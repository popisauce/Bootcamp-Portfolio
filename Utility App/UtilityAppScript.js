// =======================
// UPC Session Web App (GET-based) - Merge by PC13 UPC + Plain Text
// =======================
// Uses doGet and expects data via query parameters so that
// simple cross-origin GETs from a local HTML file work reliably.
//
// URL pattern the HTML will call:
//   https://script.google.com/macros/s/DEPLOYMENT_ID/exec?mode=upc_session&payload=<urlencoded JSON>
//
// Payload JSON structure:
// {
//   "mode": "upc_session",
//   "user": "username",
//   "sessionId": "some-session-id",
//   "header": [... final header names including Quantity ...],
//   "rows": [
//     [... row values matching header ...],
//     ...
//   ]
// }

/**
 * FILL THIS IN with the ID of your main Drive folder
 * (the same root folder you're already using).
 */
var ROOT_FOLDER_ID = "YOUR_ROOT_FOLDER_ID";

/**
 * Name of the subfolder we create/use under the root folder
 * for storing UPC session data.
 */
var UPC_SUBFOLDER_NAME = "UPC Session Logs";

/**
 * Name of the compiled Google Sheet inside the UPC session subfolder.
 * All sessions append into this one sheet.
 */
var COMPILED_SHEET_NAME = "UPC Session Compiled";

/**
 * Normalize a cell value to a trimmed string for comparison (e.g. UPC).
 */
function normalizeValue(v) {
  return String(v == null ? "" : v).trim();
}

/**
 * GET entry point.
 * We send data via query parameter 'payload' so that local HTML can call it with a GET.
 */
