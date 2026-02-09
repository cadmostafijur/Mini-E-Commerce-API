import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { productRoutes } from './product.routes';
import { cartRoutes } from './cart.routes';
import { orderRoutes } from './order.routes';
import { ResponseUtils } from '@/utils/response';

const router = Router();

// Root API endpoint - List all available endpoints
router.get('/', (req, res) => {
  ResponseUtils.success(res, {
    message: 'Mini E-Commerce API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login', 
        refresh: 'POST /api/auth/refresh',
        profile: 'GET /api/auth/profile',
        logout: 'POST /api/auth/logout'
      },
      products: {
        list: 'GET /api/products',
        details: 'GET /api/products/:id',
        create: 'POST /api/products (Admin)',
        update: 'PUT /api/products/:id (Admin)',
        delete: 'DELETE /api/products/:id (Admin)'
      },
      cart: {
        get: 'GET /api/cart',
        add: 'POST /api/cart/add',
        update: 'PUT /api/cart/items/:productId',
        remove: 'DELETE /api/cart/items/:productId',
        clear: 'DELETE /api/cart/clear'
      },
      orders: {
        list: 'GET /api/orders',
        details: 'GET /api/orders/:id',
        create: 'POST /api/orders',
        cancel: 'PATCH /api/orders/:id/cancel'
      }
    }
  }, 'Available API endpoints');
});

// Health check endpoint
router.get('/health', (req, res) => {
  ResponseUtils.success(res, {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  }, 'API is healthy');
});

// API endpoints
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);

export { router as apiRoutes };