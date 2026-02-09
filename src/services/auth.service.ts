import { PrismaClient } from '@prisma/client';
import { prisma } from '@/config/database';
import { AuthUtils, JwtPayload, TokenPair } from '@/utils/auth';
import { ApiError } from '@/utils/response';
import { RegisterInput, LoginInput } from '@/utils/validation';
import { config } from '@/config';

export interface AuthResponse {
  user: any;
  tokens: TokenPair;
}

export class AuthService {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(data.password);

    // Create user
    const user = await this.db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'CUSTOMER',
      },
    });

    // Create cart for customer
    if (user.role === 'CUSTOMER') {
      await this.db.cart.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Generate tokens
    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const tokens = AuthUtils.generateTokenPair(jwtPayload);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Authenticate user and return tokens
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    // Find user by email
    const user = await this.db.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account has been deactivated');
    }

    // Verify password
    const isValidPassword = await AuthUtils.verifyPassword(data.password, user.password);

    if (!isValidPassword) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const tokens = AuthUtils.generateTokenPair(jwtPayload);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = AuthUtils.verifyRefreshToken(refreshToken);

      // Check if refresh token exists in database
      const storedToken = await this.db.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken) {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      if (storedToken.expiresAt < new Date()) {
        // Clean up expired token
        await this.db.refreshToken.delete({
          where: { id: storedToken.id },
        });
        throw ApiError.unauthorized('Refresh token has expired');
      }

      if (!storedToken.user.isActive) {
        throw ApiError.forbidden('Account has been deactivated');
      }

      // Generate new token pair
      const jwtPayload: JwtPayload = {
        userId: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
        name: storedToken.user.name,
      };

      const tokens = AuthUtils.generateTokenPair(jwtPayload);

      // Remove old refresh token and store new one
      await this.db.refreshToken.delete({
        where: { id: storedToken.id },
      });

      await this.storeRefreshToken(storedToken.user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unauthorized('Invalid refresh token');
    }
  }

  /**
   * Logout user by invalidating refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await this.db.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  /**
   * Logout user from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    await this.db.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<any> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account has been deactivated');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: any): Promise<any> {
    // Check if email is being updated and if it's already taken
    if (data.email) {
      const existingUser = await this.db.user.findFirst({
        where: {
          email: data.email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw ApiError.conflict('Email already taken');
      }
    }

    const user = await this.db.user.update({
      where: { id: userId },
      data,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isValidPassword = await AuthUtils.verifyPassword(currentPassword, user.password);

    if (!isValidPassword) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await AuthUtils.hashPassword(newPassword);

    // Update password
    await this.db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all refresh tokens
    await this.logoutAll(userId);
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(userId: string, token: string): Promise<any> {
    const expiresAt = AuthUtils.getTokenExpirationDate(token);

    return this.db.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.db.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}