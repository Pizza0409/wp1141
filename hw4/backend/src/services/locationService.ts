import axios from 'axios';
import { db } from '../database/init';
import { Location, CreateLocationRequest, UpdateLocationRequest, GoogleMapsGeocodingResponse } from '../types';

export class LocationService {
  private static readonly GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  static async getAllLocations(userId: number): Promise<Location[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM locations WHERE userId = ? ORDER BY createdAt DESC',
        [userId],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  }

  static async getLocationById(id: number, userId: number): Promise<Location | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM locations WHERE id = ? AND userId = ?',
        [id, userId],
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

  static async createLocation(data: CreateLocationRequest, userId: number): Promise<Location> {
    try {
      // 使用 Google Geocoding API 取得座標
      const coordinates = await this.getCoordinatesFromAddress(data.address);
      
      return new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO locations (name, address, latitude, longitude, rating, notes, userId) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [data.name, data.address, coordinates.lat, coordinates.lng, data.rating, data.notes, userId],
          function(err) {
            if (err) {
              reject(err);
              return;
            }

            // 取得新建立的地點
            db.get(
              'SELECT * FROM locations WHERE id = ?',
              [this.lastID],
              (err, row: any) => {
                if (err) {
                  reject(err);
                  return;
                }
                resolve(row);
              }
            );
          }
        );
      });
    } catch (error) {
      throw new Error('Failed to create location');
    }
  }

  static async updateLocation(id: number, data: UpdateLocationRequest, userId: number): Promise<Location | null> {
    try {
      let updateFields = [];
      let values = [];

      if (data.name) {
        updateFields.push('name = ?');
        values.push(data.name);
      }

      if (data.address) {
        updateFields.push('address = ?');
        values.push(data.address);
        
        // 如果地址改變，重新取得座標
        const coordinates = await this.getCoordinatesFromAddress(data.address);
        updateFields.push('latitude = ?');
        updateFields.push('longitude = ?');
        values.push(coordinates.lat);
        values.push(coordinates.lng);
      }

      if (data.rating !== undefined) {
        updateFields.push('rating = ?');
        values.push(data.rating);
      }

      if (data.notes !== undefined) {
        updateFields.push('notes = ?');
        values.push(data.notes);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push('updatedAt = CURRENT_TIMESTAMP');
      values.push(id, userId);

      return new Promise((resolve, reject) => {
        db.run(
          `UPDATE locations SET ${updateFields.join(', ')} WHERE id = ? AND userId = ?`,
          values,
          function(err) {
            if (err) {
              reject(err);
              return;
            }

            if (this.changes === 0) {
              resolve(null);
              return;
            }

            // 取得更新後的地點
            db.get(
              'SELECT * FROM locations WHERE id = ?',
              [id],
              (err, row: any) => {
                if (err) {
                  reject(err);
                  return;
                }
                resolve(row);
              }
            );
          }
        );
      });
    } catch (error) {
      throw new Error('Failed to update location');
    }
  }

  static async deleteLocation(id: number, userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM locations WHERE id = ? AND userId = ?',
        [id, userId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.changes > 0);
        }
      );
    });
  }

  private static async getCoordinatesFromAddress(address: string): Promise<{ lat: number; lng: number }> {
    if (!this.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await axios.get<GoogleMapsGeocodingResponse>(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address,
            key: this.GOOGLE_MAPS_API_KEY
          }
        }
      );

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        throw new Error('Address not found');
      }

      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to get coordinates for address');
    }
  }
}
