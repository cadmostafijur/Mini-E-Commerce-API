export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'CUSTOMER';
    name: string;
  };
}

export interface CartItemRequest {
  productId: string;
  quantity: number;
}

export interface OrderRequest {
  paymentMethod?: string;
}

export interface ProductRequest {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'CUSTOMER';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateOrderStatusRequest {
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}