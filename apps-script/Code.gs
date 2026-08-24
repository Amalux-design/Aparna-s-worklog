/**
 * Glow Diary — Apps Script backend
 *
 * Sheet: WORK_LOGS
 * Columns: id, date, clientName, work, eventType, qty, price, amount,
 *          paymentStatus, status, own, referrerName, startTime, endTime,
 *          notes, createdAt, updatedAt
 *
 * type WorkStatus = "WORKED" | "RESERVED";
 * type PaymentStatus = "PAID" | "PENDING";
 * interface WorkLog {
 *   id: string; date: string; clientName: string; work: string;
 *   eventType: string; qty: number; price: number; amount: number;
 *   paymentStatus: PaymentStatus; status: WorkStatus;
 *   own: boolean; // true = direct client work, false = referred by another professional
 *   referrerName: string; // name of referring professional, only meaningful when own is false
 *   startTime: string; endTime: string; notes: string;
 *   createdAt: string; updatedAt: string;
 * }
 */

var SHEET_NAME = "WORK_LOGS";
var HEADERS = [
  "id", "date", "clientName", "work", "eventType", "qty", "price", "amount",
  "paymentStatus", "status", "own", "referrerName", "startTime", "endTime",
  "notes", "createdAt", "updatedAt",
];

function doGet(e) {
  return route(e);
}

function doPost(e) {
  return route(e);
}

function route(e) {
  var action = e.parameter && e.parameter.action;
  var body = {};
  if (e.postData && e.postData.contents) {
    try {
      body = JSON.parse(e.postData.contents);
      action = action || body.action;
    } catch (err) {
      return jsonResponse({ success: false, error: "Invalid JSON body" });
    }
  }

  try {
    var data;
    switch (action) {
      case "getLogs":
        data = getLogs();
        break;
      case "createLog":
        data = createLog(body);
        break;
      case "updateLog":
        data = updateLog(body);
        break;
      case "deleteLog":
        data = deleteLog(body);
        break;
      case "getCalendarData":
        data = getCalendarData(e.parameter);
        break;
      case "createReservation":
        body.status = "RESERVED";
        data = createLog(body);
        break;
      case "updatePaymentStatus":
        data = updatePaymentStatus(body);
        break;
      default:
        throw new Error("Unknown action: " + action);
    }
    return jsonResponse({ success: true, data: data });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message || String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("Sheet '" + SHEET_NAME + "' not found");
  return sheet;
}

// Sheets auto-converts strings that look like dates/times (e.g. "2026-08-16",
// "17:00") into real Date values when typed or pasted in. getValues() then
// hands those back as JS Date objects, which JSON.stringify turns into
// UTC timestamps — shifting the day and breaking the app's "YYYY-MM-DD" /
// "HH:mm" string matching. Normalize back to plain strings using the sheet's
// own timezone so nothing shifts.
function formatDateCell(value) {
  if (!(value instanceof Date)) return value;
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  return Utilities.formatDate(value, tz, "yyyy-MM-dd");
}

function formatTimeCell(value) {
  if (!(value instanceof Date)) return value;
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  return Utilities.formatDate(value, tz, "HH:mm");
}

function rowToObject(row) {
  var obj = {};
  for (var i = 0; i < HEADERS.length; i++) {
    obj[HEADERS[i]] = row[i];
  }
  obj.date = formatDateCell(obj.date);
  obj.startTime = formatTimeCell(obj.startTime) || "";
  obj.endTime = formatTimeCell(obj.endTime) || "";
  obj.amount = Number(obj.amount);
  obj.qty = Number(obj.qty) || 1;
  obj.price = Number(obj.price) || obj.amount;
  obj.own = obj.own === true || obj.own === "TRUE" || obj.own === "true";
  return obj;
}

function objectToRow(obj) {
  return HEADERS.map(function (h) {
    if (h === "own") return obj[h] === true;
    return obj[h] !== undefined ? obj[h] : "";
  });
}

function getAllRows() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var range = sheet.getRange(2, 1, lastRow - 1, HEADERS.length);
  return range.getValues();
}

function getLogs() {
  var rows = getAllRows();
  var logs = rows.map(rowToObject);
  logs.sort(function (a, b) {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return 0;
  });
  return logs;
}

function createLog(input) {
  var sheet = getSheet();
  var now = new Date().toISOString();
  var log = {
    id: Utilities.getUuid(),
    date: input.date,
    clientName: input.clientName,
    work: input.work,
    eventType: input.eventType || "",
    qty: Number(input.qty) || 1,
    price: Number(input.price) || Number(input.amount),
    amount: Number(input.amount),
    paymentStatus: input.paymentStatus,
    status: input.status,
    own: input.own === true || input.own === "true",
    referrerName: input.referrerName || "",
    startTime: input.startTime || "",
    endTime: input.endTime || "",
    notes: input.notes || "",
    createdAt: now,
    updatedAt: now,
  };
  sheet.appendRow(objectToRow(log));
  forceTextFormat(sheet, sheet.getLastRow());
  return log;
}

// Locks the date/startTime/endTime cells of a row to plain-text format so
// Sheets stops auto-converting "2026-08-16" / "17:00" into Date values,
// which is what breaks date matching in the app (see formatDateCell above).
function forceTextFormat(sheet, rowIndex) {
  sheet.getRange(rowIndex, 2).setNumberFormat("@"); // date
  sheet.getRange(rowIndex, 13).setNumberFormat("@"); // startTime
  sheet.getRange(rowIndex, 14).setNumberFormat("@"); // endTime
}

function findRowIndexById(id) {
  var sheet = getSheet();
  var ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2; // 1-indexed, +1 for header row
  }
  return -1;
}

function updateLog(input) {
  var sheet = getSheet();
  var rowIndex = findRowIndexById(input.id);
  if (rowIndex === -1) throw new Error("Log not found: " + input.id);

  var existing = rowToObject(sheet.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0]);
  var updated = {};
  for (var i = 0; i < HEADERS.length; i++) {
    var key = HEADERS[i];
    updated[key] = input[key] !== undefined ? input[key] : existing[key];
  }
  updated.id = existing.id;
  updated.createdAt = existing.createdAt;
  updated.updatedAt = new Date().toISOString();
  updated.amount = Number(updated.amount);

  sheet.getRange(rowIndex, 1, 1, HEADERS.length).setValues([objectToRow(updated)]);
  forceTextFormat(sheet, rowIndex);
  return updated;
}

function deleteLog(input) {
  var sheet = getSheet();
  var rowIndex = findRowIndexById(input.id);
  if (rowIndex === -1) throw new Error("Log not found: " + input.id);
  sheet.deleteRow(rowIndex);
  return { success: true };
}

function updatePaymentStatus(input) {
  return updateLog({ id: input.id, paymentStatus: input.paymentStatus });
}

function getCalendarData(params) {
  var year = Number(params.year);
  var month = Number(params.month); // 1-indexed from client
  var monthKey = year + "-" + (month < 10 ? "0" + month : String(month));

  var logs = getLogs();
  var data = {};
  logs.forEach(function (log) {
    if (log.date.slice(0, 7) !== monthKey) return;
    if (!data[log.date]) {
      data[log.date] = { status: log.status, logs: [] };
    }
    data[log.date].logs.push(log);
    if (data[log.date].status !== log.status) {
      data[log.date].status = "MIXED";
    }
  });
  return data;
}
