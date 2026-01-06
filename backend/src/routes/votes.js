const express = require('express');
const voteController = require('../controllers/voteController');
const { verifyVoterToken, verifyCandidateToken, verifyCandidateTokenAnySurvey, verifyResultsTokenAnySurvey } = require('../middleware/tokenAuth');

const router = express.Router();

/**
 * @route POST /api/votes
 * @desc Submit a vote
 * @access Public (with valid voter token)
 */
router.post('/', verifyVoterToken, voteController.submitVote);

/**
 * @route POST /api/votes/status
 * @desc Check if a token has already voted
 * @access Public
 */
router.post('/status', voteController.checkVoteStatus);

/**
 * @route POST /api/votes/mine
 * @desc Get this token's existing votes (for UI highlight/edit)
 * @access Public (with valid voter token)
 */
router.post('/mine', verifyVoterToken, voteController.getMyVotes);

/**
 * @route GET /api/votes/results/:surveyId
 * @desc Get candidate's own voting results
 * @access Public (with valid candidate token)
 */
router.get('/results/:surveyId', verifyCandidateToken, voteController.getCandidateResults);

/**
 * @route POST /api/votes/results/my
 * @desc Get candidate's own voting results (token-only)
 * @access Public (with valid candidate token)
 */
router.post('/results/my', verifyResultsTokenAnySurvey, voteController.getMyCandidateResults);

module.exports = router;
