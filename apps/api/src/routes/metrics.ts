import { Router } from 'express';
import metricsController from '../controllers/metrics.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin, requireKitchen, requireWaiter } from '../middleware/role.js';

const router = Router();

// Overview and financial endpoints -> admin only
router.get('/overview', authenticateToken, requireAdmin, (req, res, next) => metricsController.overview(req, res, next));
router.get('/revenue', authenticateToken, requireAdmin, (req, res, next) => metricsController.revenue(req, res, next));

// Kitchen performance -> kitchen staff or admin
router.get('/kitchen', authenticateToken, requireKitchen, (req, res, next) => metricsController.kitchenPerformance(req, res, next));

// Waiters ranking -> staff (waiter/admin)
router.get('/waiters/ranking', authenticateToken, requireWaiter, (req, res, next) => metricsController.waitersRanking(req, res, next));

// Menu endpoints -> staff/admin
router.get('/menu/top-items', authenticateToken, requireAdmin, (req, res, next) => metricsController.topMenuItems(req, res, next));

export default router;
