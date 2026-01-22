import { Router } from 'express';
import { TableController } from '../controllers/table.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireWaiter } from '../middleware/role.js';

const router = Router();
const controller = new TableController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.patch('/:id/status', controller.updateStatus);
router.post('/:id/assign-waiter', controller.assignWaiter);
router.post('/:id/release', authenticateToken, requireWaiter, controller.releaseTable);

export default router;
