function getComments(payload) {
  requireFields(payload, ['restaurantId', 'targetType', 'targetId']);
  return allRows('COMMENTS').filter(function(row) {
    return row.restaurantId === payload.restaurantId &&
      row.targetType === payload.targetType &&
      row.targetId === payload.targetId &&
      ['hidden', 'deleted'].indexOf(row.status) === -1;
  }).sort(function(a, b) {
    return String(a.createdAt).localeCompare(String(b.createdAt));
  }).map(commentToFrontend);
}

function createComment(payload) {
  requireFields(payload, ['restaurantId', 'targetType', 'targetId', 'userId', 'userName', 'text']);
  if (['dish', 'experiencePost'].indexOf(payload.targetType) === -1) {
    throw appError('INVALID_TARGET', 'Tipo de comentario invalido.');
  }
  assertCommentTarget(payload.targetType, payload.targetId, payload.restaurantId);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var timestamp = nowIso();
    var record = {
      id: makeId('comment'),
      restaurantId: payload.restaurantId,
      targetType: payload.targetType,
      targetId: payload.targetId,
      userId: payload.userId,
      userName: String(payload.userName).slice(0, 80),
      userPhotoUrl: payload.userPhotoUrl || '',
      parentCommentId: payload.parentCommentId || '',
      text: String(payload.text).slice(0, 500),
      status: 'approved',
      likesCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    appendRecord('COMMENTS', record);
    updateCounter(record.targetType, record.targetId, 'commentsCount', 1);
    invalidateCommentTargetCache(record);
    SpreadsheetApp.flush();
    return commentToFrontend(record);
  } finally {
    lock.releaseLock();
  }
}

function moderateComment(payload, context) {
  requireRole(context, ['admin']);
  requireFields(payload, ['commentId', 'status']);
  if (['pending', 'approved', 'hidden', 'deleted'].indexOf(payload.status) === -1) {
    throw appError('INVALID_STATUS', 'Estado de comentario invalido.');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var previous = findById('COMMENTS', payload.commentId);
    if (!previous) throw appError('NOT_FOUND', 'No se encontro el comentario.');
    var updated = updateRecord('COMMENTS', payload.commentId, { status: payload.status, updatedAt: nowIso() });
    var previousCounted = isCountedCommentStatus(previous.status);
    var updatedCounted = isCountedCommentStatus(updated.status);
    if (previousCounted !== updatedCounted) {
      updateCounter(updated.targetType, updated.targetId, 'commentsCount', updatedCounted ? 1 : -1);
      invalidateCommentTargetCache(updated);
    }
    audit('moderateComment', 'comment', payload.commentId, previous, updated, context);
    return commentToFrontend(updated);
  } finally {
    lock.releaseLock();
  }
}

function assertCommentTarget(targetType, targetId, restaurantId) {
  var sheetName = targetType === 'dish' ? 'DISHES' : 'EXPERIENCE_POSTS';
  var target = findById(sheetName, targetId);
  if (!target) throw appError('NOT_FOUND', 'No se encontro el recurso comentado.');
  if (String(target.restaurantId) !== String(restaurantId)) {
    throw appError('FORBIDDEN', 'El comentario no pertenece a este restaurante.');
  }
}

function isCountedCommentStatus(status) {
  return ['hidden', 'deleted'].indexOf(status) === -1;
}

function invalidateCommentTargetCache(comment) {
  if (comment.targetType === 'dish') {
    invalidateMenu(comment.restaurantId);
  }
}

function commentToFrontend(row) {
  return {
    id: row.id,
    restaurantId: row.restaurantId,
    targetType: row.targetType,
    targetId: row.targetId,
    experiencePostId: row.targetType === 'experiencePost' ? row.targetId : '',
    userId: row.userId,
    userName: row.userName,
    userPhotoUrl: row.userPhotoUrl || null,
    parentId: row.parentCommentId || null,
    parentCommentId: row.parentCommentId || null,
    text: row.text,
    status: row.status,
    likesCount: toNumber(row.likesCount),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}
