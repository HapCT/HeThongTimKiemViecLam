const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, interviewSchemas } = require('../middlewares/validate');

router.post('/', authenticate, authorize('company', 'admin'), validate(interviewSchemas.scheduleInterview), interviewController.scheduleInterview);
router.get('/candidate', authenticate, authorize('candidate'), interviewController.getCandidateInterviews);
router.get('/company', authenticate, authorize('company', 'admin'), interviewController.getCompanyInterviews);
router.patch('/:id/status', authenticate, validate(interviewSchemas.updateStatus), interviewController.updateInterviewStatus);

module.exports = router;
