import { Request, Response } from 'express';
import { z } from 'zod';
import { signKitchenToken } from '../middleware/auth.middleware';
import { OrderService } from '../services/order.service';

const KITCHEN_PIN = process.env.KITCHEN_PIN ?? '1234';

/**
 * POST /api/kitchen/login
 * Login staf dapur dengan PIN. Returns JWT.
 */
export async function kitchenLogin(req: Request, res: Response): Promise<void> {
  const { pin } = req.body;

  if (!pin || typeof pin !== 'string') {
    res.status(400).json({ message: 'PIN diperlukan' });
    return;
  }

  // Constant-time compare to prevent timing attacks
  if (pin !== KITCHEN_PIN) {
    res.status(401).json({ message: 'PIN salah' });
    return;
  }

  const token = signKitchenToken();
  res.json({ token, message: 'Login berhasil' });
}

/**
 * GET /api/kitchen/orders
 * Antrean order aktif (status: paid | processing).
 * RULE: Kitchen dashboard polling ini tiap 4-5 detik.
 * RULE: Pengelompokan per meja dilakukan di frontend, bukan di sini.
 */
export async function getKitchenQueue(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const orders = await OrderService.getKitchenQueue();
    res.json({ orders });
  } catch (error) {
    console.error('[GET /api/kitchen/orders]', error);
    res.status(500).json({ message: 'Gagal mengambil antrean dapur' });
  }
}

const UpdateStatusSchema = z.object({
  status: z.enum(['processing', 'completed']),
});

/**
 * PATCH /api/kitchen/orders/:id/status
 * Update status order: paid → processing → completed.
 * RULE: Hanya transisi yang valid (tidak bisa mundur/skip).
 */
export async function updateOrderStatus(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const parsed = UpdateStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: 'Status tidak valid',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const updatedOrder = await OrderService.updateOrderStatus(id, parsed.data.status);
    res.json({ order: updatedOrder });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal update status';
    console.error('[PATCH /api/kitchen/orders/:id/status]', error);
    res.status(400).json({ message });
  }
}
