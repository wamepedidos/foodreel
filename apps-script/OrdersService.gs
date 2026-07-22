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
      var selectedSauces = normalizeSelectedSauces(dish, item.selectedSauces || []);
      var selectedExtras = normalizeSelectedAdditions(dish, item.selectedExtras || []);
      var removedIngredients = normalizeRemovedIngredients(dish, item.selectedOptions || []);
      var unitPrice = toNumber(dish.price) + selectedExtras.reduce(function(total, extra) { return total + toNumber(extra.price); }, 0);
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
        selectedOptionsJson: safeJson(removedIngredients),
        selectedSaucesJson: safeJson(selectedSauces),
        selectedExtrasJson: safeJson(selectedExtras),
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

function normalizeSelectedSauces(dish, requested) {
  var available = findManyBy('SAUCES', 'dishId', dish.id).filter(function(sauce) {
    return toBool(sauce.available);
  });
  var values = normalizeOptionValues(requested);
  var selected = available.filter(function(sauce) {
    return values.indexOf(String(sauce.id)) !== -1 || values.indexOf(String(sauce.name)) !== -1;
  }).map(function(sauce) {
    return { name: sauce.name, value: sauce.name, price: toNumber(sauce.price) };
  });
  var minimum = toNumber(dish.minimumSauces);
  var maximum = toNumber(dish.maximumSauces) || available.length;
  if (toBool(dish.sauceSelectionRequired) && selected.length < minimum) {
    throw appError('INVALID_SAUCES', 'Selecciona las salsas requeridas para ' + dish.title + '.');
  }
  if (maximum > 0 && selected.length > maximum) {
    throw appError('INVALID_SAUCES', 'Seleccionaste demasiadas salsas para ' + dish.title + '.');
  }
  return selected;
}

function normalizeSelectedAdditions(dish, requested) {
  var available = findManyBy('ADDITIONS', 'dishId', dish.id).filter(function(addition) {
    return toBool(addition.available);
  });
  var values = normalizeOptionValues(requested);
  return available.filter(function(addition) {
    return values.indexOf(String(addition.id)) !== -1 || values.indexOf(String(addition.name)) !== -1;
  }).map(function(addition) {
    return { name: addition.name, value: addition.name, price: toNumber(addition.price) };
  });
}

function normalizeRemovedIngredients(dish, requested) {
  var removable = parseJson(dish.removableIngredientsJson, parseJson(dish.ingredientsJson, []));
  var values = normalizeOptionValues(requested);
  return removable.filter(function(ingredient) {
    return values.indexOf(String(ingredient)) !== -1;
  }).map(function(ingredient) {
    return { name: 'Sin ingrediente', value: ingredient };
  });
}

function normalizeOptionValues(options) {
  if (!Array.isArray(options)) return [];
  return options.map(function(option) {
    if (typeof option === 'string') return option;
    if (option && option.id) return String(option.id);
    if (option && option.value) return String(option.value);
    if (option && option.name) return String(option.name);
    return '';
  }).filter(Boolean);
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
      selectedSauces: parseJson(item.selectedSaucesJson, []),
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
