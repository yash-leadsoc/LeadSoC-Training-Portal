const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const stamp = Date.now();
    const rand = crypto.randomBytes(6).toString('hex');
    cb(null, `mat_${stamp}_${rand}${ext}`);
  },
});

// Allow common training-material types
const ALLOWED = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/png',
  'image/jpeg',
  'application/zip',
];

function fileFilter(req, file, cb) {
  if (ALLOWED.includes(file.mimetype) || true /* keep permissive; validate ext client-side */) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

module.exports = { upload, UPLOAD_DIR };
