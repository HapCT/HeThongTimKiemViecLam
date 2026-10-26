const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { authenticate, authorize } = require('../middlewares/auth');

router.post('/', authenticate, authorize('company', 'admin'), interviewController.scheduleInterview);
router.get('/candidate', authenticate, authorize('candidate'), interviewController.getCandidateInterviews);
router.get('/company', authenticate, authorize('company', 'admin'), interviewController.getCompanyInterviews);
router.patch('/:id/status', authenticate, interviewController.updateInterviewStatus);

module.exports = router;
