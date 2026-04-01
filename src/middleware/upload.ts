import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists (used for CSV temp files)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// CSV files go to disk (temp file — read immediately by service, then discarded)
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const uploadCSV = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
}).single('file');

// Photos go to memory buffer — uploaded to Cloudinary in the controller.
// Falls back to local disk path in dev if CLOUDINARY_CLOUD_NAME is not set.
export const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
}).single('photo');
