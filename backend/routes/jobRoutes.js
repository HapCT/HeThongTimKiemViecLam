const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate, optionalAuth, authorize } = require('../middlewares/auth');

router.get('/', optionalAuth, jobController.getJobs);
router.get('/company/my-jobs', authenticate, authorize('company'), jobController.getMyCompanyJobs);
router.get('/:id', optionalAuth, jobController.getJobById);
router.post('/', authenticate, authorize('company', 'admin'), jobController.createJob);
router.put('/:id', authenticate, authorize('company', 'admin'), jobController.updateJob);
router.delete('/:id', authenticate, authorize('company', 'admin'), jobController.deleteJob);
router.patch('/:id/status', authenticate, authorize('company', 'admin'), jobController.updateJobStatus);

module.exports = router;
