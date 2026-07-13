-- =============================================================================
-- FILE: 004_seed_menu.sql
-- PROJECT: Cak Koting QR Self-Order System
-- DESC: Seeds all menu items, option groups, and options.
-- RUN: After 003_seed_categories.sql
-- IDEMPOTENT:
--   menu            → ON CONFLICT(id) DO UPDATE SET name, price, description, is_available, updated_at
--   menu_option_group → ON CONFLICT DO NOTHING
--   menu_option       → ON CONFLICT DO NOTHING
-- NOTE: Menu IDs are text slugs. Category IDs are looked up by name.
-- =============================================================================

DO $$
DECLARE
  -- ── Category UUID variables ──────────────────────────────────────────────
  cat_nasi          UUID;
  cat_bebek         UUID;
  cat_burung_dara   UUID;
  cat_ayam          UUID;
  cat_ayam_potong   UUID;
  cat_sapi          UUID;
  cat_soto          UUID;
  cat_gurameh       UUID;
  cat_nila          UUID;
  cat_lele          UUID;
  cat_lauk          UUID;
  cat_teh           UUID;
  cat_jus           UUID;
  cat_jeruk         UUID;
  cat_tape          UUID;
  cat_cendol        UUID;
  cat_kemasan       UUID;
  cat_kopi          UUID;
  cat_degan         UUID;

  -- ── Reusable option group UUID variables ─────────────────────────────────
  grp_id UUID;

