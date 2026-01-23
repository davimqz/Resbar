import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { requireAdmin } from '../middleware/role.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const controller = new OrderController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', authenticateToken, requireAdmin, controller.update);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', authenticateToken, requireAdmin, controller.delete);
router.get('/kitchen/pending', controller.getKitchenOrders);

export default router;
