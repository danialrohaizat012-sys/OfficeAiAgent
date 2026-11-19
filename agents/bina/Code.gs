// BINA: agent pipeline & prospek BinaLab (Google Apps Script)
// -----------------------------------------------------------------
// Baca tracker prospek dalam Google Sheet, kira RINGKASAN sahaja,
// dan hantar ke Markas (/api/status). Data mentah (nama, telefon,
// alamat prospek) TIDAK dihantar; hanya angka dan senarai Lead ID.
//
// Tetapan (Apps Script → ⚙ Project Settings → Script Properties):
//   MARKAS_URL        https://office-ai-agent-tawny.vercel.app
//   MARKAS_AGENT_KEY  (kunci agent dari Vercel; JANGAN tulis dalam kod)
//   SHEET_MY          ID Google Sheet tracker Malaysia (dari URL .../d/<ID>/edit)
//   SHEET_GLOBAL      ID Google Sheet tracker BinaLab Global (pilihan)
//   TELEGRAM_BOT_TOKEN   (pilihan) token bot Markas dari @BotFather
//   TELEGRAM_CHAT_FAKHRI (pilihan) Chat ID Fakhri (bot beri bila Fakhri tekan Start)
//
// Bina → Fakhri (Telegram, pilihan): setiap pagi Bina hantar 5 prospek untuk dihubungi
// hari ini, dengan butang WhatsApp (draf mesej; Fakhri semak & tekan Send). Nama & telefon
// prospek pergi TERUS dari Google ke Telegram Fakhri sahaja; TIDAK dihantar ke Markas.
// Pilihan prospek: lajur "Next Follow-up" ≤ hari ini dahulu; kalau tiada lajur itu,
// lead yang belum dihubungi (Lead Status kosong/NEW dan "Last Contact" kosong).
//
// Fungsi untuk dijalankan:
//   ujiBina()        sekali, untuk uji (lihat Execution log)
//   pasangJadual()   sekali, untuk Bina jalan setiap pagi 8:00
//   jalankanBina()   kerja harian (dipanggil oleh jadual)
//   ujiTelegramBina() hantar 5 prospek ke Fakhri sekarang (uji Telegram)

var AGENT_ID = "bina";

function jalankanBina() {
  var p = PropertiesService.getScriptProperties().getProperties();
  if (!p.MARKAS_URL || !p.MARKAS_AGENT_KEY || !p.SHEET_MY) {
    throw new Error("Tetapan belum lengkap: isi MARKAS_URL, MARKAS_AGENT_KEY dan SHEET_MY dalam Script Properties.");
  }
  hantar_(p, { sedang: "Membaca tracker prospek…", sibuk: true });

  var tabsMY = bacaSemuaTab_(p.SHEET_MY, /prospect/i);
  var my = ringkasanMY_(tabsMY);
  var gl = p.SHEET_GLOBAL ? ringkasanGlobal_(bacaSemuaTab_(p.SHEET_GLOBAL, /./), new Date()) : null;
  var report = tulisReport_(my, gl);

  var ringkas = "Pipeline MY " + my.jumlah + " lead" + (gl ? " · Global " + gl.jumlah : "") +
    (gl && gl.lewat ? " · " + gl.lewat + " follow-up lewat" : "");
  var angka = { leadMY: my.jumlah };
  if (gl) { angka.prospekGlobal = gl.jumlah; angka.followupLewat = gl.lewat; angka.followupHariIni = gl.hariIniFollowup; }
  hantar_(p, { sedang: ringkas, sibuk: false, report: report, angka: angka });

  if (p.TELEGRAM_BOT_TOKEN && p.TELEGRAM_CHAT_FAKHRI) binaTelegram_(p, pilihHubungi_(tabsMY, new Date(), 5));
  return report;
}

function ujiTelegramBina() {
  var p = PropertiesService.getScriptProperties().getProperties();
  if (!p.TELEGRAM_BOT_TOKEN || !p.TELEGRAM_CHAT_FAKHRI || !p.SHEET_MY) throw new Error("Isi TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_FAKHRI dan SHEET_MY dalam Script Properties.");
  binaTelegram_(p, pilihHubungi_(bacaSemuaTab_(p.SHEET_MY, /prospect/i), new Date(), 5));
  Logger.log("Dihantar ke Telegram Fakhri.");
}

// ---------------------------------------------------------------- Telegram (Bina → Fakhri)

