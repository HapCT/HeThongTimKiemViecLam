const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directories exist
const cvDir = path.join(__dirname, '../uploads/cvs');
const imgDir = path.join(__dirname, '../uploads/images');

if (!fs.existsSync(cvDir)) {
  fs.mkdirSync(cvDir, { recursive: true });
}
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

// Storage for CV files with randomUUID filename
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, cvDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeFilename = `CV_${crypto.randomUUID()}${ext}`;
    cb(null, safeFilename);
  }
});

// Storage for Images (Avatars / Logos) with randomUUID filename
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imgDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeFilename = `IMG_${crypto.randomUUID()}${ext}`;
    cb(null, safeFilename);
  }
});

const cvMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const cvExtensions = ['.pdf', '.doc', '.docx'];

const cvFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (cvExtensions.includes(ext) && cvMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận tệp định dạng PDF, DOC, hoặc DOCX hợp lệ!'), false);
  }
};

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

const imageFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (imageExtensions.includes(ext) && imageMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận tệp hình ảnh định dạng JPG, JPEG, PNG hoặc WEBP hợp lệ!'), false);
  }
};

exports.uploadCV = multer({
  storage: cvStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: cvFileFilter
});

exports.uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFileFilter
});
