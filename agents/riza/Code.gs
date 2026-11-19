/**
 * RIZA V1 — autonomous, read-public-data-only lead researcher for BinaLab.
 *
 * Google Apps Script runs daily with time-based trigger after user configuration.
 * Sources: Google Places API (New) Text Search, public business listings only.
 * Writes to dedicated "Riza Leads" tab; never sends prospect messages.
 * Secrets must be in Apps Script Script Properties, NEVER in GitHub.
 *
 * Required properties: GOOGLE_PLACES_API_KEY, PROSPECT_SHEET_ID
 * Optional: MARKAS_URL, MARKAS_AGENT_KEY, DAILY_LEAD_LIMIT (default 10).
 */
var RIZA = {
  AGENT: 'riza',
  TAB: 'Riza Leads',
  TIMEZONE: 'Asia/Kuala_Lumpur',
  QUERIES: [
    { q: 'kedai motosikal Kota Bharu Kelantan Malaysia', sector: 'Automotive', offer: 'Custom System' },
    { q: 'kedai printing signage Kota Bharu Kelantan Malaysia', sector: 'Printing', offer: 'Custom System' },
    { q: 'restoran Kota Bharu Kelantan Malaysia', sector: 'F&B', offer: 'Bina Menu' },
    { q: 'bengkel kereta Pasir Mas Kelantan Malaysia', sector: 'Automotive', offer: 'Custom System' },
    { q: 'kafe Machang Kelantan Malaysia', sector: 'F&B', offer: 'Bina Menu' },
    { q: 'kedai komputer Tanah Merah Kelantan Malaysia', sector: 'Electronics', offer: 'Custom System' },
    { q: 'restoran Kuala Terengganu Malaysia', sector: 'F&B', offer: 'Bina Menu' }
  ],
  HEADERS: [
    'Date Discovered', 'Lead ID', 'Business Name', 'Category', 'Address',
    'Public Business Phone', 'Website', 'Google Maps URL', 'Place ID',
    'Recommended Product', 'Lead Score', 'Reason', 'Source',
    'Lead Status', 'Owner', 'Last Checked'
  ]
};

function rizaSettings_() {
  var p = PropertiesService.getScriptProperties().getProperties();
  if (!p.GOOGLE_PLACES_API_KEY || !p.PROSPECT_SHEET_ID) {
    throw new Error('Missing GOOGLE_PLACES_API_KEY / PROSPECT_SHEET_ID in Script Properties');
  }
  var limit = Math.max(1, Math.min(10, Number(p.DAILY_LEAD_LIMIT || 10)));
  return { apiKey: p.GOOGLE_PLACES_API_KEY, spreadsheet: p.PROSPECT_SHEET_ID,
    limit: limit, markasUrl: p.MARKAS_URL || '', markasKey: p.MARKAS_AGENT_KEY || '' };
}

function rizaToday_() {
  return Utilities.formatDate(new Date(), RIZA.TIMEZONE, 'yyyy-MM-dd');
}

function rizaNormalize_(s) {
  return String(s || '').toLowerCase().normalize('NFKC')
    .replace(/[^\\p{L}\\p{N}]/gu, '');
}
function rizaDomain_(url) {
  try {
    var u = new URL(url);
    return u.hostname.toLowerCase().replace(/^www\\./, '');
  } catch (e) { return ''; }
}
function rizaName_(p) {
  return (p.displayName && p.displayName.text) || '';
}
function rizaStatus_(settings, data) {
  if (!settings.markasKey || !settings.markasUrl) return;
  data.agent = RIZA.AGENT;
  var u = settings.markasUrl.replace(/\\/$/, '') + '/api/status';
  var resp = UrlFetchApp.fetch(u, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + settings.markasKey },
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  });
  if (resp.getResponseCode() >= 300) {
    Logger.log('Status Markas failed: HTTP ' + resp.getResponseCode());
  }
}

