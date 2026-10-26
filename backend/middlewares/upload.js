const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const cvDir = path.join(__dirname, '../uploads/cvs');
const imgDir = path.join(__dirname, '../uploads/images');

if (!fs.existsSync(cvDir)) {
  fs.mkdirSync(cvDir, { recursive: true });
}
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

// Storage for CV files
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, cvDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
    cb(null, `CV_${uniqueSuffix}_${baseName}${ext}`);
  }
});

// Storage for Images (Avatars / Logos)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imgDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
    cb(null, `IMG_${uniqueSuffix}${ext}`);
  }
});

const cvFileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext) || file.mimetype === 'application/pdf' || file.mimetype.includes('word')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận tệp định dạng PDF, DOC, hoặc DOCX!'), false);
  }
};

const imageFileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận tệp hình ảnh định dạng JPG, PNG, WEBP!'), false);
  }
};

exports.uploadCV = multer({
  storage: cvStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: cvFileFilter
});

exports.uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFileFilter
});
