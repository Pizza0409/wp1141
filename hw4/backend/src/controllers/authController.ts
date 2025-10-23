import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/authService';

export const register = async (req: Request, res: Response) => {
  try {
    // 驗證輸入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { emailOrUsername, password } = req.body;

    // 後端 trim 處理
    const trimmedEmailOrUsername = emailOrUsername.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmailOrUsername) {
      return res.status(400).json({ error: 'Email or username cannot be empty' });
    }

    if (!trimmedPassword) {
      return res.status(400).json({ error: 'Password cannot be empty' });
    }

    const result = await AuthService.register(trimmedEmailOrUsername, trimmedPassword);
    
    res.status(201).json({
      message: 'User registered successfully',
      ...result
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'User already exists') {
        return res.status(409).json({ error: error.message });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // 驗證輸入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { emailOrUsername, password } = req.body;

    // 後端 trim 處理
    const trimmedEmailOrUsername = emailOrUsername.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmailOrUsername) {
      return res.status(400).json({ error: 'Email or username cannot be empty' });
    }

    if (!trimmedPassword) {
      return res.status(400).json({ error: 'Password cannot be empty' });
    }

    const result = await AuthService.login(trimmedEmailOrUsername, trimmedPassword);
    
    res.json({
      message: 'Login successful',
      ...result
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: error.message });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  // JWT 是無狀態的，登出只需要客戶端刪除 token
  res.json({ message: 'Logout successful' });
};

// 驗證中介軟體
export const validateRegister = [
  body('emailOrUsername')
    .notEmpty()
    .withMessage('Email or username is required')
    .custom((value) => {
      if (!value.trim()) {
        throw new Error('Email or username cannot be empty or whitespace only');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .custom((value) => {
      if (!value.trim()) {
        throw new Error('Password cannot be empty or whitespace only');
      }
      return true;
    })
];

export const validateLogin = [
  body('emailOrUsername')
    .notEmpty()
    .withMessage('Email or username is required')
    .custom((value) => {
      if (!value.trim()) {
        throw new Error('Email or username cannot be empty or whitespace only');
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .custom((value) => {
      if (!value.trim()) {
        throw new Error('Password cannot be empty or whitespace only');
      }
      return true;
    })
];
