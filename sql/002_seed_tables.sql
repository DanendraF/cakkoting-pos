-- =============================================================================
-- FILE: 002_seed_tables.sql
-- PROJECT: Cak Koting QR Self-Order System
-- DESC: Seeds 10 restaurant tables (meja 1–10), all active.
-- RUN: After 001_schema.sql
-- IDEMPOTENT: ON CONFLICT(number) DO NOTHING
-- =============================================================================

INSERT INTO restaurant_table (number, is_active)
VALUES
  (1,  TRUE),
  (2,  TRUE),
  (3,  TRUE),
  (4,  TRUE),
  (5,  TRUE),
  (6,  TRUE),
  (7,  TRUE),
  (8,  TRUE),
  (9,  TRUE),
  (10, TRUE)
ON CONFLICT (number) DO NOTHING;

-- Verify
-- SELECT number, is_active FROM restaurant_table ORDER BY number;

-- =============================================================================
-- END OF 002_seed_tables.sql
-- =============================================================================