function doGet(e) {
  try {
    if (!e || !e.parameter) {
      return _jsonResponse({ ok: false, error: "No parameters received." });
    }

    var mode = e.parameter.mode || "";
    if (mode !== "upc_session") {
      return _jsonResponse({
        ok: false,
        error: "Invalid or missing mode; expected 'upc_session'.",
      });
    }

    var payloadStr = e.parameter.payload;
    if (!payloadStr) {
      return _jsonResponse({
        ok: false,
        error: "Missing 'payload' query parameter.",
      });
    }

    var data;
    try {
      data = JSON.parse(decodeURIComponent(payloadStr));
    } catch (err) {
      return _jsonResponse({
        ok: false,
        error: "Invalid JSON in payload: " + err,
      });
    }

    if (!data || !Array.isArray(data.header) || !Array.isArray(data.rows)) {
      return _jsonResponse({
        ok: false,
        error: "Payload must include 'header' and 'rows' arrays.",
      });
    }

    if (data.rows.length === 0) {
      return _jsonResponse({ ok: false, error: "No rows to process." });
    }

    // Open root folder
    var rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    } catch (err) {
      return _jsonResponse({
        ok: false,
        error: "Unable to open ROOT_FOLDER_ID: " + err,
      });
    }

    // Get or create UPC session subfolder
    var subfolder = _getOrCreateSubfolder(rootFolder, UPC_SUBFOLDER_NAME);

    // Get or create compiled sheet file
    var sheetFile = _getOrCreateSpreadsheet(subfolder, COMPILED_SHEET_NAME);
    var ss = SpreadsheetApp.open(sheetFile);
    var sheet = ss.getSheets()[0];

    // --- CLEANUP: If old Timestamp/User/SessionId columns exist, drop them ---
    if (sheet.getLastRow() > 0 && sheet.getLastColumn() >= 3) {
      var firstRowValues = sheet
        .getRange(1, 1, 1, sheet.getLastColumn())
        .getValues()[0];
      if (
        firstRowValues[0] === "Timestamp" &&
        firstRowValues[1] === "User" &&
        firstRowValues[2] === "SessionId"
      ) {
        // Delete first column 3 times (columns shift left after each delete)
        sheet.deleteColumn(1);
        sheet.deleteColumn(1);
        sheet.deleteColumn(1);
      }
    }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    // Ensure header row matches data.header
    if (lastRow === 0) {
      // Empty sheet: write header
      sheet.getRange(1, 1, 1, data.header.length).setValues([data.header]);
      lastRow = 1;
      lastCol = data.header.length;
    } else {
      // Overwrite existing header with new header names
      sheet.getRange(1, 1, 1, data.header.length).setValues([data.header]);
      lastCol = data.header.length;
    }

    // Force entire used range (header + some reasonable number of rows) to Plain Text
    sheet.getRange(1, 1, Math.max(lastRow, 5000), lastCol).setNumberFormat("@");

    // Re-read header row after any header rewrite
    var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    // Locate PC13 UPC and Quantity columns by header name
    var upcColIndex = headerRow.indexOf("PC13 UPC"); // 0-based
    var qtyColIndex = headerRow.indexOf("Quantity"); // 0-based

    if (upcColIndex === -1 || qtyColIndex === -1) {
      return _jsonResponse({
        ok: false,
        error: "Could not find 'PC13 UPC' or 'Quantity' columns in header.",
      });
    }

    // ===== Build totals map from existing data =====
    var totalsByUpc = {};

    if (lastRow > 1) {
      var existingValues = sheet
        .getRange(2, 1, lastRow - 1, lastCol)
        .getValues();
      for (var i = 0; i < existingValues.length; i++) {
        var row = existingValues[i];
        var upc = normalizeValue(row[upcColIndex]);
        if (!upc) continue;

        var qtyRaw = row[qtyColIndex];
        var qty = parseFloat(qtyRaw || 0);
        if (isNaN(qty)) qty = 0;

        if (!totalsByUpc.hasOwnProperty(upc)) {
          // Store a copy of the row
          totalsByUpc[upc] = row.slice();
          totalsByUpc[upc][qtyColIndex] = qty;
        } else {
          // Add to existing total
          var current = totalsByUpc[upc];
          var currentQtyRaw = current[qtyColIndex];
          var currentQty = parseFloat(currentQtyRaw || 0);
          if (isNaN(currentQty)) currentQty = 0;
          current[qtyColIndex] = currentQty + qty;
        }
      }
    }

    // ===== Merge incoming rows into totals map =====
    for (var r = 0; r < data.rows.length; r++) {
      var incomingRow = data.rows[r];
      if (!Array.isArray(incomingRow)) continue;

      var upcIncoming = normalizeValue(incomingRow[upcColIndex]);
      if (!upcIncoming) continue;

      var qtyIncomingRaw = incomingRow[qtyColIndex];
      var qtyIncoming = parseFloat(qtyIncomingRaw || 0);
      if (isNaN(qtyIncoming)) qtyIncoming = 0;

      if (!totalsByUpc.hasOwnProperty(upcIncoming)) {
        // New UPC
        var copyRow = incomingRow.slice();
        copyRow[qtyColIndex] = qtyIncoming;
        totalsByUpc[upcIncoming] = copyRow;
      } else {
        // Existing UPC: add to Quantity
        var existing = totalsByUpc[upcIncoming];
        var existingQtyRaw2 = existing[qtyColIndex];
        var existingQty2 = parseFloat(existingQtyRaw2 || 0);
        if (isNaN(existingQty2)) existingQty2 = 0;
        existing[qtyColIndex] = existingQty2 + qtyIncoming;
      }
    }

    // ===== Rewrite all data rows from totalsByUpc =====

    // Clear existing data rows (keep header)
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    }

    // Build final rows array from totalsByUpc map
    var finalRows = [];
    for (var upcKey in totalsByUpc) {
      if (totalsByUpc.hasOwnProperty(upcKey)) {
        finalRows.push(totalsByUpc[upcKey]);
      }
    }

    if (finalRows.length > 0) {
      sheet.getRange(2, 1, finalRows.length, lastCol).setValues(finalRows);
      // Ensure final rows are plain text as well
      sheet.getRange(2, 1, finalRows.length, lastCol).setNumberFormat("@");
    }

    return _jsonResponse({ ok: true, mergedRows: finalRows.length });
  } catch (err) {
    return _jsonResponse({ ok: false, error: "Unexpected error: " + err });
  }
}

/**
 * Helper: get or create a subfolder with the given name inside parentFolder.
 */
function _getOrCreateSubfolder(parentFolder, name) {
  var folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(name);
}

/**
 * Helper: get or create a Spreadsheet file with the given name inside folder.
 */
function _getOrCreateSpreadsheet(folder, name) {
  var files = folder.getFilesByName(name);
  if (files.hasNext()) {
    return files.next();
  }
  var ss = SpreadsheetApp.create(name);
  var file = DriveApp.getFileById(ss.getId());
  folder.addFile(file);
  // Remove from My Drive root to keep things tidy
  DriveApp.getRootFolder().removeFile(file);
  return file;
}

/**
 * Helper to return JSON HTTP responses.
 */
function _jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
