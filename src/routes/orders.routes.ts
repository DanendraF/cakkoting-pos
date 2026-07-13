import { Router } from 'express';
import { createOrder, getOrderById } from '../controllers/orders.controller';

const router = Router();

// POST /api/orders — buat order baru (publik — pelanggan tidak login)
router.post('/', createOrder);

// GET /api/orders/:id — status order untuk polling (publik)
router.get('/:id', getOrderById);

export default router;
