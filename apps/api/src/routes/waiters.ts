import { Router } from 'express';
import { WaiterController } from '../controllers/waiter.controller.js';

const router = Router();
const controller = new WaiterController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// Shift management routes
router.post('/:id/clock-in', controller.clockIn);
router.post('/:id/clock-out', controller.clockOut);

// Break management routes
router.post('/:id/start-break', controller.startBreak);
router.post('/:id/end-break', controller.endBreak);

export default router;
