import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const BCRYPT_ROUNDS = 10;

export interface TokenPayload {
  username: string;
  role: 'admin' | 'viewer';
  iat?: number;
  exp?: number;
}

export class AuthService {
  /**
   * 雜湊密碼
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, BCRYPT_ROUNDS);
    } catch (error: any) {
      logger.error('密碼雜湊失敗', { error: error.message });
      throw new Error('密碼處理失敗');
    }
  }

  /**
   * 驗證密碼
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error: any) {
      logger.error('密碼驗證失敗', { error: error.message });
      return false;
    }
  }

  /**
   * 產生 JWT token
   */
  generateToken(username: string, role: 'admin' | 'viewer'): string {
    try {
      const payload: TokenPayload = {
        username,
        role,
      };
      return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });
    } catch (error: any) {
      logger.error('產生 token 失敗', { error: error.message });
      throw new Error('產生 token 失敗');
    }
  }

  /**
   * 驗證 JWT token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error: any) {
      logger.warn('Token 驗證失敗', { error: error.message });
      return null;
    }
  }

  /**
   * 檢查權限
   */
  checkPermission(userRole: 'admin' | 'viewer', requiredRole: 'admin' | 'viewer'): boolean {
    if (requiredRole === 'admin') {
      return userRole === 'admin';
    }
    // viewer 可以訪問 viewer 權限的資源
    return true;
  }

  /**
   * 從請求中提取 token
   */
  extractTokenFromRequest(authHeader: string | null): string | null {
    if (!authHeader) {
      return null;
    }
    
    // Bearer <token>
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }
}

export default new AuthService();

