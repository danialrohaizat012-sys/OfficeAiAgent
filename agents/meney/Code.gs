// MENEY: agent Lina (jualan, margin, tunai) + Faris (repair) — Google Apps Script
// -----------------------------------------------------------------
// Baca Firestore POS Meney (BACA SAHAJA), kira RINGKASAN, hantar ke Markas.
// Tiada nama atau telefon pelanggan dihantar ke Markas. Tiada apa-apa ditulis ke Firestore.
//
// Faris → Amirul (Telegram, pilihan): sekali sehari (selepas 10 pagi) Faris hantar senarai
// repair siap belum diambil ≥3 hari + tunggu kelulusan, dengan butang "WhatsApp" (wa.me,
// klik-untuk-hantar dari telefon Meney; Amirul semak & tekan Send). Nombor pelanggan pergi
// TERUS dari Apps Script ke Telegram Amirul sahaja; TIDAK disimpan di Markas.
//
// Akses Firestore guna akaun Google Danial sendiri (pemilik projek Firebase),
// jadi tiada kunci akaun servis perlu disimpan.
//
// Tetapan (Apps Script → ⚙ Project Settings → Script Properties):
//   MARKAS_URL        https://office-ai-agent-tawny.vercel.app
//   MARKAS_AGENT_KEY  (kunci agent dari Vercel)
//   FIREBASE_PROJECT  meney-daily-mission
//   SASARAN_BULAN     30000   (sasaran jualan sebulan, RM)
//   TELEGRAM_BOT_TOKEN   (pilihan) token bot Markas dari @BotFather
//   TELEGRAM_CHAT_AMIRUL (pilihan) Chat ID Amirul (bot beri bila Amirul tekan Start)
//
// Fungsi untuk dijalankan:
//   ujiMeney()        sekali, untuk uji (lihat Execution log)
//   pasangJadual()    sekali: jalan setiap jam (hanya 9 pagi – 11 malam)
//   jalankanMeney()   kerja berkala (dipanggil oleh jadual)
//   ujiTelegramFaris() hantar senarai follow-up repair ke Amirul sekarang (uji Telegram)

var STATUS_REPAIR_TERBUKA = ["Received", "Diagnosing", "Waiting Approval", "Waiting Parts", "In Progress", "Ready"];

function tetapan_() {
  var p = PropertiesService.getScriptProperties().getProperties();
  if (!p.MARKAS_URL || !p.MARKAS_AGENT_KEY || !p.FIREBASE_PROJECT) {
    throw new Error("Tetapan belum lengkap: isi MARKAS_URL, MARKAS_AGENT_KEY dan FIREBASE_PROJECT dalam Script Properties.");
  }
  return p;
}

// Kerja berkala (jadual setiap jam). Hanya berjalan 9 pagi – 11 malam.
function jalankanMeney() {
  var jam = +Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "H");
  if (jam < 9 || jam >= 23) return "Luar waktu kedai: tidak dijalankan.";
  return kerja_(tetapan_());
}

// Ujian manual: boleh dijalankan bila-bila masa
function ujiMeney() {
  Logger.log("Berjaya dihantar ke Markas:\n\n" + kerja_(tetapan_()));
}

