function createOrder(payload, context) {
  requireFields(payload, ['restaurantId', 'tableId', 'tableSessionId', 'customerSessionId', 'idempotencyKey', 'items']);
  validateTable(payload);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var existing = allRows('ORDERS').find(function(row) {
      return row.restaurantId === payload.restaurantId && row.idempotencyKey === payload.idempotencyKey;
    });
    if (existing) return orderToFrontend(existing);
    var timestamp = nowIso();
    var orderId = makeId('order');
    var orderNumber = nextOrderNumber(payload.restaurantId);
    var computedItems = payload.items.map(function(item) {
      var dish = findById('DISHES', item.dishId);
      if (!dish || dish.restaurantId !== payload.restaurantId || dish.status !== 'active') {
        throw appError('DISH_UNAVAILABLE', 'Uno de los platos no esta disponible.');
      }
      var quantity = Math.max(1, Math.min(99, toNumber(item.quantity)));
      var unitPrice = toNumber(dish.price);
      var subtotal = quantity * unitPrice;
      return {
        id: makeId('item'),
        orderId: orderId,
        restaurantId: payload.restaurantId,
        dishId: dish.id,
        dishName: dish.title,
        dishImageUrl: dish.mainImageUrl,
        quantity: quantity,
        unitPrice: unitPrice,
        selectedOptionsJson: safeJson(item.selectedOptions || []),
        selectedSaucesJson: safeJson([]),
        selectedExtrasJson: safeJson(item.selectedExtras || []),
        notes: item.notes || '',
        subtotal: subtotal,
        isUpsell: Boolean(item.isUpsell),
        createdAt: timestamp
      };
    });
    var subtotal = computedItems.reduce(function(total, item) { return total + item.subtotal; }, 0);
    var order = {
      id: orderId,
      restaurantId: payload.restaurantId,
      tableId: payload.tableId,
      tableNumber: toNumber(payload.tableNumber),
      tableSessionId: payload.tableSessionId,
      customerSessionId: payload.customerSessionId,
      orderNumber: orderNumber,
      idempotencyKey: payload.idempotencyKey,
      source: 'customer_pwa',
      status: 'new',
      subtotal: subtotal,
      upsellTotal: 0,
      total: subtotal,
      customerNotes: String(payload.customerNotes || '').slice(0, 500),
      waiterId: '',
      createdAt: timestamp,
      receivedAt: '',
      confirmedAt: '',
      preparationStartedAt: '',
      readyAt: '',
      deliveredAt: '',
      accountRequestedAt: '',
      paidAt: '',
      cancelledAt: '',
      cancellationReason: ''
    };
    appendRecord('ORDERS', order);
    batchAppend('ORDER_ITEMS', computedItems);
    computedItems.forEach(function(item) {
      incrementCellById('DISHES', item.dishId, 'ordersCount', 1);
    });
    return orderToFrontend(order);
  } finally {
    lock.releaseLock();
  }
}

function getOrder(payload) {
  requireFields(payload, ['orderId']);
  var order = findById('ORDERS', payload.orderId);
  if (!order) return null;
  if (payload.customerSessionId && order.customerSessionId !== payload.customerSessionId) {
    throw appError('FORBIDDEN', 'Este pedido pertenece a otra sesion.');
  }
  return orderToFrontend(order);
}

function getRestaurantOrders(payload, context) {
  requireRole(context, STAFF_ROLES);
  var restaurantId = payload.restaurantId || context.restaurantId || APP_CONFIG.DEFAULT_RESTAURANT_ID;
  return allRows('ORDERS').filter(function(row) {
    return row.restaurantId === restaurantId && (!payload.tableSessionId || row.tableSessionId === payload.tableSessionId);
  }).sort(function(a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  }).map(orderToFrontend);
}

function updateOrderStatus(payload, context) {
  requireRole(context, STAFF_ROLES);
  requireFields(payload, ['orderId', 'status']);
  if (ORDER_STATUSES.indexOf(payload.status) === -1) throw appError('INVALID_STATUS', 'Estado de pedido no permitido.');
  var previous = findById('ORDERS', payload.orderId);
  if (!previous) throw appError('NOT_FOUND', 'No se encontro el pedido.');
  var patch = { status: payload.status };
  var keyByStatus = {
    received: 'receivedAt',
    confirmed: 'confirmedAt',
    preparing: 'preparationStartedAt',
    ready: 'readyAt',
    delivered: 'deliveredAt',
    account_requested: 'accountRequestedAt',
    paid: 'paidAt',
    cancelled: 'cancelledAt'
  };
  if (keyByStatus[payload.status]) patch[keyByStatus[payload.status]] = nowIso();
  var updated = updateRecord('ORDERS', payload.orderId, patch);
  audit('updateOrderStatus', 'order', payload.orderId, previous, updated, context);
  return orderToFrontend(updated);
}

function nextOrderNumber(restaurantId) {
  var numbers = allRows('ORDERS').filter(function(row) {
    return row.restaurantId === restaurantId;
  }).map(function(row) {
    return toNumber(row.orderNumber);
  });
  return Math.max.apply(null, [0].concat(numbers)) + 1;
}

function validateTable(payload) {
  var table = findById('TABLES', payload.tableId);
  if (!table || table.restaurantId !== payload.restaurantId || !toBool(table.active)) {
    throw appError('INVALID_TABLE', 'Mesa invalida.');
  }
  if (table.accessToken && payload.tableAccessToken && table.accessToken !== payload.tableAccessToken) {
    throw appError('INVALID_TABLE_TOKEN', 'Token de mesa invalido.');
  }
}

function orderToFrontend(row) {
  var items = findManyBy('ORDER_ITEMS', 'orderId', row.id).map(function(item) {
    return {
      dishId: item.dishId,
      name: item.dishName,
      image: item.dishImageUrl,
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
      selectedOptions: parseJson(item.selectedOptionsJson, []),
      selectedExtras: parseJson(item.selectedExtrasJson, []),
      notes: item.notes,
      subtotal: toNumber(item.subtotal)
    };
  });
  return Object.assign({}, row, {
    orderNumber: toNumber(row.orderNumber),
    tableNumber: toNumber(row.tableNumber),
    subtotal: toNumber(row.subtotal),
    upsellTotal: toNumber(row.upsellTotal),
    total: toNumber(row.total),
    waiterId: row.waiterId || null,
    items: items,
    receivedAt: row.receivedAt || null,
    confirmedAt: row.confirmedAt || null,
    preparationStartedAt: row.preparationStartedAt || null,
    readyAt: row.readyAt || null,
    deliveredAt: row.deliveredAt || null,
    cancelledAt: row.cancelledAt || null,
    cancellationReason: row.cancellationReason || null
  });
}
