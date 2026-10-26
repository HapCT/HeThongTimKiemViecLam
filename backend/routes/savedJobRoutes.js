const express = require('express');
const router = express.Router();
const savedJobController = require('../controllers/savedJobController');
const { authenticate, authorize } = require('../middlewares/auth');

router.post('/toggle', authenticate, authorize('candidate'), savedJobController.toggleSaveJob);
router.post('/:jobId', authenticate, authorize('candidate'), savedJobController.toggleSaveJob);
router.delete('/:jobId', authenticate, authorize('candidate'), savedJobController.toggleSaveJob);
router.get('/', authenticate, authorize('candidate'), savedJobController.getSavedJobs);

module.exports = router;
