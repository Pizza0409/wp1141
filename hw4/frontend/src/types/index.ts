export interface User {
  id: number;
  email: string;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  notes: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationRequest {
  name: string;
  address: string;
  rating: number;
  notes: string;
}

export interface UpdateLocationRequest {
  name?: string;
  address?: string;
  rating?: number;
  notes?: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
}
