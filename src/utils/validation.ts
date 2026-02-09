import { z } from 'zod';

// User Validation Schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one lowercase letter, one uppercase letter, one digit and one special character'),
  role: z.enum(['ADMIN', 'CUSTOMER']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Product Validation Schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  price: z.number()
    .positive('Price must be positive')
    .max(999999.99, 'Price must be less than 1,000,000'),
  stock: z.number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative'),
});

export const updateProductSchema = createProductSchema.partial();

export const productIdSchema = z.object({
  id: z.string().cuid('Invalid product ID'),
});

// Cart Validation Schemas
export const addToCartSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(999, 'Quantity cannot exceed 999'),
});

export const removeFromCartSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .optional(),
});

// Order Validation Schemas
export const createOrderSchema = z.object({
  paymentMethod: z.string().min(1, 'Payment method is required').optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], {
    required_error: 'Order status is required',
    invalid_type_error: 'Invalid order status',
  }),
});

export const orderIdSchema = z.object({
  id: z.string().cuid('Invalid order ID'),
});

// Pagination Validation Schema
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a positive integer').transform(Number).refine((val: number) => val > 0, 'Page must be greater than 0').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a positive integer').transform(Number).refine((val: number) => val > 0 && val <= 100, 'Limit must be between 1 and 100').optional(),
});

// Search and Filter Schemas
export const productFilterSchema = z.object({
  search: z.string().max(200, 'Search term must be less than 200 characters').optional(),
  minPrice: z.string().regex(/^\d*\.?\d+$/, 'Min price must be a valid number').transform(Number).optional(),
  maxPrice: z.string().regex(/^\d*\.?\d+$/, 'Max price must be a valid number').transform(Number).optional(),
  inStock: z.string().transform((val: string) => val === 'true').optional(),
});

// User ID Validation
export const userIdSchema = z.object({
  id: z.string().cuid('Invalid user ID'),
});

// General ID validation
export const idSchema = z.object({
  id: z.string().cuid('Invalid ID format'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;