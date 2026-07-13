-- =============================================================================
-- FILE: 003_seed_categories.sql
-- PROJECT: Cak Koting QR Self-Order System
-- DESC: Seeds all 19 menu categories with display order.
-- RUN: After 001_schema.sql
-- IDEMPOTENT: ON CONFLICT(name) DO UPDATE SET display_order
-- =============================================================================

INSERT INTO category (name, display_order)
VALUES
  -- Food categories
  ('Nasi',               1),
  ('Bebek',              2),
  ('Burung Dara',        3),
  ('Ayam',               4),
  ('Ayam Potong',        5),
  ('Sapi',               6),
  ('Soto',               7),
  ('Gurameh',            8),
  ('Nila',               9),
  ('Lele',               10),
  ('Lauk dan Sayuran',   11),
  -- Beverage categories
  ('Teh',                12),
  ('Jus Buah',           13),
  ('Jeruk',              14),
  ('Tape',               15),
  ('Cendol',             16),
  ('Kemasan',            17),
  ('Kopi, Susu, Dll',    18),
  ('Degan (Kelapa Muda)',19)
ON CONFLICT (name)
  DO UPDATE SET display_order = EXCLUDED.display_order;

-- Verify
-- SELECT name, display_order FROM category ORDER BY display_order;

-- =============================================================================
-- END OF 003_seed_categories.sql
-- =============================================================================
