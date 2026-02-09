import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '@/config';
import { ResponseUtils } from '@/utils/response';

/**
 * General rate limiting configuration
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 15 minutes
  max: config.rateLimitMaxRequests, // Limit each IP to X requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    statusCode: 429,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    ResponseUtils.tooManyRequests(
      res,
      'Too many requests from this IP, please try again later.'
    );
  },
});

/**
 * Strict rate limiting for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    ResponseUtils.tooManyRequests(
      res,
      'Too many authentication attempts, please try again in 15 minutes.'
    );
  },
});

/**
 * Rate limiting for order creation
 */
export const orderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 order creation requests per 5 minutes
  message: {
    success: false,
    message: 'Too many order attempts, please try again in a few minutes.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    ResponseUtils.tooManyRequests(
      res,
      'Too many order attempts, please try again in a few minutes.'
    );
  },
});

/**
 * Rate limiting for cart operations
 */
export const cartLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 cart operations per minute
  message: {
    success: false,
    message: 'Too many cart operations, please slow down.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    ResponseUtils.tooManyRequests(
      res,
      'Too many cart operations, please slow down.'
    );
  },
});

/**
 * Rate limiting for product creation/updates (admin only)
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 admin operations per minute
  message: {
    success: false,
    message: 'Too many admin operations, please slow down.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    ResponseUtils.tooManyRequests(
      res,
      'Too many admin operations, please slow down.'
    );
  },
});

/**
 * Custom rate limiter for user-specific operations
 */
export const createUserBasedLimiter = (max: number, windowMs: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise IP
      const user = (req as any).user;
      return user?.id || req.ip;
    },
    message: {
      success: false,
      message: message || 'Too many requests from this user.',
      statusCode: 429,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      ResponseUtils.tooManyRequests(
        res,
        message || 'Too many requests from this user.'
      );
    },
  });
};

/**
 * User-specific order cancellation limiter
 */
export const orderCancellationLimiter = createUserBasedLimiter(
  3, // 3 cancellations
  60 * 60 * 1000, // per hour
  'Too many order cancellations. Please contact support if you need assistance.'
);