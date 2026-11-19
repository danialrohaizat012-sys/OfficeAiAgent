// GILAPIPS: agent Syafiq (komuniti & ahli) — Google Apps Script
// -----------------------------------------------------------------
// Baca Firestore laman GilaPips (projek "gilapips") — BACA SAHAJA, KIRAAN SAHAJA.
// Tiada nama, emel atau data ahli dihantar ke Markas. Tiada apa-apa ditulis ke Firestore.
//
// Syafiq lapor:
//   • jumlah ahli berdaftar (members) dan ahli baru 7 hari / hari ini
//   • permintaan pengesahan (verificationRequests) yang menunggu semakan admin
//   • perlu keputusan bila ada permintaan menunggu lebih 2 hari
//
// Akses Firestore guna akaun Google Danial sendiri (pemilik projek Firebase gilapips).
//
// Tetapan (Apps Script → ⚙ Project Settings → Script Properties):
//   MARKAS_URL        https://office-ai-agent-tawny.vercel.app
//   MARKAS_AGENT_KEY  (kunci agent dari Vercel)
//   FIREBASE_PROJECT  gilapips
//
// Fungsi: ujiGilaPips() sekali untuk uji · pasangJadual() sekali (setiap 3 jam) · jalankanGilaPips() (jadual)

var AGENT_ID = "syafiq";

function tetapan_() {
  var p = PropertiesService.getScriptProperties().getProperties();
  if (!p.MARKAS_URL || !p.MARKAS_AGENT_KEY || !p.FIREBASE_PROJECT) {
    throw new Error("Tetapan belum lengkap: isi MARKAS_URL, MARKAS_AGENT_KEY dan FIREBASE_PROJECT dalam Script Properties.");
  }
  return p;
}

function jalankanGilaPips() { return kerja_(tetapan_()); }
function ujiGilaPips() { Logger.log("Berjaya dihantar ke Markas:\n\n" + kerja_(tetapan_())); }

function pasangJadual() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "jalankanGilaPips") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("jalankanGilaPips").timeBased().everyHours(3).create();
  Logger.log("Jadual dipasang: Syafiq kemas kini setiap 3 jam.");
}

function kerja_(p) {
  var now = new Date();
  hantar_(p, { sedang: "Mengira ahli komuniti…", sibuk: true });
  var tujuhHari = new Date(now.getTime() - 7 * 86400e3).toISOString();
  var hariIni = new Date(Utilities.formatDate(now, "Asia/Kuala_Lumpur", "yyyy-MM-dd") + "T00:00:00+08:00").toISOString();
  var duaHari = new Date(now.getTime() - 2 * 86400e3).toISOString();
  var r = {
    ahli: kira_(p, "members", null),
    baru7: kira_(p, "members", tTs_("createdAt", "GREATER_THAN_OR_EQUAL", tujuhHari)),
    baruHari: kira_(p, "members", tTs_("createdAt", "GREATER_THAN_OR_EQUAL", hariIni)),
    menunggu: kira_(p, "verificationRequests", tStr_("status", "EQUAL", "pending")),
    menungguLama: kira_(p, "verificationRequests", { compositeFilter: { op: "AND", filters: [
      tStr_("status", "EQUAL", "pending"), tTs_("submittedAt", "LESS_THAN", duaHari)] } }),
  };
  var out = ringkasan_(r);
  hantar_(p, { sedang: out.ringkas, sibuk: false, report: out.report, keputusan: out.keputusan, angka: out.angka });
  return out.report;
}

// ---------------------------------------------------------------- kiraan (tiada panggilan Google; boleh diuji)

function ringkasan_(r) {
  var L = [];
  L.push("KOMUNITI GILAPIPS: " + r.ahli + " ahli berdaftar");
  L.push("• Ahli baru: " + r.baruHari + " hari ini, " + r.baru7 + " dalam 7 hari");
  L.push("• Permintaan pengesahan menunggu semakan: " + r.menunggu + (r.menungguLama ? " (" + r.menungguLama + " lebih 2 hari)" : ""));
  L.push("");
  L.push("Nota: kiraan sahaja; tiada data ahli dihantar ke Markas. Edukasi sahaja, bukan nasihat pelaburan.");
  var keputusan = r.menungguLama ? r.menungguLama + " permintaan pengesahan ahli GilaPips menunggu lebih 2 hari. Semak di halaman admin?" : null;
  return {
    ringkas: r.ahli + " ahli · " + r.baru7 + " baru minggu ini" + (r.menunggu ? " · " + r.menunggu + " tunggu pengesahan" : ""),
    report: L.join("\n"), keputusan: keputusan,
    angka: { ahli: r.ahli, ahliBaru7: r.baru7, ahliBaruHari: r.baruHari, menunggu: r.menunggu },
  };
}

// ---------------------------------------------------------------- Firestore (baca sahaja, kiraan)

function tStr_(field, op, str) { return { fieldFilter: { field: { fieldPath: field }, op: op, value: { stringValue: str } } }; }
function tTs_(field, op, iso) { return { fieldFilter: { field: { fieldPath: field }, op: op, value: { timestampValue: iso } } }; }

function kira_(p, koleksi, tapis) {
  var q = { from: [{ collectionId: koleksi }] };
  if (tapis) q.where = tapis;
  var url = "https://firestore.googleapis.com/v1/projects/" + p.FIREBASE_PROJECT + "/databases/(default)/documents:runAggregationQuery";
  var res = UrlFetchApp.fetch(url, {
    method: "post", contentType: "application/json",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken(), "x-goog-user-project": p.FIREBASE_PROJECT },
    payload: JSON.stringify({ structuredAggregationQuery: { structuredQuery: q, aggregations: [{ alias: "n", count: {} }] } }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error("Firestore (" + koleksi + ") ralat " + res.getResponseCode() + ": " + res.getContentText().slice(0, 300));
  var x = JSON.parse(res.getContentText())[0];
  return x && x.result ? +x.result.aggregateFields.n.integerValue : 0;
}

// ---------------------------------------------------------------- hantar ke Markas

function hantar_(p, data) {
  data.agent = AGENT_ID;
  var res = UrlFetchApp.fetch(p.MARKAS_URL.replace(/\/$/, "") + "/api/status", {
    method: "post", contentType: "application/json",
    headers: { Authorization: "Bearer " + p.MARKAS_AGENT_KEY },
    payload: JSON.stringify(data), muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error("Markas tolak (" + res.getResponseCode() + "): " + res.getContentText());
}

// untuk ujian Node (diabaikan oleh Apps Script)
if (typeof module !== "undefined") module.exports = { ringkasan_: ringkasan_ };
