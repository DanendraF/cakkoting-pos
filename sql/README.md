# Cak Koting QR Self-Order — SQL Setup Guide

**Rumah Makan Cak Koting — Spesial Bebek Goreng, Yogyakarta**

---

## Overview

This directory contains all SQL files required to set up the PostgreSQL database on Supabase for the Cak Koting QR self-order system.

Stack: **Express + Prisma ORM** — Database: **PostgreSQL on Supabase**

---

## Execution Order

Run these files **in order** in the Supabase SQL Editor (`Database → SQL Editor → New query`):

| # | File | Description |
|---|------|-------------|
| 1 | `001_schema.sql` | Creates all tables, enums, and indexes |
| 2 | `002_seed_tables.sql` | Inserts 10 restaurant tables (meja 1–10) |
| 3 | `003_seed_categories.sql` | Inserts all 19 menu categories |
| 4 | `004_seed_menu.sql` | Inserts all menu items with option groups & options |
| 5 | `005_seed_recommendations.sql` | Inserts upselling recommendation pairs |

> **Important:** Always run `001_schema.sql` first. The seed files depend on the tables and enums it creates. All files are **idempotent** — safe to re-run without duplicating data.

---

## File Descriptions

### `001_schema.sql`
Defines the full database schema:
- **Enums:** `order_status`, `payment_status`
- **Tables:** `restaurant_table`, `category`, `menu`, `menu_option_group`, `menu_option`, `menu_recommendation`, `order`, `order_item`, `order_item_option`, `payment`
- **Indexes** on all foreign keys and frequently queried columns (`status`, `created_at`)
- All statements use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` for safe re-runs.

### `002_seed_tables.sql`
Inserts **10 restaurant tables** numbered 1–10, all active by default. Uses `ON CONFLICT DO NOTHING` so re-running is safe.

### `003_seed_categories.sql`
Inserts all **19 menu categories** with their `display_order` values, controlling the order they appear in the menu UI:

```
Nasi → Bebek → Burung Dara → Ayam → Ayam Potong → Sapi → Soto
→ Gurameh → Nila → Lele → Lauk dan Sayuran → Teh → Jus Buah
→ Jeruk → Tape → Cendol → Kemasan → Kopi/Susu/Dll → Degan
```

Uses `ON CONFLICT(name) DO UPDATE SET display_order = EXCLUDED.display_order` — safe to update display order on re-run.

### `004_seed_menu.sql`
Inserts all **~85 menu items** with their associated option groups and options. Structure:
- Uses a `DO $$ ... END $$;` PL/pgSQL block to look up category UUIDs by name
- Inserts into `menu` → `menu_option_group` → `menu_option` in sequence
- Menu IDs are **text slugs** (e.g., `'bebek-goreng'`), not UUIDs
- Uses `ON CONFLICT(id) DO UPDATE` for menu rows so prices can be updated on re-run
- Option groups and options use `ON CONFLICT DO NOTHING`

### `005_seed_recommendations.sql`
Inserts **upselling recommendation pairs** into `menu_recommendation`. See section below for logic details.

---

## MenuRecommendation Pairs — Upselling Logic

The `menu_recommendation` table stores **directional pairs** `(source_menu_id → target_menu_id)`. When a customer views or adds `source_menu_id` to their cart, the system suggests `target_menu_id` as a recommended add-on.

### How Pairs Work

```
source_menu_id  ──►  target_menu_id
  (what they       (what to suggest)
   ordered)
```

A pair is **one-directional**. To make two items recommend each other mutually, two rows are needed.

### Upselling Strategy Used

| Pattern | Example |
|---------|---------|
| **Protein → Rice** | `bebek-goreng` → `nasi-putih` |
| **Protein → Sides** | `bebek-goreng` → `lalapan`, `sambal` |
| **Protein → Drinks** | `bebek-goreng` → `teh-tawar` |
| **Rice → Protein** | `nasi-putih` → `bebek-goreng`, `ayam-goreng` |
| **Drink → Protein** | `teh-tawar` → `bebek-goreng` |
| **Dessert → Dessert** | `cendol-original` → `tape-susu` |
| **Fish → Vegetables** | `gurameh-goreng` → `ca-kangkung` |

### Notes for Developers

- The `UNIQUE(source_menu_id, target_menu_id)` constraint ensures no duplicate pairs.
- A source menu can have **multiple** targets (e.g., `bebek-goreng` recommends 4 items).
- These pairs are curated manually. Add or remove via Supabase SQL Editor or a future admin UI.
- To add a new recommendation pair:
  ```sql
  INSERT INTO menu_recommendation (id, source_menu_id, target_menu_id)
  VALUES (gen_random_uuid(), 'bebek-goreng', 'cendol-original')
  ON CONFLICT DO NOTHING;
  ```

---

## Re-running Safety

All files are designed to be **idempotent**:

| File | Strategy |
|------|----------|
| `001_schema.sql` | `CREATE TABLE IF NOT EXISTS`, `CREATE TYPE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` |
| `002_seed_tables.sql` | `ON CONFLICT DO NOTHING` |
| `003_seed_categories.sql` | `ON CONFLICT(name) DO UPDATE SET display_order` |
| `004_seed_menu.sql` | `ON CONFLICT(id) DO UPDATE SET name, price, ...` for menu; `ON CONFLICT DO NOTHING` for options |
| `005_seed_recommendations.sql` | `ON CONFLICT DO NOTHING` |

---

*Last updated: July 2026 — Cak Koting Dev Team*
