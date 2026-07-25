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

function getMediaDataUrl(payload) {
  requireFields(payload, ['restaurantId', 'fileUrl']);
  var record = allRows('DISH_MEDIA').find(function(item) {
    return item.restaurantId === payload.restaurantId && item.fileUrl === payload.fileUrl && item.type === 'video';
  });
  if (!record) throw appError('NOT_FOUND', 'No se encontro el video guardado.');

  var response = UrlFetchApp.fetch(record.fileUrl, {
    followRedirects: true,
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw appError('MEDIA_FETCH_FAILED', 'No se pudo leer el video guardado.');
  }

  var bytes = response.getBlob().getBytes();
  if (bytes.length > APP_CONFIG.MAX_VIDEO_BYTES) {
    throw appError('FILE_TOO_LARGE', 'El video es demasiado grande para preparar fotogramas desde edicion.');
  }

  var mimeType = record.mimeType || response.getHeaders()['Content-Type'] || 'video/mp4';
  return {
    dataUrl: 'data:' + mimeType + ';base64,' + Utilities.base64Encode(bytes),
    fileName: record.fileName,
    mimeType: mimeType
  };
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
