import { useState, useEffect } from 'react';
import type { Location, CreateLocationRequest, UpdateLocationRequest } from '../types';
import { apiService } from '../services/apiService';

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getLocations();
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const createLocation = async (data: CreateLocationRequest) => {
    try {
      setError(null);
      const newLocation = await apiService.createLocation(data);
      setLocations(prev => [newLocation, ...prev]);
      return newLocation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create location';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateLocation = async (id: number, data: UpdateLocationRequest) => {
    try {
      setError(null);
      const updatedLocation = await apiService.updateLocation(id, data);
      setLocations(prev => 
        prev.map(location => 
          location.id === id ? updatedLocation : location
        )
      );
      return updatedLocation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update location';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteLocation = async (id: number) => {
    try {
      setError(null);
      await apiService.deleteLocation(id);
      setLocations(prev => prev.filter(location => location.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete location';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

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
