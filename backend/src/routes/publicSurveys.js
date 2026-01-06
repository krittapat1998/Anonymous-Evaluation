const express = require('express');
const surveyController = require('../controllers/surveyController');

const router = express.Router();

/**
 * @route GET /api/surveys
 * @desc Get all active surveys (public)
 * @access Public
 */
router.get('/', surveyController.getAllSurveys);

/**
 * @route GET /api/surveys/:id
 * @desc Get single survey details for voting (public)
 * @access Public
 */
router.get('/:id', surveyController.getSurveyDetail);

module.exports = router;
