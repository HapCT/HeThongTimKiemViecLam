const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, applicationSchemas } = require('../middlewares/validate');

router.post('/', authenticate, authorize('candidate'), validate(applicationSchemas.applyJob), applicationController.applyJob);
router.get('/my-applications', authenticate, authorize('candidate'), applicationController.getCandidateApplications);
router.get('/company/all', authenticate, authorize('company', 'admin'), applicationController.getCompanyApplications);
router.patch('/:id/status', authenticate, authorize('company', 'admin'), validate(applicationSchemas.updateStatus), applicationController.updateApplicationStatus);

module.exports = router;
