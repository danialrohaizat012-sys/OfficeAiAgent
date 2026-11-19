// Fungsi kongsi untuk API Markas (fail bermula "_" tidak jadi laluan API).
//
// Rahsia (Vercel → Settings → Environment Variables), JANGAN letak dalam kod:
//   MARKAS_AGENT_KEY  : kunci untuk agent (Bina, Lina...) hantar status
//   MARKAS_VIEW_CODE  : kod akses untuk dashboard baca data hidup
// Diisi automatik bila Upstash disambung di Vercel:
//   KV_REST_API_URL + KV_REST_API_TOKEN  (atau UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)

import crypto from "node:crypto";
import config from "../markas.config.js";

export const CONFIG = config;
export const AGENT_IDS = new Set((config.agent || []).map(a => a.id));
export const LOG_MAX = 50;
export const K = {
  status: id => `markas:status:${id}`,
  log: id => `markas:log:${id}`,
  jawab: id => `markas:jawab:${id}`,     // keputusan yang Danial dah jawab (elak dihantar semula oleh agent)
};
export const JAWAB_TTL = 3 * 24 * 3600;   // 3 hari

function redisEnv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

// Hantar beberapa arahan Redis sekali gus (Upstash REST "pipeline")
export async function redis(commands) {
  const env = redisEnv();
  if (!env) throw Object.assign(new Error("Upstash belum disambung (KV_REST_API_URL tiada)"), { status: 503 });
  const r = await fetch(`${env.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw Object.assign(new Error(`Upstash ralat ${r.status}`), { status: 502 });
  const out = await r.json();
  return out.map(x => {
    if (x.error) throw Object.assign(new Error(`Upstash: ${x.error}`), { status: 502 });
    return x.result;
  });
}

export const hasRedis = () => !!redisEnv();

// Bandingan rahsia yang selamat daripada serangan masa
function same(a, b) {
  if (!a || !b) return false;
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function bearer(req) {
  const h = req.headers["authorization"] || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : (req.headers["x-api-key"] || "");
}

export function isAgent(req) { return same(bearer(req), process.env.MARKAS_AGENT_KEY); }
export function isViewer(req) { return same(req.headers["x-markas-code"], process.env.MARKAS_VIEW_CODE); }

export function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch { return null; }
}

export function send(res, status, data) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(status).send(JSON.stringify(data));
}

export function fail(res, e) {
  send(res, e.status || 500, { ok: false, ralat: e.message || "Ralat tidak dijangka" });
}

export const clip = (v, n) => (v == null ? null : String(v).slice(0, n));

// Simpan status satu agent (gabung dengan status lama) + tambah ke log aktiviti.
export async function saveStatus(id, b) {
  const now = new Date().toISOString();
  const [prevRaw, dijawab] = await redis([["GET", K.status(id)], ["GET", K.jawab(id)]]);
  // agent hantar semula perkara yang Danial dah jawab: abaikan (sehingga 3 hari)
  if (b.keputusan && dijawab && clip(b.keputusan, 300) === dijawab) b = { ...b, keputusan: null };
  const prev = prevRaw ? JSON.parse(prevRaw) : {};
  const status = {
    agent: id,
    sedang: clip(b.sedang, 200) ?? prev.sedang ?? null,
    sibuk: typeof b.sibuk === "boolean" ? b.sibuk : (prev.sibuk ?? false),
    report: b.report !== undefined ? clip(b.report, 4000) : (prev.report ?? null),
    reportPada: b.report ? now : (prev.reportPada ?? null),
    keputusan: b.keputusan !== undefined ? clip(b.keputusan, 300) : (prev.keputusan ?? null),
    angka: b.angka !== undefined ? angka(b.angka) : (prev.angka ?? null),
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
  Object.defineProperty(status, "keputusanLama", { value: prev.keputusan ?? null, enumerable: false });
  return status;
}

// Angka ringkas untuk dashboard (dinding skrin CEO, pelanggan POS): maks 8 medan,
// nama huruf sahaja, nilai nombor atau teks pendek. Tiada data peribadi.
export function angka(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out = {};
  for (const [k, x] of Object.entries(v).slice(0, 8)) {
    if (!/^[a-zA-Z]{1,24}$/.test(k)) continue;
    if (typeof x === "number" && isFinite(x)) out[k] = Math.round(x * 100) / 100;
    else if (typeof x === "string") out[k] = x.slice(0, 40);
  }
  return Object.keys(out).length ? out : null;
}

// Baca status semua agent: { id: status }
export async function readAll() {
  const ids = [...AGENT_IDS];
  const [vals] = await redis([["MGET", ...ids.map(K.status)]]);
  const out = {};
  ids.forEach((id, i) => { if (vals[i]) out[id] = JSON.parse(vals[i]); });
  return out;
}
