/**
 * Prisma Seed Script — Cak Koting QR Self-Order System
 * Run: npx ts-node prisma/seed.ts
 *
 * Reads menu data from ../../menu.json and populates the database.
 * Safe to run multiple times (upserts).
 */

import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface MenuOptionData {
  name: string;
  priceAdjustment: number;
}

interface MenuOptionGroupData {
  name: string;
  required: boolean;
  allowMultiple: boolean;
  options: MenuOptionData[];
}

interface MenuItemData {
  id: string;
  category: string;
  name: string;
  price: number;
  desc: string;
  isAvailable: boolean;
  groups: MenuOptionGroupData[];
}

interface CategoryData {
  name: string;
  displayOrder: number;
}

interface MenuData {
  categories: CategoryData[];
  menu: MenuItemData[];
}

// ─── Upselling recommendations ───────────────────────────────────────────────
// Format: [sourceMenuId, targetMenuId]
// "Saat beli A → cocok dengan B"
const RECOMMENDATIONS: [string, string][] = [
  // Bebek
  ['bebek-goreng', 'nasi-putih'],
  ['bebek-goreng', 'lalapan'],
  ['bebek-goreng', 'teh-tawar'],
  ['bebek-goreng', 'sambal'],
  ['bebek-bakar', 'nasi-putih'],
  ['bebek-bakar', 'lalapan'],
  ['bebek-bakar', 'teh-manis'],
  ['bebek-bakar', 'sambal'],
  ['bebek-penyet', 'nasi-putih'],
  ['bebek-penyet', 'lalapan'],
  ['bebek-penyet', 'teh-tawar'],
  // Ayam
  ['ayam-goreng', 'nasi-putih'],
  ['ayam-goreng', 'lalapan'],
  ['ayam-goreng', 'teh-tawar'],
  ['ayam-goreng', 'sambal'],
  ['ayam-bakar', 'nasi-putih'],
  ['ayam-bakar', 'lalapan'],
  ['ayam-bakar', 'teh-manis'],
  ['ayam-potong-goreng', 'nasi-putih'],
  ['ayam-potong-goreng', 'lalapan'],
  ['ayam-potong-goreng', 'teh-tawar'],
  ['ayam-potong-bakar', 'nasi-putih'],
  ['ayam-potong-bakar', 'lalapan'],
  ['ayam-potong-penyet', 'nasi-putih'],
  ['ayam-potong-penyet', 'lalapan'],
  ['ayam-potong-penyet', 'sambal'],
  // Burung Dara
  ['burung-dara-goreng', 'nasi-putih'],
  ['burung-dara-goreng', 'lalapan'],
  ['burung-dara-goreng', 'teh-tawar'],
  ['burung-dara-bakar', 'nasi-putih'],
  ['burung-dara-bakar', 'lalapan'],
  ['burung-dara-bakar', 'teh-manis'],
  // Ikan
  ['gurameh-goreng', 'nasi-putih'],
  ['gurameh-goreng', 'lalapan'],
  ['gurameh-goreng', 'ca-kangkung'],
  ['gurameh-goreng', 'teh-tawar'],
  ['gurameh-bakar', 'nasi-putih'],
  ['gurameh-bakar', 'lalapan'],
  ['gurameh-bakar', 'ca-kangkung'],
  ['gurameh-bakar', 'teh-manis'],
  ['nila-goreng', 'nasi-putih'],
  ['nila-goreng', 'lalapan'],
  ['nila-goreng', 'teh-tawar'],
  ['nila-bakar', 'nasi-putih'],
  ['nila-bakar', 'lalapan'],
  ['nila-bakar', 'teh-manis'],
  ['lele-goreng', 'nasi-putih'],
  ['lele-goreng', 'lalapan'],
  ['lele-goreng', 'teh-tawar'],
  ['lele-goreng', 'sambal'],
  ['lele-bakar', 'nasi-putih'],
  ['lele-bakar', 'lalapan'],
  ['lele-bakar', 'teh-manis'],
  // Sapi
  ['empal', 'nasi-putih'],
  ['empal', 'lalapan'],
  ['empal', 'teh-manis'],
  ['iga-bakar', 'nasi-putih'],
  ['iga-bakar', 'ca-kangkung'],
  ['iga-bakar', 'teh-manis'],
  ['iso', 'nasi-putih'],
  ['iso', 'teh-tawar'],
  ['babat', 'nasi-putih'],
  ['babat', 'teh-tawar'],
  ['paru', 'nasi-putih'],
  ['paru', 'teh-tawar'],
  // Soto
  ['sop-iga', 'nasi-putih'],
  ['sop-iga', 'teh-tawar'],
  ['soto-sulung-daging', 'nasi-putih'],
  ['soto-sulung-daging', 'teh-tawar'],
  ['soto-sulung-campur', 'nasi-putih'],
  ['soto-sulung-campur', 'teh-tawar'],
  // Nasi → protein suggestions
  ['nasi-putih', 'bebek-goreng'],
  ['nasi-putih', 'ayam-goreng'],
  ['nasi-putih', 'lalapan'],
  ['nasi-putih', 'teh-tawar'],
  ['nasi-uduk', 'bebek-goreng'],
  ['nasi-uduk', 'ayam-goreng'],
  ['nasi-uduk', 'lalapan'],
  // Minuman → protein (cross-upsell)
  ['teh-tawar', 'bebek-goreng'],
  ['teh-tawar', 'nasi-putih'],
  ['teh-manis', 'bebek-bakar'],
  ['teh-manis', 'nasi-putih'],
  // Lalapan cross-sell
  ['lalapan', 'bebek-goreng'],
  ['lalapan', 'ayam-goreng'],
  ['lalapan', 'sambal'],
  // Cendol / dessert
  ['cendol-original', 'teh-tawar'],
  ['cendol-durian', 'cendol-original'],
  ['jus-alpukat', 'cendol-original'],
  ['jus-alpukat', 'tape-susu'],
];