// Pilih N prospek untuk dihubungi hari ini (tiada panggilan Google; boleh diuji)
function pilihHubungi_(tabs, hariIni, n) {
  var d0 = new Date(hariIni.getFullYear(), hariIni.getMonth(), hariIni.getDate());
  var ikutTarikh = [], belumHubungi = [], adaLajurFU = false;
  tabs.forEach(function (t) {
    var h = t.header;
    var c = { nama: kol_(h, "Business Name"), kat: kol_(h, "Category"), tel: kol_(h, "Phone"), st: kol_(h, "Lead Status"),
      fu: kol_(h, "Next Follow-up"), lc: kol_(h, "Last Contact"), akt: kol_(h, "Active Check") };
    if (c.nama < 0) return;
    if (c.fu >= 0) adaLajurFU = true;
    var negeri = t.tab.replace(/prospect/i, "").trim() || t.tab;
    t.rows.forEach(function (row) {
      var nama = teks_(row[c.nama]); if (!nama) return;
      var x = { nama: nama, kat: c.kat >= 0 ? teks_(row[c.kat]) : "", tel: c.tel >= 0 ? teks_(row[c.tel]) : "", negeri: negeri,
        status: c.st >= 0 ? teks_(row[c.st]) : "" };
      if (c.akt >= 0 && /tutup|closed|inactive|tidak aktif/i.test(teks_(row[c.akt]))) return;
      if (/won|lost|menang|kalah|tolak|reject|closed/i.test(x.status)) return;
      var fu = c.fu >= 0 ? tarikh_(row[c.fu]) : null;
      if (fu && fu <= d0) { x.fu = fu; ikutTarikh.push(x); return; }
      var lc = c.lc >= 0 ? teks_(row[c.lc]) : "";
      if (!fu && !lc && (!x.status || /^new$|baru|belum/i.test(x.status))) belumHubungi.push(x);
    });
  });
  ikutTarikh.sort(function (a, b) { return a.fu - b.fu; });
  var pilih = ikutTarikh.concat(belumHubungi.filter(function (x) { return x.tel; }), belumHubungi.filter(function (x) { return !x.tel; })).slice(0, n);
  return { senarai: pilih, adaLajurFU: adaLajurFU, lewat: ikutTarikh.length };
}

function noWa_(tel) {
  var d = String(tel || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.indexOf("60") === 0) return d;
  if (d.charAt(0) === "0") return "6" + d;
  if (d.charAt(0) === "1") return "60" + d;
  return d;
}

function binaTelegram_(p, h) {
  if (!h.senarai.length) { tg_(p, p.TELEGRAM_CHAT_FAKHRI, "📞 Bina: tiada prospek perlu dihubungi hari ini. 👍"); return; }
  var L = ["📞 BINA · " + h.senarai.length + " prospek untuk dihubungi hari ini", ""];
  var butang = [];
  h.senarai.forEach(function (x, i) {
    var bila = x.fu ? "follow-up " + Utilities.formatDate(x.fu, "Asia/Kuala_Lumpur", "d/M") : "belum pernah dihubungi";
    L.push((i + 1) + ". " + x.nama + (x.kat ? " · " + x.kat : "") + " · " + x.negeri + " · " + bila);
    var no = noWa_(x.tel);
    if (!no) { L.push("   (tiada nombor telefon dalam tracker)"); return; }
    var mesej = "Salam " + x.nama + ", saya dari BinaLab 👋 Kami bantu bisnes bina sistem ringkas seperti tempahan, stok dan review pelanggan. Boleh saya kongsi contoh yang sesuai untuk bisnes anda?";
    butang.push([{ text: "📲 WhatsApp " + x.nama.slice(0, 40), url: "https://wa.me/" + no + "?text=" + encodeURIComponent(mesej) }]);
  });
  L.push("");
  if (!h.adaLajurFU) L.push("ℹ️ Tracker MY belum ada lajur \"Next Follow-up\" dan \"Last Contact\". Tambah 2 lajur ini supaya Bina boleh susun ikut tarikh follow-up.");
  L.push("Tekan butang → WhatsApp buka dengan draf. Semak & ubah dulu, kemudian tekan Send. Lepas hubungi, kemas kini tracker (Last Contact / Next Follow-up).");
  tg_(p, p.TELEGRAM_CHAT_FAKHRI, L.join("\n"), butang);
}

