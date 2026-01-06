const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

// Admin login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET || 'your-secret', { expiresIn: '8h' });
    res.json({ token, username: admin.username, role: admin.role });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};

// Generate token for specific candidate
exports.generateTokenForCandidate = async (req, res) => {
  const { surveyId, candidateId } = req.body;
  if (!surveyId || !candidateId) {
    return res.status(400).json({ error: 'surveyId and candidateId required' });
  }
  try {
    // Generate random token
    const token = uuidv4().replace(/-/g, '').slice(0, 16);
    const tokenHash = await bcrypt.hash(token, 10);
    
    // Insert into voter_tokens
    const result = await pool.query(
      'INSERT INTO voter_tokens (survey_id, candidate_id, token, token_hash) VALUES ($1, $2, $3, $4) RETURNING id',
      [surveyId, candidateId, token, tokenHash]
    );
    
    res.json({ 
      id: result.rows[0].id,
      token, // Show plain token only once
      candidateId,
      surveyId
    });
  } catch (err) {
    console.error('Token generation error:', err);
    res.status(500).json({ error: 'Token generation failed', details: err.message });
  }
};

// Get all tokens for a survey with candidate info
exports.getSurveyTokens = async (req, res) => {
  const { surveyId } = req.params;
  if (!surveyId) {
    return res.status(400).json({ error: 'surveyId required' });
  }
  try {
    const result = await pool.query(`
      SELECT 
        vt.id,
        vt.candidate_id,
        vt.is_used,
        vt.used_at,
        vt.created_at,
        c.name as candidate_name,
        c.employee_id,
        c.department
      FROM voter_tokens vt
      JOIN candidates c ON vt.candidate_id = c.id
      WHERE vt.survey_id = $1
      ORDER BY c.name, vt.created_at DESC
    `, [surveyId]);
    
    res.json({ tokens: result.rows });
  } catch (err) {
    console.error('Get tokens error:', err);
    res.status(500).json({ error: 'Failed to get tokens', details: err.message });
  }
};

