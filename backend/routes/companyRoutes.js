const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { optionalAuth, authenticate, authorize } = require('../middlewares/auth');
const { validate, reviewSchemas } = require('../middlewares/validate');

router.get('/', companyController.getCompanies);
router.get('/:id', optionalAuth, companyController.getCompanyById);
router.get('/:id/reviews', companyController.getCompanyReviews);
router.post('/:id/reviews', authenticate, authorize('candidate'), validate(reviewSchemas.addReview), companyController.addCompanyReview);

module.exports = router;

