import { useState, useEffect } from 'react';
import type { Location, CreateLocationRequest, UpdateLocationRequest } from '../types';
import { apiService } from '../services/apiService';
import { useAuth } from './useAuth';

export const useLocations = () => {
  const { isGuest } = useAuth();
  
  // 初始化時從 sessionStorage 讀取訪客資料
  const [locations, setLocations] = useState<Location[]>(() => {
    if (isGuest) {
      const stored = sessionStorage.getItem('guestLocations');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isGuest) {
        // 訪客模式：從 sessionStorage 讀取
        const stored = sessionStorage.getItem('guestLocations');
        setLocations(stored ? JSON.parse(stored) : []);
      } else {
        // 一般使用者：調用 API
        const data = await apiService.getLocations();
        setLocations(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const createLocation = async (data: CreateLocationRequest) => {
    try {
      setError(null);
      
      if (isGuest) {
        // 訪客模式：只更新前端
        const newLocation: Location = {
          ...data,
          id: Date.now(),
          userId: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updated = [newLocation, ...locations];
        setLocations(updated);
        sessionStorage.setItem('guestLocations', JSON.stringify(updated));
        return newLocation;
      } else {
        // 一般使用者：調用 API
        const newLocation = await apiService.createLocation(data);
        setLocations(prev => [newLocation, ...prev]);
        return newLocation;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create location';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateLocation = async (id: number, data: UpdateLocationRequest) => {
    try {
      setError(null);
      
      if (isGuest) {
        // 訪客模式：只更新前端
        const updated = locations.map(loc => 
          loc.id === id ? { ...loc, ...data, updatedAt: new Date().toISOString() } : loc
        );
        setLocations(updated);
        sessionStorage.setItem('guestLocations', JSON.stringify(updated));
        return updated.find(loc => loc.id === id)!;
      } else {
        // 一般使用者：調用 API
        const updatedLocation = await apiService.updateLocation(id, data);
        setLocations(prev => 
          prev.map(location => 
            location.id === id ? updatedLocation : location
          )
        );
        return updatedLocation;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update location';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteLocation = async (id: number) => {
    try {
      setError(null);
      
      if (isGuest) {
        // 訪客模式：只更新前端
        const updated = locations.filter(loc => loc.id !== id);
        setLocations(updated);
        sessionStorage.setItem('guestLocations', JSON.stringify(updated));
      } else {
        // 一般使用者：調用 API
        await apiService.deleteLocation(id);
        setLocations(prev => prev.filter(location => location.id !== id));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete location';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  return {
    locations,
    loading,
    error,
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
  };
};