function tg_(p, chat, teks, butang) {
  var payload = { chat_id: chat, text: teks.slice(0, 4000), disable_web_page_preview: true };
  if (butang && butang.length) payload.reply_markup = { inline_keyboard: butang };
  var res = UrlFetchApp.fetch("https://api.telegram.org/bot" + p.TELEGRAM_BOT_TOKEN + "/sendMessage", {
    method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) Logger.log("Telegram gagal (" + res.getResponseCode() + "): " + res.getContentText());
}

function ujiBina() {
  var report = jalankanBina();
  Logger.log("Berjaya dihantar ke Markas:\n\n" + report);
}

function pasangJadual() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "jalankanBina") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("jalankanBina").timeBased().everyDays(1).atHour(8).inTimezone("Asia/Kuala_Lumpur").create();
  Logger.log("Jadual dipasang: Bina akan jalan setiap hari sekitar 8:00 pagi.");
}

// ---------------------------------------------------------------- baca Sheet

// Pulangkan [{tab, header:[...], rows:[[...]]}] untuk semua tab yang namanya padan.
function bacaSemuaTab_(sheetId, padanNama) {
  var ss = SpreadsheetApp.openById(sheetId);
  return ss.getSheets().filter(function (sh) { return padanNama.test(sh.getName()); }).map(function (sh) {
    var v = sh.getDataRange().getValues();
    return { tab: sh.getName(), header: (v[0] || []).map(String), rows: v.slice(1) };
  });
}

// ---------------------------------------------------------------- kiraan (tiada panggilan Google; boleh diuji)

function kol_(header, nama) {
  var n = nama.toLowerCase();
  for (var i = 0; i < header.length; i++) if (String(header[i]).trim().toLowerCase() === n) return i;
  return -1;
}
function tambah_(obj, key) { key = key || "(kosong)"; obj[key] = (obj[key] || 0) + 1; }
function teks_(v) { return v == null ? "" : String(v).trim(); }

// Segmen ringkas dari kategori, untuk lihat automotive vs printing/signage dll.
function segmen_(kategori) {
  var k = kategori.toLowerCase();
  if (/motor|kereta|car|auto|vehicle|dealer/.test(k)) return "Automotive";
  if (/print|sign|banner|apparel|merchandise|packaging/.test(k)) return "Printing/signage";
  if (/repair|phone|computer|gadget|electronic/.test(k)) return "Repair/elektronik";
  if (/food|cafe|restoran|restaurant|kopi|makan/.test(k)) return "F&B";
  return k ? "Lain-lain" : "(tiada kategori)";
}

function ringkasanMY_(tabs) {
  var r = { jumlah: 0, status: {}, filter: {}, aktif: {}, negeri: {}, segmen: {}, idBerulang: [], tanpaTelefon: 0 };
  var idSeen = {};
  tabs.forEach(function (t) {
    var h = t.header;
    var c = { id: kol_(h, "Lead ID"), nama: kol_(h, "Business Name"), kat: kol_(h, "Category"), tel: kol_(h, "Phone"),
      st: kol_(h, "Lead Status"), fil: kol_(h, "Prospect Filter"), akt: kol_(h, "Active Check") };
    if (c.nama < 0) return;
    var negeri = t.tab.replace(/prospect/i, "").trim() || t.tab;
    t.rows.forEach(function (row) {
      if (!teks_(row[c.nama])) return;
      r.jumlah++;
      tambah_(r.negeri, negeri);
      tambah_(r.status, c.st >= 0 ? teks_(row[c.st]).toUpperCase() : "");
      tambah_(r.filter, c.fil >= 0 ? teks_(row[c.fil]).toUpperCase() : "");
      tambah_(r.aktif, c.akt >= 0 ? teks_(row[c.akt]).toUpperCase() : "");
      tambah_(r.segmen, segmen_(c.kat >= 0 ? teks_(row[c.kat]) : ""));
      if (c.tel >= 0 && !teks_(row[c.tel])) r.tanpaTelefon++;
      var id = c.id >= 0 ? teks_(row[c.id]) : "";
      if (id) {
        if (idSeen[id] === 1) r.idBerulang.push(id);
        idSeen[id] = (idSeen[id] || 0) + 1;
      }
    });
  });
  return r;
}

