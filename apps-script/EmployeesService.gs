function getEmployees(payload, context) {
  requireRole(context, ['admin']);
  var restaurantId = payload.restaurantId || context.restaurantId || APP_CONFIG.DEFAULT_RESTAURANT_ID;
  return {
    employees: allRows('EMPLOYEES').filter(function(row) {
      return row.restaurantId === restaurantId;
    }).map(employeeToFrontend)
  };
}

function createEmployee(payload, context) {
  requireRole(context, ['admin']);
  requireFields(payload, ['restaurantId', 'firstName', 'lastName', 'email', 'role']);
  var password = payload.temporaryPassword || 'Temporal' + Math.floor(1000 + Math.random() * 9000);
  var salt = makeId('salt');
  var timestamp = nowIso();
  var record = {
    id: makeId('employee'),
    restaurantId: payload.restaurantId,
    userId: '',
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone || '',
    photoUrl: payload.photoUrl || '',
    role: normalizeRole(payload.role),
    active: payload.status !== 'inactive',
    passwordHash: digestPassword(password, salt),
    passwordSalt: salt,
    notificationsEnabled: false,
    pushSubscriptionId: '',
    deviceTokensJson: safeJson([]),
    lastNotificationAt: '',
    lastLoginAt: '',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  appendRecord('EMPLOYEES', record);
  audit('createEmployee', 'employee', record.id, null, record, context);
  var frontend = employeeToFrontend(record);
  frontend.temporaryPassword = password;
  return frontend;
}

function updateEmployee(payload, context) {
  requireRole(context, ['admin']);
  requireFields(payload, ['employeeId', 'employee']);
  var previous = findById('EMPLOYEES', payload.employeeId);
  if (!previous) throw appError('NOT_FOUND', 'No se encontro el empleado.');
  var updated = updateRecord('EMPLOYEES', payload.employeeId, {
    firstName: payload.employee.firstName,
    lastName: payload.employee.lastName,
    email: payload.employee.email,
    phone: payload.employee.phone || '',
    photoUrl: payload.employee.photoUrl || '',
    role: normalizeRole(payload.employee.role),
    active: payload.employee.status !== 'inactive',
    notificationsEnabled: Boolean(payload.employee.notificationsEnabled),
    pushSubscriptionId: payload.employee.pushSubscriptionId || '',
    deviceTokensJson: safeJson(payload.employee.deviceTokens || []),
    updatedAt: nowIso()
  });
  audit('updateEmployee', 'employee', payload.employeeId, previous, updated, context);
  return employeeToFrontend(updated);
}

function updateEmployeeStatus(payload, context) {
  requireRole(context, ['admin']);
  requireFields(payload, ['employeeId', 'status']);
  var previous = findById('EMPLOYEES', payload.employeeId);
  if (!previous) throw appError('NOT_FOUND', 'No se encontro el empleado.');
  var updated = updateRecord('EMPLOYEES', payload.employeeId, {
    active: payload.status === 'active',
    updatedAt: nowIso()
  });
  audit('updateEmployeeStatus', 'employee', payload.employeeId, previous, updated, context);
  return employeeToFrontend(updated);
}

function updateEmployeeRole(payload, context) {
  requireRole(context, ['admin']);
  requireFields(payload, ['employeeId', 'role']);
  var previous = findById('EMPLOYEES', payload.employeeId);
  if (!previous) throw appError('NOT_FOUND', 'No se encontro el empleado.');
  var updated = updateRecord('EMPLOYEES', payload.employeeId, {
    role: normalizeRole(payload.role),
    updatedAt: nowIso()
  });
  audit('updateEmployeeRole', 'employee', payload.employeeId, previous, updated, context);
  return employeeToFrontend(updated);
}

function resetEmployeeAccess(payload, context) {
  requireRole(context, ['admin']);
  requireFields(payload, ['employeeId']);
  var previous = findById('EMPLOYEES', payload.employeeId);
  if (!previous) throw appError('NOT_FOUND', 'No se encontro el empleado.');
  var password = 'Acceso' + Math.floor(1000 + Math.random() * 9000);
  var salt = makeId('salt');
  var updated = updateRecord('EMPLOYEES', payload.employeeId, {
    passwordHash: digestPassword(password, salt),
    passwordSalt: salt,
    updatedAt: nowIso()
  });
  audit('resetEmployeeAccess', 'employee', payload.employeeId, previous, updated, context);
  return { temporaryPassword: password };
}
