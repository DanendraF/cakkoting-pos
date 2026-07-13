import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

/**
 * GET /api/menu
 * Public — returns all categories with their menus and option groups/options.
 * Used by customer menu page (polling not needed; data rarely changes).
 */
export async function getMenu(req: Request, res: Response): Promise<void> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        menus: {
          orderBy: { name: 'asc' },
          include: {
            groups: {
              orderBy: { displayOrder: 'asc' },
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    res.json({ categories });
  } catch (error) {
    console.error('[GET /api/menu]', error);
    res.status(500).json({ message: 'Gagal mengambil data menu' });
  }
}

/**
 * GET /api/menu/:id/recommendations
 * Public — returns upselling recommendations for a given menu item.
 * Called when customer adds item to cart.
 * Returns max 4 recommendations, only isAvailable items.
 */
export async function getMenuRecommendations(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;

  try {
    const recommendations = await prisma.menuRecommendation.findMany({
      where: {
        sourceMenuId: id,
        targetMenu: { isAvailable: true },
      },
      include: {
        targetMenu: {
          include: {
            groups: {
              orderBy: { displayOrder: 'asc' },
              include: { options: true },
            },
            category: { select: { name: true } },
          },
        },
      },
      take: 4,
    });

    const items = recommendations.map((r) => r.targetMenu);
    res.json({ recommendations: items });
  } catch (error) {
    console.error('[GET /api/menu/:id/recommendations]', error);
    res.status(500).json({ message: 'Gagal mengambil rekomendasi' });
  }
}
