import { Request, Response } from 'express';
import { OrderService } from '@/services/order.service';
import { ResponseUtils } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { asyncHandler } from '@/middlewares/error';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * @swagger
   * /orders:
   *   post:
   *     tags:
   *       - Orders
   *     summary: Create a new order
   *     description: Create a new order from the current cart items
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               paymentMethod:
   *                 type: string
   *                 default: credit_card
   *                 description: Payment method for the order
   *     responses:
   *       201:
   *         description: Order created successfully
   *       400:
   *         description: Cart validation failed or payment failed
   *       422:
   *         description: Invalid order data
   */
  createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const order = await this.orderService.createOrder(user!.id, req.body);
    
    ResponseUtils.created(res, order, 'Order created successfully');
  });

  /**
   * @swagger
   * /orders:
   *   get:
   *     tags:
   *       - Orders
   *     summary: Get orders
   *     description: Get user's orders (customers) or all orders (admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, SHIPPED, DELIVERED, CANCELLED]
   *         description: Filter by order status (admin only)
   *     responses:
   *       200:
   *         description: Orders retrieved successfully
   */
  getOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { page, limit, status } = req.query;

    const pagination = { page: Number(page), limit: Number(limit) };

    let orders;
    if (user!.role === 'ADMIN') {
      orders = await this.orderService.getAllOrders(pagination, status as any);
    } else {
      orders = await this.orderService.getUserOrders(user!.id, pagination);
    }
    
    ResponseUtils.success(res, orders, 'Orders retrieved successfully');
  });

  /**
   * @swagger
   * /orders/{id}:
   *   get:
   *     tags:
   *       - Orders
   *     summary: Get order by ID
   *     description: Retrieve a specific order by its ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Order retrieved successfully
   *       404:
   *         description: Order not found
   *       403:
   *         description: Access denied to this order
   */
  getOrderById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;
    
    if (!id) {
      throw new Error('Order ID is required');
    }

    // Admin can see any order, customers can only see their own
    const userId = user!.role === 'ADMIN' ? undefined : user!.id;
    const order = await this.orderService.getOrderById(id, userId);
    
    ResponseUtils.success(res, order, 'Order retrieved successfully');
  });

  /**
   * @swagger
   * /orders/{id}/status:
   *   put:
   *     tags:
   *       - Orders
   *     summary: Update order status (Admin only)
   *     description: Update the status of an order
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [PENDING, SHIPPED, DELIVERED, CANCELLED]
   *     responses:
   *       200:
   *         description: Order status updated successfully
   *       400:
   *         description: Invalid status transition
   *       403:
   *         description: Admin access required
   *       404:
   *         description: Order not found
   */
  updateOrderStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!id) {
      throw new Error('Order ID is required');
    }
    
    const order = await this.orderService.updateOrderStatus(id, req.body);
    
    ResponseUtils.success(res, order, 'Order status updated successfully');
  });

  /**
   * @swagger
   * /orders/{id}/cancel:
   *   patch:
   *     tags:
   *       - Orders
   *     summary: Cancel order
   *     description: Cancel a pending order (customers can cancel their own pending orders)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Order cancelled successfully
   *       400:
   *         description: Cannot cancel order (not pending or other reasons)
   *       403:
   *         description: Access denied or cancellation limit reached
   *       404:
   *         description: Order not found
   */
  cancelOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;
    
    if (!id) {
      throw new Error('Order ID is required');
    }

    const order = await this.orderService.cancelOrder(id, user!.id);
    
    ResponseUtils.success(res, order, 'Order cancelled successfully');
  });

  /**
   * @swagger
   * /orders/statistics:
   *   get:
   *     tags:
   *       - Orders
   *     summary: Get order statistics (Admin only)
   *     description: Retrieve comprehensive order statistics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Order statistics retrieved successfully
   *       403:
   *         description: Admin access required
   */
  getOrderStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const statistics = await this.orderService.getOrderStatistics();
    
    ResponseUtils.success(res, statistics, 'Order statistics retrieved successfully');
  });

  /**
   * @swagger
   * /orders/recent:
   *   get:
   *     tags:
   *       - Orders
   *     summary: Get recent orders (Admin only)
   *     description: Retrieve most recent orders
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *     responses:
   *       200:
   *         description: Recent orders retrieved successfully
   *       403:
   *         description: Admin access required
   */
  getRecentOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit) || 10;
    const orders = await this.orderService.getRecentOrders(limit);
    
    ResponseUtils.success(res, orders, 'Recent orders retrieved successfully');
  });

  /**
   * @swagger
   * /orders/revenue:
   *   get:
   *     tags:
   *       - Orders
   *     summary: Get revenue by period (Admin only)
   *     description: Retrieve revenue data grouped by time period
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [day, week, month, year]
   *           default: day
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 365
   *           default: 30
   *     responses:
   *       200:
   *         description: Revenue data retrieved successfully
   *       403:
   *         description: Admin access required
   */
  getRevenueByPeriod = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const period = (req.query.period as any) || 'day';
    const limit = Number(req.query.limit) || 30;
    
    const revenue = await this.orderService.getRevenueByd(period, limit);
    
    ResponseUtils.success(res, revenue, 'Revenue data retrieved successfully');
  });

  /**
   * @swagger
   * /orders/date-range:
   *   get:
   *     tags:
   *       - Orders
   *     summary: Get orders by date range
   *     description: Retrieve orders within a specific date range
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Orders retrieved successfully
   *       400:
   *         description: Invalid date range
   *       403:
   *         description: Access denied (customers can only see their own orders)
   */
  getOrdersByDateRange = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      ResponseUtils.badRequest(res, 'Start date and end date are required');
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      ResponseUtils.badRequest(res, 'Invalid date format');
      return;
    }

    if (start > end) {
      ResponseUtils.badRequest(res, 'Start date must be before end date');
      return;
    }

    // Admin can see all orders, customers can only see their own
    const userId = user!.role === 'ADMIN' ? undefined : user!.id;
    const orders = await this.orderService.getOrdersByDateRange(start, end, userId);
    
    ResponseUtils.success(res, orders, 'Orders retrieved successfully');
  });
}