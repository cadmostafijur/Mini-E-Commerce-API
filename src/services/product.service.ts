import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import { ApiError } from '@/utils/response';
import { PaginationUtils } from '@/utils/pagination';
import { PaginatedResponse } from '@/types';
import { CreateProductInput, UpdateProductInput, ProductFilterInput, PaginationInput } from '@/utils/validation';

export class ProductService {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  /**
   * Create a new product (Admin only)
   */
  async createProduct(data: CreateProductInput): Promise<any> {
    return this.db.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
      },
    });
  }

  /**
   * Get all products with pagination and filtering
   */
  async getProducts(
    pagination: PaginationInput = {},
    filters: ProductFilterInput = {}
  ): Promise<PaginatedResponse<any>> {
    const { page, limit } = PaginationUtils.validateAndNormalizePagination(pagination);
    const offset = PaginationUtils.calculateOffset(page, limit);

    // Build where clause for filtering
    const where: any = {
      isActive: true, // Only show active products
    };

    // Add search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Add price filters
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    // Add stock filter
    if (filters.inStock !== undefined) {
      if (filters.inStock) {
        where.stock = { gt: 0 };
      } else {
        where.stock = { lte: 0 };
      }
    }

    // Execute queries
    const [products, total] = await Promise.all([
      this.db.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.db.product.count({ where }),
    ]);

    return PaginationUtils.createPaginatedResponse(products, {
      page,
      limit,
      total,
    });
  }

  /**
   * Get all products for admin (includes inactive)
   */
  async getProductsForAdmin(
    pagination: PaginationInput = {},
    filters: ProductFilterInput = {}
  ): Promise<PaginatedResponse<any>> {
    const { page, limit } = PaginationUtils.validateAndNormalizePagination(pagination);
    const offset = PaginationUtils.calculateOffset(page, limit);

    // Build where clause for filtering (without isActive filter for admin)
    const where: any = {};

    // Add search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Add price filters
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    // Add stock filter
    if (filters.inStock !== undefined) {
      if (filters.inStock) {
        where.stock = { gt: 0 };
      } else {
        where.stock = { lte: 0 };
      }
    }

    // Execute queries
    const [products, total] = await Promise.all([
      this.db.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.db.product.count({ where }),
    ]);

    return PaginationUtils.createPaginatedResponse(products, {
      page,
      limit,
      total,
    });
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string, includeInactive = false): Promise<any> {
    const where: any = { id };
    
    if (!includeInactive) {
      where.isActive = true;
    }

    const product = await this.db.product.findFirst({
      where,
    });

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    return product;
  }

  /**
   * Update product (Admin only)
   */
  async updateProduct(id: string, data: UpdateProductInput): Promise<any> {
    // Check if product exists
    await this.getProductById(id, true); // Include inactive for admin operations

    // Validate stock if provided
    if (data.stock !== undefined && data.stock < 0) {
      throw ApiError.badRequest('Stock cannot be negative');
    }

    // Validate price if provided
    if (data.price !== undefined && data.price <= 0) {
      throw ApiError.badRequest('Price must be greater than 0');
    }

    return this.db.product.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete product (Admin only)
   */
  async deleteProduct(id: string): Promise<any> {
    // Check if product exists
    await this.getProductById(id, true); // Include inactive for admin operations

    return this.db.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Hard delete product (Admin only) - use with caution
   */
  async hardDeleteProduct(id: string): Promise<void> {
    // Check if product exists
    await this.getProductById(id, true);

    // Check if product has any order items
    const orderItemsCount = await this.db.orderItem.count({
      where: { productId: id },
    });

    if (orderItemsCount > 0) {
      throw ApiError.badRequest(
        'Cannot delete product with existing order history. Use soft delete instead.'
      );
    }

    // Remove from any carts first
    await this.db.cartItem.deleteMany({
      where: { productId: id },
    });

    // Delete the product
    await this.db.product.delete({
      where: { id },
    });
  }

  /**
   * Restore soft-deleted product (Admin only)
   */
  async restoreProduct(id: string): Promise<any> {
    // Check if product exists (including inactive)
    const product = await this.db.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    if (product.isActive) {
      throw ApiError.badRequest('Product is already active');
    }

    return this.db.product.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Update product stock (used internally for orders)
   */
  async updateStock(id: string, quantity: number, operation: 'increase' | 'decrease'): Promise<any> {
    const product = await this.getProductById(id);

    let newStock: number;
    if (operation === 'increase') {
      newStock = product.stock + quantity;
    } else {
      newStock = product.stock - quantity;
      if (newStock < 0) {
        throw ApiError.badRequest(`Insufficient stock. Available: ${product.stock}, Required: ${quantity}`);
      }
    }

    return this.db.product.update({
      where: { id },
      data: { stock: newStock },
    });
  }

  /**
   * Check product stock availability
   */
  async checkStockAvailability(id: string, requiredQuantity: number): Promise<boolean> {
    const product = await this.getProductById(id);
    return product.stock >= requiredQuantity;
  }

  /**
   * Get low stock products (Admin only)
   */
  async getLowStockProducts(threshold: number = 10): Promise<any[]> {
    return this.db.product.findMany({
      where: {
        isActive: true,
        stock: { lte: threshold },
      },
      orderBy: { stock: 'asc' },
    });
  }

  /**
   * Get product statistics (Admin only)
   */
  async getProductStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    outOfStock: number;
  }> {
    const [total, active, inactive, lowStock, outOfStock] = await Promise.all([
      this.db.product.count(),
      this.db.product.count({ where: { isActive: true } }),
      this.db.product.count({ where: { isActive: false } }),
      this.db.product.count({ 
        where: { 
          isActive: true, 
          stock: { lte: 10, gt: 0 } 
        } 
      }),
      this.db.product.count({ 
        where: { 
          isActive: true, 
          stock: 0 
        } 
      }),
    ]);

    return {
      total,
      active,
      inactive,
      lowStock,
      outOfStock,
    };
  }

  /**
   * Bulk update product stocks (Admin only)
   */
  async bulkUpdateStock(updates: Array<{ id: string; stock: number }>): Promise<void> {
    await this.db.$transaction(async (tx) => {
      for (const update of updates) {
        if (update.stock < 0) {
          throw ApiError.badRequest(`Stock cannot be negative for product ${update.id}`);
        }

        await tx.product.update({
          where: { id: update.id },
          data: { stock: update.stock },
        });
      }
    });
  }
}