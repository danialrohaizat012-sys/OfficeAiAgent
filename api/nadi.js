// /api/nadi : Nadi rumus laporan harian dari status semua agent.
//
// Dipanggil oleh:
//   • Vercel Cron setiap pagi (lihat vercel.json), header Authorization: Bearer <CRON_SECRET>
//   • Butang "Rumus sekarang" di dashboard, header x-markas-code: <MARKAS_VIEW_CODE>
//   • Agent / Terminal, header Authorization: Bearer <MARKAS_AGENT_KEY>
//
// Nadi TIDAK baca Google Sheet atau Firebase. Ia hanya baca report yang dah dihantar
// oleh agent lain (Bina, Lina, Faris...) dan tulis satu ringkasan.
// Pagi (Cron) ringkasan juga dihantar ke Telegram Danial kalau TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_DANIAL ada.

import crypto from "node:crypto";
import { CONFIG, isAgent, isViewer, send, fail, saveStatus, readAll } from "./_lib.js";
import { rumus, leaderId } from "./_rumus.js";
import { sendDanial, tgReady } from "./_telegram.js";
export { rumus, leaderId };

function isCron(req) {
  const s = process.env.CRON_SECRET, h = req.headers["authorization"] || "";
  if (!s || !h.startsWith("Bearer ")) return false;
  const a = Buffer.from(h.slice(7)), b = Buffer.from(s);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  try {
    if (!(isCron(req) || isAgent(req) || isViewer(req))) return send(res, 401, { ok: false, ralat: "Tiada kebenaran" });
    const leader = leaderId(CONFIG);
    if (!leader) return send(res, 400, { ok: false, ralat: "Tiada agent di pejabat jenis hab dalam markas.config.js" });
    const statuses = await readAll();
    const r = rumus(statuses, CONFIG, new Date());
    const status = await saveStatus(leader, { sedang: r.ringkas, sibuk: false, report: r.report, keputusan: r.keputusan });
    // Hantar ke Telegram Danial: setiap pagi (Cron) atau bila diminta (?telegram=1)
    let telegram = null;
    const q = req.query || {};
    if ((isCron(req) || q.telegram === "1") && tgReady()) {
      try { telegram = await sendDanial("☀️ " + r.report); } catch (e) { telegram = { ok: false, ralat: e.message }; }
    }
    return send(res, 200, { ok: true, status, telegram: telegram ? !!telegram.ok : null });
  } catch (e) {
    return fail(res, e);
  }
}

