import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/client';
import { signAdminToken } from '../middleware/auth.middleware';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@cakkoting.id';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ?? '';

/**
 * POST /api/admin/login
 */
export async function adminLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email dan password diperlukan' });
    return;
  }

  if (email !== ADMIN_EMAIL) {
    res.status(401).json({ message: 'Email atau password salah' });
    return;
  }

  const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!isValid) {
    res.status(401).json({ message: 'Email atau password salah' });
    return;
  }

  const token = signAdminToken('admin');
  res.json({ token, message: 'Login berhasil' });
}

// ─── Menu Management ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/menu
 */
export async function adminGetMenu(req: Request, res: Response): Promise<void> {
  try {
    const menus = await prisma.menu.findMany({
      include: {
        category: { select: { name: true, id: true } },
        groups: {
          orderBy: { displayOrder: 'asc' },
          include: { options: true },
        },
      },
      orderBy: [
        { category: { displayOrder: 'asc' } },
        { name: 'asc' },
      ],
    });
    res.json({ menus });
  } catch (error) {
    console.error('[GET /api/admin/menu]', error);
    res.status(500).json({ message: 'Gagal mengambil menu' });
  }
}

const MenuSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/, 'ID hanya boleh huruf kecil, angka, dan tanda hubung'),
  name: z.string().min(1).max(100),
  price: z.number().int().min(0),
  desc: z.string().max(500).default(''),
  isAvailable: z.boolean().default(true),
  categoryId: z.string().min(1),
  groups: z
    .array(
      z.object({
        name: z.string().min(1),
        required: z.boolean(),
        allowMultiple: z.boolean(),
        options: z.array(
          z.object({
            name: z.string().min(1),
            priceAdjustment: z.number().int().min(0),
          })
        ),
      })
    )
    .default([]),
});

/**
 * POST /api/admin/menu
 */
export async function adminCreateMenu(req: Request, res: Response): Promise<void> {
  const parsed = MenuSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Data tidak valid', errors: parsed.error.flatten() });
    return;
  }

  const { id, name, price, desc, isAvailable, categoryId, groups } = parsed.data;

  try {
    const menu = await prisma.menu.create({
      data: {
        id,
        name,
        price,
        desc,
        isAvailable,
        categoryId,
        groups: {
          create: groups.map((g, gi) => ({
            name: g.name,
            required: g.required,
            allowMultiple: g.allowMultiple,
            displayOrder: gi,
            options: { createMany: { data: g.options } },
          })),
        },
      },
      include: { groups: { include: { options: true } }, category: true },
    });
    res.status(201).json({ menu });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuat menu';
    console.error('[POST /api/admin/menu]', error);
    res.status(400).json({ message });
  }
}

const UpdateMenuSchema = MenuSchema.partial().omit({ id: true });

/**
 * PATCH /api/admin/menu/:id
 * Also handles toggle isAvailable and update groups/options.
 */
export async function adminUpdateMenu(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = UpdateMenuSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Data tidak valid', errors: parsed.error.flatten() });
    return;
  }

  const { groups, ...menuFields } = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Update menu fields
      const menu = await tx.menu.update({
        where: { id },
        data: { ...menuFields, updatedAt: new Date() },
      });

      // If groups provided, replace all groups
      if (groups !== undefined) {
        await tx.menuOptionGroup.deleteMany({ where: { menuId: id } });
        for (let gi = 0; gi < groups.length; gi++) {
          const g = groups[gi]!;
          await tx.menuOptionGroup.create({
            data: {
              name: g.name,
              required: g.required,
              allowMultiple: g.allowMultiple,
              displayOrder: gi,
              menuId: id,
              options: { createMany: { data: g.options } },
            },
          });
        }
      }

      return tx.menu.findUnique({
        where: { id },
        include: { groups: { include: { options: true } }, category: true },
      });
    });

    res.json({ menu: updated });
  } catch (error) {
    console.error('[PATCH /api/admin/menu/:id]', error);
    res.status(400).json({ message: 'Gagal update menu' });
  }
}

/**
 * DELETE /api/admin/menu/:id
 */
export async function adminDeleteMenu(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    await prisma.menu.delete({ where: { id } });
    res.json({ message: 'Menu berhasil dihapus' });
  } catch (error) {
    console.error('[DELETE /api/admin/menu/:id]', error);
    res.status(400).json({ message: 'Gagal menghapus menu' });
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/categories
 */
export async function adminGetCategories(req: Request, res: Response): Promise<void> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { menus: true } } },
    });
    res.json({ categories });
  } catch (error) {
    console.error('[GET /api/admin/categories]', error);
    res.status(500).json({ message: 'Gagal mengambil kategori' });
  }
}

// ─── Reports ──────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/reports?date=YYYY-MM-DD
 * Laporan transaksi harian. Jika tanpa date, ambil hari ini.
 */
export async function adminGetReports(req: Request, res: Response): Promise<void> {
  const dateStr = (req.query['date'] as string) ?? new Date().toISOString().split('T')[0];

  try {
    const startDate = new Date(`${dateStr}T00:00:00.000+07:00`);
    const endDate = new Date(`${dateStr}T23:59:59.999+07:00`);

    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['paid', 'processing', 'completed'] },
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        table: { select: { number: true } },
        items: { include: { options: true } },
        payment: { select: { status: true, paymentType: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;

    // Top selling items
    const itemCounts: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const order of orders) {
      for (const item of order.items) {
        const optTotal = item.options.reduce((s, o) => s + o.priceAdjustment, 0);
        const revenue = (item.priceAtOrder + optTotal) * item.qty;
        if (!itemCounts[item.menuId]) {
          itemCounts[item.menuId] = { name: item.name, qty: 0, revenue: 0 };
        }
        itemCounts[item.menuId]!.qty += item.qty;
        itemCounts[item.menuId]!.revenue += revenue;
      }
    }

    const topItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b.qty - a.qty)
      .slice(0, 10)
      .map(([menuId, data]) => ({ menuId, ...data }));

    res.json({
      date: dateStr,
      summary: { totalOrders, totalRevenue },
      orders,
      topItems,
    });
  } catch (error) {
    console.error('[GET /api/admin/reports]', error);
    res.status(500).json({ message: 'Gagal mengambil laporan' });
  }
}
