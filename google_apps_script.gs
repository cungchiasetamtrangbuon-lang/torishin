// Google Apps Script template for syncing Torishin staff daily data.
// 1) Create a new Apps Script project.
// 2) Replace SHEET_ID with your Google Sheet ID.
// 3) Deploy as Web App and copy the web app URL into staff_daily.html.

const SHEET_ID = "YOUR_GOOGLE_SHEET_ID";
const DEFAULT_SHEET = "data";

function doGet(e) {
  const key = e.parameter.key || "torishin_rev_v3";
  const sheetName = e.parameter.sheet || DEFAULT_SHEET;
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  const values = sh.getDataRange().getDisplayValues();
  if (!values.length) {
    sh.appendRow(["key", "payload", "updatedAt"]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, data: null })).setMimeType(ContentService.MimeType.JSON);
  }

  const headers = values[0];
  const keyIndex = headers.indexOf("key");
  const payloadIndex = headers.indexOf("payload");
  const updatedIndex = headers.indexOf("updatedAt");
  if (keyIndex < 0 || payloadIndex < 0) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Missing columns" })).setMimeType(ContentService.MimeType.JSON);
  }

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][keyIndex]).trim() === String(key)) {
      const payload = values[i][payloadIndex] ? JSON.parse(values[i][payloadIndex]) : null;
      return ContentService.createTextOutput(JSON.stringify({ ok: true, data: payload })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: null })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || "{}");
  const key = payload.key || "torishin_rev_v3";
  const sheetName = payload.sheet || DEFAULT_SHEET;
  const data = payload.data || {};
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  const values = sh.getDataRange().getDisplayValues();
  if (!values.length) {
    sh.appendRow(["key", "payload", "updatedAt"]);
  }

  const headers = sh.getRange(1, 1, 1, 3).getValues()[0];
  const keyIndex = headers.indexOf("key");
  const payloadIndex = headers.indexOf("payload");
  const updatedIndex = headers.indexOf("updatedAt");

  const rowValues = sh.getDataRange().getDisplayValues();
  let found = false;
  for (let i = 1; i < rowValues.length; i++) {
    if (String(rowValues[i][keyIndex]).trim() === String(key)) {
      sh.getRange(i + 1, payloadIndex + 1).setValue(JSON.stringify(data));
      sh.getRange(i + 1, updatedIndex + 1).setValue(new Date().toISOString());
      found = true;
      break;
    }
  }

  if (!found) {
    sh.appendRow([key, JSON.stringify(data), new Date().toISOString()]);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
