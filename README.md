# Cak Koting — QR Self-Order & Cashless Payment System

Sistem pemesanan mandiri berbasis QR code per meja untuk **Rumah Makan Cak Koting** (spesial bebek goreng, Yogyakarta). Pelanggan scan QR di meja → pesan lewat HP → bayar cashless (QRIS/E-Wallet via Midtrans) → pesanan otomatis masuk antrean dapur, tanpa perlu dicatat manual oleh pelayan.

> Dokumen ini adalah entry point teknis. Untuk detail bisnis & desain lengkap, baca:
> - `docs/PRD_CakKoting_QR_Order.docx` — alur bisnis, skema database, decision log
> - `docs/design.md` — spesifikasi tiap halaman (layout, states, responsive)
> - `docs/nextjs-build-prompt.md` — panduan awal build (catatan: dokumen ini menyebut Next.js API routes sebagai backend; **project ini memakai Express + Prisma terpisah**, lihat Arsitektur di bawah)
> - `docs/menu-full-app-format.json` — seed data menu (85 item, 19 kategori)

---

## 1. Arsitektur

Monorepo dengan **frontend dan backend terpisah**:

```
┌─────────────────────┐        ┌──────────────────────┐        ┌──────────────┐
│   apps/web           │  REST  │   apps/api             │        │  PostgreSQL   │
│   Next.js 14          │ ─────▶ │   Express + Prisma ORM  │ ─────▶ │  Database     │
│   (customer/kitchen/  │  JSON  │   (business logic,      │        │               │
│    admin frontend)    │◀───── │   webhook Midtrans)      │◀─────  │               │
└─────────────────────┘        └──────────────────────┘        └──────────────┘
                                          │
                                          ▼
                                ┌──────────────────┐
                                │  Midtrans Snap /   │
                                │  Core API          │
                                └──────────────────┘
```

- **`apps/web`** — Next.js (App Router), murni presentasi + fetch ke API. Tidak menyimpan business logic penting (validasi harga, status transisi) di sisi frontend.
- **`apps/api`** — Express, seluruh business logic dan akses database lewat **Prisma ORM**. Menerima webhook Midtrans di sini, bukan di Next.js.
- Komunikasi frontend ↔ backend murni **REST API** (JSON), termasuk untuk polling (kitchen queue & status pesanan) — sesuai keputusan real-time strategy di PRD Bagian 4.1.

---

## 2. Tech Stack

| Layer | Pilihan |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | **Express.js** (Node.js), TypeScript |
| ORM | **Prisma** |
| Database | PostgreSQL (bisa MySQL, tinggal ganti `provider` di `schema.prisma`) |
| Payment Gateway | Midtrans (Snap.js di frontend, Core API/Notification webhook di backend) |
| Realtime dapur | Polling interval 4–5 detik (bukan WebSocket — lihat PRD 4.1) |
| Auth kitchen/admin | Session-based sederhana (PIN untuk kitchen, email+password untuk admin) |
| Deployment | Frontend: Vercel · Backend: Railway/Render/VPS · DB: Supabase/Railway/Neon |

---

## 3. Struktur Folder

```
cakkoting-qr-order/
├── apps/
│   ├── web/                          # Next.js — frontend
│   │   ├── app/
│   │   │   ├── (customer)/
│   │   │   │   ├── menu/page.tsx
│   │   │   │   ├── cart/page.tsx
│   │   │   │   ├── checkout/page.tsx
│   │   │   │   ├── order/[orderId]/page.tsx
│   │   │   │   ├── table-invalid/page.tsx
│   │   │   │   └── payment-failed/page.tsx
│   │   │   ├── kitchen/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── menu/page.tsx
│   │   │   │   ├── menu/[id]/page.tsx
│   │   │   │   ├── categories/page.tsx
│   │   │   │   └── reports/page.tsx
│   │   │   ├── not-found.tsx         # 404 global
│   │   │   └── error.tsx             # 500 fallback
│   │   ├── lib/
│   │   │   ├── api-client.ts         # fetch wrapper ke apps/api
│   │   │   └── hooks/                # useOrderStatus, useKitchenQueue (polling)
│   │   └── package.json
│   │
│   └── api/                          # Express — backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── menu.routes.ts
│       │   │   ├── orders.routes.ts
│       │   │   ├── payments.routes.ts    # termasuk webhook Midtrans
│       │   │   ├── kitchen.routes.ts
│       │   │   └── admin.routes.ts
│       │   ├── controllers/
│       │   ├── services/
│       │   │   ├── order.service.ts      # snapshot harga, transisi status
│       │   │   └── midtrans.service.ts
│       │   ├── middleware/
│       │   │   └── auth.middleware.ts
│       │   ├── prisma/
│       │   │   └── client.ts
│       │   └── index.ts                  # entry point Express
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── seed.ts                   # baca menu-full-app-format.json
│       │   └── migrations/
│       └── package.json
│
├── docs/
│   ├── PRD_CakKoting_QR_Order.docx
│   ├── design.md
│   ├── nextjs-build-prompt.md
│   ├── menu_cakkoting.json
│   └── menu-full-app-format.json
│
├── package.json                      # root, workspace config
└── README.md                         # file ini
```