// Revoke/regenerate token for candidate
exports.regenerateTokenForCandidate = async (req, res) => {
  const { surveyId, candidateId } = req.body;
  if (!surveyId || !candidateId) {
    return res.status(400).json({ error: 'surveyId and candidateId required' });
  }
  try {
    // Token rotation: keep the same voter_tokens.id so votes tied to voter_token_id still match.
    // This makes "reset token" change the secret, not the identity.

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existing = await client.query(
        `SELECT id
         FROM voter_tokens
         WHERE survey_id = $1 AND candidate_id = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [surveyId, candidateId]
      );

      const token = uuidv4().replace(/-/g, '').slice(0, 16);
      const tokenHash = await bcrypt.hash(token, 10);

      if (existing.rows.length > 0) {
        const tokenId = existing.rows[0].id;

        // Update token in-place (preserves id)
        await client.query(
          `UPDATE voter_tokens
           SET token = $1,
               token_hash = $2,
               is_used = false,
               used_at = NULL
           WHERE id = $3`,
          [token, tokenHash, tokenId]
        );

        // Remove any other unused duplicates for this candidate (optional hygiene)
        await client.query(
          `DELETE FROM voter_tokens
           WHERE survey_id = $1 AND candidate_id = $2 AND id <> $3 AND is_used = false`,
          [surveyId, candidateId, tokenId]
        );

        await client.query('COMMIT');
        return res.json({
          id: tokenId,
          token,
          candidateId,
          surveyId,
        });
      }

      // If no row exists yet, fall back to create
      const created = await client.query(
        'INSERT INTO voter_tokens (survey_id, candidate_id, token, token_hash) VALUES ($1, $2, $3, $4) RETURNING id',
        [surveyId, candidateId, token, tokenHash]
      );

      await client.query('COMMIT');
      return res.json({
        id: created.rows[0].id,
        token,
        candidateId,
        surveyId,
      });
    } catch (e) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // ignore rollback errors
      }
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Regenerate token error:', err);
    res.status(500).json({ error: 'Token regeneration failed', details: err.message });
  }
};

// Create candidate + generate token in one action
exports.createCandidateWithToken = async (req, res) => {
  const { surveyId, name, employeeId, department } = req.body;
  if (!surveyId || !name) {
    return res.status(400).json({ error: 'surveyId and name required' });
  }
  try {
    // Generate a placeholder access token hash (required by candidates table)
    const placeholderToken = crypto.randomBytes(16).toString('hex');
    const accessTokenHash = crypto.createHash('sha256').update(placeholderToken).digest('hex');
    
    // Create candidate
    const candidateId = uuidv4();
    const candidateResult = await pool.query(
      `INSERT INTO candidates (id, survey_id, name, employee_id, department, access_token_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING id, name, employee_id, department`,
      [candidateId, surveyId, name, employeeId || null, department || null, accessTokenHash]
    );
    
    // Generate token for this candidate
    const token = uuidv4().replace(/-/g, '').slice(0, 16);
    const tokenHash = await bcrypt.hash(token, 10);
    
    const tokenResult = await pool.query(
      `INSERT INTO voter_tokens (survey_id, candidate_id, token, token_hash, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING id`,
      [surveyId, candidateId, token, tokenHash]
    );
    
    res.status(201).json({
      success: true,
      candidate: candidateResult.rows[0],
      token: token, // Plain token shown once
      tokenId: tokenResult.rows[0].id
    });
  } catch (err) {
    console.error('Create candidate with token error:', err);
    res.status(500).json({ error: 'Failed to create candidate with token', details: err.message });
  }
};

// Legacy: Generate tokens for voting (old way)
exports.generateTokens = async (req, res) => {
  const { surveyId, count } = req.body;
  if (!surveyId || !count || count < 1 || count > 500) {
    return res.status(400).json({ error: 'Invalid surveyId or count' });
  }
  try {
    const policyRes = await pool.query(
      'SELECT token_policy FROM surveys WHERE id = $1',
      [surveyId]
    );
    if (policyRes.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    if (policyRes.rows[0].token_policy !== 'single_use') {
      return res.status(400).json({ error: 'Bulk tokens are only allowed for single-use surveys' });
    }

    const tokens = [];
    for (let i = 0; i < count; i++) {
      const token = uuidv4().replace(/-/g, '').slice(0, 16);
      const tokenHash = await bcrypt.hash(token, 10);

      const inserted = await pool.query(
        `INSERT INTO voter_tokens (survey_id, candidate_id, token, token_hash, is_used, used_at, created_at)
         VALUES ($1, NULL, $2, $3, false, NULL, CURRENT_TIMESTAMP)
         RETURNING id, created_at, is_used`,
        [surveyId, token, tokenHash]
      );

      tokens.push({
        id: inserted.rows[0].id,
        token,
        createdAt: inserted.rows[0].created_at,
        isUsed: inserted.rows[0].is_used,
      });
    }
    res.json({ tokens });
  } catch (err) {
    res.status(500).json({ error: 'Token generation failed', details: err.message });
  }
};

// Get bulk (anonymous) tokens for a survey
// Bulk tokens are rows in voter_tokens where candidate_id IS NULL
exports.getSurveyBulkTokens = async (req, res) => {
  const { surveyId } = req.params;
  if (!surveyId) {
    return res.status(400).json({ error: 'surveyId required' });
  }

  try {
    const policyRes = await pool.query(
      'SELECT token_policy FROM surveys WHERE id = $1',
      [surveyId]
    );
    if (policyRes.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    if (policyRes.rows[0].token_policy !== 'single_use') {
      return res.status(400).json({ error: 'Bulk tokens are only available for single-use surveys' });
    }

    const result = await pool.query(
      `SELECT id, token, is_used, used_at, created_at
       FROM voter_tokens
       WHERE survey_id = $1 AND candidate_id IS NULL
       ORDER BY created_at DESC`,
      [surveyId]
    );

    res.json({
      surveyId,
      tokens: result.rows.map((r) => ({
        id: r.id,
        token: r.token,
        isUsed: r.is_used,
        usedAt: r.used_at,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error('Get bulk tokens error:', err);
    res.status(500).json({ error: 'Failed to get bulk tokens', details: err.message });
  }
};
