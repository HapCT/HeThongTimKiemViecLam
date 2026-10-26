const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middlewares/auth');

router.post('/', authenticate, authorize('candidate'), applicationController.applyJob);
router.get('/my-applications', authenticate, authorize('candidate'), applicationController.getCandidateApplications);
router.get('/company/all', authenticate, authorize('company', 'admin'), applicationController.getCompanyApplications);
router.patch('/:id/status', authenticate, authorize('company', 'admin'), applicationController.updateApplicationStatus);

module.exports = router;
