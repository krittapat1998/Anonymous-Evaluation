const crypto = require('crypto');
const pool = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * Hash a token using SHA-256
 * @param {string} token - The token to hash
 * @returns {string} - Hashed token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Middleware to verify voter token
 * Checks if token is valid and hasn't already voted
 */
async function verifyVoterToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.body.token;
    const surveyId = req.body.surveyId || req.params.surveyId;

    if (!token || !surveyId) {
      return res.status(400).json({ error: 'Missing token or survey ID' });
    }

    // Get all tokens for this survey and check bcrypt hash
    const result = await pool.query(
      'SELECT id, is_used, token_hash FROM voter_tokens WHERE survey_id = $1',
      [surveyId]
    );

    let foundToken = null;
    for (const row of result.rows) {
      try {
        const match = await bcrypt.compare(token, row.token_hash);
        if (match) {
          foundToken = row;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!foundToken) {
      return res.status(403).json({ error: 'Invalid token for this survey' });
    }

    // Resolve survey token policy
    const policyRes = await pool.query(
      'SELECT token_policy FROM surveys WHERE id = $1',
      [surveyId]
    );
    const tokenPolicy = policyRes.rows[0]?.token_policy || 'multi_candidate';

    // For single-use surveys, reject already-used tokens
    if (tokenPolicy === 'single_use' && foundToken.is_used) {
      return res.status(403).json({ error: 'Token already used' });
    }

    // Store token info in request for later use
    req.voterToken = token;
    req.voterTokenId = foundToken.id;
    req.surveyId = surveyId;
    req.tokenPolicy = tokenPolicy;

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to verify candidate access token
 * Used when candidate wants to view their own results
 */
async function verifyCandidateToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.body.token;
    const surveyId = req.body.surveyId || req.params.surveyId;

    if (!token || !surveyId) {
      return res.status(400).json({ error: 'Missing token or survey ID' });
    }

    const tokenHash = hashToken(token);

    // Find candidate with this token
    const result = await pool.query(
      'SELECT id FROM candidates WHERE survey_id = $1 AND access_token_hash = $2',
      [surveyId, tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid candidate token' });
    }

    req.candidateId = result.rows[0].id;
    req.surveyId = surveyId;

    next();
  } catch (error) {
    console.error('Candidate token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to verify candidate access token without requiring surveyId.
 * Resolves candidate + survey from the token hash.
 */
async function verifyCandidateTokenAnySurvey(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.body.token;

    if (!token) {
      return res.status(400).json({ error: 'Missing token' });
    }

    const tokenHash = hashToken(token);

    const result = await pool.query(
      'SELECT id, survey_id FROM candidates WHERE access_token_hash = $1 LIMIT 1',
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid candidate token' });
    }

    req.candidateId = result.rows[0].id;
    req.surveyId = result.rows[0].survey_id;

    next();
  } catch (error) {
    console.error('Candidate token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to verify a token for candidate results without requiring surveyId.
 * Accepts either:
 * - Candidate access token (SHA-256 against candidates.access_token_hash)
 * - Voter token (bcrypt against voter_tokens.token_hash) that is tied to a candidate_id
 */
async function verifyResultsTokenAnySurvey(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.body.token;

    if (!token) {
      return res.status(400).json({ error: 'Missing token' });
    }

    // 1) Try candidate access token (sha256)
    const tokenHash = hashToken(token);
    const candidateRes = await pool.query(
      'SELECT id, survey_id FROM candidates WHERE access_token_hash = $1 LIMIT 1',
      [tokenHash]
    );

    if (candidateRes.rows.length > 0) {
      req.candidateId = candidateRes.rows[0].id;
      req.surveyId = candidateRes.rows[0].survey_id;
      return next();
    }

    // 2) Fallback: try voter token (bcrypt) that is tied to a candidate_id
    const voterTokens = await pool.query(
      'SELECT id, survey_id, candidate_id, token_hash FROM voter_tokens WHERE candidate_id IS NOT NULL'
    );

    let matched = null;
    for (const row of voterTokens.rows) {
      try {
        const ok = await bcrypt.compare(token, row.token_hash);
        if (ok) {
          matched = row;
          break;
        }
      } catch (err) {
        // bcrypt comparison error
      }
    }

    if (!matched?.candidate_id) {
      return res.status(403).json({ 
        error: 'This token cannot view results', 
        reason: 'not_candidate_token',
        message: 'Only candidate tokens can view feedback results. This token is for voting only.'
      });
    }

    req.candidateId = matched.candidate_id;
    req.surveyId = matched.survey_id;
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  hashToken,
  verifyVoterToken,
  verifyCandidateToken,
  verifyCandidateTokenAnySurvey,
  verifyResultsTokenAnySurvey,
};
