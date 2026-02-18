import { Router } from 'express';
import { ReturnRequestController } from '../controllers/return-request.controller.js';
import { requireAdmin, requireWaiter } from '../middleware/role.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const controller = new ReturnRequestController();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Listar todas as solicitações (somente admin e garçom)
router.get('/', requireWaiter, controller.getAll);

// Obter solicitação por ID (somente admin e garçom)
router.get('/:id', requireWaiter, controller.getById);

// Obter solicitações por pedido (somente admin e garçom)
router.get('/order/:orderId', requireWaiter, controller.getByOrderId);

// Criar solicitação de devolução (somente admin e garçom)
router.post('/', requireWaiter, controller.create);

// Atualizar status da solicitação (somente admin)
router.put('/:id', requireAdmin, controller.update);

// Deletar solicitação (somente admin)
router.delete('/:id', requireAdmin, controller.delete);

export default router;
