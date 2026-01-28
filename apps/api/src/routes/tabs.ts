import { Router } from 'express';
import { TabController } from '../controllers/tab.controller.js';
import { validate } from '../middleware/validate.js';
import { closeTabSchema } from '@resbar/shared';
import { requireAdmin, requireWaiter } from '../middleware/role.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const controller = new TabController();

// Create a new tab (table or counter)
router.post('/', controller.create);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/table/:tableId', controller.getByTableId);
router.patch('/:id/close', validate(closeTabSchema), controller.close);
router.get('/:id/calculate', controller.calculate);
router.get('/table/:tableId/calculate', controller.calculateTable);

// Service charge management - only waiters can toggle
router.patch('/:id/toggle-service-charge', authenticateToken, requireWaiter, controller.toggleServiceCharge);

// Request bill
router.post('/:id/request-bill', controller.requestBill);

// Transfer account - move all orders from one tab to another
router.post('/:id/transfer', authenticateToken, controller.transferAccount);

// Admin-only: delete a tab
router.delete('/:id', authenticateToken, requireAdmin, controller.delete);

export default router;
