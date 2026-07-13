import { Router } from 'express';
import { requireAdminAuth } from '../middleware/auth.middleware';
import {
  adminLogin,
  adminGetMenu,
  adminCreateMenu,
  adminUpdateMenu,
  adminDeleteMenu,
  adminGetCategories,
  adminGetReports,
} from '../controllers/admin.controller';

const router = Router();

// POST /api/admin/login
router.post('/login', adminLogin);

// Protected admin routes
router.get('/menu', requireAdminAuth, adminGetMenu);
router.post('/menu', requireAdminAuth, adminCreateMenu);
router.patch('/menu/:id', requireAdminAuth, adminUpdateMenu);
router.delete('/menu/:id', requireAdminAuth, adminDeleteMenu);

router.get('/categories', requireAdminAuth, adminGetCategories);
router.get('/reports', requireAdminAuth, adminGetReports);

export default router;
