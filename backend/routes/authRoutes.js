const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { validate, authSchemas } = require('../middlewares/validate');

router.post('/login', validate(authSchemas.login), authController.login);
router.post('/register', validate(authSchemas.register), authController.register);
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, validate(authSchemas.changePassword), authController.changePassword);

module.exports = router;
