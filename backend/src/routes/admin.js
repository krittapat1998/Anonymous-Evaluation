const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdminToken } = require('../middleware/adminAuth');

// Admin login
router.post('/login', adminController.login);

// Create candidate with token (new way)
router.post('/candidates/create-with-token', verifyAdminToken, adminController.createCandidateWithToken);

// Token management (protected)
router.post('/generate-token', verifyAdminToken, adminController.generateTokenForCandidate);
router.get('/surveys/:surveyId/tokens', verifyAdminToken, adminController.getSurveyTokens);
router.get('/surveys/:surveyId/bulk-tokens', verifyAdminToken, adminController.getSurveyBulkTokens);
router.post('/regenerate-token', verifyAdminToken, adminController.regenerateTokenForCandidate);

// Legacy token generation (old way)
router.post('/generate-tokens', verifyAdminToken, adminController.generateTokens);

module.exports = router;
