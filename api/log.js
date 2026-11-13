// GET /api/log?agent=bina : 50 aktiviti terakhir seorang agent (terbaru dahulu)
// header: x-markas-code: <MARKAS_VIEW_CODE>

import { AGENT_IDS, K, LOG_MAX, redis, isViewer, send, fail } from "./_lib.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return send(res, 405, { ok: false, ralat: "Guna GET" });
    if (!isViewer(req)) return send(res, 401, { ok: false, ralat: "Kod akses salah atau tiada" });
    const id = String(req.query.agent || "").toLowerCase();
    if (!AGENT_IDS.has(id)) return send(res, 400, { ok: false, ralat: `Agent "${id}" tiada dalam markas.config.js` });
    const [items] = await redis([["LRANGE", K.log(id), 0, LOG_MAX - 1]]);
    return send(res, 200, { ok: true, agent: id, log: (items || []).map(x => JSON.parse(x)) });
  } catch (e) {
    return fail(res, e);
  }
}
