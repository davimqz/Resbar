import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireStaff } from '../middleware/role.js';

const router = Router();
const controller = new InventoryController();

// Rotas de inventário requerem autenticação e staff (garçom, cozinha ou admin)
router.get('/', authenticateToken, requireStaff, controller.getAll);
router.get('/:id', authenticateToken, requireStaff, controller.getById);
router.post('/', authenticateToken, requireStaff, controller.create);
router.put('/:id', authenticateToken, requireStaff, controller.update);
router.delete('/:id', authenticateToken, requireStaff, controller.delete);

export default router;
