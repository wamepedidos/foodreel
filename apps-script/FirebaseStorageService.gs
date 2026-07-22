function firebaseAccessToken() {
  var props = PropertiesService.getScriptProperties();
  var clientEmail = props.getProperty('FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL');
  var privateKey = props.getProperty('FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY');
  if (!clientEmail || !privateKey) {
    throw appError('FIREBASE_NOT_CONFIGURED', 'Configura la cuenta de servicio de Firebase Storage en Script Properties.');
  }
  privateKey = privateKey.replace(/\\n/g, '\n');
  var header = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=+$/, '');
  var nowSeconds = Math.floor(Date.now() / 1000);
  var claim = {
    aud: 'https://oauth2.googleapis.com/token',
    exp: nowSeconds + 3600,
    iat: nowSeconds,
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/devstorage.read_write'
  };
  var payload = Utilities.base64EncodeWebSafe(JSON.stringify(claim)).replace(/=+$/, '');
  var signature = Utilities.computeRsaSha256Signature(header + '.' + payload, privateKey);
  var jwt = header + '.' + payload + '.' + Utilities.base64EncodeWebSafe(signature).replace(/=+$/, '');
  var response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: {
      assertion: jwt,
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
    },
    muteHttpExceptions: true
  });
  var data = JSON.parse(response.getContentText());
  if (!data.access_token) {
    throw appError('FIREBASE_AUTH_FAILED', 'No se pudo autenticar con Firebase Storage.');
  }
  return data.access_token;
}

function uploadVideo(payload) {
  requireFields(payload, ['restaurantId', 'fileName', 'mimeType', 'base64']);
  if (!/^video\/(mp4|webm)$/.test(payload.mimeType)) {
    throw appError('INVALID_FILE_TYPE', 'Solo se permiten videos MP4 o WEBM.');
  }
  var bytes = Utilities.base64Decode(payload.base64);
  if (bytes.length > APP_CONFIG.MAX_VIDEO_BYTES) {
    throw appError('FILE_TOO_LARGE', 'El video supera el limite permitido para esta etapa.');
  }
  var props = PropertiesService.getScriptProperties();
  var bucket = props.getProperty('FIREBASE_STORAGE_BUCKET');
  if (!bucket) {
    throw appError('FIREBASE_NOT_CONFIGURED', 'Configura FIREBASE_STORAGE_BUCKET en Script Properties.');
  }
  var path = [
    'restaurant-videos',
    payload.restaurantId,
    payload.dishId ? 'dishes' : 'posts',
    makeId('video') + '-' + sanitizeFileName(payload.fileName)
  ].join('/');
  var downloadToken = Utilities.getUuid();
  var accessToken = firebaseAccessToken();
  var boundary = 'foodreel_' + Utilities.getUuid();
  var metadata = {
    name: path,
    contentType: payload.mimeType,
    metadata: {
      firebaseStorageDownloadTokens: downloadToken
    }
  };
  var multipartBytes = multipartUploadBytes(boundary, metadata, payload.mimeType, bytes);
  var response = UrlFetchApp.fetch(
    'https://storage.googleapis.com/upload/storage/v1/b/' + encodeURIComponent(bucket) + '/o?uploadType=multipart',
    {
      contentType: 'multipart/related; boundary=' + boundary,
      headers: { Authorization: 'Bearer ' + accessToken },
      method: 'post',
      muteHttpExceptions: true,
      payload: multipartBytes
    }
  );
  var code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw appError('FIREBASE_UPLOAD_FAILED', 'No se pudo subir el video a Firebase Storage.');
  }
  var fileUrl = 'https://firebasestorage.googleapis.com/v0/b/' + encodeURIComponent(bucket) + '/o/' + encodeURIComponent(path) + '?alt=media&token=' + encodeURIComponent(downloadToken);
  return saveMediaRecord(payload, {
    driveFileId: path,
    fileUrl: fileUrl,
    sizeBytes: bytes.length
  });
}

function multipartUploadBytes(boundary, metadata, mimeType, fileBytes) {
  var delimiter = '--' + boundary + '\r\n';
  var metadataPart =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    '\r\n';
  var mediaPart =
    delimiter +
    'Content-Type: ' + mimeType + '\r\n\r\n';
  var closeDelimiter = '\r\n--' + boundary + '--';
  return Utilities.newBlob(metadataPart).getBytes()
    .concat(Utilities.newBlob(mediaPart).getBytes())
    .concat(fileBytes)
    .concat(Utilities.newBlob(closeDelimiter).getBytes());
}

function deleteFirebaseVideo(record) {
  var bucket = PropertiesService.getScriptProperties().getProperty('FIREBASE_STORAGE_BUCKET');
  if (!bucket || !record || !record.driveFileId) return false;
  var response = UrlFetchApp.fetch(
    'https://storage.googleapis.com/storage/v1/b/' + encodeURIComponent(bucket) + '/o/' + encodeURIComponent(record.driveFileId),
    {
      headers: { Authorization: 'Bearer ' + firebaseAccessToken() },
      method: 'delete',
      muteHttpExceptions: true
    }
  );
  return response.getResponseCode() === 204 || response.getResponseCode() === 404;
}
