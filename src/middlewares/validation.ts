import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ResponseUtils } from '@/utils/response';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation middleware factory for Zod schemas
 */
export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let dataToValidate;

      switch (target) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        default:
          dataToValidate = req.body;
      }

      const validationResult = schema.safeParse(dataToValidate);

      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(
          (error: any) => `${error.path.join('.')}: ${error.message}`
        );
        
        ResponseUtils.unprocessableEntity(
          res,
          errorMessages.join('; '),
          'Validation failed'
        );
        return;
      }

      // Replace the original data with validated data
      switch (target) {
        case 'body':
          req.body = validationResult.data;
          break;
        case 'query':
          req.query = validationResult.data;
          break;
        case 'params':
          req.params = validationResult.data;
          break;
      }

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      ResponseUtils.error(res, 'Validation error', 'Internal server error', 500);
    }
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');

/**
 * Validate route parameters
 */
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');

/**
 * Multiple validation middleware for complex validations
 */
export const validateMultiple = (validations: Array<{
  schema: ZodSchema;
  target: ValidationTarget;
}>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors: string[] = [];

      for (const { schema, target } of validations) {
        let dataToValidate;

        switch (target) {
          case 'body':
            dataToValidate = req.body;
            break;
          case 'query':
            dataToValidate = req.query;
            break;
          case 'params':
            dataToValidate = req.params;
            break;
          default:
            dataToValidate = req.body;
        }

        const validationResult = schema.safeParse(dataToValidate);

        if (!validationResult.success) {
          const targetErrors = validationResult.error.errors.map(
            (error) => `${target}.${error.path.join('.')}: ${error.message}`
          );
          errors.push(...targetErrors);
        } else {
          // Update the validated data
          switch (target) {
            case 'body':
              req.body = validationResult.data;
              break;
            case 'query':
              req.query = validationResult.data;
              break;
            case 'params':
              req.params = validationResult.data;
              break;
          }
        }
      }

      if (errors.length > 0) {
        ResponseUtils.unprocessableEntity(
          res,
          errors.join('; '),
          'Validation failed'
        );
        return;
      }

      next();
    } catch (error) {
      console.error('Multiple validation middleware error:', error);
      ResponseUtils.error(res, 'Validation error', 'Internal server error', 500);
    }
  };
};