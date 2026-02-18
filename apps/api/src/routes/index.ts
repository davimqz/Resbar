import { Router } from 'express';
import authRoutes from './auth.js';
import waiterRoutes from './waiters.js';
import tableRoutes from './tables.js';
import personRoutes from './persons.js';
import tabRoutes from './tabs.js';
import orderRoutes from './orders.js';
import menuItemRoutes from './menu-items.js';
import dashboardRoutes from './dashboard.js';
import inventoryRoutes from './inventory.js';
import uploadRoutes from './uploads.js';
import adminRoutes from './admin.js';
import metricsRoutes from './metrics.js';
import returnRequestRoutes from './return-requests.js';
import tabCancellationRoutes from './tab-cancellation.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/waiters', waiterRoutes);
router.use('/tables', tableRoutes);
router.use('/persons', personRoutes);
router.use('/tabs', tabRoutes);
router.use('/orders', orderRoutes);
router.use('/menu-items', menuItemRoutes);
router.use('/uploads', uploadRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/metrics', metricsRoutes);
router.use('/admin', adminRoutes);
router.use('/return-requests', returnRequestRoutes);
router.use('/tab-cancellation', tabCancellationRoutes);

export default router;
