// POST /api/decision  { "agent": "kai" }
// Danial tandakan perkara "perlu keputusan" sebagai selesai dari dashboard.
// header: x-markas-code: <MARKAS_VIEW_CODE>

import { AGENT_IDS, K, LOG_MAX, redis, isViewer, body, send, fail } from "./_lib.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return send(res, 405, { ok: false, ralat: "Guna POST" });
    if (!isViewer(req)) return send(res, 401, { ok: false, ralat: "Kod akses salah atau tiada" });
    const b = body(req) || {};
    const id = String(b.agent || "").toLowerCase();
    if (!AGENT_IDS.has(id)) return send(res, 400, { ok: false, ralat: `Agent "${id}" tiada dalam markas.config.js` });
    const [raw] = await redis([["GET", K.status(id)]]);
    if (!raw) return send(res, 404, { ok: false, ralat: "Agent belum pernah hantar status" });
    const s = JSON.parse(raw);
    const was = s.keputusan;
    s.keputusan = null;
    const now = new Date().toISOString();
    await redis([
      ["SET", K.status(id), JSON.stringify(s)],
      ["LPUSH", K.log(id), JSON.stringify({ masa: now, selesai: was || "keputusan", oleh: "Danial" })],
      ["LTRIM", K.log(id), 0, LOG_MAX - 1],
    ]);
    return send(res, 200, { ok: true, status: s });
  } catch (e) {
    return fail(res, e);
  }
}
