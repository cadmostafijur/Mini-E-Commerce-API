import { Request, Response, NextFunction } from 'express';
import { ApiError, ResponseUtils } from '@/utils/response';
import { config } from '@/config';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: error.message,
    stack: config.nodeEnv === 'development' ? error.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle API errors
  if (error instanceof ApiError) {
    ResponseUtils.error(res, error.message, error.message, error.statusCode);
    return;
  }

  // Handle Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    handlePrismaError(error, res);
    return;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errorMessages = error.errors.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    );
    ResponseUtils.unprocessableEntity(
      res,
      errorMessages.join('; '),
      'Validation failed'
    );
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    ResponseUtils.unauthorized(res, 'Invalid token', 'Authentication failed');
    return;
  }

  if (error.name === 'TokenExpiredError') {
    ResponseUtils.unauthorized(res, 'Token expired', 'Authentication failed');
    return;
  }

  // Handle other common errors
  if (error.name === 'CastError') {
    ResponseUtils.badRequest(res, 'Invalid ID format');
    return;
  }

  if (error.name === 'ValidationError') {
    ResponseUtils.unprocessableEntity(res, error.message, 'Validation failed');
    return;
  }

  // Default to 500 internal server error
  const message = config.nodeEnv === 'production' 
    ? 'Internal server error'
    : error.message;

  ResponseUtils.error(res, message, 'Internal server error', 500);
};

/**
 * Handle Prisma-specific errors
 */
const handlePrismaError = (error: PrismaClientKnownRequestError, res: Response): void => {
  switch (error.code) {
    case 'P2001': // Record not found
      ResponseUtils.notFound(res, 'Resource not found');
      break;
    
    case 'P2002': // Unique constraint violation
      const target = error.meta?.target as string[] || ['field'];
      ResponseUtils.conflict(
        res,
        `${target.join(', ')} already exists`,
        'Duplicate entry'
      );
      break;
    
    case 'P2003': // Foreign key constraint violation
      ResponseUtils.badRequest(
        res,
        'Related resource not found or invalid reference',
        'Foreign key constraint failed'
      );
      break;
    
    case 'P2025': // Record not found in where condition
      ResponseUtils.notFound(res, 'Resource not found');
      break;
    
    case 'P2014': // Required relation missing
      ResponseUtils.badRequest(
        res,
        'Required related resource is missing',
        'Required relation missing'
      );
      break;
    
    default:
      console.error('Unhandled Prisma error:', error);
      ResponseUtils.error(
        res,
        'Database operation failed',
        'Database error',
        500
      );
  }
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseUtils.notFound(
    res,
    `Route ${req.method} ${req.path} not found`,
    'Route not found'
  );
};

/**
 * Async error wrapper to catch promise rejections
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};