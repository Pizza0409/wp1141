import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 檢查本地儲存的認證資訊（使用 sessionStorage）
    const storedToken = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');
    const storedIsGuest = sessionStorage.getItem('isGuest') === 'true';

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsGuest(storedIsGuest);
    }
    setLoading(false);
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    try {
      const response = await apiService.login({ emailOrUsername, password });
      
      const isGuestLogin = emailOrUsername === 'guest@example.com';
      
      setToken(response.token);
      setUser(response.user);
      setIsGuest(isGuestLogin);
      
      sessionStorage.setItem('token', response.token);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      sessionStorage.setItem('isGuest', isGuestLogin.toString());
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (emailOrUsername: string, password: string) => {
    try {
      const response = await apiService.register({ emailOrUsername, password });
      
      setToken(response.token);
      setUser(response.user);
      setIsGuest(false);
      
      sessionStorage.setItem('token', response.token);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      sessionStorage.setItem('isGuest', 'false');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    const wasGuest = isGuest;
    
    // 清除 sessionStorage（包含認證資訊和訪客資料）
    sessionStorage.clear();
    
    // 重置狀態
    setToken(null);
    setUser(null);
    setIsGuest(false);
    
    // 非訪客才調用後端 logout API
    if (!wasGuest) {
      apiService.logout().catch(console.error);
    }
    
    // 強制重新載入到登入頁面
    window.location.href = '/';
  };

  const value: AuthContextType = {
    user,
    token,
    isGuest,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
