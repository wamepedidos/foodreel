const IMMUTABLE_ASSET = /\.[a-z0-9]+$/i;
const ORDER_STATUSES = [
  "new",
  "received",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "account_requested",
  "paid",
  "cancelled",
];
const ORDER_TRANSITIONS = {
  new: ["received", "confirmed", "cancelled"],
  received: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered", "account_requested"],
  delivered: ["account_requested", "paid"],
  account_requested: ["paid"],
  paid: [],
  cancelled: [],
};
const ACTIVE_STAFF_STATUSES = ["new", "received", "confirmed", "preparing", "ready", "delivered", "account_requested"];
const orderStreams = new Map();
const restaurantStreams = new Map();
const experiencePostStreams = new Map();
const experienceCommentStreams = new Map();

function withCacheHeaders(response) {
  const headers = new Headers(response.headers);
  if (!headers.has("cache-control")) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function error(message, status = 400) {
  return json({ error: message }, status);
}

async function ensureSchema(env) {
  if (!env.DB) {
    throw new Error("D1 binding DB is not available.");
  }

  const d1 = env.DB;
  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS orders (
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
    )`),
    d1.prepare("CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_idx ON orders (restaurant_id, idempotency_key)"),
    d1.prepare("CREATE UNIQUE INDEX IF NOT EXISTS orders_number_idx ON orders (restaurant_id, order_number)"),
    d1.prepare("CREATE INDEX IF NOT EXISTS orders_restaurant_status_created_idx ON orders (restaurant_id, status, created_at)"),
    d1.prepare("CREATE INDEX IF NOT EXISTS orders_customer_session_idx ON orders (customer_session_id)"),
    d1.prepare(`CREATE TABLE IF NOT EXISTS experience_posts (
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
    )`),
    d1.prepare("CREATE UNIQUE INDEX IF NOT EXISTS experience_posts_idempotency_idx ON experience_posts (restaurant_id, idempotency_key)"),
    d1.prepare("CREATE INDEX IF NOT EXISTS experience_posts_status_created_idx ON experience_posts (restaurant_id, status, created_at)"),
    d1.prepare("CREATE INDEX IF NOT EXISTS experience_posts_user_idx ON experience_posts (user_id)"),
    d1.prepare(`CREATE TABLE IF NOT EXISTS experience_post_likes (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id)
    )`),
    d1.prepare(`CREATE TABLE IF NOT EXISTS experience_post_views (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id)
    )`),
    d1.prepare(`CREATE TABLE IF NOT EXISTS experience_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      text TEXT NOT NULL,
      parent_id TEXT,
      created_at TEXT NOT NULL
    )`),
    d1.prepare("CREATE INDEX IF NOT EXISTS experience_comments_post_created_idx ON experience_comments (post_id, created_at)"),
  ]);
}

function rowToOrder(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    tableId: row.table_id,
    tableNumber: row.table_number,
    tableSessionId: row.table_session_id,
    customerSessionId: row.customer_session_id,
    orderNumber: row.order_number,
    idempotencyKey: row.idempotency_key,
    source: row.source,
    status: row.status,
    items: JSON.parse(row.items),
    subtotal: row.subtotal,
    upsellTotal: row.upsell_total,
    total: row.total,
    customerNotes: row.customer_notes,
    waiterId: row.waiter_id,
    createdAt: row.created_at,
    receivedAt: row.received_at,
    confirmedAt: row.confirmed_at,
    preparationStartedAt: row.preparation_started_at,
    readyAt: row.ready_at,
    deliveredAt: row.delivered_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
  };
}

function rowToExperiencePost(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    tableSessionId: row.table_session_id,
    userId: row.user_id,
    userName: row.user_name,
    userPhoto: row.user_photo,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    text: row.text,
    dishId: row.dish_id,
    dishName: row.dish_name,
    dishImage: row.dish_image,
    orderId: row.order_id,
    status: row.status,
    likesCount: row.likes_count,
    viewsCount: row.views_count,
    commentsCount: row.comments_count,
    sharesCount: row.shares_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToExperienceComment(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    experiencePostId: row.post_id,
    userId: row.user_id,
    userName: row.user_name,
    text: row.text,
    parentId: row.parent_id,
    createdAt: row.created_at,
  };
}

function isLocalRequest(url) {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

function hasStaffPreviewAccess(request, env, url) {
  if (isLocalRequest(url)) {
    return true;
  }

  const configuredToken = env.STAFF_PREVIEW_TOKEN;
  if (configuredToken) {
    return request.headers.get("x-staff-preview-token") === configuredToken || url.searchParams.get("token") === configuredToken;
  }

  return env.ENABLE_STAFF_PREVIEW === "true" && url.searchParams.get("staffPreview") === "1";
}

function customerCanRead(order, url) {
  return order.customerSessionId === url.searchParams.get("customerSessionId");
}

function validateCreateOrder(input) {
  const requiredText = ["restaurantId", "tableId", "tableSessionId", "customerSessionId", "idempotencyKey"];
  for (const key of requiredText) {
    if (!input[key] || typeof input[key] !== "string") {
      return `${key} is required.`;
    }
  }

  if (input.source !== "customer_pwa") {
    return "Invalid order source.";
  }

  if (!Number.isFinite(input.tableNumber) || input.tableNumber <= 0) {
    return "tableNumber is required.";
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return "Order must include at least one item.";
  }

  for (const item of input.items) {
    if (!item.dishId || !item.name || !Number.isFinite(item.quantity) || !Number.isFinite(item.unitPrice)) {
      return "Every item must include dishId, name, quantity and unitPrice.";
    }
  }

  return "";
}

async function getOrderRow(env, orderId) {
  return env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
}

async function getOrderById(env, orderId) {
  return rowToOrder(await getOrderRow(env, orderId));
}

async function getRestaurantOrders(env, restaurantId) {
  const placeholders = ACTIVE_STAFF_STATUSES.map(() => "?").join(", ");
  const result = await env.DB.prepare(
    `SELECT * FROM orders WHERE restaurant_id = ? AND status IN (${placeholders}) ORDER BY created_at DESC LIMIT 100`
  )
    .bind(restaurantId, ...ACTIVE_STAFF_STATUSES)
    .all();
  return result.results.map(rowToOrder);
}

function addStream(map, key, request, initialPayload) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const client = { writer, heartbeat: 0 };
  const clients = map.get(key) ?? new Set();
  clients.add(client);
  map.set(key, clients);

  const send = (payload) => writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)).catch(() => cleanup());
  const cleanup = () => {
    clearInterval(client.heartbeat);
    clients.delete(client);
    if (!clients.size) {
      map.delete(key);
    }
    writer.close().catch(() => undefined);
  };

  send(initialPayload);
  client.heartbeat = setInterval(() => writer.write(encoder.encode(": ping\n\n")).catch(() => cleanup()), 25000);
  request.signal?.addEventListener("abort", cleanup, { once: true });

  return new Response(stream.readable, {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/event-stream; charset=utf-8",
      connection: "keep-alive",
    },
  });
}

function broadcast(map, key, payload) {
  const clients = map.get(key);
  if (!clients) {
    return;
  }

  const encoder = new TextEncoder();
  for (const client of clients) {
    client.writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)).catch(() => clients.delete(client));
  }
}

async function broadcastOrderChange(env, order) {
  broadcast(orderStreams, order.id, order);
  broadcast(restaurantStreams, order.restaurantId, await getRestaurantOrders(env, order.restaurantId));
}

async function getExperiencePostById(env, postId) {
  return rowToExperiencePost(await env.DB.prepare("SELECT * FROM experience_posts WHERE id = ?").bind(postId).first());
}

async function getExperienceComments(env, postId) {
  const result = await env.DB.prepare("SELECT * FROM experience_comments WHERE post_id = ? ORDER BY created_at ASC LIMIT 200").bind(postId).all();
  return result.results.map(rowToExperienceComment);
}

function canReadExperiencePost(post, userId) {
  return post.status === "approved" || post.userId === userId;
}

async function broadcastExperiencePostChange(env, postId) {
  const post = await getExperiencePostById(env, postId);
  broadcast(experiencePostStreams, postId, post);
  return post;
}

async function broadcastExperienceCommentsChange(env, postId) {
  const comments = await getExperienceComments(env, postId);
  broadcast(experienceCommentStreams, postId, comments);
  return comments;
}

function validateCreateExperiencePost(input) {
  const requiredText = ["restaurantId", "tableSessionId", "userId", "userName", "idempotencyKey"];
  for (const key of requiredText) {
    if (!input[key] || typeof input[key] !== "string") {
      return `${key} is required.`;
    }
  }

  if (!String(input.text ?? "").trim() && !input.mediaUrl) {
    return "Experience post must include text or media.";
  }

  if (String(input.text ?? "").length > 300) {
    return "Experience text cannot exceed 300 characters.";
  }

  if (input.mediaUrl && input.mediaType !== "image") {
    return "Only images are supported.";
  }

  return "";
}

async function createExperiencePost(request, env) {
  const input = await request.json();
  const validationError = validateCreateExperiencePost(input);
  if (validationError) {
    return error(validationError);
  }

  const existing = await env.DB.prepare("SELECT * FROM experience_posts WHERE restaurant_id = ? AND idempotency_key = ?")
    .bind(input.restaurantId, input.idempotencyKey)
    .first();

  if (existing) {
    return json(rowToExperiencePost(existing));
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO experience_posts (
      id, restaurant_id, table_session_id, user_id, user_name, user_photo, media_url, media_type, text,
      dish_id, dish_name, dish_image, order_id, idempotency_key, status, likes_count, views_count,
      comments_count, shares_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      input.restaurantId,
      input.tableSessionId,
      input.userId,
      String(input.userName).slice(0, 80),
      input.userPhoto ?? null,
      input.mediaUrl ?? null,
      input.mediaUrl ? "image" : null,
      String(input.text ?? "").replace(/\s+/g, " ").trim(),
      input.dishId ?? null,
      input.dishName ?? null,
      input.dishImage ?? null,
      input.orderId ?? null,
      input.idempotencyKey,
      "pending",
      0,
      0,
      0,
      0,
      now,
      now
    )
    .run();

  return json(await getExperiencePostById(env, id), 201);
}

async function likeExperiencePost(request, env, postId) {
  const body = await request.json().catch(() => ({}));
  const userId = String(body.userId ?? "");
  const liked = Boolean(body.liked);
  if (!userId) {
    return error("userId is required.");
  }

  const post = await getExperiencePostById(env, postId);
  if (!post) {
    return error("Experience post not found.", 404);
  }
  if (post.status !== "approved") {
    return error("Experience post is not approved.", 409);
  }

  const now = new Date().toISOString();
  if (liked) {
    const result = await env.DB.prepare("INSERT OR IGNORE INTO experience_post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)")
      .bind(postId, userId, now)
      .run();
    if (result.meta.changes > 0) {
      await env.DB.prepare("UPDATE experience_posts SET likes_count = likes_count + 1, updated_at = ? WHERE id = ?").bind(now, postId).run();
    }
  } else {
    const result = await env.DB.prepare("DELETE FROM experience_post_likes WHERE post_id = ? AND user_id = ?").bind(postId, userId).run();
    if (result.meta.changes > 0) {
      await env.DB.prepare("UPDATE experience_posts SET likes_count = MAX(0, likes_count - 1), updated_at = ? WHERE id = ?").bind(now, postId).run();
    }
  }

  return json(await broadcastExperiencePostChange(env, postId));
}

async function registerExperienceView(request, env, postId) {
  const body = await request.json().catch(() => ({}));
  const userId = String(body.userId ?? "");
  if (!userId) {
    return error("userId is required.");
  }

  const post = await getExperiencePostById(env, postId);
  if (!post) {
    return error("Experience post not found.", 404);
  }
  if (post.status !== "approved") {
    return error("Experience post is not approved.", 409);
  }

  const now = new Date().toISOString();
  const result = await env.DB.prepare("INSERT OR IGNORE INTO experience_post_views (post_id, user_id, created_at) VALUES (?, ?, ?)")
    .bind(postId, userId, now)
    .run();
  if (result.meta.changes > 0) {
    await env.DB.prepare("UPDATE experience_posts SET views_count = views_count + 1, updated_at = ? WHERE id = ?").bind(now, postId).run();
  }

  return json(await broadcastExperiencePostChange(env, postId));
}

async function shareExperiencePost(env, postId) {
  const post = await getExperiencePostById(env, postId);
  if (!post) {
    return error("Experience post not found.", 404);
  }
  const now = new Date().toISOString();
  await env.DB.prepare("UPDATE experience_posts SET shares_count = shares_count + 1, updated_at = ? WHERE id = ?").bind(now, postId).run();
  return json(await broadcastExperiencePostChange(env, postId));
}

async function createExperienceComment(request, env, postId) {
  const body = await request.json().catch(() => ({}));
  const post = await getExperiencePostById(env, postId);
  if (!post) {
    return error("Experience post not found.", 404);
  }
  if (post.status !== "approved") {
    return error("Experience post is not approved.", 409);
  }

  const text = String(body.text ?? "").replace(/\s+/g, " ").trim();
  if (!body.userId || !body.userName || !text) {
    return error("userId, userName and text are required.");
  }
  if (text.length > 240) {
    return error("Comment is too long.");
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO experience_comments (id, post_id, user_id, user_name, text, parent_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, postId, String(body.userId), String(body.userName).slice(0, 80), text, body.parentId ?? null, now)
    .run();
  await env.DB.prepare("UPDATE experience_posts SET comments_count = comments_count + 1, updated_at = ? WHERE id = ?").bind(now, postId).run();
  await broadcastExperienceCommentsChange(env, postId);
  await broadcastExperiencePostChange(env, postId);
  return json(rowToExperienceComment(await env.DB.prepare("SELECT * FROM experience_comments WHERE id = ?").bind(id).first()), 201);
}

async function createOrder(request, env) {
  const input = await request.json();
  const validationError = validateCreateOrder(input);
  if (validationError) {
    return error(validationError);
  }

  const existing = await env.DB.prepare("SELECT * FROM orders WHERE restaurant_id = ? AND idempotency_key = ?")
    .bind(input.restaurantId, input.idempotencyKey)
    .first();

  if (existing) {
    return json(rowToOrder(existing));
  }

  const now = new Date().toISOString();
  const items = input.items.map((item) => ({
    dishId: String(item.dishId),
    name: String(item.name),
    image: String(item.image ?? ""),
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    selectedOptions: Array.isArray(item.selectedOptions) ? item.selectedOptions : [],
    selectedExtras: Array.isArray(item.selectedExtras) ? item.selectedExtras : [],
    notes: String(item.notes ?? ""),
    subtotal: Number(item.subtotal),
  }));

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const maxRow = await env.DB.prepare("SELECT COALESCE(MAX(order_number), 0) AS max_number FROM orders WHERE restaurant_id = ?")
      .bind(input.restaurantId)
      .first();
    const orderNumber = Number(maxRow?.max_number ?? 0) + 1;
    const id = crypto.randomUUID();

    try {
      await env.DB.prepare(
        `INSERT INTO orders (
          id, restaurant_id, table_id, table_number, table_session_id, customer_session_id, order_number,
          idempotency_key, source, status, items, subtotal, upsell_total, total, customer_notes, waiter_id,
          created_at, received_at, confirmed_at, preparation_started_at, ready_at, delivered_at, cancelled_at, cancellation_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          input.restaurantId,
          input.tableId,
          Number(input.tableNumber),
          input.tableSessionId,
          input.customerSessionId,
          orderNumber,
          input.idempotencyKey,
          "customer_pwa",
          "new",
          JSON.stringify(items),
          Number(input.subtotal),
          Number(input.upsellTotal ?? 0),
          Number(input.total),
          String(input.customerNotes ?? ""),
          null,
          now,
          null,
          null,
          null,
          null,
          null,
          null,
          null
        )
        .run();

      const order = await getOrderById(env, id);
      await broadcastOrderChange(env, order);
      return json(order, 201);
    } catch (caughtError) {
      const duplicate = await env.DB.prepare("SELECT * FROM orders WHERE restaurant_id = ? AND idempotency_key = ?")
        .bind(input.restaurantId, input.idempotencyKey)
        .first();
      if (duplicate) {
        return json(rowToOrder(duplicate));
      }

      if (attempt === 2) {
        throw caughtError;
      }
    }
  }

  return error("Could not create order.", 500);
}

