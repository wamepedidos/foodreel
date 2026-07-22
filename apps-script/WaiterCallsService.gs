function createWaiterCall(payload) {
  requireFields(payload, ['restaurantId', 'tableId', 'tableSessionId', 'customerSessionId', 'type']);
  validateTable(payload);
  var timestamp = nowIso();
  var record = {
    id: makeId('waiter_call'),
    restaurantId: payload.restaurantId,
    tableId: payload.tableId,
    tableNumber: toNumber(payload.tableNumber),
    tableSessionId: payload.tableSessionId,
    customerSessionId: payload.customerSessionId,
    type: payload.type,
    message: String(payload.message || '').slice(0, 240),
    status: 'pending',
    waiterId: '',
    createdAt: timestamp,
    acceptedAt: '',
    resolvedAt: '',
    cancelledAt: ''
  };
  appendRecord('WAITER_CALLS', record);
  return callToFrontend(record);
}

function getWaiterCalls(payload, context) {
  requireRole(context, STAFF_ROLES);
  var restaurantId = payload.restaurantId || context.restaurantId || APP_CONFIG.DEFAULT_RESTAURANT_ID;
  return allRows('WAITER_CALLS').filter(function(row) {
    return row.restaurantId === restaurantId && ['pending', 'accepted'].indexOf(row.status) !== -1;
  }).sort(function(a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  }).map(callToFrontend);
}

function updateWaiterCallStatus(payload, context) {
  requireRole(context, STAFF_ROLES);
  requireFields(payload, ['callId', 'status']);
  if (['pending', 'accepted', 'resolved', 'cancelled'].indexOf(payload.status) === -1) {
    throw appError('INVALID_STATUS', 'Estado de solicitud invalido.');
  }
  var patch = { status: payload.status };
  if (payload.status === 'accepted') patch.acceptedAt = nowIso();
  if (payload.status === 'resolved') patch.resolvedAt = nowIso();
  if (payload.status === 'cancelled') patch.cancelledAt = nowIso();
  var updated = updateRecord('WAITER_CALLS', payload.callId, patch);
  return callToFrontend(updated);
}

function callToFrontend(row) {
  return Object.assign({}, row, { tableNumber: toNumber(row.tableNumber) });
}
