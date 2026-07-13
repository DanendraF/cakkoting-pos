import { Router } from 'express';
import { getMenu, getMenuRecommendations } from '../controllers/menu.controller';

const router = Router();

// GET /api/menu — semua kategori + menu + varian (publik)
router.get('/', getMenu);

// GET /api/menu/:id/recommendations — rekomendasi upselling (publik)
router.get('/:id/recommendations', getMenuRecommendations);

export default router;
