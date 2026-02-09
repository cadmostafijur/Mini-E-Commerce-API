import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '@/config';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  name: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.bcryptSaltRounds);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateAccessToken(payload: JwtPayload): string {
    const secret = config.jwtAccessSecret;
    if (!secret) {
      throw new Error('JWT access secret is not configured');  
    }
    return jwt.sign(payload, secret, {
      expiresIn: config.jwtAccessExpiresIn,
      issuer: 'mini-ecommerce-api',
    } as jwt.SignOptions);
  }

  static generateRefreshToken(payload: Pick<JwtPayload, 'userId'>): string {
    const secret = config.jwtRefreshSecret;
    if (!secret) {
      throw new Error('JWT refresh secret is not configured');  
    }
    return jwt.sign(payload, secret, {
      expiresIn: config.jwtRefreshExpiresIn,
      issuer: 'mini-ecommerce-api',
    } as jwt.SignOptions);
  }

  static verifyAccessToken(token: string): JwtPayload {
    const secret = config.jwtAccessSecret;
    if (!secret) {
      throw new Error('JWT access secret is not configured');  
    }
    return jwt.verify(token, secret) as JwtPayload;
  }

  static verifyRefreshToken(token: string): Pick<JwtPayload, 'userId'> {
    const secret = config.jwtRefreshSecret;
    if (!secret) {
      throw new Error('JWT refresh secret is not configured');  
    }
    return jwt.verify(token, secret) as Pick<JwtPayload, 'userId'>;
  }

  static generateTokenPair(user: JwtPayload): TokenPair {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken({ userId: user.userId });
    
    return { accessToken, refreshToken };
  }

  static getTokenExpirationDate(token: string): Date {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      if (!decoded?.exp) {
        throw new Error('Invalid token');
      }
      return new Date(decoded.exp * 1000);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}