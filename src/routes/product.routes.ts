import { Router } from 'express';
import { ProductController } from '@/controllers/product.controller';
import { authenticate, requireAdmin, optionalAuth } from '@/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation';
import { adminLimiter } from '@/middlewares/rateLimit';
import { 
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  paginationSchema,
  productFilterSchema
} from '@/utils/validation';

const router = Router();
const productController = new ProductController();

/**
 * Product Routes
 */

// Public routes (optional authentication for admin features)
router.get('/',
  optionalAuth,
  validateQuery(paginationSchema.merge(productFilterSchema)),
  productController.getProducts
);

router.get('/:id',
  optionalAuth,
  validateParams(productIdSchema),
  productController.getProductById
);

// Admin-only routes
router.use(authenticate);
router.use(requireAdmin);
router.use(adminLimiter);

router.post('/',
  validateBody(createProductSchema),
  productController.createProduct
);

router.put('/:id',
  validateParams(productIdSchema),
  validateBody(updateProductSchema),
  productController.updateProduct
);

router.delete('/:id',
  validateParams(productIdSchema),
  productController.deleteProduct
);

router.patch('/:id/restore',
  validateParams(productIdSchema),
  productController.restoreProduct
);

router.get('/admin/low-stock',
  productController.getLowStockProducts
);

router.get('/admin/statistics',
  productController.getProductStatistics
);

router.put('/admin/bulk-update-stock',
  validateBody(createProductSchema.pick({ stock: true }).extend({
    updates: createProductSchema.pick({ stock: true }).extend({
      id: productIdSchema.shape.id
    }).array()
  })),
  productController.bulkUpdateStock
);

export { router as productRoutes };