BEGIN
  -- ── Look up category IDs by name ─────────────────────────────────────────
  SELECT id INTO cat_nasi        FROM category WHERE name = 'Nasi';
  SELECT id INTO cat_bebek       FROM category WHERE name = 'Bebek';
  SELECT id INTO cat_burung_dara FROM category WHERE name = 'Burung Dara';
  SELECT id INTO cat_ayam        FROM category WHERE name = 'Ayam';
  SELECT id INTO cat_ayam_potong FROM category WHERE name = 'Ayam Potong';
  SELECT id INTO cat_sapi        FROM category WHERE name = 'Sapi';
  SELECT id INTO cat_soto        FROM category WHERE name = 'Soto';
  SELECT id INTO cat_gurameh     FROM category WHERE name = 'Gurameh';
  SELECT id INTO cat_nila        FROM category WHERE name = 'Nila';
  SELECT id INTO cat_lele        FROM category WHERE name = 'Lele';
  SELECT id INTO cat_lauk        FROM category WHERE name = 'Lauk dan Sayuran';
  SELECT id INTO cat_teh         FROM category WHERE name = 'Teh';
  SELECT id INTO cat_jus         FROM category WHERE name = 'Jus Buah';
  SELECT id INTO cat_jeruk       FROM category WHERE name = 'Jeruk';
  SELECT id INTO cat_tape        FROM category WHERE name = 'Tape';
  SELECT id INTO cat_cendol      FROM category WHERE name = 'Cendol';
  SELECT id INTO cat_kemasan     FROM category WHERE name = 'Kemasan';
  SELECT id INTO cat_kopi        FROM category WHERE name = 'Kopi, Susu, Dll';
  SELECT id INTO cat_degan       FROM category WHERE name = 'Degan (Kelapa Muda)';

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: NASI
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('nasi-putih', 'Nasi Putih', 6000,  '', TRUE, cat_nasi, NOW()),
    ('nasi-uduk',  'Nasi Uduk',  8000,  '', TRUE, cat_nasi, NOW()),
    ('nasi-bakar', 'Nasi Bakar', 12000, '', TRUE, cat_nasi, NOW()),
    ('nasi-merah', 'Nasi Merah', 12000, '', TRUE, cat_nasi, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name         = EXCLUDED.name,
    price        = EXCLUDED.price,
    description  = EXCLUDED.description,
    is_available = EXCLUDED.is_available,
    updated_at   = NOW();
  -- No option groups for Nasi items

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: BEBEK
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('bebek-goreng', 'Bebek Goreng', 27500, '', TRUE, cat_bebek, NOW()),
    ('bebek-bakar',  'Bebek Bakar',  30000, '', TRUE, cat_bebek, NOW()),
    ('bebek-penyet', 'Bebek Penyet', 27500, '', TRUE, cat_bebek, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();

  -- Options for bebek-goreng
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Potongan', TRUE, FALSE, 1, 'bebek-goreng')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'bebek-goreng' AND name = 'Potongan';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Paha', 0, grp_id),
    (gen_random_uuid(), 'Dada', 0, grp_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 2, 'bebek-goreng')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'bebek-goreng' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Options for bebek-bakar
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Potongan', TRUE, FALSE, 1, 'bebek-bakar')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'bebek-bakar' AND name = 'Potongan';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Paha', 0, grp_id),
    (gen_random_uuid(), 'Dada', 0, grp_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 2, 'bebek-bakar')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'bebek-bakar' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Options for bebek-penyet
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Potongan', TRUE, FALSE, 1, 'bebek-penyet')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'bebek-penyet' AND name = 'Potongan';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Paha', 0, grp_id),
    (gen_random_uuid(), 'Dada', 0, grp_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 2, 'bebek-penyet')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'bebek-penyet' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: BURUNG DARA
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('burung-dara-goreng', 'Burung Dara Goreng', 33500, '', TRUE, cat_burung_dara, NOW()),
    ('burung-dara-bakar',  'Burung Dara Bakar',  35500, '', TRUE, cat_burung_dara, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();

  -- Options for burung-dara-goreng (Sambal only)
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 1, 'burung-dara-goreng')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'burung-dara-goreng' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Options for burung-dara-bakar (Sambal only)
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 1, 'burung-dara-bakar')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'burung-dara-bakar' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: AYAM
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('ayam-goreng', 'Ayam Goreng', 25000, '', TRUE, cat_ayam, NOW()),
    ('ayam-bakar',  'Ayam Bakar',  27000, '', TRUE, cat_ayam, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();

  -- Options for ayam-goreng
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Potongan', TRUE, FALSE, 1, 'ayam-goreng')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'ayam-goreng' AND name = 'Potongan';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Paha', 0, grp_id),
    (gen_random_uuid(), 'Dada', 0, grp_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 2, 'ayam-goreng')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'ayam-goreng' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Options for ayam-bakar
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Potongan', TRUE, FALSE, 1, 'ayam-bakar')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'ayam-bakar' AND name = 'Potongan';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Paha', 0, grp_id),
    (gen_random_uuid(), 'Dada', 0, grp_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 2, 'ayam-bakar')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'ayam-bakar' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: AYAM POTONG
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('ayam-potong-goreng', 'Ayam Potong Goreng', 17000, '', TRUE, cat_ayam_potong, NOW()),
    ('ayam-potong-bakar',  'Ayam Potong Bakar',  19000, '', TRUE, cat_ayam_potong, NOW()),
    ('ayam-potong-penyet', 'Ayam Potong Penyet', 17000, '', TRUE, cat_ayam_potong, NOW()),
    ('kepala-ayam',        'Kepala Ayam',         9000, '', TRUE, cat_ayam_potong, NOW()),
    ('ati-ampela',         'Ati Ampela',          14000, '', TRUE, cat_ayam_potong, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();

  -- Options for ayam-potong-goreng
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Potongan', TRUE, FALSE, 1, 'ayam-potong-goreng')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'ayam-potong-goreng' AND name = 'Potongan';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Paha', 0, grp_id),
    (gen_random_uuid(), 'Dada', 0, grp_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 2, 'ayam-potong-goreng')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'ayam-potong-goreng' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Options for ayam-potong-bakar
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Potongan', TRUE, FALSE, 1, 'ayam-potong-bakar')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'ayam-potong-bakar' AND name = 'Potongan';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Paha', 0, grp_id),
    (gen_random_uuid(), 'Dada', 0, grp_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 2, 'ayam-potong-bakar')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'ayam-potong-bakar' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Options for ayam-potong-penyet
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Potongan', TRUE, FALSE, 1, 'ayam-potong-penyet')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'ayam-potong-penyet' AND name = 'Potongan';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Paha', 0, grp_id),
    (gen_random_uuid(), 'Dada', 0, grp_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 2, 'ayam-potong-penyet')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'ayam-potong-penyet' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;
  -- kepala-ayam and ati-ampela have no option groups

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: SAPI
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('empal',    'Empal',    28000, '', TRUE, cat_sapi, NOW()),
    ('iga-bakar','Iga Bakar', 31000, '', TRUE, cat_sapi, NOW()),
    ('iso',      'Iso',       25000, '', TRUE, cat_sapi, NOW()),
    ('babat',    'Babat',     25000, '', TRUE, cat_sapi, NOW()),
    ('paru',     'Paru',      25000, '', TRUE, cat_sapi, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();
  -- No option groups for Sapi items

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: SOTO
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('sop-iga',              'Sop Iga',              32000, '', TRUE, cat_soto, NOW()),
    ('soto-sulung-daging',   'Soto Sulung Daging',   20000, '', TRUE, cat_soto, NOW()),
    ('soto-sulung-campur',   'Soto Sulung Campur',   15000, '', TRUE, cat_soto, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();
  -- No option groups for Soto items

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: GURAMEH
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('gurameh-goreng', 'Gurameh Goreng', 55000, '', TRUE, cat_gurameh, NOW()),
    ('gurameh-bakar',  'Gurameh Bakar',  60000, '', TRUE, cat_gurameh, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();

  -- Options for gurameh-goreng
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 1, 'gurameh-goreng')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'gurameh-goreng' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Options for gurameh-bakar
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 1, 'gurameh-bakar')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'gurameh-bakar' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: NILA
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('nila-goreng', 'Nila Goreng', 25000, '', TRUE, cat_nila, NOW()),
    ('nila-bakar',  'Nila Bakar',  30000, '', TRUE, cat_nila, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();

  -- Options for nila-goreng
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 1, 'nila-goreng')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'nila-goreng' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Options for nila-bakar
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 1, 'nila-bakar')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'nila-bakar' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: LELE
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('lele-goreng', 'Lele Goreng', 12725, '', TRUE, cat_lele, NOW()),
    ('lele-bakar',  'Lele Bakar',  14500, '', TRUE, cat_lele, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();

  -- Options for lele-goreng
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 1, 'lele-goreng')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'lele-goreng' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Options for lele-bakar
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Sambal', TRUE, FALSE, 1, 'lele-bakar')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'lele-bakar' AND name = 'Sambal';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: LAUK DAN SAYURAN
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('oseng-daun-pepaya',  'Oseng Daun Pepaya', 10000, '',                      TRUE, cat_lauk, NOW()),
    ('ca-kangkung',        'Ca Kangkung',        15000, '',                      TRUE, cat_lauk, NOW()),
    ('ca-kangkung-cumi',   'Ca Kangkung Cumi',   20000, '',                      TRUE, cat_lauk, NOW()),
    ('ca-kangkung-udang',  'Ca Kangkung Udang',  20000, '',                      TRUE, cat_lauk, NOW()),
    ('pete-goreng',        'Pete Goreng',         14000, '',                      TRUE, cat_lauk, NOW()),
    ('kol-goreng',         'Kol Goreng',           9000, '',                      TRUE, cat_lauk, NOW()),
    ('telur',              'Telur',                7000, '',                      TRUE, cat_lauk, NOW()),
    ('tahutempe',          'Tahu/Tempe',            4000, '',                      TRUE, cat_lauk, NOW()),
    ('terong-goreng',      'Terong Goreng',       10000, '',                      TRUE, cat_lauk, NOW()),
    ('sambal-belut',       'Sambal Belut',        15000, '',                      TRUE, cat_lauk, NOW()),
    ('sambal-terong',      'Sambal Terong',       13000, '',                      TRUE, cat_lauk, NOW()),
    ('sambal',             'Sambal',               4000, '',                      TRUE, cat_lauk, NOW()),
    ('lalapan',            'Lalapan',              3000, 'Timun, kubis & kemangi',TRUE, cat_lauk, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();

  -- Options for telur (Jenis: Dadar / Ceplok)
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Jenis', TRUE, FALSE, 1, 'telur')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'telur' AND name = 'Jenis';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Dadar', 0, grp_id),
    (gen_random_uuid(), 'Ceplok', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Options for tahutempe (Jenis: Goreng / Penyet)
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Jenis', TRUE, FALSE, 1, 'tahutempe')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'tahutempe' AND name = 'Jenis';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Goreng',           0, grp_id),
    (gen_random_uuid(), 'Penyet (3 biji)',  0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Options for sambal (Jenis: Bawang / Ijo / Terasi / Matang)
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Jenis', TRUE, FALSE, 1, 'sambal')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'sambal' AND name = 'Jenis';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Bawang', 0, grp_id),
    (gen_random_uuid(), 'Ijo',    0, grp_id),
    (gen_random_uuid(), 'Terasi', 0, grp_id),
    (gen_random_uuid(), 'Matang', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: TEH
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('teh-tawar',     'Teh Tawar',     4000,  '', TRUE, cat_teh, NOW()),
    ('teh-manis',     'Teh Manis',     7500,  '', TRUE, cat_teh, NOW()),
    ('teh-gula-batu', 'Teh Gula Batu', 9000,  '', TRUE, cat_teh, NOW()),
    ('green-tea',     'Green Tea',     16000, '', TRUE, cat_teh, NOW()),
    ('lemon-tea',     'Lemon Tea',     10000, '', TRUE, cat_teh, NOW()),
    ('teh-tarik',     'Teh Tarik',     10000, '', TRUE, cat_teh, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();

  -- Suhu options for teh-tawar
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Suhu', TRUE, FALSE, 1, 'teh-tawar')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'teh-tawar' AND name = 'Suhu';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Es',    0, grp_id),
    (gen_random_uuid(), 'Panas', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Suhu options for teh-manis
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Suhu', TRUE, FALSE, 1, 'teh-manis')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'teh-manis' AND name = 'Suhu';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Es',    0, grp_id),
    (gen_random_uuid(), 'Panas', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Suhu options for lemon-tea
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Suhu', TRUE, FALSE, 1, 'lemon-tea')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'lemon-tea' AND name = 'Suhu';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Es',    0, grp_id),
    (gen_random_uuid(), 'Panas', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Suhu options for teh-tarik
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Suhu', TRUE, FALSE, 1, 'teh-tarik')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'teh-tarik' AND name = 'Suhu';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Es',    0, grp_id),
    (gen_random_uuid(), 'Panas', 0, grp_id)
  ON CONFLICT DO NOTHING;
  -- teh-gula-batu and green-tea have no option groups

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: JUS BUAH
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('jus-jambu',     'Jus Jambu',     15000, '', TRUE, cat_jus, NOW()),
    ('jus-jeruk',     'Jus Jeruk',     15000, '', TRUE, cat_jus, NOW()),
    ('jus-mangga',    'Jus Mangga',    15000, '', TRUE, cat_jus, NOW()),
    ('jus-melon',     'Jus Melon',     15000, '', TRUE, cat_jus, NOW()),
    ('jus-apel',      'Jus Apel',      15000, '', TRUE, cat_jus, NOW()),
    ('jus-timun',     'Jus Timun',     13000, '', TRUE, cat_jus, NOW()),
    ('jus-tomat',     'Jus Tomat',     13000, '', TRUE, cat_jus, NOW()),
    ('jus-stroberi',  'Jus Stroberi',  15000, '', TRUE, cat_jus, NOW()),
    ('jus-nangka',    'Jus Nangka',    15000, '', TRUE, cat_jus, NOW()),
    ('jus-alpukat',   'Jus Alpukat',   18000, '', TRUE, cat_jus, NOW()),
    ('jus-buah-naga', 'Jus Buah Naga', 18000, '', TRUE, cat_jus, NOW()),
    ('jus-sirsak',    'Jus Sirsak',    18000, '', TRUE, cat_jus, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();
  -- No option groups for Jus Buah items

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: JERUK
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('jeruk',       'Jeruk',       10000, '', TRUE, cat_jeruk, NOW()),
    ('jeruk-nipis', 'Jeruk Nipis', 12000, '', TRUE, cat_jeruk, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();

  -- Suhu options for jeruk
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Suhu', TRUE, FALSE, 1, 'jeruk')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'jeruk' AND name = 'Suhu';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Es',    0, grp_id),
    (gen_random_uuid(), 'Panas', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Suhu options for jeruk-nipis
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Suhu', TRUE, FALSE, 1, 'jeruk-nipis')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'jeruk-nipis' AND name = 'Suhu';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Es',    0, grp_id),
    (gen_random_uuid(), 'Panas', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: TAPE
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('tape',           'Tape',           10000, '', TRUE, cat_tape, NOW()),
    ('tape-susu',      'Tape Susu',      13000, '', TRUE, cat_tape, NOW()),
    ('es-beras-kencur','Es Beras Kencur',10000, '', TRUE, cat_tape, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();

  -- Suhu options for tape
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Suhu', TRUE, FALSE, 1, 'tape')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'tape' AND name = 'Suhu';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Es',    0, grp_id),
    (gen_random_uuid(), 'Panas', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Suhu options for tape-susu
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Suhu', TRUE, FALSE, 1, 'tape-susu')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'tape-susu' AND name = 'Suhu';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Es',    0, grp_id),
    (gen_random_uuid(), 'Panas', 0, grp_id)
  ON CONFLICT DO NOTHING;
  -- es-beras-kencur has no option groups

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: CENDOL
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('cendol-original',   'Cendol Original',   13000, '', TRUE, cat_cendol, NOW()),
    ('cendol-durian',     'Cendol Durian',      20000, '', TRUE, cat_cendol, NOW()),
    ('cendol-lychee',     'Cendol Lychee',      15000, '', TRUE, cat_cendol, NOW()),
    ('cendol-bubblegum',  'Cendol Bubblegum',   18000, '', TRUE, cat_cendol, NOW()),
    ('cendol-greentea',   'Cendol Greentea',    18000, '', TRUE, cat_cendol, NOW()),
    ('cendol-red-velvet', 'Cendol Red Velvet',  18000, '', TRUE, cat_cendol, NOW()),
    ('cendol-klepon',     'Cendol Klepon',       18000, '', TRUE, cat_cendol, NOW()),
    ('cendol-tape',       'Cendol Tape',         15000, '', TRUE, cat_cendol, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();
  -- No option groups for Cendol items

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: KEMASAN
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('air-mineral',     'Air Mineral',     7000, '', TRUE, cat_kemasan, NOW()),
    ('teh-botol-sosro', 'Teh Botol Sosro', 6000, '', TRUE, cat_kemasan, NOW()),
    ('fruit-tea',       'Fruit Tea',        6000, '', TRUE, cat_kemasan, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();
  -- No option groups for Kemasan items

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: KOPI, SUSU, DLL
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('kopi',       'Kopi',        8000, '', TRUE, cat_kopi, NOW()),
    ('milo',       'Milo',       10000, '', TRUE, cat_kopi, NOW()),
    ('susu-putih', 'Susu Putih', 10000, '', TRUE, cat_kopi, NOW()),
    ('sekoteng',   'Sekoteng',    9000, '', TRUE, cat_kopi, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();

  -- Suhu options for kopi
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Suhu', TRUE, FALSE, 1, 'kopi')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'kopi' AND name = 'Suhu';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Es',    0, grp_id),
    (gen_random_uuid(), 'Panas', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Suhu options for milo
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Suhu', TRUE, FALSE, 1, 'milo')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'milo' AND name = 'Suhu';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Es',    0, grp_id),
    (gen_random_uuid(), 'Panas', 0, grp_id)
  ON CONFLICT DO NOTHING;

  -- Suhu options for susu-putih
  INSERT INTO menu_option_group (id, name, required, allow_multiple, display_order, menu_id)
  VALUES (gen_random_uuid(), 'Suhu', TRUE, FALSE, 1, 'susu-putih')
  ON CONFLICT DO NOTHING;

  SELECT id INTO grp_id FROM menu_option_group WHERE menu_id = 'susu-putih' AND name = 'Suhu';
  INSERT INTO menu_option (id, name, price_adjustment, group_id) VALUES
    (gen_random_uuid(), 'Es',    0, grp_id),
    (gen_random_uuid(), 'Panas', 0, grp_id)
  ON CONFLICT DO NOTHING;
  -- sekoteng has no option groups (served traditionally hot)

  -- ════════════════════════════════════════════════════════════════════════════
  -- CATEGORY: DEGAN (KELAPA MUDA)
  -- ════════════════════════════════════════════════════════════════════════════
  INSERT INTO menu (id, name, price, description, is_available, category_id, updated_at)
  VALUES
    ('degan-utuh-original',  'Degan Utuh Original',  15000, '', TRUE, cat_degan, NOW()),
    ('degan-utuh-sirup',     'Degan Utuh Sirup',      18000, '', TRUE, cat_degan, NOW()),
    ('degan-utuh-gula-jawa', 'Degan Utuh Gula Jawa',  18000, '', TRUE, cat_degan, NOW()),
    ('degan-utuh-susu',      'Degan Utuh Susu',        20000, '', TRUE, cat_degan, NOW())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, price = EXCLUDED.price,
    description = EXCLUDED.description, is_available = EXCLUDED.is_available, updated_at = NOW();
  -- No option groups for Degan items

END $$;

-- Verify counts
-- SELECT (SELECT COUNT(*) FROM menu)              AS total_menu_items,
--        (SELECT COUNT(*) FROM menu_option_group) AS total_option_groups,
--        (SELECT COUNT(*) FROM menu_option)        AS total_options;

-- =============================================================================
-- END OF 004_seed_menu.sql
-- =============================================================================