---

## 4. Prasyarat

- Node.js ≥ 18
- npm / pnpm (contoh di bawah pakai npm)
- PostgreSQL ≥ 14 (lokal via Docker, atau pakai Supabase/Railway/Neon)
- Akun Midtrans Sandbox (untuk testing pembayaran) — daftar di [dashboard.midtrans.com](https://dashboard.midtrans.com)

---

## 5. Setup & Menjalankan Secara Lokal

### 5.1 Clone & Install

```bash
git clone <repo-url> cakkoting-qr-order
cd cakkoting-qr-order

# install dependency di kedua workspace
cd apps/api && npm install
cd ../web && npm install
```

### 5.2 Konfigurasi Environment

**`apps/api/.env`**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cakkoting"
PORT=4000
JWT_SECRET="ganti-dengan-random-string"
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxxxxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxxxxx"
MIDTRANS_IS_PRODUCTION=false
CORS_ORIGIN="http://localhost:3000"
```

**`apps/web/.env.local`**

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxxxxx"
```

### 5.3 Setup Database (Prisma)

```bash
cd apps/api

# generate Prisma client
npx prisma generate

# jalankan migrasi (buat semua tabel dari schema.prisma)
npx prisma migrate dev --name init

# seed data menu dari docs/menu-full-app-format.json
npx prisma db seed
```

### 5.4 Jalankan Dev Server

Buka 2 terminal:

```bash
# terminal 1 — backend
cd apps/api
npm run dev        # Express jalan di http://localhost:4000

# terminal 2 — frontend
cd apps/web
npm run dev        # Next.js jalan di http://localhost:3000
```

Akses:
- Customer: `http://localhost:3000/menu?meja=1`
- Kitchen: `http://localhost:3000/kitchen/login`
- Admin: `http://localhost:3000/admin/login`

### 5.5 Webhook Midtrans (Testing Lokal)

Midtrans perlu mengakses endpoint webhook publik. Untuk testing lokal, pakai `ngrok`:

```bash
ngrok http 4000
```

Set Payment Notification URL di [dashboard Midtrans Sandbox](https://dashboard.midtrans.com) ke:
`https://<ngrok-id>.ngrok-free.app/api/payments/webhook`

---

## 6. Skema Database (Prisma)

Diturunkan dari `PRD_CakKoting_QR_Order.docx` Bagian 5. Ringkasan model:

| Model | Keterangan |
|---|---|
| `Table` | Daftar meja & status |
| `Category` | Kategori menu (Bebek, Ayam, Minuman, dst.) |
| `Menu` | Detail menu, harga dasar, `isAvailable` (toggle stok manual) |
| `MenuOptionGroup` | Grup varian per menu (misal "Potongan", "Sambal", "Suhu") |
| `MenuOption` | Pilihan di dalam grup varian |
| `Order` | Induk pesanan. `status`: `pending → paid → processing → completed` / `cancelled` |
| `OrderItem` | Item dalam order, `priceAtOrder` di-snapshot saat transaksi |
| `OrderItemOption` | Varian yang dipilih per item, snapshot nama & tambahan harga |
| `Payment` | Log transaksi Midtrans, `status`: `pending / settlement / expire / cancel` |

Lihat SQL lengkap di `docs/PRD_CakKoting_QR_Order.docx` Bagian 5 — terjemahkan langsung ke `apps/api/prisma/schema.prisma` dengan relasi Prisma standar (`@relation`).

**Perintah Prisma yang sering dipakai:**

```bash
npx prisma studio           # GUI untuk lihat/edit data
npx prisma migrate dev      # buat migrasi baru setelah ubah schema.prisma
npx prisma generate         # regenerate Prisma client setelah ubah schema
npx prisma db seed          # jalankan ulang seed script
```

---

## 7. API Endpoints (apps/api)

| Method | Route | Keterangan |
|---|---|---|
| `GET` | `/api/menu` | Ambil semua kategori + menu + varian |
| `POST` | `/api/orders` | Buat order baru (`status: pending`), trigger Midtrans Snap token |
| `GET` | `/api/orders/:id` | Ambil status order (dipakai untuk polling di halaman status) |
| `POST` | `/api/payments/webhook` | Endpoint notifikasi Midtrans — update `Payment.status` & `Order.status` |
| `GET` | `/api/kitchen/orders` | Ambil antrean order aktif, dikelompokkan per meja (dipakai polling kitchen) |
| `PATCH` | `/api/kitchen/orders/:id/status` | Update status order (`paid → processing → completed`) |
| `POST` | `/api/kitchen/login` | Login staf dapur (PIN) |
| `GET` | `/api/admin/menu` | List menu untuk admin |
| `POST` | `/api/admin/menu` | Tambah menu baru |
| `PATCH` | `/api/admin/menu/:id` | Edit menu / toggle `isAvailable` / update varian |
| `DELETE` | `/api/admin/menu/:id` | Hapus menu |
| `GET` | `/api/admin/categories` | List kategori |
| `GET` | `/api/admin/reports?date=` | Laporan transaksi harian |
| `POST` | `/api/admin/login` | Login admin |

---

## 8. Aturan Bisnis Wajib

Diimplementasikan persis sesuai Decision Log di PRD Bagian 4 — **jangan disederhanakan tanpa diskusi ulang**:

1. **Polling, bukan WebSocket** — kitchen dashboard & halaman status pesanan polling tiap 4–5 detik.
2. **Setiap checkout = order baru** — order susulan dari meja yang sama tidak digabung ke order lama; kitchen dashboard menggabungkan tampilannya saja per `table_id`.
3. **Tracking status tanpa login** — `order_id` disimpan di `localStorage` browser pelanggan.
4. **Stok manual** — toggle `isAvailable`, bukan sistem hitung stok otomatis.
5. **Harga & varian di-snapshot saat order dibuat** — `OrderItem.priceAtOrder` dan `OrderItemOption` tidak boleh dihitung ulang dari tabel master setelah order dibuat.
6. **`Order.status` hanya berubah ke `paid` lewat webhook Midtrans** (`payment_status = settlement`). Jika `expire`/`cancel` → `Order.status` otomatis `cancelled`.

---

## 9. Testing

```bash
# backend
cd apps/api
npm run test

# frontend
cd apps/web
npm run test
```

Untuk testing pembayaran end-to-end, gunakan [simulator Midtrans Sandbox](https://simulator.sandbox.midtrans.com) dengan `transaction_id` dari response Snap token.

---

## 10. Deployment

| Bagian | Rekomendasi |
|---|---|
| `apps/web` | Vercel — set `NEXT_PUBLIC_API_BASE_URL` ke URL backend production |
| `apps/api` | Railway / Render / VPS — pastikan `CORS_ORIGIN` diarahkan ke domain frontend production |
| Database | Supabase / Railway Postgres / Neon — jalankan `npx prisma migrate deploy` (bukan `migrate dev`) saat deploy |
| Midtrans | Ganti ke Production key & set `MIDTRANS_IS_PRODUCTION=true` setelah bisnis Midtrans terverifikasi |

Sebelum go-live, pastikan Payment Notification URL di dashboard Midtrans Production diarahkan ke `https://<domain-backend>/api/payments/webhook`.

---

## 11. Referensi Desain

- Design token warna & tipografi: lihat `docs/design.md` Bagian 1.
- Spesifikasi tiap halaman (layout, states, responsive breakpoint per area): `docs/design.md` Bagian 2–6.
- Mockup interaktif (mock data, tanpa backend): `docs/cakkoting-mockup.jsx`.

---

## 12. Kontribusi & Urutan Kerja

Ikuti urutan build yang disarankan di `docs/nextjs-build-prompt.md` Bagian 9 (disesuaikan: langkah "bangun API routes" berarti bangun route Express di `apps/api`, bukan Next.js API routes):

1. Setup schema Prisma + migrate + seed dari `menu-full-app-format.json`.
2. Bangun endpoint Express inti (`/api/menu`, `/api/orders`, `/api/payments/webhook`, `/api/kitchen/orders`) — test dengan curl/Postman dulu.
3. Bangun halaman customer inti di Next.js (Menu → Varian → Cart → Checkout → Order Status).
4. Bangun `not-found.tsx` & `error.tsx` global.
5. Bangun Kitchen (Login → Antrean).
6. Bangun Admin (Login → Menu Management → Varian → Categories → Reports).
7. Bangun edge case customer (Table Invalid, Payment Failed).
8. Test end-to-end di device asli (HP untuk customer, tablet untuk kitchen).

---

## 13. Kontak Bisnis (untuk referensi konten/copy)

- Rumah Makan Cak Koting — Spesial Bebek Goreng
- Jl. Doktor Sutomo No.57, Bausasran, Kec. Danurejan, Kota Yogyakarta, DIY 55211
- Instagram: [@cakkoting](https://instagram.com/cakkoting)
- WhatsApp: 0856-4757-2009 / 0856-2883-111
