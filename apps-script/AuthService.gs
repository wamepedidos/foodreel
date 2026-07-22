function requireRole(context, roles) {
  var role = normalizeRole(context && context.role);
  var allowed = roles.map(normalizeRole);
  if (allowed.indexOf(role) === -1) {
    throw appError('FORBIDDEN', 'No tienes permisos para esta accion.');
  }
}

function publicContext(payload, auth) {
  return {
    restaurantId: (payload && payload.restaurantId) || (auth && auth.restaurantId) || APP_CONFIG.DEFAULT_RESTAURANT_ID,
    role: auth && auth.role,
    userId: auth && auth.userId,
    sessionId: (payload && (payload.sessionId || payload.customerSessionId)) || ''
  };
}

function loginEmployee(payload) {
  requireFields(payload, ['email', 'password', 'restaurantId']);
  var employee = allRows('EMPLOYEES').find(function(row) {
    return String(row.restaurantId) === String(payload.restaurantId) &&
      String(row.email).toLowerCase() === String(payload.email).toLowerCase() &&
      toBool(row.active);
  });
  if (!employee) throw appError('INVALID_LOGIN', 'Correo o contrasena invalidos.');
  var expected = digestPassword(payload.password, employee.passwordSalt);
  if (expected !== employee.passwordHash) throw appError('INVALID_LOGIN', 'Correo o contrasena invalidos.');
  updateRecord('EMPLOYEES', employee.id, { lastLoginAt: nowIso(), updatedAt: nowIso() });
  var safe = employeeToFrontend(Object.assign({}, employee, { lastLoginAt: nowIso() }));
  return {
    employee: safe,
    token: Utilities.base64EncodeWebSafe(employee.id + ':' + nowIso()),
    session: { userId: employee.id, role: safe.role, restaurantId: employee.restaurantId }
  };
}

function employeeToFrontend(employee) {
  return {
    id: employee.id,
    restaurantId: employee.restaurantId,
    firstName: employee.firstName,
    lastName: employee.lastName,
    photoUrl: employee.photoUrl,
    email: employee.email,
    phone: employee.phone,
    role: frontendRole(normalizeRole(employee.role)),
    status: toBool(employee.active) ? 'active' : 'inactive',
    temporaryPassword: '',
    invitationSent: true,
    notificationsEnabled: toBool(employee.notificationsEnabled),
    pushSubscriptionId: employee.pushSubscriptionId || '',
    deviceTokens: parseJson(employee.deviceTokensJson, []),
    lastNotificationAt: employee.lastNotificationAt || null,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
    lastAccessAt: employee.lastLoginAt || null
  };
}
