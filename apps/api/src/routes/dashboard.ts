import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';

const router = Router();
const controller = new DashboardController();

// Todas as rotas de dashboard requerem autenticação e role de admin
router.get('/stats', authenticateToken, requireAdmin, controller.getStats);

export default router;
