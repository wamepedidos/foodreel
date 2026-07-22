CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  table_id TEXT NOT NULL,
  table_number INTEGER NOT NULL,
  table_session_id TEXT NOT NULL,
  customer_session_id TEXT NOT NULL,
  order_number INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  items TEXT NOT NULL,
  subtotal REAL NOT NULL,
  upsell_total REAL NOT NULL,
  total REAL NOT NULL,
  customer_notes TEXT NOT NULL DEFAULT '',
  waiter_id TEXT,
  created_at TEXT NOT NULL,
  received_at TEXT,
  confirmed_at TEXT,
  preparation_started_at TEXT,
  ready_at TEXT,
  delivered_at TEXT,
  cancelled_at TEXT,
  cancellation_reason TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_idx ON orders (restaurant_id, idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS orders_number_idx ON orders (restaurant_id, order_number);
CREATE INDEX IF NOT EXISTS orders_restaurant_status_created_idx ON orders (restaurant_id, status, created_at);
CREATE INDEX IF NOT EXISTS orders_customer_session_idx ON orders (customer_session_id);
