import { Router } from 'express';
import { register, login, logout, validateRegister, validateLogin } from '../controllers/authController';

const router = Router();

// 註冊
router.post('/register', validateRegister, register);

// 登入
router.post('/login', validateLogin, login);

// 登出
router.post('/logout', logout);

export { router as authRoutes };
