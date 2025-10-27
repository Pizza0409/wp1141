import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 驗證輸入不能為空白或純空格
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setError('請輸入電子郵件或使用者代號');
      setLoading(false);
      return;
    }

    if (!trimmedPassword) {
      setError('請輸入密碼');
      setLoading(false);
      return;
    }

    try {
      await login(trimmedEmail, trimmedPassword);
      // 使用 setTimeout 確保狀態更新後再導航
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } catch (err) {
      // 確保錯誤訊息正確顯示
      const errorMessage = err instanceof Error ? err.message : '登入失敗';
      // 翻譯英文錯誤訊息
      if (errorMessage === 'Invalid credentials' || errorMessage === '登入失敗，請檢查您的帳號密碼') {
        setError('帳號或密碼錯誤');
      } else {
        setError(errorMessage);
      }
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await login('guest@example.com', 'guest123');
      // 使用 setTimeout 確保狀態更新後再導航
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } catch (err) {
      setError('訪客登入失敗，請稍後再試');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default'
    }}>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            登入
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="emailOrUsername"
              label="電子郵件或使用者代號"
              name="emailOrUsername"
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="密碼"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : '登入'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              onClick={handleGuestLogin}
              disabled={loading}
            >
              訪客試用
            </Button>
            <Box textAlign="center">
              <Link component={RouterLink} to="/register" variant="body2">
                還沒有帳號？立即註冊
              </Link>
            </Box>
          </Box>
        </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
