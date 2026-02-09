import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { ResponseUtils } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { asyncHandler } from '@/middlewares/error';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Register a new user
   *     description: Create a new user account with email and password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - password
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 100
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]
   *               role:
   *                 type: string
   *                 enum: [ADMIN, CUSTOMER]
   *                 default: CUSTOMER
   *     responses:
   *       201:
   *         description: User registered successfully
   *       409:
   *         description: User with email already exists
   *       422:
   *         description: Validation error
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.register(req.body);
    
    ResponseUtils.created(res, result, 'User registered successfully');
  });

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Login user
   *     description: Authenticate user with email and password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   *       403:
   *         description: Account deactivated
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body);
    
    ResponseUtils.success(res, result, 'Login successful');
  });

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Refresh access token
   *     description: Get a new access token using refresh token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Tokens refreshed successfully
   *       401:
   *         description: Invalid or expired refresh token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    const tokens = await this.authService.refreshToken(refreshToken);
    
    ResponseUtils.success(res, tokens, 'Tokens refreshed successfully');
  });

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Logout user
   *     description: Logout user by invalidating refresh token
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Logged out successfully
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    await this.authService.logout(refreshToken);
    
    ResponseUtils.success(res, null, 'Logged out successfully');
  });

  /**
   * @swagger
   * /auth/logout-all:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Logout from all devices
   *     description: Logout user from all devices by invalidating all refresh tokens
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logged out from all devices successfully
   */
  logoutAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    await this.authService.logoutAll(user!.id);
    
    ResponseUtils.success(res, null, 'Logged out from all devices successfully');
  });

  /**
   * @swagger
   * /auth/profile:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Get user profile
   *     description: Get current user's profile information
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *       404:
   *         description: User not found
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const profile = await this.authService.getUserProfile(user!.id);
    
    ResponseUtils.success(res, profile, 'Profile retrieved successfully');
  });

  /**
   * @swagger
   * /auth/profile:
   *   put:
   *     tags:
   *       - Authentication
   *     summary: Update user profile
   *     description: Update current user's profile information
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 100
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *       409:
   *         description: Email already taken
   */
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const updatedProfile = await this.authService.updateProfile(user!.id, req.body);
    
    ResponseUtils.success(res, updatedProfile, 'Profile updated successfully');
  });

  /**
   * @swagger
   * /auth/change-password:
   *   put:
   *     tags:
   *       - Authentication
   *     summary: Change password
   *     description: Change current user's password
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *                 minLength: 8
   *                 pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]
   *     responses:
   *       200:
   *         description: Password changed successfully
   *       401:
   *         description: Current password is incorrect
   */
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { user } = req as AuthenticatedRequest;
    const { currentPassword, newPassword } = req.body;
    
    await this.authService.changePassword(user!.id, currentPassword, newPassword);
    
    ResponseUtils.success(res, null, 'Password changed successfully');
  });
}