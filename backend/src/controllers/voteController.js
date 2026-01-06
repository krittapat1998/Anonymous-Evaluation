const pool = require('../config/database');
const { hashToken } = require('../middleware/tokenAuth');
const { v4: uuidv4 } = require('uuid');

function normalizeIdArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    // Try JSON first ("[\"opt1\"]")
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Fallback: plain string like "opt1" or comma-separated like "opt1,opt2"
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.includes(',')) {
        return trimmed
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [trimmed];
    }
  }

  return [];
}

/**
 * Submit a vote
 * @route POST /api/votes
 * @param {string} token - Voter token
 * @param {string} surveyId - Survey ID
 * @param {string} candidateId - Candidate ID
 * @param {array} strengthIds - Array of strength feedback option IDs
 * @param {array} weaknessIds - Array of weakness feedback option IDs
 * @param {string} feedbackText - Optional written feedback
 */
exports.submitVote = async (req, res) => {
  const client = await pool.connect();

  try {
    const { surveyId, candidateId, strengthIds, weaknessIds, feedbackText } = req.body;
    const voterTokenId = req.voterTokenId; // From middleware
    const tokenPolicy = req.tokenPolicy || 'multi_candidate';

    // Validate required fields
    if (!surveyId || !candidateId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if survey exists and is active
    const surveyCheck = await client.query(
      'SELECT id FROM surveys WHERE id = $1 AND status = $2',
      [surveyId, 'active']
    );

    if (surveyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found or is not active' });
    }

    // Check if candidate exists
    const candidateCheck = await client.query(
      'SELECT id FROM candidates WHERE id = $1 AND survey_id = $2',
      [candidateId, surveyId]
    );

    if (candidateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Prevent self-voting: token is tied to a candidate (token owner).
    // If the owner tries to vote for themselves, reject.
    const tokenOwnerRes = await client.query(
      'SELECT candidate_id FROM voter_tokens WHERE id = $1',
      [voterTokenId]
    );
    const tokenOwnerCandidateId = tokenOwnerRes.rows[0]?.candidate_id || null;
    if (tokenOwnerCandidateId && tokenOwnerCandidateId === candidateId) {
      return res.status(403).json({ error: 'You cannot vote for yourself' });
    }

    // Begin transaction
    await client.query('BEGIN');

    // Single-use surveys: once a token submits any vote, it cannot be used again (including edits)
    if (tokenPolicy === 'single_use') {
      const already = await client.query(
        'SELECT 1 FROM votes WHERE survey_id = $1 AND voter_token_id = $2 LIMIT 1',
        [surveyId, voterTokenId]
      );
      if (already.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Token already used' });
      }
    }

    // Upsert vote for this token+candidate (allows editing while survey is active)
    const voteResult = await client.query(
      `INSERT INTO votes (
          id, survey_id, candidate_id, voter_token_id,
          strength_ids, weakness_ids, feedback_text,
          created_at, updated_at
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (survey_id, voter_token_id, candidate_id)
       DO UPDATE SET
         strength_ids = EXCLUDED.strength_ids,
         weakness_ids = EXCLUDED.weakness_ids,
         feedback_text = EXCLUDED.feedback_text,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [
        uuidv4(),
        surveyId,
        candidateId,
        voterTokenId,
        JSON.stringify(strengthIds || []),
        JSON.stringify(weaknessIds || []),
        feedbackText || null,
      ]
    );

    if (tokenPolicy === 'single_use') {
      const mark = await client.query(
        `UPDATE voter_tokens
         SET is_used = true,
             used_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND is_used = false`,
        [voterTokenId]
      );

      if (mark.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Token already used' });
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Vote submitted successfully',
      voteId: voteResult.rows[0].id,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Vote submission error:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  } finally {
    client.release();
  }
};

/**
 * Get voting status for a token
 * @route POST /api/votes/status
 */
exports.checkVoteStatus = async (req, res) => {
  try {
    const { surveyId, token } = req.body;

    if (!surveyId || !token) {
      return res.status(400).json({ error: 'Missing required fields: surveyId and token' });
    }

    const bcrypt = require('bcrypt');

    // Get survey token policy first
    const surveyRes = await pool.query(
      'SELECT token_policy FROM surveys WHERE id = $1',
      [surveyId]
    );
    
    if (surveyRes.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    const tokenPolicy = surveyRes.rows[0].token_policy || 'multi_candidate';

    // Find matching token row by comparing bcrypt hash
    const tokens = await pool.query(
      'SELECT id, candidate_id, token_hash, is_used FROM voter_tokens WHERE survey_id = $1',
      [surveyId]
    );

    let voterTokenRow = null;
    for (const row of tokens.rows) {
      try {
        const match = await bcrypt.compare(token, row.token_hash);
        if (match) {
          voterTokenRow = row;
          break;
        }
      } catch (bcryptErr) {
        console.error('Bcrypt compare error:', bcryptErr);
        continue;
      }
    }

    if (!voterTokenRow?.id) {
      return res.status(401).json({ error: 'Invalid token for this survey' });
    }

    // For single-use surveys, reject already-used tokens
    if (tokenPolicy === 'single_use' && voterTokenRow.is_used) {
      return res.status(403).json({ error: 'Token already used', tokenUsed: true });
    }

    const voterTokenId = voterTokenRow.id;

    // Token owner info (candidate) for UI display
    let tokenOwner = null;
    if (voterTokenRow.candidate_id) {
      const ownerRes = await pool.query(
        `SELECT id, name, employee_id, department
         FROM candidates
         WHERE id = $1 AND survey_id = $2`,
        [voterTokenRow.candidate_id, surveyId]
      );
      if (ownerRes.rows.length > 0) {
        tokenOwner = ownerRes.rows[0];
      }
    }

    const votes = await pool.query(
      `SELECT candidate_id, strength_ids, weakness_ids, feedback_text
       FROM votes
       WHERE survey_id = $1 AND voter_token_id = $2`,
      [surveyId, voterTokenId]
    );

    res.json({
      valid: true,
      votedCandidateIds: votes.rows.map((r) => r.candidate_id),
      tokenOwner,
    });
  } catch (error) {
    console.error('Vote status check error:', error);
    res.status(500).json({ error: 'Failed to check vote status', details: error.message });
  }
};

/**
 * Get this token's existing votes (for highlighting + editing)
 * @route POST /api/votes/mine
 * @access Public (with valid voter token)
 */
exports.getMyVotes = async (req, res) => {
  try {
    const surveyId = req.body.surveyId || req.surveyId;
    const voterTokenId = req.voterTokenId;

    if (!surveyId || !voterTokenId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const votes = await pool.query(
      `SELECT candidate_id, strength_ids, weakness_ids, feedback_text, created_at, updated_at
       FROM votes
       WHERE survey_id = $1 AND voter_token_id = $2`,
      [surveyId, voterTokenId]
    );

    res.json({
      votes: votes.rows,
    });
  } catch (error) {
    console.error('Get my votes error:', error);
    res.status(500).json({ error: 'Failed to retrieve votes' });
  }
};

/**
 * Get results for a candidate (candidate view their own results)
 * @route GET /api/votes/results/:surveyId
 */
exports.getCandidateResults = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const candidateId = req.candidateId;

    // Get all votes for this candidate
    const votesResult = await pool.query(
      `SELECT 
        id,
        strength_ids,
        weakness_ids,
        feedback_text,
        created_at
       FROM votes
       WHERE survey_id = $1 AND candidate_id = $2
       ORDER BY created_at DESC`,
      [surveyId, candidateId]
    );

    if (votesResult.rows.length === 0) {
      return res.json({
        candidateId,
        surveyId,
        totalVotes: 0,
        votes: [],
        summary: {
          strengths: {},
          weaknesses: {},
        },
      });
    }

    // Aggregate strength and weakness counts
    const strengthCounts = {};
    const weaknessCounts = {};

    const comments = [];

    votesResult.rows.forEach((vote) => {
      const strengths = normalizeIdArray(vote.strength_ids);
      const weaknesses = normalizeIdArray(vote.weakness_ids);

      const text = (vote.feedback_text || '').trim();
      if (text) comments.push(text);

      strengths.forEach((id) => {
        strengthCounts[id] = (strengthCounts[id] || 0) + 1;
      });

      weaknesses.forEach((id) => {
        weaknessCounts[id] = (weaknessCounts[id] || 0) + 1;
      });
    });

    // Get feedback option names
    const optionsResult = await pool.query(
      `SELECT id, option_text, type FROM feedback_options
       WHERE survey_id = $1`,
      [surveyId]
    );

    const optionsMap = {};
    optionsResult.rows.forEach((opt) => {
      optionsMap[opt.id] = { text: opt.option_text, type: opt.type };
    });

    // Format results
    const strengthsFormatted = Object.entries(strengthCounts).map(([id, count]) => ({
      id,
      text: optionsMap[id]?.text || id,
      count,
    }));

    const weaknessesFormatted = Object.entries(weaknessCounts).map(([id, count]) => ({
      id,
      text: optionsMap[id]?.text || id,
      count,
    }));

    res.json({
      candidateId,
      surveyId,
      totalVotes: votesResult.rows.length,
      summary: {
        strengths: strengthsFormatted.sort((a, b) => b.count - a.count),
        weaknesses: weaknessesFormatted.sort((a, b) => b.count - a.count),
      },
      comments,
    });
  } catch (error) {
    console.error('Get candidate results error:', error);
    res.status(500).json({ error: 'Failed to retrieve results' });
  }
};

/**
 * Get results for a candidate (token-only; survey resolved by middleware)
 * @route POST /api/votes/results/my
 */
exports.getMyCandidateResults = async (req, res) => {
  try {
    const surveyId = req.surveyId;
    const candidateId = req.candidateId;

    if (!surveyId || !candidateId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Candidate info (for display)
    const candidateRes = await pool.query(
      'SELECT id, name, employee_id, department FROM candidates WHERE id = $1 AND survey_id = $2',
      [candidateId, surveyId]
    );
    const candidate = candidateRes.rows[0] || { id: candidateId };

    // Get all votes for this candidate
    const votesResult = await pool.query(
      `SELECT strength_ids, weakness_ids, feedback_text, created_at
       FROM votes
       WHERE survey_id = $1 AND candidate_id = $2`,
      [surveyId, candidateId]
    );

    // Aggregate strength and weakness counts
    const strengthCounts = {};
    const weaknessCounts = {};

    const comments = [];

    votesResult.rows.forEach((vote) => {
      const strengths = normalizeIdArray(vote.strength_ids);
      const weaknesses = normalizeIdArray(vote.weakness_ids);

      const text = (vote.feedback_text || '').trim();
      if (text) comments.push(text);

      strengths.forEach((id) => {
        strengthCounts[id] = (strengthCounts[id] || 0) + 1;
      });

      weaknesses.forEach((id) => {
        weaknessCounts[id] = (weaknessCounts[id] || 0) + 1;
      });
    });

    // Get feedback option names
    const optionsResult = await pool.query(
      `SELECT id, option_text, type FROM feedback_options
       WHERE survey_id = $1`,
      [surveyId]
    );

    const optionsMap = {};
    optionsResult.rows.forEach((opt) => {
      optionsMap[opt.id] = { text: opt.option_text, type: opt.type };
    });

    const strengthsFormatted = Object.entries(strengthCounts).map(([id, count]) => ({
      id,
      text: optionsMap[id]?.text || id,
      count,
    }));

    const weaknessesFormatted = Object.entries(weaknessCounts).map(([id, count]) => ({
      id,
      text: optionsMap[id]?.text || id,
      count,
    }));

    return res.json({
      candidate,
      candidateId,
      surveyId,
      totalVotes: votesResult.rows.length,
      summary: {
        strengths: strengthsFormatted.sort((a, b) => b.count - a.count),
        weaknesses: weaknessesFormatted.sort((a, b) => b.count - a.count),
      },
      comments,
    });
  } catch (error) {
    console.error('Get my candidate results error:', error);
    return res.status(500).json({ error: 'Failed to retrieve results' });
  }
};
