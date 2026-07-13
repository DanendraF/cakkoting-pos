import { Router } from 'express';
import { requireKitchenAuth } from '../middleware/auth.middleware';
import {
  kitchenLogin,
  getKitchenQueue,
  updateOrderStatus,
} from '../controllers/kitchen.controller';

const router = Router();

// POST /api/kitchen/login — PIN login, returns JWT
router.post('/login', kitchenLogin);

// Protected routes (require Kitchen JWT)
router.get('/orders', requireKitchenAuth, getKitchenQueue);
router.patch('/orders/:id/status', requireKitchenAuth, updateOrderStatus);

export default router;