function kerja_(p) {
  var now = new Date();
  var hari = Utilities.formatDate(now, "Asia/Kuala_Lumpur", "yyyy-MM-dd");
  var bulan = hari.slice(0, 8) + "01";
  var sasaran = +(p.SASARAN_BULAN || 30000);

  // ---------- Lina: jualan, margin, tunai
  hantar_(p, { agent: "lina", sedang: "Mengira jualan dan tunai…", sibuk: true });
  var jualan = cari_(p, "sales", [f_("saleDate", "GREATER_THAN_OR_EQUAL", bulan)]);
  var siapBulan = cari_(p, "repairs", [f_("completedTransactionDate", "GREATER_THAN_OR_EQUAL", mulaHariUTC_(bulan))]);
  var shifts = cari_(p, "shifts", [], { field: "openedAt", direction: "DESCENDING" }, 3);
  var lina = ringkasanLina_(jualan, siapBulan, shifts, hari, sasaran, now);
  hantar_(p, { agent: "lina", sedang: lina.ringkas, sibuk: false, report: lina.report, keputusan: lina.keputusan, angka: lina.angka });

  // ---------- Faris: repair terbuka
  hantar_(p, { agent: "faris", sedang: "Menyemak tiket repair…", sibuk: true });
  var terbuka = cari_(p, "repairs", [{ fieldFilter: { field: { fieldPath: "status" }, op: "IN",
    value: { arrayValue: { values: STATUS_REPAIR_TERBUKA.map(function (s) { return { stringValue: s }; }) } } } }]);
  var faris = ringkasanFaris_(terbuka, now);
  hantar_(p, { agent: "faris", sedang: faris.ringkas, sibuk: false, report: faris.report, keputusan: faris.keputusan, angka: faris.angka });

  // ---------- Faris → Amirul: follow-up repair (Telegram, sekali sehari selepas 10 pagi)
  var jam = +Utilities.formatDate(now, "Asia/Kuala_Lumpur", "H");
  var props = PropertiesService.getScriptProperties();
  if (p.TELEGRAM_BOT_TOKEN && p.TELEGRAM_CHAT_AMIRUL && jam >= 10 && props.getProperty("FARIS_TG_HARI") !== hari) {
    farisTelegram_(p, faris);
    props.setProperty("FARIS_TG_HARI", hari);
  }

  return lina.report + "\n\n" + faris.report;
}

// Uji Telegram Faris → Amirul (hantar sekarang, tanpa tunggu jadual)
function ujiTelegramFaris() {
  var p = tetapan_();
  if (!p.TELEGRAM_BOT_TOKEN || !p.TELEGRAM_CHAT_AMIRUL) throw new Error("Isi TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_AMIRUL dalam Script Properties.");
  var terbuka = cari_(p, "repairs", [{ fieldFilter: { field: { fieldPath: "status" }, op: "IN",
    value: { arrayValue: { values: STATUS_REPAIR_TERBUKA.map(function (s) { return { stringValue: s }; }) } } } }]);
  farisTelegram_(p, ringkasanFaris_(terbuka, new Date()));
  Logger.log("Dihantar ke Telegram Amirul.");
}

// ---------------------------------------------------------------- Telegram (Faris → Amirul)

// Nombor Malaysia → format wa.me (60xxxxxxxxx). Pulang "" kalau tiada.
function noWa_(tel) {
  var d = String(tel || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.indexOf("60") === 0) return d;
  if (d.charAt(0) === "0") return "6" + d;
  if (d.charAt(0) === "1") return "60" + d;
  return d;
}

function farisTelegram_(p, faris) {
  var senarai = faris.belumAmbil.map(function (r) { return { r: r, jenis: "siap" }; })
    .concat(faris.tungguLulus.map(function (r) { return { r: r, jenis: "lulus" }; })).slice(0, 12);
  if (!senarai.length) {
    tg_(p, p.TELEGRAM_CHAT_AMIRUL, "🔧 Faris: tiada repair perlu follow-up hari ini. 👍");
    return;
  }
  var L = ["🔧 FARIS · Follow-up repair hari ini (" + senarai.length + ")", ""];
  var butang = [];
  senarai.forEach(function (x, i) {
    var r = x.r, nama = String(r.customer || "Pelanggan").slice(0, 30), alat = String(r.device || "peranti").slice(0, 40);
    L.push((i + 1) + ". " + (r.ticketNo || "?") + " · " + nama + " · " + alat + " · " + (x.jenis === "siap" ? "SIAP, belum diambil " + x.r._hari + " hari" : "TUNGGU KELULUSAN"));
    var no = noWa_(r.phone);
    if (!no) { L.push("   (tiada nombor telefon dalam POS)"); return; }
    var mesej = x.jenis === "siap"
      ? "Salam " + nama + ", ini Meney Gaming 👋 Repair " + alat + " anda (tiket " + (r.ticketNo || "") + ") dah siap dan boleh diambil di kedai. Terima kasih!"
      : "Salam " + nama + ", ini Meney Gaming 👋 Untuk repair " + alat + " (tiket " + (r.ticketNo || "") + "), kami perlukan kelulusan anda sebelum teruskan. Boleh balas mesej ini? Terima kasih!";
    butang.push([{ text: "📲 WhatsApp " + (r.ticketNo || nama), url: "https://wa.me/" + no + "?text=" + encodeURIComponent(mesej) }]);
  });
  L.push("", "Tekan butang → WhatsApp buka dengan draf mesej. Semak dulu, kemudian tekan Send dari telefon Meney.");
  tg_(p, p.TELEGRAM_CHAT_AMIRUL, L.join("\n"), butang);
}

