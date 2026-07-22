function nowIso() {
  return new Date().toISOString();
}

function jsonResponse(payload, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function ok(data, message) {
  return jsonResponse({ success: true, data: data || {}, message: message || '' });
}

function fail(code, message) {
  return jsonResponse({ success: false, error: { code: code, message: message } });
}

function parseRequest(e) {
  if (e && e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  return {
    action: e && e.parameter ? e.parameter.action : '',
    payload: e && e.parameter ? e.parameter : {},
    auth: {}
  };
}

function makeId(prefix) {
  return prefix + '_' + Utilities.getUuid();
}

function requireFields(payload, fields) {
  fields.forEach(function(field) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      throw appError('VALIDATION_ERROR', 'Falta el campo requerido: ' + field);
    }
  });
}

function appError(code, message) {
  var error = new Error(message);
  error.code = code;
  return error;
}

function safeJson(value, fallback) {
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value || fallback || []);
  if (!value) return JSON.stringify(fallback || []);
  return String(value);
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function toBool(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function toNumber(value) {
  var numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function sanitizeFileName(name) {
  return String(name || 'archivo').replace(/[^\w.\- ]+/g, '').slice(0, 120);
}

function digestPassword(password, salt) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + password, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(bytes);
}

function normalizeRole(role) {
  var map = {
    ADMINISTRADOR: 'admin',
    MESERO: 'waiter',
    COCINA: 'kitchen',
    admin: 'admin',
    waiter: 'waiter',
    kitchen: 'kitchen'
  };
  return map[role] || role;
}

function frontendRole(role) {
  var map = {
    admin: 'ADMINISTRADOR',
    waiter: 'MESERO',
    kitchen: 'COCINA'
  };
  return map[role] || role;
}

function publicUrlForFile(fileId) {
  return 'https://drive.google.com/uc?export=view&id=' + encodeURIComponent(fileId);
}
