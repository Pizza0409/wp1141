import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { LocationService } from '../services/locationService';
import { AuthRequest } from '../middleware/auth';

export const getAllLocations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const locations = await LocationService.getAllLocations(userId);
    
    res.json({
      message: 'Locations retrieved successfully',
      data: locations
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to retrieve locations' });
  }
};

export const getLocationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const location = await LocationService.getLocationById(parseInt(id), userId);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({
      message: 'Location retrieved successfully',
      data: location
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: 'Failed to retrieve location' });
  }
};

export const createLocation = async (req: AuthRequest, res: Response) => {
  try {
    // 驗證輸入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user!.id;
    const locationData = req.body;
    
    const location = await LocationService.createLocation(locationData, userId);
    
    res.status(201).json({
      message: 'Location created successfully',
      data: location
    });
  } catch (error) {
    console.error('Create location error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to create location')) {
        return res.status(400).json({ error: 'Failed to create location. Please check the address.' });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLocation = async (req: AuthRequest, res: Response) => {
  try {
    // 驗證輸入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;
    
    const location = await LocationService.updateLocation(parseInt(id), updateData, userId);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({
      message: 'Location updated successfully',
      data: location
    });
  } catch (error) {
    console.error('Update location error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to update location')) {
        return res.status(400).json({ error: 'Failed to update location. Please check the address.' });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const deleted = await LocationService.deleteLocation(parseInt(id), userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
};

// 驗證中介軟體
export const validateCreateLocation = [
  body('name')
    .notEmpty()
    .withMessage('Location name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];

export const validateUpdateLocation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('address')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
];
