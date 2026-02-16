import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';

const router = Router();
const controller = new DashboardController();

// Todas as rotas de dashboard requerem autenticação e role de admin
router.get('/stats', authenticateToken, requireAdmin, controller.getStats);
router.get('/overview', authenticateToken, requireAdmin, controller.getOverview.bind(controller));
router.get('/overview-waiters', authenticateToken, requireAdmin, controller.getOverviewWaiters.bind(controller));
router.get('/overview-finance', authenticateToken, requireAdmin, controller.getOverviewFinance.bind(controller));
router.get('/overview-operations', authenticateToken, requireAdmin, controller.getOverviewOperations.bind(controller));
router.get('/finance/summary', authenticateToken, requireAdmin, controller.getFinanceSummary.bind(controller));
router.get('/operational-metrics', authenticateToken, requireAdmin, controller.getOperationalMetrics.bind(controller));

export default router;
