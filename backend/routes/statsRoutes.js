const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticate, authorize } = require('../middlewares/auth');

router.get('/public', statsController.getPublicStats);
router.get('/admin', authenticate, authorize('admin'), statsController.getAdminStats);
router.get('/company', authenticate, authorize('company'), statsController.getCompanyStats);

module.exports = router;
