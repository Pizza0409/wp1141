import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/init';
import { User, AuthRequest, AuthResponse } from '../types';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  static async register(emailOrUsername: string, password: string): Promise<AuthResponse> {
    // 檢查是 email 還是 username
    const isEmail = emailOrUsername.includes('@');
    
    // 檢查用戶是否已存在
    const existingUser = await this.findUser(emailOrUsername);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // 雜湊密碼
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // 建立新用戶
    return new Promise((resolve, reject) => {
      const query = isEmail 
        ? 'INSERT INTO users (email, password) VALUES (?, ?)'
        : 'INSERT INTO users (username, password) VALUES (?, ?)';
      
      db.run(query, [emailOrUsername, hashedPassword], function(err) {
        if (err) {
          reject(new Error('Failed to create user'));
          return;
        }

        const userId = this.lastID;
        const token = jwt.sign(
          { id: userId, emailOrUsername },
          process.env.JWT_SECRET!,
          { expiresIn: '7d' }
        );

        resolve({
          token,
          user: { 
            id: userId, 
            ...(isEmail ? { email: emailOrUsername } : { username: emailOrUsername })
          }
        });
      });
    });
  }

  static async login(emailOrUsername: string, password: string): Promise<AuthResponse> {
    const user = await this.findUser(emailOrUsername);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 驗證密碼
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // 產生 JWT token
    const token = jwt.sign(
      { id: user.id, emailOrUsername },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: { 
        id: user.id, 
        email: user.email,
        username: user.username
      }
    };
  }

  static async findUser(emailOrUsername: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      // 同時搜尋 email 和 username
      db.get(
        'SELECT * FROM users WHERE email = ? OR username = ?',
        [emailOrUsername, emailOrUsername],
        (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row || null);
        }
      );
    });
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row || null);
        }
      );
    });
  }

  static async findUserById(id: number): Promise<User | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row || null);
        }
      );
    });
  }
}