function tg_(p, chat, teks, butang) {
  var payload = { chat_id: chat, text: teks.slice(0, 4000), disable_web_page_preview: true };
  if (butang && butang.length) payload.reply_markup = { inline_keyboard: butang };
  var res = UrlFetchApp.fetch("https://api.telegram.org/bot" + p.TELEGRAM_BOT_TOKEN + "/sendMessage", {
    method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) Logger.log("Telegram gagal (" + res.getResponseCode() + "): " + res.getContentText());
}

function pasangJadual() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "jalankanMeney") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("jalankanMeney").timeBased().everyHours(1).create();
  Logger.log("Jadual dipasang: Lina & Faris kemas kini setiap jam (9 pagi – 11 malam).");
}

// ---------------------------------------------------------------- Firestore (baca sahaja)

function f_(field, op, str) {
  return { fieldFilter: { field: { fieldPath: field }, op: op, value: { stringValue: str } } };
}

// Tarikh "YYYY-MM-DD" waktu Malaysia → ISO UTC permulaan hari itu (MYT = UTC+8)
function mulaHariUTC_(ymd) {
  var d = new Date(ymd + "T00:00:00+08:00");
  return d.toISOString();
}

function cari_(p, koleksi, tapis, susun, had) {
  var q = { from: [{ collectionId: koleksi }] };
  if (tapis.length === 1) q.where = tapis[0];
  else if (tapis.length > 1) q.where = { compositeFilter: { op: "AND", filters: tapis } };
  if (susun) q.orderBy = [{ field: { fieldPath: susun.field }, direction: susun.direction }];
  q.limit = had || 2000;
  var url = "https://firestore.googleapis.com/v1/projects/" + p.FIREBASE_PROJECT + "/databases/(default)/documents:runQuery";
  var res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken(), "x-goog-user-project": p.FIREBASE_PROJECT },
    payload: JSON.stringify({ structuredQuery: q }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error("Firestore (" + koleksi + ") ralat " + res.getResponseCode() + ": " + res.getContentText().slice(0, 300));
  return JSON.parse(res.getContentText()).filter(function (x) { return x.document; }).map(function (x) { return dokumen_(x.document.fields || {}); });
}

// Tukar format Firestore REST ({stringValue:..}) kepada objek biasa
function nilai_(v) {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return +v.integerValue;
  if ("doubleValue" in v) return +v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(nilai_);
  if ("mapValue" in v) return dokumen_(v.mapValue.fields || {});
  return null;
}
function dokumen_(fields) {
  var o = {}; for (var k in fields) o[k] = nilai_(fields[k]); return o;
}

// ---------------------------------------------------------------- kiraan (tiada panggilan Google; boleh diuji)