function rizaGetSheet_(ss) {
  var sheet = ss.getSheetByName(RIZA.TAB);
  if (!sheet) {
    sheet = ss.insertSheet(RIZA.TAB);
    sheet.getRange(1, 1, 1, RIZA.HEADERS.length).setValues([RIZA.HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, RIZA.HEADERS.length)
      .setBackground('#153443').setFontColor('#ffffff').setFontWeight('bold');
    sheet.autoResizeColumns(1, RIZA.HEADERS.length);
  }
  var headers = sheet.getRange(1, 1, 1, RIZA.HEADERS.length).getValues()[0];
  if (headers.join('|') !== RIZA.HEADERS.join('|')) {
    throw new Error('Riza Leads header schema changed. Refusing to overwrite or append.');
  }
  return sheet;
}

function rizaExisting_(ss, ownSheet) {
  var ids = {}, names = {}, phones = {}, domains = {};
  ss.getSheets().forEach(function(sheet) {
    var rows = sheet.getLastRow();
    if (rows < 2 || rows > 30000) return;
    var data = sheet.getRange(1, 1, rows, Math.min(sheet.getLastColumn(), 30)).getDisplayValues();
    var head = data[0].map(function(s) { return String(s).toLowerCase().trim(); });
    function find(names) { for (var i = 0; i < names.length; i++) { var n = head.indexOf(names[i]); if (n >= 0) return n; } return -1; }
    var nameCol = find(['business name', 'nama perniagaan', 'company name']);
    var idCol = find(['place id']);
    var phoneCol = find(['public business phone', 'phone', 'phone number']);
    var webCol = find(['website']);
    if (nameCol < 0 && idCol < 0) return;
    data.slice(1).forEach(function(row) {
      if (idCol >= 0 && row[idCol]) ids[row[idCol]] = true;
      if (nameCol >= 0 && row[nameCol]) names[rizaNormalize_(row[nameCol])] = true;
      if (phoneCol >= 0 && row[phoneCol]) phones[rizaNormalize_(row[phoneCol])] = true;
      if (webCol >= 0 && row[webCol]) { var d = rizaDomain_(row[webCol]); if (d) domains[d] = true; }
    });
  });
  return { ids: ids, names: names, phones: phones, domains: domains };
}

function rizaHasDuplicate_(p, seen) {
  var name = rizaNormalize_(rizaName_(p));
  var phone = rizaNormalize_(p.nationalPhoneNumber || '');
  var domain = rizaDomain_(p.websiteUri || '');
  return Boolean((p.id && seen.ids[p.id]) || (name && seen.names[name]) ||
    (phone && seen.phones[phone]) || (domain && seen.domains[domain]));
}
function rizaRemember_(p, seen) {
  if (p.id) seen.ids[p.id] = true;
  var name = rizaNormalize_(rizaName_(p));
  if (name) seen.names[name] = true;
  var phone = rizaNormalize_(p.nationalPhoneNumber || '');
  if (phone) seen.phones[phone] = true;
  var domain = rizaDomain_(p.websiteUri || '');
  if (domain) seen.domains[domain] = true;
}

function rizaSearch_(key, query) {
  var body = { textQuery: query, languageCode: 'ms', regionCode: 'MY', pageSize: 20 };
  var response = UrlFetchApp.fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'post', contentType: 'application/json',
    headers: { 'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,places.businessStatus,places.primaryType' },
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('Places API HTTP ' + response.getResponseCode() + ': ' +
      response.getContentText().slice(0, 250));
  }
  return (JSON.parse(response.getContentText()).places || [])
    .filter(function(p) { return p.businessStatus !== 'CLOSED_PERMANENTLY' && rizaName_(p); });
}
function rizaScore_(p, sector) {
  // Transparent heuristic, not a verified assessment of commercial intent.
  var score = 45;
  if (p.nationalPhoneNumber) score += 10;
  if (p.websiteUri) score += 10;
  if (p.googleMapsUri) score += 10;
  if (sector === 'F&B') score += 10;
  return Math.min(score, 85);
}
function rizaReasons_(p, sector) {
  var list = ['Sector match: ' + sector];
  if (p.websiteUri) list.push('Public website available');
  else list.push('No website returned by listing (not independently verified)');
  if (p.nationalPhoneNumber) list.push('Public business phone available');
  list.push('Human qualification required before outreach');
  return list.join('; ');
}

