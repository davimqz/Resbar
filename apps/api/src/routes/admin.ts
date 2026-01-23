import { Router } from 'express';
import { promoteUser } from '../controllers/admin.controller.js';

const router = Router();

router.post('/promote', promoteUser);

export default router;
