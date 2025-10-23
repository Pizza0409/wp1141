import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { AuthRequest, AuthResponse, Location, CreateLocationRequest, UpdateLocationRequest, ApiResponse } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 請求攔截器：自動添加 token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 響應攔截器：處理認證錯誤
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // 認證相關 API
  async register(data: AuthRequest): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<any> = await this.api.post('/auth/register', data);
      // 後端直接回傳 token 和 user，不是包在 data 裡面
      return {
        token: response.data.token,
        user: response.data.user
      };
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('此電子郵件或使用者代號已被註冊，請使用其他帳號或直接登入');
      }
      throw error;
    }
  }

  async login(data: AuthRequest): Promise<AuthResponse> {
    const response: AxiosResponse<any> = await this.api.post('/auth/login', data);
    // 後端直接回傳 token 和 user，不是包在 data 裡面
    return {
      token: response.data.token,
      user: response.data.user
    };
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
  }

  // 地點相關 API
  async getLocations(): Promise<Location[]> {
    const response: AxiosResponse<ApiResponse<Location[]>> = await this.api.get('/locations');
    return response.data.data!;
  }

  async getLocationById(id: number): Promise<Location> {
    const response: AxiosResponse<ApiResponse<Location>> = await this.api.get(`/locations/${id}`);
    return response.data.data!;
  }

  async createLocation(data: CreateLocationRequest): Promise<Location> {
    const response: AxiosResponse<ApiResponse<Location>> = await this.api.post('/locations', data);
    return response.data.data!;
  }

  async updateLocation(id: number, data: UpdateLocationRequest): Promise<Location> {
    const response: AxiosResponse<ApiResponse<Location>> = await this.api.put(`/locations/${id}`, data);
    return response.data.data!;
  }

  async deleteLocation(id: number): Promise<void> {
    await this.api.delete(`/locations/${id}`);
  }
}

export const apiService = new ApiService();
