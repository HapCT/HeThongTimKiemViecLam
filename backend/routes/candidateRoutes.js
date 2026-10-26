const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadCV, uploadImage } = require('../middlewares/upload');

router.get('/cvs', authenticate, authorize('candidate'), candidateController.getCVs);
router.get('/cvs/:id', authenticate, candidateController.getCVById);
router.post('/cvs', authenticate, authorize('candidate'), candidateController.createCV);
router.post('/cvs/upload', authenticate, authorize('candidate'), uploadCV.single('file'), candidateController.uploadCVFile);
router.put('/cvs/:id', authenticate, authorize('candidate'), candidateController.updateCV);
router.delete('/cvs/:id', authenticate, authorize('candidate'), candidateController.deleteCV);
router.patch('/cvs/:id/default', authenticate, authorize('candidate'), candidateController.setDefaultCV);
router.post('/upload-avatar', authenticate, uploadImage.single('image'), candidateController.uploadAvatar);

module.exports = router;
