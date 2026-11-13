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

import { AGENT_IDS, isAgent, isViewer, body, send, fail, saveStatus, readAll } from "./_lib.js";

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

  const status = await saveStatus(id, b);
  return send(res, 200, { ok: true, status });
}

async function get(req, res) {
  if (!isViewer(req)) return send(res, 401, { ok: false, ralat: "Kod akses salah atau tiada" });
  const agents = await readAll();
  return send(res, 200, { ok: true, masaServer: new Date().toISOString(), agents });
}
