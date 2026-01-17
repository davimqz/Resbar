import { Router } from 'express';
import { TabController } from '../controllers/tab.controller.js';
import { validate } from '../middleware/validate.js';
import { closeTabSchema } from '@resbar/shared';

const router = Router();
const controller = new TabController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/table/:tableId', controller.getByTableId);
router.patch('/:id/close', validate(closeTabSchema), controller.close);
router.get('/:id/calculate', controller.calculate);
router.get('/table/:tableId/calculate', controller.calculateTable);

export default router;
