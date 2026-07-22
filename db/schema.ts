export const ordersTableSql = `
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
)`;

export const orderIndexesSql = [
  'CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_idx ON orders (restaurant_id, idempotency_key)',
  'CREATE UNIQUE INDEX IF NOT EXISTS orders_number_idx ON orders (restaurant_id, order_number)',
  'CREATE INDEX IF NOT EXISTS orders_restaurant_status_created_idx ON orders (restaurant_id, status, created_at)',
  'CREATE INDEX IF NOT EXISTS orders_customer_session_idx ON orders (customer_session_id)'
];

export const experiencePostsTableSql = `
CREATE TABLE IF NOT EXISTS experience_posts (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  table_session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_photo TEXT,
  media_url TEXT,
  media_type TEXT,
  text TEXT NOT NULL DEFAULT '',
  dish_id TEXT,
  dish_name TEXT,
  dish_image TEXT,
  order_id TEXT,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

export const experiencePostIndexesSql = [
  'CREATE UNIQUE INDEX IF NOT EXISTS experience_posts_idempotency_idx ON experience_posts (restaurant_id, idempotency_key)',
  'CREATE INDEX IF NOT EXISTS experience_posts_status_created_idx ON experience_posts (restaurant_id, status, created_at)',
  'CREATE INDEX IF NOT EXISTS experience_posts_user_idx ON experience_posts (user_id)'
];

export const experiencePostLikesTableSql = `
CREATE TABLE IF NOT EXISTS experience_post_likes (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id)
)`;

export const experiencePostViewsTableSql = `
CREATE TABLE IF NOT EXISTS experience_post_views (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id)
)`;

export const experienceCommentsTableSql = `
CREATE TABLE IF NOT EXISTS experience_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  parent_id TEXT,
  created_at TEXT NOT NULL
)`;

export const experienceCommentIndexesSql = [
  'CREATE INDEX IF NOT EXISTS experience_comments_post_created_idx ON experience_comments (post_id, created_at)'
];

export const dishesTableSql = `
CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  main_image_url TEXT NOT NULL DEFAULT '',
  gallery TEXT NOT NULL DEFAULT '[]',
  video_url TEXT NOT NULL DEFAULT '',
  video_thumbnail_url TEXT NOT NULL DEFAULT '',
  serving_sizes TEXT NOT NULL DEFAULT '[]',
  serving_description TEXT NOT NULL DEFAULT '',
  spicy_level INTEGER NOT NULL DEFAULT 0,
  is_vegan INTEGER NOT NULL DEFAULT 0,
  is_vegetarian INTEGER NOT NULL DEFAULT 0,
  is_gluten_free INTEGER NOT NULL DEFAULT 0,
  sauces TEXT NOT NULL DEFAULT '[]',
  sauce_selection_required INTEGER NOT NULL DEFAULT 0,
  minimum_sauces INTEGER NOT NULL DEFAULT 0,
  maximum_sauces INTEGER NOT NULL DEFAULT 1,
  features TEXT NOT NULL DEFAULT '[]',
  ingredients TEXT NOT NULL DEFAULT '[]',
  allergens TEXT NOT NULL DEFAULT '[]',
  dietary_notes TEXT NOT NULL DEFAULT '',
  cross_contamination_warning TEXT NOT NULL DEFAULT '',
  preparation_time_min INTEGER,
  preparation_time_max INTEGER,
  likes_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  added_to_order_count INTEGER NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  customer_posts_count INTEGER NOT NULL DEFAULT 0,
  sold_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

export const dishIndexesSql = [
  'CREATE INDEX IF NOT EXISTS dishes_restaurant_status_sort_idx ON dishes (restaurant_id, status, sort_order)',
  'CREATE INDEX IF NOT EXISTS dishes_restaurant_category_idx ON dishes (restaurant_id, category_id)'
];

export const employeesTableSql = `
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  photo_url TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  temporary_password TEXT NOT NULL DEFAULT '',
  invitation_sent INTEGER NOT NULL DEFAULT 0,
  notifications_enabled INTEGER NOT NULL DEFAULT 0,
  push_subscription_id TEXT NOT NULL DEFAULT '',
  device_tokens TEXT NOT NULL DEFAULT '[]',
  last_notification_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_access_at TEXT
)`;

export const employeeIndexesSql = [
  'CREATE UNIQUE INDEX IF NOT EXISTS employees_restaurant_email_idx ON employees (restaurant_id, email)',
  'CREATE INDEX IF NOT EXISTS employees_restaurant_role_status_idx ON employees (restaurant_id, role, status)'
];

export const restaurantMetricsTableSql = `
CREATE TABLE IF NOT EXISTS restaurant_metrics (
  restaurant_id TEXT PRIMARY KEY,
  menu_shares_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
)`;