function jalankanRiza() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return 'Skipped: existing run in progress';
  var p;
  try {
    p = rizaSettings_();
    rizaStatus_(p, { sedang: 'Mencari prospek awam yang relevan…', sibuk: true });
    var ss = SpreadsheetApp.openById(p.spreadsheet), sh = rizaGetSheet_(ss);
    var seen = rizaExisting_(ss, sh);
    var day = rizaToday_();
    // Rotate search categories so each run covers one or two focused markets.
    var cycle = Math.floor(new Date().getTime() / 86400000) % RIZA.QUERIES.length;
    var selected = [RIZA.QUERIES[cycle], RIZA.QUERIES[(cycle + 1) % RIZA.QUERIES.length]];
    var collected = [], duplicates = 0, searched = 0;
    for (var q = 0; q < selected.length && collected.length < p.limit; q++) {
      var item = selected[q], places = rizaSearch_(p.apiKey, item.q);
      for (var i = 0; i < places.length && collected.length < p.limit; i++) {
        var place = places[i]; searched++;
        if (rizaHasDuplicate_(place, seen)) { duplicates++; continue; }
        // Avoid personal data; only public business directory fields.
        var leadId = 'RIZA-' + day.replace(/-/g, '') + '-' + String(collected.length + 1).padStart(2, '0');
        collected.push([day, leadId, rizaName_(place), item.sector,
          place.formattedAddress || '', place.nationalPhoneNumber || '',
          place.websiteUri || '', place.googleMapsUri || '', place.id || '',
          item.offer, rizaScore_(place, item.sector), rizaReasons_(place, item.sector),
          'Google Places Text Search', 'New - Needs Review', 'Fakhri', day]);
        rizaRemember_(place, seen);
      }
    }
    if (collected.length) {
      sh.getRange(sh.getLastRow() + 1, 1, collected.length, RIZA.HEADERS.length)
        .setValues(collected);
    }
    var report = 'RIZA V1 · ' + day +
      '\\nProspek baharu: ' + collected.length +
      '\\nDisemak: ' + searched + ' · pendua: ' + duplicates +
      '\\nSumber: Google Places (listing perniagaan awam)' +
      '\\nDisimpan: ' + RIZA.TAB + ' (untuk semakan Fakhri)' +
      '\\nTiada mesej outreach dihantar secara automatik.';
    rizaStatus_(p, { sedang: collected.length + ' lead baharu · perlu semakan Fakhri',
      sibuk: false, report: report });
    Logger.log(report);
    return report;
  } catch (err) {
    Logger.log('Riza failed: ' + err.message);
    if (p) {
      try { rizaStatus_(p, { sedang: 'Ralat semasa prospecting', sibuk: false,
        report: 'Riza gagal: ' + String(err.message).slice(0, 280),
        keputusan: 'Semak konfigurasi/kuota Google Places API dan Apps Script.' }); } catch (ignored) {}
    }
    throw err;
  } finally { lock.releaseLock(); }
}

function ujiRiza() { return jalankanRiza(); }
function pasangJadual() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'jalankanRiza') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('jalankanRiza').timeBased().everyDays(1).atHour(9)
    .inTimezone(RIZA.TIMEZONE).create();
  Logger.log('Riza dijadualkan setiap hari sekitar 9 pagi waktu Malaysia');
}
function hentikanJadual() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'jalankanRiza') ScriptApp.deleteTrigger(t);
  });
}
