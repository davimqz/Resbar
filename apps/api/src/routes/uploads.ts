import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadImage } from '../controllers/upload.controller.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'public', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage });

router.post('/', upload.single('file'), uploadImage);

export default router;
