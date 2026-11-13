// GET /api/health : semak sama ada backend sedia (tiada rahsia didedahkan).
// Buka terus di browser: https://<projek>.vercel.app/api/health

import crypto from "node:crypto";
import { hasRedis, redis, send } from "./_lib.js";

export default async function handler(req, res) {
  const semak = {
    upstash: hasRedis() ? "disambung" : "BELUM: sambung Upstash di Vercel → Storage",
    MARKAS_AGENT_KEY: process.env.MARKAS_AGENT_KEY ? "ada" : "BELUM: tambah di Settings → Environment Variables",
    MARKAS_VIEW_CODE: process.env.MARKAS_VIEW_CODE ? "ada" : "BELUM: tambah di Settings → Environment Variables",
  };
  if (hasRedis()) {
    try { const [p] = await redis([["PING"]]); semak.upstashPing = p === "PONG" ? "ok" : String(p); }
    catch (e) { semak.upstashPing = "gagal: " + e.message; }
  }
  const sedia = hasRedis() && semak.upstashPing === "ok" && !!process.env.MARKAS_AGENT_KEY && !!process.env.MARKAS_VIEW_CODE;
  send(res, 200, {
    sedia,
    semak,
    // Cadangan kunci rawak baru (tidak disimpan di mana-mana). Salin ke Vercel kalau perlu.
    cadanganKunciRawak: crypto.randomBytes(24).toString("base64url"),
  });
}
