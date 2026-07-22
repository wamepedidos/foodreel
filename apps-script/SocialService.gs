function toggleLike(payload) {
  requireFields(payload, ['restaurantId', 'targetType', 'targetId']);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sessionKey = payload.userId || payload.sessionId;
    if (!sessionKey) throw appError('VALIDATION_ERROR', 'Falta usuario o sesion.');
    var existing = allRows('LIKES').find(function(row) {
      return row.restaurantId === payload.restaurantId &&
        row.targetType === payload.targetType &&
        row.targetId === payload.targetId &&
        (row.userId === payload.userId || row.sessionId === payload.sessionId);
    });
    var count = currentCounter(payload.targetType, payload.targetId, 'likesCount');
    if (payload.liked && !existing) {
      appendRecord('LIKES', {
        id: makeId('like'),
        restaurantId: payload.restaurantId,
        targetType: payload.targetType,
        targetId: payload.targetId,
        userId: payload.userId || '',
        sessionId: payload.sessionId || '',
        createdAt: nowIso()
      });
      count = updateCounter(payload.targetType, payload.targetId, 'likesCount', 1);
    }
    if (!payload.liked && existing) {
      updateRecord('LIKES', existing.id, Object.assign({}, existing, { targetId: '__deleted__' + existing.targetId }));
      count = updateCounter(payload.targetType, payload.targetId, 'likesCount', -1);
    }
    return { liked: Boolean(payload.liked), count: count, target: targetFor(payload.targetType, payload.targetId) };
  } finally {
    lock.releaseLock();
  }
}

function registerView(payload) {
  requireFields(payload, ['restaurantId', 'targetType', 'targetId']);
  var sessionKey = payload.userId || payload.sessionId;
  if (!sessionKey) throw appError('VALIDATION_ERROR', 'Falta usuario o sesion.');
  var viewedDate = Utilities.formatDate(new Date(), APP_CONFIG.DEFAULT_TIMEZONE, 'yyyy-MM-dd-HH');
  var existing = allRows('VIEWS').find(function(row) {
    return row.restaurantId === payload.restaurantId &&
      row.targetType === payload.targetType &&
      row.targetId === payload.targetId &&
      row.viewedDate === viewedDate &&
      (row.userId === payload.userId || row.sessionId === payload.sessionId);
  });
  var count = currentCounter(payload.targetType, payload.targetId, 'viewsCount');
  if (!existing) {
    appendRecord('VIEWS', {
      id: makeId('view'),
      restaurantId: payload.restaurantId,
      targetType: payload.targetType,
      targetId: payload.targetId,
      userId: payload.userId || '',
      sessionId: payload.sessionId || '',
      viewedDate: viewedDate,
      createdAt: nowIso()
    });
    count = updateCounter(payload.targetType, payload.targetId, 'viewsCount', 1);
    return { counted: true, count: count, target: targetFor(payload.targetType, payload.targetId) };
  }
  return { counted: false, count: count, target: targetFor(payload.targetType, payload.targetId) };
}

function registerShare(payload) {
  requireFields(payload, ['restaurantId', 'targetType', 'targetId', 'shareMethod']);
  appendRecord('SHARES', {
    id: makeId('share'),
    restaurantId: payload.restaurantId,
    targetType: payload.targetType,
    targetId: payload.targetId,
    userId: payload.userId || '',
    sessionId: payload.sessionId || '',
    shareMethod: payload.shareMethod,
    createdAt: nowIso()
  });
  if (payload.targetType === 'menu') {
    var current = toNumber(getConfigValue('menuSharesCount', '0')) + 1;
    setConfigValue('menuSharesCount', current, 'Contador separado de compartidos de la carta');
    return { count: current };
  }
  var count = updateCounter(payload.targetType, payload.targetId, 'sharesCount', 1);
  return { count: count, target: targetFor(payload.targetType, payload.targetId) };
}

function updateCounter(targetType, targetId, column, amount) {
  if (targetType === 'dish') return incrementCellById('DISHES', targetId, column, amount);
  if (targetType === 'experiencePost') return incrementCellById('EXPERIENCE_POSTS', targetId, column, amount);
  if (targetType === 'comment') return incrementCellById('COMMENTS', targetId, column, amount);
  if (targetType === 'menu') return toNumber(getConfigValue('menuSharesCount', '0'));
  throw appError('INVALID_TARGET', 'Tipo de recurso invalido.');
}

function currentCounter(targetType, targetId, column) {
  var sheet = targetType === 'dish' ? 'DISHES' : targetType === 'experiencePost' ? 'EXPERIENCE_POSTS' : 'COMMENTS';
  var row = findById(sheet, targetId);
  return row ? toNumber(row[column]) : 0;
}

function targetFor(targetType, targetId) {
  if (targetType === 'dish') return dishToPublic(findById('DISHES', targetId));
  if (targetType === 'experiencePost') return postToFrontend(findById('EXPERIENCE_POSTS', targetId));
  if (targetType === 'comment') return commentToFrontend(findById('COMMENTS', targetId));
  return null;
}
