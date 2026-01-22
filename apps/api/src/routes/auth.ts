import { Router } from 'express';
import {
  googleCallback,
  completeProfile,
  getCurrentUser,
  refreshAccessToken,
  logout,
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Autenticação
router.post('/google', googleCallback);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

// Rotas protegidas
router.get('/me', authenticateToken, getCurrentUser);
router.post('/complete-profile', authenticateToken, completeProfile);

export default router;
