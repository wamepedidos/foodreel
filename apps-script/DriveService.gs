function ensureDriveFolders() {
  var props = PropertiesService.getScriptProperties();
  var rootId = props.getProperty('DRIVE_ROOT_FOLDER_ID');
  var root = rootId ? DriveApp.getFolderById(rootId) : DriveApp.createFolder(APP_CONFIG.APP_NAME);
  props.setProperty('DRIVE_ROOT_FOLDER_ID', root.getId());
  ['dishes', 'posts', 'users', 'employees', 'thumbnails'].forEach(function(name) {
    var key = 'DRIVE_FOLDER_' + name.toUpperCase();
    if (!props.getProperty(key)) {
      var folders = root.getFoldersByName(name);
      var folder = folders.hasNext() ? folders.next() : root.createFolder(name);
      props.setProperty(key, folder.getId());
    }
  });
}

function uploadImage(payload) {
  requireFields(payload, ['restaurantId', 'fileName', 'mimeType', 'base64']);
  if (!/^image\/(jpeg|jpg|png|webp)$/.test(payload.mimeType)) {
    throw appError('INVALID_FILE_TYPE', 'Solo se permiten imagenes JPG, PNG o WEBP.');
  }
  var bytes = Utilities.base64Decode(payload.base64);
  if (bytes.length > APP_CONFIG.MAX_IMAGE_BYTES) {
    throw appError('FILE_TOO_LARGE', 'La imagen supera el limite permitido.');
  }
  ensureDriveFolders();
  var folderId = PropertiesService.getScriptProperties().getProperty(payload.dishId ? 'DRIVE_FOLDER_DISHES' : 'DRIVE_FOLDER_POSTS');
  var folder = DriveApp.getFolderById(folderId);
  var blob = Utilities.newBlob(bytes, payload.mimeType, sanitizeFileName(payload.fileName));
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return saveMediaRecord(payload, {
    driveFileId: file.getId(),
    fileUrl: publicUrlForFile(file.getId()),
    sizeBytes: bytes.length
  });
}

function deleteDriveMedia(record) {
  if (!record || !record.driveFileId) return false;
  DriveApp.getFileById(record.driveFileId).setTrashed(true);
  return true;
}
