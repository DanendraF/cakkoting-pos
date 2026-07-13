import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const categoriesCount = await prisma.category.count();
    const menuCount = await prisma.menu.count();
    console.log(`✅ Koneksi Sukses!`);
    console.log(`Kategori terdaftar: ${categoriesCount}`);
    console.log(`Menu terdaftar: ${menuCount}`);
  } catch (error) {
    console.error(`❌ Koneksi Gagal:`, error);
  } finally {
    await prisma.$disconnect();
  }
}
test();