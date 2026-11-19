// Rumusan laporan harian Nadi (fungsi tulen, tiada Node API) supaya boleh
// dipakai oleh /api/nadi (server) DAN dashboard (kad "Laporan hari ini" mod Data contoh).

export function leaderId(config) {
  const hub = (config.pejabat || []).find(o => o.jenis === "hab");
  const a = hub && (config.agent || []).find(x => x.pejabat === hub.id);
  return a ? a.id : null;
}

function lalu(iso, now) {
  const m = Math.max(0, (now - new Date(iso)) / 60000);
  if (m < 60) return `${Math.round(m)} min lalu`;
  if (m < 48 * 60) return `${Math.round(m / 60)} jam lalu`;
  return `${Math.round(m / 1440)} hari lalu`;
}

// Baris penting dari report agent (angka utama, isu, follow-up)
const PENTING = /jumlah|unjuran|lewat|isu data|belum diambil|≥ ?7 hari|sasaran|follow-up:|jualan barang/i;

export function rumus(statuses, config, now) {
  const tarikh = new Intl.DateTimeFormat("ms-MY", { timeZone: "Asia/Kuala_Lumpur", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
  const jam = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", minute: "2-digit" }).format(now);
  const lead = leaderId(config);
  const L = [`LAPORAN HARIAN NADI · ${tarikh} (${jam})`];
  const keputusan = [], senyap = [], belum = [];

  for (const o of (config.pejabat || []).filter(x => x.jenis !== "hab")) {
    const agents = (config.agent || []).filter(a => a.pejabat === o.id);
    const hidup = agents.filter(a => statuses[a.id]);
    L.push("", (o.label || o.nama).toUpperCase().replace(/^PEJABAT /, ""));
    if (!hidup.length) L.push("• Belum ada agent yang melapor.");
    for (const a of agents) {
      const s = statuses[a.id];
      if (!s) { belum.push(a.nama); continue; }
      L.push(`• ${a.nama} (${lalu(s.dikemaskini, now)}): ${s.sedang || "—"}`);
      for (const line of String(s.report || "").split("\n").map(x => x.trim()).filter(x => PENTING.test(x)).slice(0, 3)) {
        L.push(`    ${line.replace(/^•\s*/, "– ")}`);
      }
      if (s.keputusan) keputusan.push(`${a.nama}: ${s.keputusan}`);
      const had = a.senyapSelepasJam;
      if (had && (now - new Date(s.dikemaskini)) / 3600e3 > had) senyap.push(`${a.nama}: tiada laporan sejak ${lalu(s.dikemaskini, now)} (jangkaan setiap ${had} jam)`);
    }
  }
  // agent lain di hab (selain Nadi)
  for (const a of (config.agent || []).filter(x => x.id !== lead && !statuses[x.id] && (config.pejabat || []).find(o => o.id === x.pejabat && o.jenis === "hab"))) belum.push(a.nama);

  L.push("", `⚠ PERLU KEPUTUSAN DANIAL (${keputusan.length})`);
  L.push(...(keputusan.length ? keputusan.map(k => "• " + k) : ["• Tiada. 👍"]));
  if (senyap.length) L.push("", "🔕 AGENT SENYAP", ...senyap.map(x => "• " + x));
  if (belum.length) L.push("", "Belum dihidupkan: " + belum.join(", "));

  const ringkas = `Laporan harian siap · ${keputusan.length} perlu keputusan` + (senyap.length ? ` · ${senyap.length} agent senyap` : "");
  return {
    ringkas,
    report: L.join("\n"),
    keputusan: senyap.length ? `${senyap.length} agent tidak melapor seperti biasa. Semak jadual skrip (Apps Script)?` : null,
  };
}
