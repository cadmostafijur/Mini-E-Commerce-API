import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import { ApiError } from '@/utils/response';
import { PaginationUtils } from '@/utils/pagination';
import { PaginatedResponse } from '@/types';
import { PaymentService } from '@/utils/payment';
import { CartService } from './cart.service';
import { CreateOrderInput, PaginationInput, UpdateOrderStatusInput } from '@/utils/validation';
import { config } from '@/config';

export interface OrderWithItems {
  id: string;
  status: string;
  items: any[];
  [key: string]: any;
}

export interface OrderSummary {
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export class OrderService {
  private db: PrismaClient;
  private cartService: CartService;

  constructor() {
    this.db = prisma;
    this.cartService = new CartService();
  }

  /**
   * Create a new order from cart
   */
  async createOrder(userId: string, orderData: CreateOrderInput): Promise<OrderWithItems> {
    // Validate cart before checkout
    const { isValid, errors, cart } = await this.cartService.validateCartForCheckout(userId);

    if (!isValid) {
      throw ApiError.badRequest(`Cart validation failed: ${errors.join(', ')}`);
    }

    if (cart.items.length === 0) {
      throw ApiError.badRequest('Cannot create order from empty cart');
    }

    // Calculate order total
    const orderTotal = cart.items.reduce(
      (total, item) => total + (Number(item.product.price) * item.quantity),
      0
    );

    // Process payment simulation
    const paymentResult = await PaymentService.processPayment(
      orderTotal,
      orderData.paymentMethod || 'credit_card'
    );

    if (!paymentResult.success) {
      throw ApiError.badRequest(`Payment failed: ${paymentResult.error}`);
    }

    // Create order with transaction to ensure atomicity
    const order = await this.db.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount: orderTotal,
          status: 'PENDING',
        },
      });

      // Create order items and update stock
      const orderItems: any[] = [];
      
      for (const cartItem of cart.items) {
        // Check stock availability again within transaction
        const product = await tx.product.findUnique({
          where: { id: cartItem.productId },
        });

        if (!product || !product.isActive) {
          throw ApiError.badRequest(`Product ${cartItem.product.name} is no longer available`);
        }

        if (cartItem.quantity > product.stock) {
          throw ApiError.badRequest(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${cartItem.quantity}`
          );
        }

        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            price: cartItem.product.price,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        });

        orderItems.push(orderItem);

        // Update product stock
        await tx.product.update({
          where: { id: cartItem.productId },
          data: {
            stock: {
              decrement: cartItem.quantity,
            },
          },
        });
      }

      // Clear the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return {
        ...newOrder,
        items: orderItems,
      };
    });

    return order;
  }

  /**
   * Get orders for a user with pagination
   */
  async getUserOrders(
    userId: string,
    pagination: PaginationInput = {}
  ): Promise<PaginatedResponse<OrderWithItems>> {
    const { page, limit } = PaginationUtils.validateAndNormalizePagination(pagination);
    const offset = PaginationUtils.calculateOffset(page, limit);

    const [orders, total] = await Promise.all([
      this.db.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.db.order.count({ where: { userId } }),
    ]);

    return PaginationUtils.createPaginatedResponse(orders, {
      page,
      limit,
      total,
    });
  }

  /**
   * Get all orders (Admin only)
   */
  async getAllOrders(
    pagination: PaginationInput = {},
    status?: string
  ): Promise<PaginatedResponse<OrderWithItems>> {
    const { page, limit } = PaginationUtils.validateAndNormalizePagination(pagination);
    const offset = PaginationUtils.calculateOffset(page, limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.db.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.db.order.count({ where }),
    ]);

    return PaginationUtils.createPaginatedResponse(orders, {
      page,
      limit,
      total,
    });
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string, userId?: string): Promise<OrderWithItems> {
    const where: any = { id: orderId };
    
    // If userId is provided, restrict to user's orders
    if (userId) {
      where.userId = userId;
    }

    const order = await this.db.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    return order;
  }

  /**
   * Update order status (Admin only)
   */
  async updateOrderStatus(
    orderId: string,
    statusData: UpdateOrderStatusInput
  ): Promise<OrderWithItems> {
    const order = await this.getOrderById(orderId);

    // Validate status transition
    if (!this.isValidStatusTransition(order.status, statusData.status)) {
      throw ApiError.badRequest(
        `Invalid status transition from ${order.status} to ${statusData.status}`
      );
    }

    const updatedOrder = await this.db.order.update({
      where: { id: orderId },
      data: {
        status: statusData.status,
        updatedAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return updatedOrder;
  }

  /**
   * Cancel order (Customer can cancel PENDING orders)
   */
  async cancelOrder(orderId: string, userId: string): Promise<OrderWithItems> {
    const order = await this.getOrderById(orderId, userId);

    if (order.status !== 'PENDING') {
      throw ApiError.badRequest('Can only cancel orders with PENDING status');
    }

    // Check user's cancellation count to prevent abuse
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.cancellationCount >= config.maxCancellationCount) {
      throw ApiError.forbidden(
        `Maximum cancellation limit (${config.maxCancellationCount}) reached. Please contact support.`
      );
    }

    // Cancel order and restore stock
    const cancelledOrder = await this.db.$transaction(async (tx) => {
      // Restore stock for each order item
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
      });

      // Increment user's cancellation count
      await tx.user.update({
        where: { id: userId },
        data: {
          cancellationCount: {
            increment: 1,
          },
        },
      });

      return updatedOrder;
    });

    return cancelledOrder;
  }

  /**
   * Get order statistics (Admin only)
   */
  async getOrderStatistics(): Promise<OrderSummary> {
    const [
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      revenueResult,
    ] = await Promise.all([
      this.db.order.count(),
      this.db.order.count({ where: { status: 'PENDING' } }),
      this.db.order.count({ where: { status: 'SHIPPED' } }),
      this.db.order.count({ where: { status: 'DELIVERED' } }),
      this.db.order.count({ where: { status: 'CANCELLED' } }),
      this.db.order.aggregate({
        where: {
          status: {
            not: 'CANCELLED',
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: Number(revenueResult._sum.totalAmount) || 0,
    };
  }

  /**
   * Get recent orders (Admin only)
   */
  async getRecentOrders(limit: number = 10): Promise<OrderWithItems[]> {
    return this.db.order.findMany({
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get orders by date range
   */
  async getOrdersByDateRange(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<OrderWithItems[]> {
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (userId) {
      where.userId = userId;
    }

    return this.db.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if status transition is valid
   */
  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      PENDING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [], // Final state
      CANCELLED: [], // Final state
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Get order revenue by period
   */
  async getRevenueByd(
    period: 'day' | 'week' | 'month' | 'year',
    limit: number = 30
  ): Promise<Array<{ date: string; revenue: number; orderCount: number }>> {
    let dateFormat: string;
    let interval: string;

    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        interval = '1 day';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        interval = '1 week';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        interval = '1 month';
        break;
      case 'year':
        dateFormat = '%Y';
        interval = '1 year';
        break;
    }

    // This is a simplified version. In production, you might want to use raw SQL
    // or a more sophisticated approach for better performance
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - limit);

    const orders = await this.db.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'CANCELLED',
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Group by date and calculate revenue
    const revenueMap = new Map<string, { revenue: number; orderCount: number }>();

    orders.forEach(order => {
      const dateKey = order.createdAt?.toISOString()?.split('T')[0] || ''; // YYYY-MM-DD format
      if (!dateKey) return;
      
      const existing = revenueMap.get(dateKey) || { revenue: 0, orderCount: 0 };
      
      revenueMap.set(dateKey, {
        revenue: existing.revenue + Number(order.totalAmount),
        orderCount: existing.orderCount + 1,
      });
    });

    // Convert to array and sort by date
    return Array.from(revenueMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}