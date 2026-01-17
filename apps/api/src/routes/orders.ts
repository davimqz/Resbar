import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';

const router = Router();
const controller = new OrderController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.delete);
router.get('/kitchen/pending', controller.getKitchenOrders);

export default router;
