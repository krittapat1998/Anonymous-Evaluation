const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Create a new survey
 * @route POST /api/admin/surveys
 */
exports.createSurvey = async (req, res) => {
  try {
    const { title, description, expiresAt, tokenPolicy } = req.body;
    const adminId = req.adminId;

    if (!title) {
      return res.status(400).json({ error: 'Survey title is required' });
    }

    const resolvedTokenPolicy = tokenPolicy === 'single_use' ? 'single_use' : 'multi_candidate';

    const result = await pool.query(
      `INSERT INTO surveys (id, title, description, status, created_by, expires_at, token_policy, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [uuidv4(), title, description || '', 'draft', adminId, expiresAt || null, resolvedTokenPolicy]
    );

    res.status(201).json({
      success: true,
      survey: result.rows[0],
    });
  } catch (error) {
    console.error('Create survey error:', error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
};

/**
 * Get all surveys (admin view)
 * @route GET /api/admin/surveys
 */
exports.getAllSurveys = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        s.id,
        s.title,
        s.description,
        s.status,
        s.token_policy,
        s.created_at,
        COUNT(DISTINCT c.id) as candidate_count,
        COUNT(DISTINCT v.id) as vote_count
       FROM surveys s
       LEFT JOIN candidates c ON s.id = c.survey_id
       LEFT JOIN votes v ON s.id = v.survey_id
       GROUP BY s.id
       ORDER BY s.created_at DESC`
    );

    res.json({
      surveys: result.rows,
    });
  } catch (error) {
    console.error('Get surveys error:', error);
    res.status(500).json({ error: 'Failed to retrieve surveys' });
  }
};

/**
 * Get single survey details
 * @route GET /api/admin/surveys/:id
 */
exports.getSurveyDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const surveyResult = await pool.query(
      'SELECT * FROM surveys WHERE id = $1',
      [id]
    );

    if (surveyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const candidatesResult = await pool.query(
      'SELECT id, name, employee_id, department FROM candidates WHERE survey_id = $1',
      [id]
    );

    const feedbackResult = await pool.query(
      `SELECT id, type, option_text, display_order 
       FROM feedback_options 
       WHERE survey_id = $1 
       ORDER BY type, display_order`,
      [id]
    );

    const survey = surveyResult.rows[0];
    const strengths = feedbackResult.rows.filter((f) => f.type === 'strength');
    const weaknesses = feedbackResult.rows.filter((f) => f.type === 'weakness');

    res.json({
      survey,
      candidates: candidatesResult.rows,
      feedbackOptions: {
        strengths,
        weaknesses,
      },
    });
  } catch (error) {
    console.error('Get survey detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve survey' });
  }
};

/**
 * Update survey (title, description, status)
 * @route PATCH /api/admin/surveys/:id
 */
exports.updateSurveyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description, tokenPolicy } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(title);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (status !== undefined) {
      if (!['draft', 'active', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (tokenPolicy !== undefined) {
      if (!['multi_candidate', 'single_use'].includes(tokenPolicy)) {
        return res.status(400).json({ error: 'Invalid token policy' });
      }
      updates.push(`token_policy = $${paramIndex}`);
      values.push(tokenPolicy);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add ID to values
    values.push(id);

    const query = `UPDATE surveys 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    res.json({
      success: true,
      survey: result.rows[0],
    });
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({ error: 'Failed to update survey' });
  }
};

/**
 * Add candidate to survey
 * @route POST /api/admin/surveys/:surveyId/candidates
 */
exports.addCandidate = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { name, employeeId, department } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Candidate name is required' });
    }

    // Generate random access token
    const accessToken = crypto.randomBytes(16).toString('hex');
    const accessTokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');

    const result = await pool.query(
      `INSERT INTO candidates (id, survey_id, name, employee_id, department, access_token_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING id, name, employee_id, department`,
      [uuidv4(), surveyId, name, employeeId || null, department || null, accessTokenHash]
    );

    res.status(201).json({
      success: true,
      candidate: result.rows[0],
      accessToken, // Send to admin once for distribution
    });
  } catch (error) {
    console.error('Add candidate error:', error);
    res.status(500).json({ error: 'Failed to add candidate' });
  }
};

/**
 * Add feedback option to survey
 * @route POST /api/admin/surveys/:surveyId/feedback-options
 */
exports.addFeedbackOption = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { type, optionText, displayOrder } = req.body;

    if (!['strength', 'weakness'].includes(type) || !optionText) {
      return res.status(400).json({ error: 'Invalid feedback option' });
    }

    const result = await pool.query(
      `INSERT INTO feedback_options (id, survey_id, type, option_text, display_order, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [uuidv4(), surveyId, type, optionText, displayOrder || 0]
    );

    res.status(201).json({
      success: true,
      feedbackOption: result.rows[0],
    });
  } catch (error) {
    console.error('Add feedback option error:', error);
    res.status(500).json({ error: 'Failed to add feedback option' });
  }
};

/**
 * Delete feedback option from survey
 * @route DELETE /api/admin/surveys/:surveyId/feedback-options/:optionId
 */
exports.deleteFeedbackOption = async (req, res) => {
  try {
    const { surveyId, optionId } = req.params;

    const result = await pool.query(
      'DELETE FROM feedback_options WHERE id = $1 AND survey_id = $2 RETURNING id',
      [optionId, surveyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback option not found' });
    }

    res.json({
      success: true,
      message: 'Feedback option deleted successfully',
    });
  } catch (error) {
    console.error('Delete feedback option error:', error);
    res.status(500).json({ error: 'Failed to delete feedback option' });
  }
};

/**
 * Get all results for a survey (admin only)
 * @route GET /api/admin/surveys/:surveyId/all-results
 */
exports.getAllResults = async (req, res) => {
  try {
    const { surveyId } = req.params;

    // Get all votes with candidate info
    const votesResult = await pool.query(
      `SELECT 
        c.id as candidate_id,
        c.name as candidate_name,
        COUNT(v.id) as total_votes,
        v.strength_ids,
        v.weakness_ids
       FROM candidates c
       LEFT JOIN votes v ON c.id = v.candidate_id
       WHERE c.survey_id = $1
       GROUP BY c.id, c.name, v.strength_ids, v.weakness_ids
       ORDER BY c.name`,
      [surveyId]
    );

    // Get feedback options
    const optionsResult = await pool.query(
      'SELECT id, type, option_text FROM feedback_options WHERE survey_id = $1',
      [surveyId]
    );

    const optionsMap = {};
    optionsResult.rows.forEach((opt) => {
      optionsMap[opt.id] = { text: opt.option_text, type: opt.type };
    });

    res.json({
      surveyId,
      results: votesResult.rows,
      feedbackOptions: optionsMap,
    });
  } catch (error) {
    console.error('Get all results error:', error);
    res.status(500).json({ error: 'Failed to retrieve results' });
  }
};

/**
 * Delete candidate from survey
 * @route DELETE /api/admin/surveys/:surveyId/candidates/:candidateId
 */
exports.deleteCandidate = async (req, res) => {
  try {
    const { surveyId, candidateId } = req.params;

    // Delete candidate (will cascade delete tokens and votes)
    const result = await pool.query(
      'DELETE FROM candidates WHERE id = $1 AND survey_id = $2 RETURNING id',
      [candidateId, surveyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({
      success: true,
      message: 'Candidate deleted successfully',
    });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
};

