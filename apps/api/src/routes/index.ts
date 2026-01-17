import { Router } from 'express';
import waiterRoutes from './waiters.js';
import tableRoutes from './tables.js';
import personRoutes from './persons.js';
import tabRoutes from './tabs.js';
import orderRoutes from './orders.js';
import menuItemRoutes from './menu-items.js';

const router = Router();

router.use('/waiters', waiterRoutes);
router.use('/tables', tableRoutes);
router.use('/persons', personRoutes);
router.use('/tabs', tabRoutes);
router.use('/orders', orderRoutes);
router.use('/menu-items', menuItemRoutes);

export default router;