async function main() {
  console.log('🌱 Starting seed...');

  // ── Load menu.json ────────────────────────────────────────────────────────
  const menuPath = path.resolve(__dirname, '../../menu.json');
  if (!fs.existsSync(menuPath)) {
    throw new Error(`menu.json not found at ${menuPath}`);
  }
  const rawData = JSON.parse(fs.readFileSync(menuPath, 'utf-8')) as MenuData;

  // ── 1. Seed RestaurantTable (Meja 1–10) ──────────────────────────────────
  console.log('📋 Seeding restaurant tables...');
  for (let i = 1; i <= 10; i++) {
    await prisma.restaurantTable.upsert({
      where: { number: i },
      update: {},
      create: { number: i, isActive: true },
    });
  }
  console.log(`  ✓ 10 tables seeded`);

  // ── 2. Seed Categories ────────────────────────────────────────────────────
  console.log('🗂️  Seeding categories...');
  const categoryMap: Record<string, string> = {};

  for (const cat of rawData.categories) {
    const record = await prisma.category.upsert({
      where: { name: cat.name },
      update: { displayOrder: cat.displayOrder },
      create: { name: cat.name, displayOrder: cat.displayOrder },
    });
    categoryMap[cat.name] = record.id;
  }
  console.log(`  ✓ ${rawData.categories.length} categories seeded`);

  // ── 3. Seed Menu, Groups, Options ─────────────────────────────────────────
  console.log('🍽️  Seeding menu items...');
  let menuCount = 0;

  for (const item of rawData.menu) {
    const categoryId = categoryMap[item.category];
    if (!categoryId) {
      console.warn(`  ⚠ Category not found: ${item.category} for ${item.id}`);
      continue;
    }

    // Upsert menu item
    await prisma.menu.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        price: item.price,
        desc: item.desc,
        isAvailable: item.isAvailable,
        categoryId,
      },
      create: {
        id: item.id,
        name: item.name,
        price: item.price,
        desc: item.desc,
        isAvailable: item.isAvailable,
        categoryId,
      },
    });

    // Delete existing groups and recreate (simpler than deep upsert)
    await prisma.menuOptionGroup.deleteMany({ where: { menuId: item.id } });

    for (let gi = 0; gi < item.groups.length; gi++) {
      const group = item.groups[gi];
      if (!group) continue;

      await prisma.menuOptionGroup.create({
        data: {
          name: group.name,
          required: group.required,
          allowMultiple: group.allowMultiple,
          displayOrder: gi,
          menuId: item.id,
          options: {
            createMany: {
              data: group.options.map((opt) => ({
                name: opt.name,
                priceAdjustment: opt.priceAdjustment,
              })),
            },
          },
        },
      });
    }

    menuCount++;
  }
  console.log(`  ✓ ${menuCount} menu items seeded`);

  // ── 4. Seed Recommendations ───────────────────────────────────────────────
  console.log('💡 Seeding upselling recommendations...');
  let recCount = 0;

  for (const [sourceId, targetId] of RECOMMENDATIONS) {
    try {
      await prisma.menuRecommendation.upsert({
        where: { sourceMenuId_targetMenuId: { sourceMenuId: sourceId, targetMenuId: targetId } },
        update: {},
        create: { sourceMenuId: sourceId, targetMenuId: targetId },
      });
      recCount++;
    } catch (e) {
      // Skip if source/target menu doesn't exist
      console.warn(`  ⚠ Skipped recommendation ${sourceId} → ${targetId}`);
    }
  }
  console.log(`  ✓ ${recCount} recommendations seeded`);

  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
