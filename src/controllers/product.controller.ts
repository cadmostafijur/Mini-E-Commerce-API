import { Request, Response } from 'express';
import { ProductService } from '@/services/product.service';
import { ResponseUtils } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { asyncHandler } from '@/middlewares/error';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * @swagger
   * /products:
   *   post:
   *     tags:
   *       - Products
   *     summary: Create a new product (Admin only)
   *     description: Create a new product in the catalog
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - price
   *               - stock
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 200
   *               description:
   *                 type: string
   *                 maxLength: 1000
   *               price:
   *                 type: number
   *                 minimum: 0.01
   *                 maximum: 999999.99
   *               stock:
   *                 type: integer
   *                 minimum: 0
   *     responses:
   *       201:
   *         description: Product created successfully
   *       403:
   *         description: Admin access required
   *       422:
   *         description: Validation error
   */
  createProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const product = await this.productService.createProduct(req.body);
    
    ResponseUtils.created(res, product, 'Product created successfully');
  });

  /**
   * @swagger
   * /products:
   *   get:
   *     tags:
   *       - Products
   *     summary: Get all products
   *     description: Retrieve all active products with pagination and filtering
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
   *         name: search
   *         schema:
   *           type: string
   *           maxLength: 200
   *       - in: query
   *         name: minPrice
   *         schema:
   *           type: number
   *           minimum: 0
   *       - in: query
   *         name: maxPrice
   *         schema:
   *           type: number
   *           minimum: 0
   *       - in: query
   *         name: inStock
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Products retrieved successfully
   */
  getProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { page, limit, search, minPrice, maxPrice, inStock } = req.query;

    const pagination = { page: Number(page) || 1, limit: Number(limit) || 10 };
    const filters = { 
      search: search as string, 
      minPrice: minPrice ? Number(minPrice) : undefined, 
      maxPrice: maxPrice ? Number(maxPrice) : undefined, 
      inStock: inStock ? inStock === 'true' : undefined 
    };

    let result;
    if (user?.role === 'ADMIN') {
      result = await this.productService.getProductsForAdmin(pagination, filters);
    } else {
      result = await this.productService.getProducts(pagination, filters);
    }
    
    ResponseUtils.success(res, result, 'Products retrieved successfully');
  });

  /**
   * @swagger
   * /products/{id}:
   *   get:
   *     tags:
   *       - Products
   *     summary: Get product by ID
   *     description: Retrieve a specific product by its ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Product retrieved successfully
   *       404:
   *         description: Product not found
   */
  getProductById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { id } = req.params;
    
    if (!id) {
      throw new Error('Product ID is required');
    }
    
    const includeInactive = user?.role === 'ADMIN';
    const product = await this.productService.getProductById(id, includeInactive);
    
    ResponseUtils.success(res, product, 'Product retrieved successfully');
  });

  /**
   * @swagger
   * /products/{id}:
   *   put:
   *     tags:
   *       - Products
   *     summary: Update product (Admin only)
   *     description: Update an existing product's information
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
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 200
   *               description:
   *                 type: string
   *                 maxLength: 1000
   *               price:
   *                 type: number
   *                 minimum: 0.01
   *                 maximum: 999999.99
   *               stock:
   *                 type: integer
   *                 minimum: 0
   *     responses:
   *       200:
   *         description: Product updated successfully
   *       403:
   *         description: Admin access required
   *       404:
   *         description: Product not found
   */
  updateProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!id) {
      throw new Error('Product ID is required');
    }
    
    const product = await this.productService.updateProduct(id, req.body);

    ResponseUtils.success(res, product, 'Product updated successfully');
  });

  /**
   * @swagger
   * /products/{id}:
   *   delete:
   *     tags:
   *       - Products
   *     summary: Delete product (Admin only)
   *     description: Soft delete a product (mark as inactive)
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
   *         description: Product deleted successfully
   *       403:
   *         description: Admin access required
   *       404:
   *         description: Product not found
   */
  deleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!id) {
      throw new Error('Product ID is required');
    }
    
    const product = await this.productService.deleteProduct(id);

    ResponseUtils.success(res, product, 'Product deleted successfully');
  });

  /**
   * @swagger
   * /products/{id}/restore:
   *   patch:
   *     tags:
   *       - Products
   *     summary: Restore deleted product (Admin only)
   *     description: Restore a soft-deleted product (mark as active)
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
   *         description: Product restored successfully
   *       403:
   *         description: Admin access required
   *       404:
   *         description: Product not found
   */
  restoreProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    if (!id) {
      throw new Error('Product ID is required');
    }
    
    const product = await this.productService.restoreProduct(id);

    ResponseUtils.success(res, product, 'Product restored successfully');
  });

  /**
   * @swagger
   * /products/low-stock:
   *   get:
   *     tags:
   *       - Products
   *     summary: Get low stock products (Admin only)
   *     description: Retrieve products with low stock levels
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: threshold
   *         schema:
   *           type: integer
   *           minimum: 0
   *           default: 10
   *     responses:
   *       200:
   *         description: Low stock products retrieved successfully
   *       403:
   *         description: Admin access required
   */
  getLowStockProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const threshold = Number(req.query.threshold) || 10;
    const products = await this.productService.getLowStockProducts(threshold);
    
    ResponseUtils.success(res, products, 'Low stock products retrieved successfully');
  });

  /**
   * @swagger
   * /products/statistics:
   *   get:
   *     tags:
   *       - Products
   *     summary: Get product statistics (Admin only)
   *     description: Retrieve product inventory statistics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Product statistics retrieved successfully
   *       403:
   *         description: Admin access required
   */
  getProductStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const statistics = await this.productService.getProductStatistics();
    
    ResponseUtils.success(res, statistics, 'Product statistics retrieved successfully');
  });

  /**
   * @swagger
   * /products/bulk-update-stock:
   *   put:
   *     tags:
   *       - Products
   *     summary: Bulk update product stocks (Admin only)
   *     description: Update multiple product stocks in a single operation
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - updates
   *             properties:
   *               updates:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - id
   *                     - stock
   *                   properties:
   *                     id:
   *                       type: string
   *                     stock:
   *                       type: integer
   *                       minimum: 0
   *     responses:
   *       200:
   *         description: Product stocks updated successfully
   *       403:
   *         description: Admin access required
   */
  bulkUpdateStock = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { updates } = req.body;
    await this.productService.bulkUpdateStock(updates);
    
    ResponseUtils.success(res, null, 'Product stocks updated successfully');
  });
}