function tarikh_(v) {
  if (v instanceof Date && !isNaN(v)) return v;
  var s = teks_(v); if (!s) return null;
  var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/) || null;
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);            // dd/mm/yyyy
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  return null;
}
function nombor_(v) {
  if (typeof v === "number") return v;
  var n = parseFloat(teks_(v).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function ringkasanGlobal_(tabs, hariIni) {
  var r = { jumlah: 0, peringkat: {}, negara: {}, segmen: {}, keutamaanTinggi: 0, lewat: 0, hariIniFollowup: 0, potensiUSD: 0 };
  var d0 = new Date(hariIni.getFullYear(), hariIni.getMonth(), hariIni.getDate());
  tabs.forEach(function (t) {
    var h = t.header;
    var c = { nama: kol_(h, "Business Name"), neg: kol_(h, "Country"), ind: kol_(h, "Industry"), pri: kol_(h, "Priority"),
      st: kol_(h, "Pipeline Stage"), fu: kol_(h, "Next Follow-up"), usd: kol_(h, "Potential USD") };
    if (c.nama < 0) return;
    t.rows.forEach(function (row) {
      if (!teks_(row[c.nama])) return;
      r.jumlah++;
      tambah_(r.peringkat, c.st >= 0 ? teks_(row[c.st]) : "");
      tambah_(r.negara, c.neg >= 0 ? teks_(row[c.neg]) : "");
      tambah_(r.segmen, segmen_(c.ind >= 0 ? teks_(row[c.ind]) : ""));
      if (c.pri >= 0 && /high|tinggi/i.test(teks_(row[c.pri]))) r.keutamaanTinggi++;
      if (c.usd >= 0) r.potensiUSD += nombor_(row[c.usd]);
      var fu = c.fu >= 0 ? tarikh_(row[c.fu]) : null;
      if (fu) { if (fu < d0) r.lewat++; else if (fu.getTime() === d0.getTime()) r.hariIniFollowup++; }
    });
  });
  return r;
}

function senarai_(obj, maks) {
  return Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; }).slice(0, maks || 6)
    .map(function (k) { return k + " " + obj[k]; }).join(", ");
}

function tulisReport_(my, gl) {
  var L = [];
  L.push("PIPELINE MALAYSIA: " + my.jumlah + " lead");
  L.push("• Status: " + senarai_(my.status));
  L.push("• Tapisan: " + senarai_(my.filter));
  L.push("• Semakan aktif: " + senarai_(my.aktif));
  L.push("• Segmen: " + senarai_(my.segmen));
  L.push("• Negeri teratas: " + senarai_(my.negeri, 5));
  var isu = [];
  if (my.idBerulang.length) isu.push(my.idBerulang.length + " Lead ID berulang (" + my.idBerulang.slice(0, 6).join(", ") + (my.idBerulang.length > 6 ? ", …" : "") + ")");
  if (my.tanpaTelefon) isu.push(my.tanpaTelefon + " lead tiada nombor telefon");
  L.push("• Isu data: " + (isu.length ? isu.join("; ") : "tiada"));
  if (gl) {
    L.push("");
    L.push("BINALAB GLOBAL: " + gl.jumlah + " prospek");
    L.push("• Peringkat: " + senarai_(gl.peringkat));
    L.push("• Negara: " + senarai_(gl.negara));
    L.push("• Keutamaan tinggi: " + gl.keutamaanTinggi);
    L.push("• Follow-up: " + gl.lewat + " lewat, " + gl.hariIniFollowup + " hari ini");
    if (gl.potensiUSD) L.push("• Anggaran potensi: USD " + Math.round(gl.potensiUSD).toLocaleString("en-US"));
  }
  L.push("");
  L.push("Nota: tracker Malaysia belum ada nilai RM berbentuk nombor dan tarikh follow-up, jadi nilai pipeline MY belum dapat dikira.");
  return L.join("\n");
}

// ---------------------------------------------------------------- hantar ke Markas

function hantar_(p, data) {
  data.agent = AGENT_ID;
  var res = UrlFetchApp.fetch(p.MARKAS_URL.replace(/\/$/, "") + "/api/status", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + p.MARKAS_AGENT_KEY },
    payload: JSON.stringify(data),
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  if (code !== 200) throw new Error("Markas tolak (" + code + "): " + res.getContentText());
}

// untuk ujian Node (diabaikan oleh Apps Script)
if (typeof module !== "undefined") module.exports = { pilihHubungi_: pilihHubungi_, ringkasanMY_: ringkasanMY_, ringkasanGlobal_: ringkasanGlobal_, tulisReport_: tulisReport_, segmen_: segmen_ };
