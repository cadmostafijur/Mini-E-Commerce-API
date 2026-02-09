import { Request, Response, NextFunction } from 'express';
import { AuthUtils } from '@/utils/auth';
import { ResponseUtils, ApiError } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';

/**
 * Authentication middleware to verify JWT tokens
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      ResponseUtils.unauthorized(res, 'Authorization header is required');
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      ResponseUtils.unauthorized(res, 'Authorization header must start with Bearer');
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      ResponseUtils.unauthorized(res, 'Access token is required');
      return;
    }

    try {
      const payload = AuthUtils.verifyAccessToken(token);
      
      // Attach user info to request
      (req as AuthenticatedRequest).user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      };

      next();
    } catch (jwtError) {
      ResponseUtils.unauthorized(res, 'Invalid or expired access token');
      return;
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    ResponseUtils.error(res, 'Authentication failed', 'Internal server error', 500);
  }
};

/**
 * Authorization middleware factory for role-based access control
 */
export const authorize = (allowedRoles: Array<'ADMIN' | 'CUSTOMER'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        ResponseUtils.unauthorized(res, 'User information not found');
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        ResponseUtils.forbidden(
          res,
          `Access denied. Required role: ${allowedRoles.join(' or ')}`,
          'Insufficient permissions'
        );
        return;
      }

      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      ResponseUtils.error(res, 'Authorization failed', 'Internal server error', 500);
    }
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = authorize(['ADMIN']);

/**
 * Middleware to check if user is customer
 */
export const requireCustomer = authorize(['CUSTOMER']);

/**
 * Middleware to allow both admin and customer
 */
export const requireAuthenticated = authorize(['ADMIN', 'CUSTOMER']);

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      next();
      return;
    }

    try {
      const payload = AuthUtils.verifyAccessToken(token);
      
      (req as AuthenticatedRequest).user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      };
    } catch (jwtError) {
      // Don't fail, just continue without user info
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if error occurs
  }
};