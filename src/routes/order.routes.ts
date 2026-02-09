import { Router } from 'express';
import { OrderController } from '@/controllers/order.controller';
import { authenticate, requireAdmin, requireAuthenticated } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import { orderLimiter, orderCancellationLimiter } from '@/middlewares/rateLimit';
import { 
  createOrderSchema,
  updateOrderStatusSchema,
  orderIdSchema,
  paginationSchema
} from '@/utils/validation';
import { z } from 'zod';

const router = Router();
const orderController = new OrderController();

/**
 * Order Routes - All routes require authentication
 */

router.use(authenticate);
router.use(requireAuthenticated);

// Create new order (customers only)
router.post('/',
  orderLimiter,
  validateBody(createOrderSchema),
  orderController.createOrder
);

// Get orders (user's own orders or all orders for admin)
router.get('/',
  validateQuery(paginationSchema.extend({
    status: z.enum(['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional()
  })),
  orderController.getOrders
);

// Get order by ID
router.get('/:id',
  validateParams(orderIdSchema),
  orderController.getOrderById
);

// Cancel order (customers can cancel their own pending orders)
router.patch('/:id/cancel',
  orderCancellationLimiter,
  validateParams(orderIdSchema),
  orderController.cancelOrder
);

// Get orders by date range
router.get('/filter/date-range',
  validateQuery(z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  })),
  orderController.getOrdersByDateRange
);

// Admin-only routes
router.use(requireAdmin);

// Update order status (admin only)
router.put('/:id/status',
  validateParams(orderIdSchema),
  validateBody(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

// Get order statistics (admin only)
router.get('/admin/statistics',
  orderController.getOrderStatistics
);

// Get recent orders (admin only)
router.get('/admin/recent',
  validateQuery(z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).refine(val => val >= 1 && val <= 50).optional()
  })),
  orderController.getRecentOrders
);

// Get revenue by period (admin only)
router.get('/admin/revenue',
  validateQuery(z.object({
    period: z.enum(['day', 'week', 'month', 'year']).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).refine(val => val >= 1 && val <= 365).optional()
  })),
  orderController.getRevenueByPeriod
);

export { router as orderRoutes };