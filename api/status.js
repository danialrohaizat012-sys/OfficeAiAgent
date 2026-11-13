// /api/status
//
// POST (agent hantar status), header: Authorization: Bearer <MARKAS_AGENT_KEY>
//   {
//     "agent": "bina",                       wajib, mesti ada dalam markas.config.js
//     "sedang": "Kira nilai pipeline",       apa agent sedang buat (maks 200 aksara)
//     "sibuk": true,                         true = sibuk, false = sedia
//     "report": "Ringkasan pipeline: ...",   pilihan: report terakhir (maks 4000 aksara)
//     "keputusan": "Setuju diskaun 15%?"     pilihan: perkara perlu keputusan Danial (null = tiada)
//   }
//
// GET (dashboard baca status semua agent), header: x-markas-code: <MARKAS_VIEW_CODE>

import { AGENT_IDS, K, LOG_MAX, redis, isAgent, isViewer, body, send, fail, clip } from "./_lib.js";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") return await post(req, res);
    if (req.method === "GET") return await get(req, res);
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { ok: false, ralat: "Guna GET atau POST" });
  } catch (e) {
    return fail(res, e);
  }
}

async function post(req, res) {
  if (!isAgent(req)) return send(res, 401, { ok: false, ralat: "API key salah atau tiada" });
  const b = body(req);
  if (!b) return send(res, 400, { ok: false, ralat: "Body mesti JSON" });
  const id = String(b.agent || "").toLowerCase();
  if (!AGENT_IDS.has(id)) return send(res, 400, { ok: false, ralat: `Agent "${id}" tiada dalam markas.config.js` });

  const now = new Date().toISOString();
  const [prevRaw] = await redis([["GET", K.status(id)]]);
  const prev = prevRaw ? JSON.parse(prevRaw) : {};

  const status = {
    agent: id,
    sedang: clip(b.sedang, 200) ?? prev.sedang ?? null,
    sibuk: typeof b.sibuk === "boolean" ? b.sibuk : (prev.sibuk ?? false),
    report: b.report !== undefined ? clip(b.report, 4000) : (prev.report ?? null),
    reportPada: b.report ? now : (prev.reportPada ?? null),
    keputusan: b.keputusan !== undefined ? clip(b.keputusan, 300) : (prev.keputusan ?? null),
    dikemaskini: now,
  };
  const entry = { masa: now, sedang: status.sedang, sibuk: status.sibuk };
  if (b.report) entry.report = clip(b.report, 600);
  if (b.keputusan) entry.keputusan = status.keputusan;

  await redis([
    ["SET", K.status(id), JSON.stringify(status)],
    ["LPUSH", K.log(id), JSON.stringify(entry)],
    ["LTRIM", K.log(id), 0, LOG_MAX - 1],
  ]);
  return send(res, 200, { ok: true, status });
}

async function get(req, res) {
  if (!isViewer(req)) return send(res, 401, { ok: false, ralat: "Kod akses salah atau tiada" });
  const ids = [...AGENT_IDS];
  const [vals] = await redis([["MGET", ...ids.map(K.status)]]);
  const agents = {};
  ids.forEach((id, i) => { if (vals[i]) agents[id] = JSON.parse(vals[i]); });
  return send(res, 200, { ok: true, masaServer: new Date().toISOString(), agents });
}
