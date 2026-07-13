import { Request, Response } from 'express';
import { z } from 'zod';
import { OrderService } from '../services/order.service';

const CreateOrderSchema = z.object({
  tableNumber: z.number().int().min(1).max(50),
  customerName: z.string().max(40).default(''),
  items: z
    .array(
      z.object({
        menuId: z.string().min(1),
        qty: z.number().int().min(1).max(20),
        options: z
          .array(
            z.object({
              groupName: z.string(),
              optionName: z.string(),
              priceAdjustment: z.number().int().min(0),
            })
          )
          .default([]),
        note: z.string().max(200).default(''),
      })
    )
    .min(1, 'Pesanan tidak boleh kosong'),
});

/**
 * POST /api/orders
 * Membuat order baru, snapshot harga, trigger Midtrans Snap token.
 */
export async function createOrder(req: Request, res: Response): Promise<void> {
  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Data pesanan tidak valid',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await OrderService.createOrder(parsed.data);
    res.status(201).json({
      orderId: result.order.id,
      status: result.order.status,
      total: result.order.total,
      snapToken: result.snapToken,
      snapRedirectUrl: result.snapRedirectUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuat pesanan';
    console.error('[POST /api/orders]', error);
    res.status(400).json({ message });
  }
}

/**
 * GET /api/orders/:id
 * Public — customer polls this endpoint tiap ~5 detik untuk cek status pesanan.
 * Tracking tanpa login: order_id disimpan di localStorage pelanggan.
 */
export async function getOrderById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const order = await OrderService.getOrderById(id);
    if (!order) {
      res.status(404).json({ message: 'Pesanan tidak ditemukan' });
      return;
    }

    res.json({
      id: order.id,
      status: order.status,
      total: order.total,
      customerName: order.customerName,
      tableNumber: order.table.number,
      items: order.items.map((item) => ({
        name: item.name,
        qty: item.qty,
        priceAtOrder: item.priceAtOrder,
        note: item.note,
        options: item.options,
      })),
      payment: order.payment
        ? { status: order.payment.status, paymentType: order.payment.paymentType }
        : null,
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error('[GET /api/orders/:id]', error);
    res.status(500).json({ message: 'Gagal mengambil data pesanan' });
  }
}
