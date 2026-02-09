import { Response } from 'express';
import { ApiResponse } from '@/types';

export class ResponseUtils {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      statusCode,
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    error: string,
    message: string = 'An error occurred',
    statusCode: number = 500
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error,
      statusCode,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response, message: string = 'No content'): Response {
    const response: ApiResponse = {
      success: true,
      message,
      statusCode: 204,
    };
    return res.status(204).json(response);
  }

  static badRequest(res: Response, error: string, message: string = 'Bad request'): Response {
    return this.error(res, error, message, 400);
  }

  static unauthorized(res: Response, error: string = 'Unauthorized', message: string = 'Unauthorized'): Response {
    return this.error(res, error, message, 401);
  }

  static forbidden(res: Response, error: string = 'Forbidden', message: string = 'Forbidden'): Response {
    return this.error(res, error, message, 403);
  }

  static notFound(res: Response, error: string = 'Resource not found', message: string = 'Not found'): Response {
    return this.error(res, error, message, 404);
  }

  static conflict(res: Response, error: string, message: string = 'Conflict'): Response {
    return this.error(res, error, message, 409);
  }

  static unprocessableEntity(res: Response, error: string, message: string = 'Validation failed'): Response {
    return this.error(res, error, message, 422);
  }

  static tooManyRequests(res: Response, error: string = 'Too many requests', message: string = 'Rate limit exceeded'): Response {
    return this.error(res, error, message, 429);
  }
}

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string): ApiError {
    return new ApiError(message, 400);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(message, 401);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(message, 403);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(message, 404);
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 409);
  }

  static unprocessableEntity(message: string): ApiError {
    return new ApiError(message, 422);
  }

  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError(message, 429);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(message, 500, false);
  }
}