function rm_(n) { return (n < 0 ? "-RM" : "RM") + (Math.round(Math.abs(n) * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function n_(v) { var x = Number(v); return isFinite(x) ? x : 0; }
function hariMYT_(iso) { return iso ? new Date(new Date(iso).getTime() + 8 * 3600e3).toISOString().slice(0, 10) : ""; }

// Untung kasar satu jualan: jumlah dibayar tolak kos barang (konsainan: bayaran pembekal)
function untungJualan_(s) {
  var kos = (s.items || []).reduce(function (t, i) {
    var k = i.ownershipType === "consignment" ? n_(i.consignmentPayable) : n_(i.cost) * n_(i.qty);
    return t + k;
  }, 0);
  return n_(s.total) - kos;
}

function ringkasanLina_(jualan, repairSiap, shifts, hari, sasaran, now) {
  var sah = jualan.filter(function (s) { return (s.status || "completed") === "completed"; });
  var hariIni = sah.filter(function (s) { return s.saleDate === hari; });
  var rHariIni = repairSiap.filter(function (r) { return hariMYT_(r.completedTransactionDate) === hari; });

  var jHari = hariIni.reduce(function (t, s) { return t + n_(s.total); }, 0);
  var uHari = hariIni.reduce(function (t, s) { return t + untungJualan_(s); }, 0);
  var repHari = rHariIni.reduce(function (t, r) { return t + n_(r.finalPrice); }, 0);
  var repUHari = rHariIni.reduce(function (t, r) { return t + n_(r.netProfit); }, 0);

  var jBulan = sah.reduce(function (t, s) { return t + n_(s.total); }, 0) + repairSiap.reduce(function (t, r) { return t + n_(r.finalPrice); }, 0);
  var uBulan = sah.reduce(function (t, s) { return t + untungJualan_(s); }, 0) + repairSiap.reduce(function (t, r) { return t + n_(r.netProfit); }, 0);

  var bayar = {};
  hariIni.forEach(function (s) {
    (s.payments && s.payments.length ? s.payments : [{ method: s.paymentMethod || "Lain", amount: s.total }]).forEach(function (pm) {
      bayar[pm.method || "Lain"] = (bayar[pm.method || "Lain"] || 0) + n_(pm.amount);
    });
  });

  // kategori paling laku bulan ini
  var kat = {};
  sah.forEach(function (s) { (s.items || []).forEach(function (i) { var k = i.category || "Lain"; kat[k] = (kat[k] || 0) + n_(i.lineTotal || n_(i.price) * n_(i.qty)); }); });
  var katTop = Object.keys(kat).sort(function (a, b) { return kat[b] - kat[a]; }).slice(0, 3);

  // kemajuan sasaran
  var d = +hari.slice(8, 10), hariBulan = new Date(+hari.slice(0, 4), +hari.slice(5, 7), 0).getDate();
  var unjuran = d > 0 ? jBulan / d * hariBulan : 0;

  // shift tunai
  var buka = shifts.filter(function (s) { return s.status === "open"; })[0];
  var tutup = shifts.filter(function (s) { return s.status === "closed"; })[0];
  var keputusan = null;
  if (tutup && Math.abs(n_(tutup.cashVariance)) >= 5) {
    keputusan = "Beza tunai shift " + (tutup.shiftNo || "") + ": " + rm_(n_(tutup.cashVariance)) + (tutup.varianceNote ? " (nota: " + String(tutup.varianceNote).slice(0, 80) + ")" : "") + ". Perlu semak?";
  }

  var L = [];
  L.push("JUALAN HARI INI (" + hari + ")");
  L.push("• Jualan barang: " + rm_(jHari) + " (" + hariIni.length + " transaksi) · untung kasar " + rm_(uHari) + (jHari ? " (" + Math.round(uHari / jHari * 100) + "%)" : ""));
  L.push("• Repair siap: " + rm_(repHari) + " (" + rHariIni.length + " tiket) · untung " + rm_(repUHari));
  L.push("• Bayaran: " + (Object.keys(bayar).length ? Object.keys(bayar).map(function (k) { return k + " " + rm_(bayar[k]); }).join(", ") : "tiada"));
  L.push("");
  L.push("BULAN INI");
  L.push("• Jumlah (barang + repair): " + rm_(jBulan) + " daripada sasaran " + rm_(sasaran) + " (" + Math.round(jBulan / sasaran * 100) + "%)");
  L.push("• Untung kasar: " + rm_(uBulan) + (jBulan ? " (" + Math.round(uBulan / jBulan * 100) + "%)" : ""));
  L.push("• Unjuran hujung bulan ikut kadar semasa: " + rm_(unjuran) + (unjuran < sasaran ? " — perlu " + rm_((sasaran - jBulan) / Math.max(1, hariBulan - d)) + " sehari untuk capai sasaran" : " — atas landasan"));
  if (katTop.length) L.push("• Kategori teratas: " + katTop.map(function (k) { return k + " " + rm_(kat[k]); }).join(", "));
  L.push("");
  L.push("TUNAI & SHIFT");
  L.push("• Shift terbuka: " + (buka ? (buka.shiftNo || "") + " oleh " + (buka.staffName || "staf") + " · tunai buka " + rm_(n_(buka.openingCash)) : "tiada"));
  if (tutup) L.push("• Shift terakhir ditutup: " + (tutup.shiftNo || "") + " · jangkaan " + rm_(n_(tutup.expectedCash)) + ", sebenar " + rm_(n_(tutup.closingCash || tutup.actualCash)) + ", beza " + rm_(n_(tutup.cashVariance)));
  L.push("");
  L.push("Nota: margin = jualan tolak kos barang dalam POS (belum tolak belanja operasi). Refund belum dikira.");

  var ringkas = "Hari ini " + rm_(jHari + repHari) + " · bulan " + Math.round(jBulan / sasaran * 100) + "% sasaran";
  // angka ringkas untuk dashboard (dinding skrin CEO + pelanggan 3D ikut jualan)
  var angka = { jualanHari: jHari + repHari, transaksiHari: hariIni.length + rHariIni.length, jualanBulan: jBulan, peratusSasaran: Math.round(jBulan / sasaran * 100) };
  return { ringkas: ringkas, report: L.join("\n"), keputusan: keputusan, angka: angka };
}

function ringkasanFaris_(repairs, now) {
  var hariSejak = function (r) {
    var t = r.transactionDate || r.createdAt;
    return t ? Math.floor((now - new Date(t)) / 86400e3) : 0;
  };
  var ikutStatus = {};
  STATUS_REPAIR_TERBUKA.forEach(function (s) { ikutStatus[s] = []; });
  repairs.forEach(function (r) { (ikutStatus[r.status] = ikutStatus[r.status] || []).push(r); });
  var label = function (r) { return (r.ticketNo || "?") + " " + String(r.device || "").slice(0, 30) + " (" + hariSejak(r) + " hari)"; };

  repairs.forEach(function (r) { r._hari = hariSejak(r); });
  var lama = repairs.filter(function (r) { return r.status !== "Ready" && hariSejak(r) >= 7; });
  var belumAmbil = (ikutStatus["Ready"] || []).filter(function (r) { return hariSejak(r) >= 3; });
  var tungguLulus = ikutStatus["Waiting Approval"] || [];

  var L = [];
  L.push("REPAIR TERBUKA: " + repairs.length + " tiket");
  L.push("• Ikut status: " + STATUS_REPAIR_TERBUKA.filter(function (s) { return ikutStatus[s].length; }).map(function (s) { return s + " " + ikutStatus[s].length; }).join(", "));
  L.push("• Anggaran nilai (belum siap): " + rm_(repairs.reduce(function (t, r) { return t + n_(r.estimate); }, 0)));
  L.push("");
  L.push("PERLU FOLLOW-UP");
  L.push("• Siap tapi belum diambil ≥3 hari: " + (belumAmbil.length ? belumAmbil.slice(0, 6).map(label).join("; ") : "tiada"));
  L.push("• Tunggu kelulusan pelanggan: " + (tungguLulus.length ? tungguLulus.slice(0, 6).map(label).join("; ") : "tiada"));
  L.push("• Terbuka ≥7 hari: " + (lama.length ? lama.slice(0, 6).map(label).join("; ") : "tiada"));
  L.push("");
  L.push("Dasar selepas jualan: cuba repair dahulu → ganti 1-ke-1 jika stok sama ada → refund jika kedua-duanya tidak boleh.");

  var keputusan = lama.length >= 3 ? lama.length + " tiket repair terbuka ≥7 hari. Perlu tindakan (tambah alat ganti / hubungi pelanggan / pertimbang refund)?" : null;
  var ringkas = repairs.length + " repair terbuka" + (belumAmbil.length ? " · " + belumAmbil.length + " siap belum diambil" : "") + (lama.length ? " · " + lama.length + " lama" : "");
  return { ringkas: ringkas, report: L.join("\n"), keputusan: keputusan,
    angka: { repairTerbuka: repairs.length, belumAmbil: belumAmbil.length, repairLama: lama.length },
    belumAmbil: belumAmbil, tungguLulus: tungguLulus };   // dua senarai ini untuk Telegram Amirul SAHAJA (tidak dihantar ke Markas)
}

// ---------------------------------------------------------------- hantar ke Markas

function hantar_(p, data) {
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
if (typeof module !== "undefined") module.exports = { ringkasanLina_: ringkasanLina_, ringkasanFaris_: ringkasanFaris_, dokumen_: dokumen_, mulaHariUTC_: mulaHariUTC_, hariMYT_: hariMYT_ };
