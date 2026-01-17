import { Router } from 'express';
import { PersonController } from '../controllers/person.controller.js';

const router = Router();
const controller = new PersonController();

router.post('/', controller.create);
router.get('/:id', controller.getById);
router.delete('/:id', controller.delete);

export default router;
