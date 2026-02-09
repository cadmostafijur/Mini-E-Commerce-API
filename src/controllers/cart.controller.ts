import { Request, Response } from 'express';
import { CartService } from '@/services/cart.service';
import { ResponseUtils } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { asyncHandler } from '@/middlewares/error';

export class CartController {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  /**
   * @swagger
   * /cart:
   *   get:
   *     tags:
   *       - Cart
   *     summary: Get user's cart
   *     description: Retrieve user's shopping cart with items and totals
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cart retrieved successfully
   *       404:
   *         description: Cart not found
   */
  getCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const cart = await this.cartService.getOrCreateCart(user!.id);
    
    ResponseUtils.success(res, cart, 'Cart retrieved successfully');
  });

  /**
   * @swagger
   * /cart/add:
   *   post:
   *     tags:
   *       - Cart
   *     summary: Add item to cart
   *     description: Add a product to the user's shopping cart
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - productId
   *               - quantity
   *             properties:
   *               productId:
   *                 type: string
   *               quantity:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 999
   *     responses:
   *       200:
   *         description: Item added to cart successfully
   *       400:
   *         description: Insufficient stock or invalid product
   *       404:
   *         description: Product not found
   */
  addToCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const cart = await this.cartService.addToCart(user!.id, req.body);
    
    ResponseUtils.success(res, cart, 'Item added to cart successfully');
  });

  /**
   * @swagger
   * /cart/remove:
   *   post:
   *     tags:
   *       - Cart
   *     summary: Remove item from cart
   *     description: Remove a product from the user's shopping cart or decrease quantity
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - productId
   *             properties:
   *               productId:
   *                 type: string
   *               quantity:
   *                 type: integer
   *                 minimum: 1
   *                 description: Quantity to remove. If not provided or exceeds current quantity, item will be removed completely.
   *     responses:
   *       200:
   *         description: Item removed from cart successfully
   *       404:
   *         description: Item not found in cart
   */
  removeFromCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const cart = await this.cartService.removeFromCart(user!.id, req.body);
    
    ResponseUtils.success(res, cart, 'Item removed from cart successfully');
  });

  /**
   * @swagger
   * /cart/item/{productId}:
   *   put:
   *     tags:
   *       - Cart
   *     summary: Update cart item quantity
   *     description: Update the quantity of a specific item in the cart
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
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
   *               - quantity
   *             properties:
   *               quantity:
   *                 type: integer
   *                 minimum: 0
   *                 maximum: 999
   *                 description: New quantity. Set to 0 to remove item.
   *     responses:
   *       200:
   *         description: Cart item updated successfully
   *       400:
   *         description: Insufficient stock or invalid quantity
   *       404:
   *         description: Item not found in cart
   */
  updateCartItemQuantity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const cart = await this.cartService.updateCartItemQuantity(user!.id, productId, quantity);
    
    ResponseUtils.success(res, cart, 'Cart item updated successfully');
  });

  /**
   * @swagger
   * /cart/clear:
   *   delete:
   *     tags:
   *       - Cart
   *     summary: Clear cart
   *     description: Remove all items from the user's shopping cart
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cart cleared successfully
   */
  clearCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    await this.cartService.clearCart(user!.id);
    
    ResponseUtils.success(res, null, 'Cart cleared successfully');
  });

  /**
   * @swagger
   * /cart/count:
   *   get:
   *     tags:
   *       - Cart
   *     summary: Get cart item count
   *     description: Get the total number of items in the user's cart
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cart item count retrieved successfully
   */
  getCartItemCount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const count = await this.cartService.getCartItemCount(user!.id);
    
    ResponseUtils.success(res, { count }, 'Cart item count retrieved successfully');
  });

  /**
   * @swagger
   * /cart/summary:
   *   get:
   *     tags:
   *       - Cart
   *     summary: Get cart summary
   *     description: Get a quick summary of the user's cart (item count, total amount, etc.)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cart summary retrieved successfully
   */
  getCartSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const summary = await this.cartService.getCartSummary(user!.id);
    
    ResponseUtils.success(res, summary, 'Cart summary retrieved successfully');
  });

  /**
   * @swagger
   * /cart/validate:
   *   get:
   *     tags:
   *       - Cart
   *     summary: Validate cart for checkout
   *     description: Check if cart is ready for checkout and identify any issues
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cart validation completed
   */
  validateCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const validation = await this.cartService.validateCartForCheckout(user!.id);
    
    ResponseUtils.success(res, validation, 'Cart validation completed');
  });

  /**
   * @swagger
   * /cart/cleanup:
   *   post:
   *     tags:
   *       - Cart
   *     summary: Clean up cart
   *     description: Remove unavailable items and update quantities for items exceeding stock
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cart cleaned up successfully
   */
  cleanupCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const cart = await this.cartService.cleanupCart(user!.id);
    
    ResponseUtils.success(res, cart, 'Cart cleaned up successfully');
  });

  /**
   * @swagger
   * /cart/check/{productId}:
   *   get:
   *     tags:
   *       - Cart
   *     summary: Check if product is in cart
   *     description: Check if a specific product is already in the user's cart
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Product check completed
   */
  checkProductInCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { productId } = req.params;
    
    if (!productId) {
      throw new Error('Product ID is required');
    }
    const inCart = await this.cartService.isProductInCart(user!.id, productId);
    
    ResponseUtils.success(res, { inCart }, 'Product check completed');
  });
}