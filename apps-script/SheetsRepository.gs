function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  if (APP_CONFIG.DEFAULT_SPREADSHEET_ID) return SpreadsheetApp.openById(APP_CONFIG.DEFAULT_SPREADSHEET_ID);
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw appError('SPREADSHEET_NOT_CONFIGURED', 'Configura SPREADSHEET_ID en Script Properties.');
  return active;
}

function getSheet(name) {
  var spreadsheet = getSpreadsheet();
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }
  ensureHeaders(sheet, SHEET_HEADERS[name]);
  return sheet;
}

function ensureHeaders(sheet, headers) {
  if (!headers) return;
  var range = sheet.getRange(1, 1, 1, headers.length);
  var current = range.getValues()[0];
  var missing = headers.some(function(header, index) {
    return current[index] !== header;
  });
  if (missing) {
    range.setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
  }
}

function allRows(name) {
  var sheet = getSheet(name);
  var headers = SHEET_HEADERS[name];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function(row, index) {
    var object = { _rowNumber: index + 2 };
    headers.forEach(function(header, columnIndex) {
      object[header] = row[columnIndex];
    });
    return object;
  });
}

function appendRecord(name, record) {
  var sheet = getSheet(name);
  var headers = SHEET_HEADERS[name];
  var row = headers.map(function(header) {
    return record[header] !== undefined ? record[header] : '';
  });
  sheet.appendRow(row);
  return record;
}

function updateRecord(name, id, patch) {
  var sheet = getSheet(name);
  var headers = SHEET_HEADERS[name];
  var idColumn = headers.indexOf('id');
  var rows = allRows(name);
  var row = rows.find(function(item) {
    return String(item.id) === String(id);
  });
  if (!row) throw appError('NOT_FOUND', 'No se encontro el recurso ' + id);
  var next = Object.assign({}, row, patch);
  delete next._rowNumber;
  sheet.getRange(row._rowNumber, 1, 1, headers.length).setValues([headers.map(function(header) {
    return next[header] !== undefined ? next[header] : '';
  })]);
  return next;
}

function findById(name, id) {
  return allRows(name).find(function(row) {
    return String(row.id) === String(id);
  }) || null;
}

function findOneBy(name, column, value) {
  return allRows(name).find(function(row) {
    return String(row[column]) === String(value);
  }) || null;
}

function findManyBy(name, column, value) {
  return allRows(name).filter(function(row) {
    return String(row[column]) === String(value);
  });
}

function batchAppend(name, records) {
  if (!records.length) return;
  var sheet = getSheet(name);
  var headers = SHEET_HEADERS[name];
  var values = records.map(function(record) {
    return headers.map(function(header) {
      return record[header] !== undefined ? record[header] : '';
    });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, headers.length).setValues(values);
}

function incrementCellById(name, id, column, amount) {
  var record = findById(name, id);
  if (!record) throw appError('NOT_FOUND', 'No se encontro el recurso ' + id);
  var nextValue = Math.max(0, toNumber(record[column]) + amount);
  updateRecord(name, id, Object.assign({}, record, { [column]: nextValue, updatedAt: nowIso() }));
  return nextValue;
}

function getConfigValue(key, fallback) {
  var row = findOneBy('CONFIG', 'key', key);
  return row ? row.value : fallback;
}

function setConfigValue(key, value, description) {
  var existing = findOneBy('CONFIG', 'key', key);
  if (existing) {
    var sheet = getSheet('CONFIG');
    var headers = SHEET_HEADERS.CONFIG;
    var next = { key: key, value: String(value), description: description || existing.description, updatedAt: nowIso() };
    sheet.getRange(existing._rowNumber, 1, 1, headers.length).setValues([headers.map(function(header) {
      return next[header] !== undefined ? next[header] : '';
    })]);
    return next;
  }
  return appendRecord('CONFIG', { key: key, value: String(value), description: description || '', updatedAt: nowIso() });
}
