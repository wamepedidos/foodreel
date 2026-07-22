function uploadMedia(payload, context) {
  if (payload.type === 'video' || /^video\//.test(payload.mimeType || '')) {
    return uploadVideo(payload);
  }
  return uploadImage(payload);
}

function saveMediaRecord(payload, uploaded) {
  var createdAt = nowIso();
  var record = {
    id: makeId('media'),
    restaurantId: payload.restaurantId,
    dishId: payload.dishId || payload.postId || '',
    type: payload.type || (/^video\//.test(payload.mimeType) ? 'video' : 'image'),
    driveFileId: uploaded.driveFileId,
    fileUrl: uploaded.fileUrl,
    thumbnailUrl: payload.thumbnailUrl || '',
    mimeType: payload.mimeType,
    fileName: sanitizeFileName(payload.fileName),
    sizeBytes: uploaded.sizeBytes,
    sortOrder: payload.sortOrder || 0,
    isPrimary: Boolean(payload.isPrimary),
    createdAt: createdAt
  };
  appendRecord('DISH_MEDIA', record);
  return mediaToFrontend(record);
}

function deleteMedia(payload) {
  requireFields(payload, ['mediaId', 'restaurantId']);
  var record = findById('DISH_MEDIA', payload.mediaId);
  if (!record || record.restaurantId !== payload.restaurantId) throw appError('NOT_FOUND', 'No se encontro el archivo.');
  var deleted = record.type === 'video' ? deleteFirebaseVideo(record) : deleteDriveMedia(record);
  updateRecord('DISH_MEDIA', record.id, Object.assign({}, record, { fileUrl: '', thumbnailUrl: '' }));
  return { deleted: deleted };
}

function getMediaUrl(payload) {
  requireFields(payload, ['fileId']);
  var record = allRows('DISH_MEDIA').find(function(item) {
    return item.driveFileId === payload.fileId || item.id === payload.fileId;
  });
  if (!record) throw appError('NOT_FOUND', 'No se encontro el archivo.');
  return { fileId: record.driveFileId, url: record.fileUrl };
}

function mediaToFrontend(record) {
  return {
    id: record.id,
    restaurantId: record.restaurantId,
    dishId: record.dishId,
    type: record.type,
    driveFileId: record.driveFileId,
    fileUrl: record.fileUrl,
    thumbnailUrl: record.thumbnailUrl,
    mimeType: record.mimeType,
    fileName: record.fileName,
    sizeBytes: toNumber(record.sizeBytes),
    sortOrder: toNumber(record.sortOrder),
    isPrimary: toBool(record.isPrimary),
    createdAt: record.createdAt
  };
}
