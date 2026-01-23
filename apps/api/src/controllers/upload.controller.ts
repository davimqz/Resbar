import { Request, Response, NextFunction } from 'express';

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/uploads/${req.file.filename}`;

    res.json({ success: true, data: { url } });
  } catch (error) {
    next(error);
  }
}
