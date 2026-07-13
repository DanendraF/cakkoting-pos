-- =============================================================================
-- FILE: 005_seed_recommendations.sql
-- PROJECT: Cak Koting QR Self-Order System
-- DESC: Seeds curated upselling recommendation pairs for the menu.
-- RUN: After 004_seed_menu.sql
-- IDEMPOTENT: ON CONFLICT(source_menu_id, target_menu_id) DO NOTHING
--
-- STRATEGY:
--   Each row means: "When customer orders [source], suggest [target]."
--   Pairs are directional and curated for Indonesian warung dining context.
--
-- UPSELLING PATTERNS USED:
--   • Protein → Nasi Putih    (protein always pairs with rice)
--   • Protein → Lalapan       (fresh veggie side, very common)
--   • Protein → Sambal        (extra sambal is a staple upsell)
--   • Protein → Drink         (goreng → teh tawar; bakar → teh manis)
--   • Fish → Ca Kangkung      (fish + stir-fried vegetables pairing)
--   • Rice → Protein          (cross-sell protein from rice)
--   • Drink → Protein/Rice    (when ordering just a drink, suggest food)
--   • Dessert → Dessert       (cendol + tape-susu is a popular combo)
-- =============================================================================

INSERT INTO menu_recommendation (id, source_menu_id, target_menu_id)
VALUES

  -- ── BEBEK GORENG ──────────────────────────────────────────────────────────
  -- Bebek is the hero product; pair with rice, sides, and a drink
  (gen_random_uuid(), 'bebek-goreng', 'nasi-putih'),  -- always eat with rice
  (gen_random_uuid(), 'bebek-goreng', 'lalapan'),     -- fresh veggie side
  (gen_random_uuid(), 'bebek-goreng', 'teh-tawar'),   -- classic warung drink
  (gen_random_uuid(), 'bebek-goreng', 'sambal'),      -- extra sambal

  -- ── BEBEK BAKAR ───────────────────────────────────────────────────────────
  (gen_random_uuid(), 'bebek-bakar', 'nasi-putih'),
  (gen_random_uuid(), 'bebek-bakar', 'lalapan'),
  (gen_random_uuid(), 'bebek-bakar', 'teh-manis'),    -- bakar → sweeter drink
  (gen_random_uuid(), 'bebek-bakar', 'sambal'),

  -- ── BEBEK PENYET ──────────────────────────────────────────────────────────
  (gen_random_uuid(), 'bebek-penyet', 'nasi-putih'),
  (gen_random_uuid(), 'bebek-penyet', 'lalapan'),
  (gen_random_uuid(), 'bebek-penyet', 'teh-tawar'),

  -- ── BURUNG DARA GORENG ────────────────────────────────────────────────────
  (gen_random_uuid(), 'burung-dara-goreng', 'nasi-putih'),
  (gen_random_uuid(), 'burung-dara-goreng', 'lalapan'),
  (gen_random_uuid(), 'burung-dara-goreng', 'teh-tawar'),

  -- ── BURUNG DARA BAKAR ─────────────────────────────────────────────────────
  (gen_random_uuid(), 'burung-dara-bakar', 'nasi-putih'),
  (gen_random_uuid(), 'burung-dara-bakar', 'lalapan'),
  (gen_random_uuid(), 'burung-dara-bakar', 'teh-manis'),

  -- ── AYAM GORENG ───────────────────────────────────────────────────────────
  (gen_random_uuid(), 'ayam-goreng', 'nasi-putih'),
  (gen_random_uuid(), 'ayam-goreng', 'lalapan'),
  (gen_random_uuid(), 'ayam-goreng', 'teh-tawar'),
  (gen_random_uuid(), 'ayam-goreng', 'sambal'),

  -- ── AYAM BAKAR ────────────────────────────────────────────────────────────
  (gen_random_uuid(), 'ayam-bakar', 'nasi-putih'),
  (gen_random_uuid(), 'ayam-bakar', 'lalapan'),
  (gen_random_uuid(), 'ayam-bakar', 'teh-manis'),

  -- ── AYAM POTONG GORENG ────────────────────────────────────────────────────
  (gen_random_uuid(), 'ayam-potong-goreng', 'nasi-putih'),
  (gen_random_uuid(), 'ayam-potong-goreng', 'lalapan'),
  (gen_random_uuid(), 'ayam-potong-goreng', 'teh-tawar'),

  -- ── AYAM POTONG BAKAR ─────────────────────────────────────────────────────
  (gen_random_uuid(), 'ayam-potong-bakar', 'nasi-putih'),
  (gen_random_uuid(), 'ayam-potong-bakar', 'lalapan'),
  (gen_random_uuid(), 'ayam-potong-bakar', 'teh-manis'),

  -- ── AYAM POTONG PENYET ────────────────────────────────────────────────────
  (gen_random_uuid(), 'ayam-potong-penyet', 'nasi-putih'),
  (gen_random_uuid(), 'ayam-potong-penyet', 'lalapan'),
  (gen_random_uuid(), 'ayam-potong-penyet', 'sambal'),  -- penyet implies spicy → more sambal

  -- ── EMPAL (SAPI) ──────────────────────────────────────────────────────────
  (gen_random_uuid(), 'empal', 'nasi-putih'),
  (gen_random_uuid(), 'empal', 'lalapan'),
  (gen_random_uuid(), 'empal', 'teh-manis'),

  -- ── IGA BAKAR (SAPI) ──────────────────────────────────────────────────────
  (gen_random_uuid(), 'iga-bakar', 'nasi-putih'),
  (gen_random_uuid(), 'iga-bakar', 'lalapan'),
  (gen_random_uuid(), 'iga-bakar', 'teh-manis'),
  (gen_random_uuid(), 'iga-bakar', 'ca-kangkung'),  -- iga bakar is premium → suggest veg side

  -- ── ISO (SAPI) ────────────────────────────────────────────────────────────
  (gen_random_uuid(), 'iso', 'nasi-putih'),
  (gen_random_uuid(), 'iso', 'teh-tawar'),

  -- ── BABAT (SAPI) ──────────────────────────────────────────────────────────
  (gen_random_uuid(), 'babat', 'nasi-putih'),
  (gen_random_uuid(), 'babat', 'teh-tawar'),

  -- ── PARU (SAPI) ───────────────────────────────────────────────────────────
  (gen_random_uuid(), 'paru', 'nasi-putih'),
  (gen_random_uuid(), 'paru', 'teh-tawar'),

  -- ── SOP IGA ───────────────────────────────────────────────────────────────
  -- Soto/sop traditionally comes with rice
  (gen_random_uuid(), 'sop-iga', 'nasi-putih'),
  (gen_random_uuid(), 'sop-iga', 'teh-tawar'),

  -- ── SOTO SULUNG DAGING ────────────────────────────────────────────────────
  (gen_random_uuid(), 'soto-sulung-daging', 'nasi-putih'),
  (gen_random_uuid(), 'soto-sulung-daging', 'teh-tawar'),

  -- ── SOTO SULUNG CAMPUR ────────────────────────────────────────────────────
  (gen_random_uuid(), 'soto-sulung-campur', 'nasi-putih'),
  (gen_random_uuid(), 'soto-sulung-campur', 'teh-tawar'),

  -- ── GURAMEH GORENG ────────────────────────────────────────────────────────
  -- Premium fish → suggest rice, veggie side, and ca-kangkung
  (gen_random_uuid(), 'gurameh-goreng', 'nasi-putih'),
  (gen_random_uuid(), 'gurameh-goreng', 'lalapan'),
  (gen_random_uuid(), 'gurameh-goreng', 'teh-tawar'),
  (gen_random_uuid(), 'gurameh-goreng', 'ca-kangkung'),

  -- ── GURAMEH BAKAR ─────────────────────────────────────────────────────────
  (gen_random_uuid(), 'gurameh-bakar', 'nasi-putih'),
  (gen_random_uuid(), 'gurameh-bakar', 'lalapan'),
  (gen_random_uuid(), 'gurameh-bakar', 'teh-manis'),
  (gen_random_uuid(), 'gurameh-bakar', 'ca-kangkung'),

  -- ── NILA GORENG ───────────────────────────────────────────────────────────
  (gen_random_uuid(), 'nila-goreng', 'nasi-putih'),
  (gen_random_uuid(), 'nila-goreng', 'lalapan'),
  (gen_random_uuid(), 'nila-goreng', 'teh-tawar'),

  -- ── NILA BAKAR ────────────────────────────────────────────────────────────
  (gen_random_uuid(), 'nila-bakar', 'nasi-putih'),
  (gen_random_uuid(), 'nila-bakar', 'lalapan'),
  (gen_random_uuid(), 'nila-bakar', 'teh-manis'),

  -- ── LELE GORENG ───────────────────────────────────────────────────────────
  (gen_random_uuid(), 'lele-goreng', 'nasi-putih'),
  (gen_random_uuid(), 'lele-goreng', 'lalapan'),
  (gen_random_uuid(), 'lele-goreng', 'teh-tawar'),
  (gen_random_uuid(), 'lele-goreng', 'sambal'),     -- lele penyet culture = extra sambal

  -- ── LELE BAKAR ────────────────────────────────────────────────────────────
  (gen_random_uuid(), 'lele-bakar', 'nasi-putih'),
  (gen_random_uuid(), 'lele-bakar', 'lalapan'),
  (gen_random_uuid(), 'lele-bakar', 'teh-manis'),

  -- ── NASI PUTIH ────────────────────────────────────────────────────────────
  -- Customer orders only rice → suggest protein, sides, and drink
  (gen_random_uuid(), 'nasi-putih', 'bebek-goreng'), -- hero product suggestion
  (gen_random_uuid(), 'nasi-putih', 'ayam-goreng'),
  (gen_random_uuid(), 'nasi-putih', 'lalapan'),
  (gen_random_uuid(), 'nasi-putih', 'teh-tawar'),

  -- ── NASI UDUK ─────────────────────────────────────────────────────────────
  -- Nasi uduk is more flavourful → still suggest protein sides
  (gen_random_uuid(), 'nasi-uduk', 'bebek-goreng'),
  (gen_random_uuid(), 'nasi-uduk', 'ayam-goreng'),
  (gen_random_uuid(), 'nasi-uduk', 'lalapan'),

  -- ── TEH TAWAR ─────────────────────────────────────────────────────────────
  -- Customer orders just a drink → suggest food
  (gen_random_uuid(), 'teh-tawar', 'bebek-goreng'),
  (gen_random_uuid(), 'teh-tawar', 'ayam-goreng'),
  (gen_random_uuid(), 'teh-tawar', 'nasi-putih'),

  -- ── TEH MANIS ─────────────────────────────────────────────────────────────
  (gen_random_uuid(), 'teh-manis', 'bebek-bakar'),
  (gen_random_uuid(), 'teh-manis', 'ayam-bakar'),
  (gen_random_uuid(), 'teh-manis', 'nasi-putih'),

  -- ── CENDOL ORIGINAL ───────────────────────────────────────────────────────
  -- Dessert cross-sells: cendol + tape susu is a popular pairing
  (gen_random_uuid(), 'cendol-original', 'tape-susu'),
  (gen_random_uuid(), 'cendol-original', 'teh-tawar'), -- cool drink to go with dessert

  -- ── JUS ALPUKAT ───────────────────────────────────────────────────────────
  -- Premium drink → cross-sell dessert
  (gen_random_uuid(), 'jus-alpukat', 'cendol-original'),
  (gen_random_uuid(), 'jus-alpukat', 'tape-susu'),

  -- ── LALAPAN ───────────────────────────────────────────────────────────────
  -- Side ordered alone → suggest main protein dishes
  (gen_random_uuid(), 'lalapan', 'bebek-goreng'),
  (gen_random_uuid(), 'lalapan', 'ayam-goreng')

ON CONFLICT ON CONSTRAINT uq_recommendation_pair DO NOTHING;

-- Verify
-- SELECT
--   mr.source_menu_id,
--   s.name AS source_name,
--   mr.target_menu_id,
--   t.name AS target_name
-- FROM menu_recommendation mr
-- JOIN menu s ON s.id = mr.source_menu_id
-- JOIN menu t ON t.id = mr.target_menu_id
-- ORDER BY mr.source_menu_id, mr.target_menu_id;

-- =============================================================================
-- END OF 005_seed_recommendations.sql
-- =============================================================================
