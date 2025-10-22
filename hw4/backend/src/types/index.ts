export interface User {
  id: number;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
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
  user: {
    id: number;
    email: string;
  };
}

export interface GoogleMapsGeocodingResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }>;
  status: string;
}
