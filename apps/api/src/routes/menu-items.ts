import { Router } from 'express';
import { MenuItemController } from '../controllers/menu-item.controller.js';

const router = Router();
const controller = new MenuItemController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.patch('/:id/availability', controller.toggleAvailability);

export default router;
