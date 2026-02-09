import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { authenticate, requireAuthenticated } from '@/middlewares/auth';
import { validateBody } from '@/middlewares/validation';
import { authLimiter } from '@/middlewares/rateLimit';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  createProductSchema
} from '@/utils/validation';

const router = Router();
const authController = new AuthController();

/**
 * Authentication Routes
 */

// Public routes (no authentication required)
router.post('/register', 
  authLimiter,
  validateBody(registerSchema),
  authController.register
);

router.post('/login',
  authLimiter, 
  validateBody(loginSchema),
  authController.login
);

router.post('/refresh',
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

// Protected routes (authentication required)
router.use(authenticate);

router.post('/logout',
  validateBody(refreshTokenSchema),
  authController.logout
);

router.post('/logout-all',
  requireAuthenticated,
  authController.logoutAll
);

router.get('/profile',
  requireAuthenticated,
  authController.getProfile
);

router.put('/profile',
  requireAuthenticated,
  validateBody(registerSchema.partial().omit({ password: true, role: true })),
  authController.updateProfile
);

router.put('/change-password',
  requireAuthenticated,
  validateBody(registerSchema.pick({ password: true }).extend({
    currentPassword: registerSchema.shape.password,
    newPassword: registerSchema.shape.password
  })),
  authController.changePassword
);

export { router as authRoutes };