async function updateOrderStatus(request, env, orderId) {
  const body = await request.json();
  const nextStatus = body.status;
  if (!ORDER_STATUSES.includes(nextStatus)) {
    return error("Invalid order status.");
  }

  const current = await getOrderById(env, orderId);
  if (!current) {
    return error("Order not found.", 404);
  }

  if (!ORDER_TRANSITIONS[current.status].includes(nextStatus)) {
    return error("Order status transition is not allowed.", 409);
  }

  const now = new Date().toISOString();
  const updates = ["status = ?"];
  const values = [nextStatus];
  const addTimestamp = (column) => {
    updates.push(`${column} = COALESCE(${column}, ?)`);
    values.push(now);
  };

  if (nextStatus === "received" || (nextStatus === "confirmed" && !current.receivedAt)) {
    addTimestamp("received_at");
  }
  if (nextStatus === "confirmed") {
    addTimestamp("confirmed_at");
  }
  if (nextStatus === "preparing") {
    addTimestamp("preparation_started_at");
  }
  if (nextStatus === "ready") {
    addTimestamp("ready_at");
  }
  if (nextStatus === "delivered") {
    addTimestamp("delivered_at");
  }
  if (nextStatus === "cancelled") {
    addTimestamp("cancelled_at");
  }

  await env.DB.prepare(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`).bind(...values, orderId).run();
  const order = await getOrderById(env, orderId);
  await broadcastOrderChange(env, order);
  return json(order);
}

async function assignWaiter(request, env, orderId) {
  const body = await request.json();
  if (!body.waiterId || typeof body.waiterId !== "string") {
    return error("waiterId is required.");
  }

  await env.DB.prepare("UPDATE orders SET waiter_id = ? WHERE id = ?").bind(body.waiterId, orderId).run();
  const order = await getOrderById(env, orderId);
  if (!order) {
    return error("Order not found.", 404);
  }

  await broadcastOrderChange(env, order);
  return json(order);
}

async function cancelOrder(request, env, orderId, hasStaffAccess, url) {
  const body = await request.json().catch(() => ({}));
  const order = await getOrderById(env, orderId);
  if (!order) {
    return error("Order not found.", 404);
  }

  if (!hasStaffAccess && order.customerSessionId !== body.customerSessionId && !customerCanRead(order, url)) {
    return error("Not allowed.", 403);
  }

  if (!ORDER_TRANSITIONS[order.status].includes("cancelled")) {
    return error("Order cannot be cancelled from its current status.", 409);
  }

  const now = new Date().toISOString();
  await env.DB.prepare("UPDATE orders SET status = ?, cancelled_at = COALESCE(cancelled_at, ?), cancellation_reason = ? WHERE id = ?")
    .bind("cancelled", now, String(body.reason ?? ""), orderId)
    .run();

  const updated = await getOrderById(env, orderId);
  await broadcastOrderChange(env, updated);
  return json(updated);
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const hasStaffAccess = hasStaffPreviewAccess(request, env, url);

  try {
    await ensureSchema(env);

    if (request.method === "POST" && parts[0] === "api" && parts[1] === "orders" && parts.length === 2) {
      return createOrder(request, env);
    }

    if (request.method === "POST" && parts[0] === "api" && parts[1] === "experience-posts" && parts.length === 2) {
      return createExperiencePost(request, env);
    }

    if (parts[0] === "api" && parts[1] === "experience-posts" && parts[2]) {
      const postId = parts[2];

      if (request.method === "GET" && parts.length === 3) {
        const post = await getExperiencePostById(env, postId);
        if (!post) {
          return error("Experience post not found.", 404);
        }
        if (!canReadExperiencePost(post, url.searchParams.get("userId"))) {
          return error("Not allowed.", 403);
        }
        return json(post);
      }

      if (request.method === "GET" && parts[3] === "events") {
        const post = await getExperiencePostById(env, postId);
        if (!post) {
          return error("Experience post not found.", 404);
        }
        if (!canReadExperiencePost(post, url.searchParams.get("userId"))) {
          return error("Not allowed.", 403);
        }
        return addStream(experiencePostStreams, postId, request, post);
      }

      if (request.method === "POST" && parts[3] === "like") {
        return likeExperiencePost(request, env, postId);
      }

      if (request.method === "POST" && parts[3] === "view") {
        return registerExperienceView(request, env, postId);
      }

      if (request.method === "POST" && parts[3] === "share") {
        return shareExperiencePost(env, postId);
      }

      if (request.method === "GET" && parts[3] === "comments" && parts[4] === "events") {
        return addStream(experienceCommentStreams, postId, request, await getExperienceComments(env, postId));
      }

      if (request.method === "POST" && parts[3] === "comments") {
        return createExperienceComment(request, env, postId);
      }
    }

    if (parts[0] === "api" && parts[1] === "orders" && parts[2]) {
      const orderId = parts[2];

      if (request.method === "GET" && parts.length === 3) {
        const order = await getOrderById(env, orderId);
        if (!order) {
          return error("Order not found.", 404);
        }
        if (!hasStaffAccess && !customerCanRead(order, url)) {
          return error("Not allowed.", 403);
        }
        return json(order);
      }

      if (request.method === "GET" && parts[3] === "events") {
        const order = await getOrderById(env, orderId);
        if (!order) {
          return error("Order not found.", 404);
        }
        if (!hasStaffAccess && !customerCanRead(order, url)) {
          return error("Not allowed.", 403);
        }
        return addStream(orderStreams, orderId, request, order);
      }

      if (request.method === "PATCH" && parts[3] === "status") {
        if (!hasStaffAccess) {
          return error("Staff preview access is disabled.", 403);
        }
        return updateOrderStatus(request, env, orderId);
      }

      if (request.method === "PATCH" && parts[3] === "waiter") {
        if (!hasStaffAccess) {
          return error("Staff preview access is disabled.", 403);
        }
        return assignWaiter(request, env, orderId);
      }

      if (request.method === "PATCH" && parts[3] === "cancel") {
        return cancelOrder(request, env, orderId, hasStaffAccess, url);
      }
    }

    if (parts[0] === "api" && parts[1] === "restaurants" && parts[2] && parts[3] === "orders") {
      if (request.method === "GET" && parts.length === 4 && url.searchParams.get("tableSessionId")) {
        const result = await env.DB.prepare(
          "SELECT * FROM orders WHERE restaurant_id = ? AND table_session_id = ? ORDER BY created_at DESC LIMIT 100"
        )
          .bind(parts[2], url.searchParams.get("tableSessionId"))
          .all();
        return json(result.results.map(rowToOrder));
      }

      if (!hasStaffAccess) {
        return error("Staff preview access is disabled.", 403);
      }

      if (request.method === "GET" && parts.length === 4) {
        return json(await getRestaurantOrders(env, parts[2]));
      }

      if (request.method === "GET" && parts[4] === "events") {
        return addStream(restaurantStreams, parts[2], request, await getRestaurantOrders(env, parts[2]));
      }
    }
  } catch (caughtError) {
    return error(caughtError instanceof Error ? caughtError.message : "Unexpected API error.", 500);
  }

  return error("API route not found.", 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env);
    }

    const assetResponse = await env.ASSETS.fetch(request);

    if (assetResponse.status !== 404) {
      return IMMUTABLE_ASSET.test(url.pathname) ? withCacheHeaders(assetResponse) : assetResponse;
    }

    if (request.method === "GET" && !IMMUTABLE_ASSET.test(url.pathname)) {
      return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
    }

    return assetResponse;
  },
};
