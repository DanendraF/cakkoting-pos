-- =============================================================================
-- FILE: 001_schema.sql
-- PROJECT: Cak Koting QR Self-Order System
-- DESC: Creates all tables, enums, and indexes. Fully idempotent.
-- RUN: First — before any seed files.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending',
    'paid',
    'processing',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending',
    'settlement',
    'expire',
    'cancel',
    'deny',
    'failure'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- TABLE: restaurant_table
-- DESC: Physical tables in the restaurant. Each has a unique table number.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS restaurant_table (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  number     INTEGER     NOT NULL UNIQUE,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  restaurant_table            IS 'Physical dine-in tables at Rumah Makan Cak Koting';
COMMENT ON COLUMN restaurant_table.number     IS 'Human-readable table number shown on the QR code';
COMMENT ON COLUMN restaurant_table.is_active  IS 'Whether this table is currently in use / visible to customers';

-- ---------------------------------------------------------------------------
-- TABLE: category
-- DESC: Menu category (e.g., Bebek, Ayam, Minuman, etc.)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS category (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL UNIQUE,
  display_order INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  category               IS 'Menu categories shown in the ordering UI';
COMMENT ON COLUMN category.display_order IS 'Sort order for category tabs in the UI (ascending)';

-- ---------------------------------------------------------------------------
-- TABLE: menu
-- DESC: Individual menu items. ID is a human-readable slug (e.g. bebek-goreng).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS menu (
  id           TEXT        PRIMARY KEY,             -- slug, e.g. 'bebek-goreng'
  name         TEXT        NOT NULL,
  price        INTEGER     NOT NULL,                -- in IDR (no decimal)
  description  TEXT        NOT NULL DEFAULT '',
  is_available BOOLEAN     NOT NULL DEFAULT TRUE,
  category_id  UUID        NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  menu              IS 'All orderable menu items';
COMMENT ON COLUMN menu.id           IS 'URL-safe slug used as primary key, e.g. bebek-goreng';
COMMENT ON COLUMN menu.price        IS 'Base price in IDR (integer, no cents)';
COMMENT ON COLUMN menu.description  IS 'Optional short description displayed under item name';
COMMENT ON COLUMN menu.is_available IS 'Toggle to hide item without deleting it';

CREATE INDEX IF NOT EXISTS idx_menu_category_id  ON menu(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_is_available ON menu(is_available);

-- ---------------------------------------------------------------------------
-- TABLE: menu_option_group
-- DESC: A group of options for a menu item (e.g., "Pilihan Sambal").
--       required=true means customer must pick at least one.
--       allow_multiple=true means customer can pick more than one option.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS menu_option_group (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT    NOT NULL,
  required       BOOLEAN NOT NULL DEFAULT FALSE,
  allow_multiple BOOLEAN NOT NULL DEFAULT FALSE,
  display_order  INTEGER NOT NULL DEFAULT 0,
  menu_id        TEXT    NOT NULL REFERENCES menu(id) ON DELETE CASCADE
);

COMMENT ON TABLE  menu_option_group                IS 'Groups of selectable options belonging to a menu item';
COMMENT ON COLUMN menu_option_group.required       IS 'Customer must select at least one option from this group';
COMMENT ON COLUMN menu_option_group.allow_multiple IS 'Customer may select more than one option from this group';
COMMENT ON COLUMN menu_option_group.display_order  IS 'Sort order of option groups within the menu item';

CREATE INDEX IF NOT EXISTS idx_menu_option_group_menu_id ON menu_option_group(menu_id);

-- ---------------------------------------------------------------------------
-- TABLE: menu_option
-- DESC: Individual selectable option within an option group.
--       price_adjustment is added to (or subtracted from) the base item price.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS menu_option (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT    NOT NULL,
  price_adjustment INTEGER NOT NULL DEFAULT 0,   -- can be negative for discounts
  group_id         UUID    NOT NULL REFERENCES menu_option_group(id) ON DELETE CASCADE
);

COMMENT ON TABLE  menu_option                    IS 'Individual options within an option group (e.g. Sambal Terasi)';
COMMENT ON COLUMN menu_option.price_adjustment   IS 'Delta price in IDR added to base price when this option is chosen';

CREATE INDEX IF NOT EXISTS idx_menu_option_group_id ON menu_option(group_id);

-- ---------------------------------------------------------------------------
-- TABLE: menu_recommendation
-- DESC: Directional upselling pairs. source -> target means:
--       "when customer orders source, suggest target."
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS menu_recommendation (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_menu_id TEXT NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
  target_menu_id TEXT NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
  CONSTRAINT uq_recommendation_pair UNIQUE (source_menu_id, target_menu_id),
  CONSTRAINT chk_no_self_recommendation CHECK (source_menu_id <> target_menu_id)
);

COMMENT ON TABLE  menu_recommendation                IS 'Upselling pairs: ordering source → suggest target';
COMMENT ON COLUMN menu_recommendation.source_menu_id IS 'The item that was ordered / added to cart';
COMMENT ON COLUMN menu_recommendation.target_menu_id IS 'The item suggested as a complementary add-on';

CREATE INDEX IF NOT EXISTS idx_menu_recommendation_source ON menu_recommendation(source_menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_recommendation_target ON menu_recommendation(target_menu_id);

-- ---------------------------------------------------------------------------
-- TABLE: order
-- DESC: A customer's order session, linked to a restaurant table.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "order" (
  id                TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  table_id          UUID        NOT NULL REFERENCES restaurant_table(id) ON DELETE RESTRICT,
  customer_name     TEXT        NOT NULL DEFAULT '',
  status            order_status NOT NULL DEFAULT 'pending',
  total             INTEGER     NOT NULL DEFAULT 0,           -- sum of all items in IDR
  snap_token        TEXT,                                     -- Midtrans Snap payment token
  snap_redirect_url TEXT,                                     -- Midtrans Snap redirect URL
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  "order"                   IS 'Customer order sessions. One per table visit.';
COMMENT ON COLUMN "order".total             IS 'Cached total in IDR; recomputed when items change';
COMMENT ON COLUMN "order".snap_token        IS 'Midtrans Snap token, populated after payment initiation';
COMMENT ON COLUMN "order".snap_redirect_url IS 'Midtrans hosted payment page URL';

CREATE INDEX IF NOT EXISTS idx_order_table_id  ON "order"(table_id);
CREATE INDEX IF NOT EXISTS idx_order_status    ON "order"(status);
CREATE INDEX IF NOT EXISTS idx_order_created_at ON "order"(created_at DESC);

-- ---------------------------------------------------------------------------
-- TABLE: order_item
-- DESC: A single menu item line within an order.
--       name and price_at_order are denormalized snapshots (menu may change later).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS order_item (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        TEXT    NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  menu_id         TEXT    NOT NULL REFERENCES menu(id) ON DELETE RESTRICT,
  name            TEXT    NOT NULL,                  -- snapshot of menu.name at order time
  qty             INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
  price_at_order  INTEGER NOT NULL,                  -- snapshot of effective price (base + options)
  note            TEXT    NOT NULL DEFAULT ''
);

COMMENT ON TABLE  order_item                 IS 'Line items belonging to an order';
COMMENT ON COLUMN order_item.name            IS 'Snapshot of menu name at time of order (immutable)';
COMMENT ON COLUMN order_item.price_at_order  IS 'Effective unit price including option adjustments at order time';
COMMENT ON COLUMN order_item.note            IS 'Free-text note from customer (e.g. "tanpa pedas")';

CREATE INDEX IF NOT EXISTS idx_order_item_order_id ON order_item(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_menu_id  ON order_item(menu_id);

-- ---------------------------------------------------------------------------
-- TABLE: order_item_option
-- DESC: Selected options for an order_item (snapshot of chosen menu_option rows).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS order_item_option (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id    UUID    NOT NULL REFERENCES order_item(id) ON DELETE CASCADE,
  group_name       TEXT    NOT NULL,    -- snapshot of menu_option_group.name
  option_name      TEXT    NOT NULL,    -- snapshot of menu_option.name
  price_adjustment INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE  order_item_option                IS 'Snapshot of selected options for each order line item';
COMMENT ON COLUMN order_item_option.group_name     IS 'Snapshot of group name at order time';
COMMENT ON COLUMN order_item_option.option_name    IS 'Snapshot of option name at order time';

CREATE INDEX IF NOT EXISTS idx_order_item_option_item_id ON order_item_option(order_item_id);

-- ---------------------------------------------------------------------------
-- TABLE: payment
-- DESC: Payment record for an order. One-to-one with order.
--       Stores Midtrans transaction details and raw webhook payload.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payment (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            TEXT         NOT NULL UNIQUE REFERENCES "order"(id) ON DELETE RESTRICT,
  midtrans_order_id   TEXT         UNIQUE,             -- order ID sent to Midtrans (may differ from our order.id)
  status              payment_status NOT NULL DEFAULT 'pending',
  gross_amount        INTEGER      NOT NULL DEFAULT 0, -- total charged in IDR
  payment_type        TEXT,                            -- e.g. 'bank_transfer', 'qris', 'gopay'
  transaction_id      TEXT,                            -- Midtrans transaction_id
  transaction_time    TIMESTAMPTZ,
  raw_notification    JSONB,                           -- full raw webhook body from Midtrans
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  payment                       IS 'Payment records linked to orders via Midtrans';
COMMENT ON COLUMN payment.midtrans_order_id     IS 'The order_id string sent to Midtrans (format: CKOTING-<uuid>)';
COMMENT ON COLUMN payment.raw_notification      IS 'Full JSON body of the latest Midtrans webhook notification';
COMMENT ON COLUMN payment.payment_type          IS 'Payment method chosen by customer (qris, gopay, bank_transfer, etc.)';

CREATE INDEX IF NOT EXISTS idx_payment_order_id          ON payment(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_midtrans_order_id ON payment(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_status            ON payment(status);

-- =============================================================================
-- END OF 001_schema.sql
-- =============================================================================
