import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// POST /api/admin/promote
export async function promoteUser(req: Request, res: Response) {
  try {
    const token = process.env.ADMIN_PROMOTION_TOKEN;
    const { email, secret } = req.body as { email?: string; secret?: string };

    if (!token) {
      return res.status(500).json({ success: false, error: 'Admin promotion not configured' });
    }

    if (!secret || secret !== token) {
      return res.status(403).json({ success: false, error: 'Invalid promotion token' });
    }

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });

    res.json({ success: true, data: { id: user.id, email: user.email, role: user.role } });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'User not found. Have they logged in?' });
    }
    console.error('Error promoting user:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
}
