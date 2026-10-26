const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { optionalAuth, authenticate, authorize } = require('../middlewares/auth');

router.get('/', companyController.getCompanies);
router.get('/:id', optionalAuth, companyController.getCompanyById);
router.get('/:id/reviews', companyController.getCompanyReviews);
router.post('/:id/reviews', authenticate, authorize('candidate'), companyController.addCompanyReview);

module.exports = router;

