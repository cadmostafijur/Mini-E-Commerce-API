import { PrismaClient } from '@prisma/client';
import { prisma } from '@/config/database';
import { ApiError } from '@/utils/response';
import { AddToCartInput, RemoveFromCartInput } from '@/utils/validation';

export interface CartWithItems {
  id: string;
  items: any[];
  totalItems: number;
  totalAmount: number;
}

export class CartService {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  /**
   * Get or create cart for user
   */
  async getOrCreateCart(userId: string): Promise<CartWithItems> {
    let cart = await this.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
          where: {
            product: {
              isActive: true, // Only include items with active products
            },
          },
        },
      },
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await this.db.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    return this.calculateCartTotals(cart);
  }

  /**
   * Add item to cart
   */
  async addToCart(userId: string, data: AddToCartInput): Promise<CartWithItems> {
    // Get or create cart
    const cart = await this.getOrCreateCart(userId);

    // Check if product exists and is active
    const product = await this.db.product.findFirst({
      where: {
        id: data.productId,
        isActive: true,
      },
    });

    if (!product) {
      throw ApiError.notFound('Product not found or not available');
    }

    // Check stock availability
    const totalRequestedQuantity = data.quantity;
    const existingCartItem = cart.items.find(item => item.productId === data.productId);
    const existingQuantity = existingCartItem?.quantity || 0;
    const newTotalQuantity = existingQuantity + totalRequestedQuantity;

    if (newTotalQuantity > product.stock) {
      throw ApiError.badRequest(
        `Insufficient stock. Available: ${product.stock}, In cart: ${existingQuantity}, Requested: ${totalRequestedQuantity}`
      );
    }

    // Add or update cart item
    await this.db.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: data.productId,
        },
      },
      update: {
        quantity: {
          increment: data.quantity,
        },
      },
      create: {
        cartId: cart.id,
        productId: data.productId,
        quantity: data.quantity,
      },
    });

    // Return updated cart
    return this.getOrCreateCart(userId);
  }

  /**
   * Remove item from cart or decrease quantity
   */
  async removeFromCart(userId: string, data: RemoveFromCartInput): Promise<CartWithItems> {
    const cart = await this.getOrCreateCart(userId);

    const existingCartItem = cart.items.find(item => item.productId === data.productId);

    if (!existingCartItem) {
      throw ApiError.notFound('Item not found in cart');
    }

    const quantityToRemove = data.quantity || existingCartItem.quantity;

    if (quantityToRemove >= existingCartItem.quantity) {
      // Remove item completely
      await this.db.cartItem.delete({
        where: { id: existingCartItem.id },
      });
    } else {
      // Decrease quantity
      await this.db.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity - quantityToRemove,
        },
      });
    }

    // Return updated cart
    return this.getOrCreateCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateCartItemQuantity(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<CartWithItems> {
    if (quantity < 0) {
      throw ApiError.badRequest('Quantity cannot be negative');
    }

    if (quantity === 0) {
      return this.removeFromCart(userId, { productId });
    }

    const cart = await this.getOrCreateCart(userId);

    const existingCartItem = cart.items.find(item => item.productId === productId);

    if (!existingCartItem) {
      throw ApiError.notFound('Item not found in cart');
    }

    // Check stock availability
    const product = existingCartItem.product;
    if (quantity > product.stock) {
      throw ApiError.badRequest(
        `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
      );
    }

    // Update quantity
    await this.db.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity },
    });

    // Return updated cart
    return this.getOrCreateCart(userId);
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string): Promise<void> {
    const cart = await this.db.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await this.db.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(userId: string): Promise<number> {
    const cart = await this.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          where: {
            product: {
              isActive: true,
            },
          },
        },
      },
    });

    if (!cart) {
      return 0;
    }

    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Validate cart before checkout
   */
  async validateCartForCheckout(userId: string): Promise<{
    isValid: boolean;
    errors: string[];
    cart: CartWithItems;
  }> {
    const cart = await this.getOrCreateCart(userId);
    const errors: string[] = [];

    if (cart.items.length === 0) {
      errors.push('Cart is empty');
      return { isValid: false, errors, cart };
    }

    // Check each item's stock availability
    for (const item of cart.items) {
      if (!item.product.isActive) {
        errors.push(`Product "${item.product.name}" is no longer available`);
        continue;
      }

      if (item.quantity > item.product.stock) {
        errors.push(
          `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}, In cart: ${item.quantity}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      cart,
    };
  }

  /**
   * Remove unavailable items from cart
   */
  async cleanupCart(userId: string): Promise<CartWithItems> {
    const cart = await this.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      return this.getOrCreateCart(userId);
    }

    // Remove items with inactive products or insufficient stock
    const itemsToRemove = cart.items.filter(
      item => !item.product.isActive || item.quantity > item.product.stock
    );

    if (itemsToRemove.length > 0) {
      await this.db.cartItem.deleteMany({
        where: {
          id: {
            in: itemsToRemove.map(item => item.id),
          },
        },
      });
    }

    // Update quantities for items that exceed available stock
    const itemsToUpdate = cart.items.filter(
      item => item.product.isActive && 
             item.quantity > 0 && 
             item.quantity <= item.product.stock &&
             !itemsToRemove.some(removed => removed.id === item.id)
    );

    for (const item of itemsToUpdate) {
      if (item.quantity > item.product.stock) {
        await this.db.cartItem.update({
          where: { id: item.id },
          data: { quantity: item.product.stock },
        });
      }
    }

    return this.getOrCreateCart(userId);
  }

  /**
   * Calculate cart totals
   */
  private calculateCartTotals(
    cart: any
  ): CartWithItems {
    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    const totalAmount = cart.items.reduce(
      (total, item) => total + (Number(item.product.price) * item.quantity),
      0
    );

    return {
      ...cart,
      totalItems,
      totalAmount,
    };
  }

  /**
   * Check if product is in cart
   */
  async isProductInCart(userId: string, productId: string): Promise<boolean> {
    const cart = await this.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          where: { productId },
        },
      },
    });

    return cart ? cart.items.length > 0 : false;
  }

  /**
   * Get cart summary for quick display
   */
  async getCartSummary(userId: string): Promise<{
    itemCount: number;
    totalAmount: number;
    isEmpty: boolean;
  }> {
    const cart = await this.getOrCreateCart(userId);

    return {
      itemCount: cart.totalItems,
      totalAmount: cart.totalAmount,
      isEmpty: cart.items.length === 0,
    };
  }
}