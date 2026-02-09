import { Router } from 'express';
import { CartController } from '@/controllers/cart.controller';
import { authenticate, requireCustomer } from '@/middlewares/auth';
import { validateBody, validateParams } from '@/middlewares/validation';
import { cartLimiter } from '@/middlewares/rateLimit';
import { 
  addToCartSchema,
  removeFromCartSchema,
  productIdSchema
} from '@/utils/validation';

const router = Router();
const cartController = new CartController();

/**
 * Cart Routes - All routes require authentication as a customer
 */

router.use(authenticate);
router.use(requireCustomer);
router.use(cartLimiter);

// Get cart
router.get('/',
  cartController.getCart
);

// Add item to cart
router.post('/add',
  validateBody(addToCartSchema),
  cartController.addToCart
);

// Remove item from cart
router.post('/remove',
  validateBody(removeFromCartSchema),
  cartController.removeFromCart
);

// Update cart item quantity
router.put('/item/:productId',
  validateParams(productIdSchema),
  validateBody(addToCartSchema.pick({ quantity: true })),
  cartController.updateCartItemQuantity
);

// Clear entire cart
router.delete('/clear',
  cartController.clearCart
);

// Get cart item count
router.get('/count',
  cartController.getCartItemCount
);

// Get cart summary
router.get('/summary',
  cartController.getCartSummary
);

// Validate cart for checkout
router.get('/validate',
  cartController.validateCart
);

// Clean up cart (remove unavailable items)
router.post('/cleanup',
  cartController.cleanupCart
);

// Check if product is in cart
router.get('/check/:productId',
  validateParams(productIdSchema),
  cartController.checkProductInCart
);

export { router as cartRoutes };