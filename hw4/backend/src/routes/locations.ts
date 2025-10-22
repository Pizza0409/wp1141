import { Router } from 'express';
import { 
  getAllLocations, 
  getLocationById, 
  createLocation, 
  updateLocation, 
  deleteLocation,
  validateCreateLocation,
  validateUpdateLocation
} from '../controllers/locationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 所有路由都需要認證
router.use(authenticateToken);

// 取得所有地點
router.get('/', getAllLocations);

// 取得特定地點
router.get('/:id', getLocationById);

// 建立新地點
router.post('/', validateCreateLocation, createLocation);

// 更新地點
router.put('/:id', validateUpdateLocation, updateLocation);

// 刪除地點
router.delete('/:id', deleteLocation);

export { router as locationRoutes };
