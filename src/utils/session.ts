const CUSTOMER_SESSION_KEY = 'foodreel-customer-session-id';
const TABLE_SESSION_PREFIX = 'foodreel-table-session-id:';

function makeId(prefix: string) {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${randomPart}`;
}

function getOrCreateStorageValue(key: string, prefix: string) {
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const next = makeId(prefix);
  window.localStorage.setItem(key, next);
  return next;
}

export function getOrCreateCustomerSessionId() {
  return getOrCreateStorageValue(CUSTOMER_SESSION_KEY, 'customer');
}

export function getOrCreateTableSessionId(restaurantId: string, tableId: string) {
  return getOrCreateStorageValue(`${TABLE_SESSION_PREFIX}${restaurantId}:${tableId}`, 'table_session');
}

export function makeIdempotencyKey() {
  return makeId('order');
}
