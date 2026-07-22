function audit(action, resourceType, resourceId, previousData, newData, context) {
  var actor = context || {};
  appendRecord('AUDIT_LOG', {
    id: makeId('audit'),
    restaurantId: actor.restaurantId || APP_CONFIG.DEFAULT_RESTAURANT_ID,
    userId: actor.userId || '',
    userRole: actor.role || '',
    action: action,
    resourceType: resourceType,
    resourceId: resourceId || '',
    previousDataJson: previousData ? JSON.stringify(previousData) : '',
    newDataJson: newData ? JSON.stringify(stripSensitive(newData)) : '',
    ipOrSession: actor.sessionId || '',
    createdAt: nowIso()
  });
}

function stripSensitive(record) {
  var copy = Object.assign({}, record);
  delete copy.passwordHash;
  delete copy.passwordSalt;
  delete copy.temporaryPassword;
  delete copy.password;
  return copy;
}
