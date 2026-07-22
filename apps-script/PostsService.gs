function createExperiencePost(payload) {
  requireFields(payload, ['restaurantId', 'tableSessionId', 'userId', 'userName', 'idempotencyKey']);
  var existing = allRows('EXPERIENCE_POSTS').find(function(row) {
    return row.restaurantId === payload.restaurantId && row.id === 'post_' + payload.idempotencyKey;
  });
  if (existing) return postToFrontend(existing);
  var timestamp = nowIso();
  var record = {
    id: 'post_' + payload.idempotencyKey,
    restaurantId: payload.restaurantId,
    tableSessionId: payload.tableSessionId,
    userId: payload.userId,
    userName: String(payload.userName).slice(0, 80),
    userPhotoUrl: payload.userPhotoUrl || payload.userPhoto || '',
    mediaUrl: payload.mediaUrl || '',
    mediaDriveFileId: payload.mediaDriveFileId || '',
    mediaType: payload.mediaType || '',
    text: String(payload.text || '').slice(0, 300),
    dishId: payload.dishId || '',
    dishName: payload.dishName || '',
    dishImageUrl: payload.dishImage || '',
    orderId: payload.orderId || '',
    status: 'pending',
    likesCount: 0,
    viewsCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  appendRecord('EXPERIENCE_POSTS', record);
  return postToFrontend(record);
}

function getExperiencePost(payload) {
  requireFields(payload, ['experiencePostId']);
  var post = findById('EXPERIENCE_POSTS', payload.experiencePostId);
  if (!post) return null;
  if (post.status !== 'approved' && payload.userId !== post.userId) {
    throw appError('FORBIDDEN', 'La publicacion aun no esta disponible.');
  }
  return postToFrontend(post);
}

function getApprovedPosts(payload) {
  var restaurantId = payload.restaurantId || APP_CONFIG.DEFAULT_RESTAURANT_ID;
  var limit = Math.min(50, Math.max(1, toNumber(payload.limit) || 20));
  var offset = toNumber(payload.pageToken || 0);
  var rows = allRows('EXPERIENCE_POSTS').filter(function(row) {
    return row.restaurantId === restaurantId && row.status === 'approved';
  }).sort(function(a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
  return {
    posts: rows.slice(offset, offset + limit).map(postToFrontend),
    nextPageToken: offset + limit < rows.length ? String(offset + limit) : ''
  };
}

function approveExperiencePost(payload, context) {
  requireRole(context, ['admin']);
  return moderatePost(payload.experiencePostId, 'approved', context);
}

function rejectExperiencePost(payload, context) {
  requireRole(context, ['admin']);
  return moderatePost(payload.experiencePostId, 'rejected', context);
}

function moderatePost(postId, status, context) {
  if (!postId) throw appError('VALIDATION_ERROR', 'Falta experiencePostId.');
  var previous = findById('EXPERIENCE_POSTS', postId);
  if (!previous) throw appError('NOT_FOUND', 'No se encontro la publicacion.');
  var updated = updateRecord('EXPERIENCE_POSTS', postId, { status: status, updatedAt: nowIso() });
  audit(status + 'ExperiencePost', 'experiencePost', postId, previous, updated, context);
  return postToFrontend(updated);
}

function postToFrontend(row) {
  return {
    id: row.id,
    restaurantId: row.restaurantId,
    tableSessionId: row.tableSessionId,
    userId: row.userId,
    userName: row.userName,
    userPhoto: row.userPhotoUrl || null,
    userPhotoUrl: row.userPhotoUrl || null,
    mediaUrl: row.mediaUrl || null,
    mediaDriveFileId: row.mediaDriveFileId || null,
    mediaType: row.mediaType || null,
    text: row.text,
    dishId: row.dishId || null,
    dishName: row.dishName || null,
    dishImage: row.dishImageUrl || null,
    orderId: row.orderId || null,
    status: row.status,
    likesCount: toNumber(row.likesCount),
    viewsCount: toNumber(row.viewsCount),
    commentsCount: toNumber(row.commentsCount),
    sharesCount: toNumber(row.sharesCount),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}
