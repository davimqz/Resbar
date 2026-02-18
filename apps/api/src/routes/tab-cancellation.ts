import { Router } from 'express';
import { TabCancellationController } from '../controllers/tab-cancellation.controller.js';
import { requireAdmin, requireWaiter } from '../middleware/role.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const controller = new TabCancellationController();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Listar todas as solicitações (somente admin e garçom)
router.get('/', requireWaiter, controller.getAll);

// Obter solicitação por ID (somente admin e garçom)
router.get('/:id', requireWaiter, controller.getById);

// Obter solicitações por comanda (somente admin e garçom)
router.get('/tab/:tabId', requireWaiter, controller.getByTabId);

// Criar solicitação de cancelamento (somente admin e garçom)
router.post('/', requireWaiter, controller.create);

// Atualizar status da solicitação (somente admin)
router.put('/:id', requireAdmin, controller.update);

// Deletar solicitação (somente admin)
router.delete('/:id', requireAdmin, controller.delete);

export default router;
