const express = require('express');
const surveyController = require('../controllers/surveyController');
const { verifyAdminToken } = require('../middleware/adminAuth');

const router = express.Router();

/**
 * @route POST /api/admin/surveys
 * @desc Create a new survey
 * @access Admin only
 */
router.post('/', verifyAdminToken, surveyController.createSurvey);

/**
 * @route GET /api/admin/surveys
 * @desc Get all surveys
 * @access Admin only
 */
router.get('/', verifyAdminToken, surveyController.getAllSurveys);

/**
 * @route GET /api/admin/surveys/:id
 * @desc Get single survey details
 * @access Admin only
 */
router.get('/:id', verifyAdminToken, surveyController.getSurveyDetail);

/**
 * @route PATCH /api/admin/surveys/:id
 * @desc Update survey status
 * @access Admin only
 */
router.patch('/:id', verifyAdminToken, surveyController.updateSurveyStatus);

/**
 * @route POST /api/admin/surveys/:surveyId/candidates
 * @desc Add candidate to survey
 * @access Admin only
 */
router.post('/:surveyId/candidates', verifyAdminToken, surveyController.addCandidate);

/**
 * @route DELETE /api/admin/surveys/:surveyId/candidates/:candidateId
 * @desc Delete candidate from survey
 * @access Admin only
 */
router.delete('/:surveyId/candidates/:candidateId', verifyAdminToken, surveyController.deleteCandidate);

/**
 * @route POST /api/admin/surveys/:surveyId/feedback-options
 * @desc Add feedback option to survey
 * @access Admin only
 */
router.post('/:surveyId/feedback-options', verifyAdminToken, surveyController.addFeedbackOption);

/**
 * @route DELETE /api/admin/surveys/:surveyId/feedback-options/:optionId
 * @desc Delete feedback option from survey
 * @access Admin only
 */
router.delete('/:surveyId/feedback-options/:optionId', verifyAdminToken, surveyController.deleteFeedbackOption);

/**
 * @route GET /api/admin/surveys/:surveyId/all-results
 * @desc Get all voting results for a survey
 * @access Admin only
 */
router.get('/:surveyId/all-results', verifyAdminToken, surveyController.getAllResults);

module.exports = router;
