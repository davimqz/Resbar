import { Router } from 'express';
import { WaiterController } from '../controllers/waiter.controller.js';

const router = Router();
const controller = new WaiterController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
