import { prisma } from '../prisma/client';
import { MidtransService } from './midtrans.service';
import type { CartItemOption } from '../types';

export interface CreateOrderInput {
  tableNumber: number;
  customerName: string;
  items: {
    menuId: string;
    qty: number;
    options: CartItemOption[];
    note: string;
  }[];
}

export class OrderService {
  /**
   * Creates a new order, snapshots prices, and triggers Midtrans Snap token.
   * RULE: priceAtOrder is snapshotted here — never recalculated after order creation.
   * RULE: Every checkout = new order (even from same table). No merging.
   */
  static async createOrder(input: CreateOrderInput) {
    const { tableNumber, customerName, items } = input;

    // ── Validate table exists ────────────────────────────────────────────────
    const table = await prisma.restaurantTable.findUnique({
      where: { number: tableNumber },
    });
    if (!table) {
      throw new Error(`Meja ${tableNumber} tidak ditemukan`);
    }
    if (!table.isActive) {
      throw new Error(`Meja ${tableNumber} tidak aktif`);
    }

    // ── Fetch and validate all menu items (price snapshot) ───────────────────
    const menuIds = [...new Set(items.map((i) => i.menuId))];
    const menus = await prisma.menu.findMany({
      where: { id: { in: menuIds } },
      include: {
        groups: {
          include: { options: true },
        },
      },
    });

    const menuMap = new Map(menus.map((m) => [m.id, m]));

    // Validate all items are available
    for (const item of items) {
      const menu = menuMap.get(item.menuId);
      if (!menu) {
        throw new Error(`Menu '${item.menuId}' tidak ditemukan`);
      }
      if (!menu.isAvailable) {
        throw new Error(`Menu '${menu.name}' sedang tidak tersedia`);
      }
    }

    // ── Compute total from snapshotted prices ─────────────────────────────────
    let total = 0;
    for (const item of items) {
      const menu = menuMap.get(item.menuId)!;
      const optionsTotal = item.options.reduce(
        (sum, opt) => sum + opt.priceAdjustment,
        0
      );
      total += (menu.price + optionsTotal) * item.qty;
    }

    // ── Create order in transaction ───────────────────────────────────────────
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tableId: table.id,
          customerName: customerName.trim(),
          total,
          status: 'pending',
          items: {
            create: items.map((item) => {
              const menu = menuMap.get(item.menuId)!;
              return {
                menuId: item.menuId,
                name: menu.name, // snapshot
                qty: item.qty,
                priceAtOrder: menu.price, // snapshot
                note: item.note,
                options: {
                  createMany: {
                    data: item.options.map((opt) => ({
                      groupName: opt.groupName,   // snapshot
                      optionName: opt.optionName, // snapshot
                      priceAdjustment: opt.priceAdjustment, // snapshot
                    })),
                  },
                },
              };
            }),
          },
        },
        include: {
          items: { include: { options: true } },
          table: { select: { number: true } },
        },
      });

      // Create payment record (pending)
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          midtransOrderId: newOrder.id,
          grossAmount: total,
          status: 'pending',
        },
      });

      return newOrder;
    });

    // ── Get Midtrans Snap token ───────────────────────────────────────────────
    try {
      const { token, redirectUrl } = await MidtransService.createSnapToken({
        orderId: order.id,
        grossAmount: total,
        customerName,
        tableNumber,
        items: items.map((item) => {
          const menu = menuMap.get(item.menuId)!;
          const optTotal = item.options.reduce(
            (s, o) => s + o.priceAdjustment,
            0
          );
          return {
            id: item.menuId,
            price: menu.price + optTotal,
            quantity: item.qty,
            name: menu.name,
          };
        }),
      });

      // Save snap token to order
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { snapToken: token, snapRedirectUrl: redirectUrl },
        include: {
          items: { include: { options: true } },
          table: { select: { number: true } },
        },
      });

      return { order: updatedOrder, snapToken: token, snapRedirectUrl: redirectUrl };
    } catch (snapError) {
      console.error('[OrderService] Midtrans Snap error:', snapError);
      // Order is created but payment not initiated — still return order
      return { order, snapToken: null, snapRedirectUrl: null };
    }
  }

  /**
   * Get order by ID for customer status polling.
   * RULE: This endpoint is public — customer tracks via localStorage order_id.
   */
  static async getOrderById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { options: true } },
        table: { select: { number: true } },
        payment: { select: { status: true, paymentType: true } },
      },
    });
  }

  /**
   * Get active kitchen queue: orders with status 'paid' or 'processing'.
   * Grouped display logic is done on the frontend (group by table).
   * RULE: polling every 4-5s from kitchen dashboard.
   */
  static async getKitchenQueue() {
    return prisma.order.findMany({
      where: {
        status: { in: ['paid', 'processing'] },
      },
      include: {
        items: { include: { options: true } },
        table: { select: { number: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Update order status from kitchen dashboard.
   * RULE: Status only goes paid → processing → completed (not backwards).
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: 'processing' | 'completed'
  ) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order tidak ditemukan');

    const validTransitions: Record<string, string[]> = {
      paid: ['processing'],
      processing: ['completed'],
    };

    const allowed = validTransitions[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Status tidak valid: tidak bisa ubah dari ${order.status} ke ${newStatus}`
      );
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: {
        items: { include: { options: true } },
        table: { select: { number: true } },
      },
    });
  }
}
