// /api/telegram : Telegram Bot untuk Markas.
//
// POST (dari Telegram, webhook): header X-Telegram-Bot-Api-Secret-Token mesti betul.
//   /start      → bot balas Chat ID (untuk disimpan di Vercel / Apps Script)
//   /laporan    → (Danial sahaja) laporan harian Nadi terkini
//   /keputusan  → (Danial sahaja) senarai perkara perlu keputusan, dengan butang
//   butang Setuju / Tolak / Bincang nanti → (Danial sahaja) kemas kini status agent
//
// GET ?setup=1 (dari dashboard, header x-markas-code): sambung webhook + senarai arahan bot.
// Rahsia: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_DANIAL (lihat api/_telegram.js).

import { CONFIG, AGENT_IDS, K, LOG_MAX, JAWAB_TTL, redis, isViewer, body, send, fail, readAll } from "./_lib.js";
import { tg, tgReady, danialChat, sendTo, webhookSecret, decisionButtons } from "./_telegram.js";
import { leaderId } from "./_rumus.js";

const JAWAPAN = { ok: "✅ Setuju", no: "❌ Tolak", later: "🕐 Bincang nanti" };
const nama = id => ((CONFIG.agent || []).find(a => a.id === id) || {}).nama || id;
const jam = () => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", minute: "2-digit" }).format(new Date());

export default async function handler(req, res) {
  try {
    if (req.method === "GET") return await setup(req, res);
    if (req.method !== "POST") return send(res, 405, { ok: false, ralat: "Guna POST" });
    if (req.headers["x-telegram-bot-api-secret-token"] !== webhookSecret()) return send(res, 401, { ok: false });
    const u = body(req) || {};
    if (u.callback_query) await onButton(u.callback_query);
    else if (u.message && u.message.text) await onMessage(u.message);
    return send(res, 200, { ok: true });
  } catch (e) {
    // Telegram cuba semula kalau bukan 200; log ralat tetapi balas 200
    console.error("[telegram]", e);
    return send(res, 200, { ok: false });
  }
}

// Halaman ringkas: buka /api/telegram?setup=1 dalam Safari, masukkan kod akses, tekan Sambung
const SETUP_PAGE = `<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sambung Telegram · Markas</title><style>body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#0F1B2D;color:#EEF2F7;display:grid;place-items:center;min-height:100vh;padding:20px;box-sizing:border-box}
.c{max-width:380px;width:100%;background:#16223a;border-radius:18px;padding:22px}h1{font-size:20px;margin:0 0 6px}p{color:#9AA5B8;font-size:14px;line-height:1.45}
input{width:100%;box-sizing:border-box;font-size:17px;padding:12px;border-radius:12px;border:1px solid #2c3a57;background:#0F1B2D;color:#fff}
button{margin-top:12px;width:100%;font-size:16px;font-weight:700;padding:13px;border:0;border-radius:12px;background:#B58A4A;color:#091411}
#o{margin-top:14px;font-size:14px;line-height:1.5;white-space:pre-wrap}</style></head><body><div class="c">
<h1>🤖 Sambung Telegram</h1><p>Masukkan kod akses Markas (MARKAS_VIEW_CODE) dan tekan Sambung. Buat sekali sahaja selepas TELEGRAM_BOT_TOKEN ditambah di Vercel dan Redeploy.</p>
<input id="k" type="password" placeholder="Kod akses" autocomplete="current-password"><button id="b">Sambung</button><div id="o"></div></div>
<script>document.getElementById("b").onclick=async()=>{const o=document.getElementById("o");o.textContent="Menyambung…";
try{const r=await fetch("/api/telegram?setup=1",{headers:{"x-markas-code":document.getElementById("k").value.trim()},cache:"no-store"});const j=await r.json();
o.textContent=j.ok?"✅ Berjaya! Bot "+(j.bot||"")+" disambung.\n\nLangkah seterusnya: buka bot dalam Telegram dan tekan Start untuk dapat Chat ID."+(j.danial?"\n\n✅ TELEGRAM_CHAT_DANIAL dah ada. Cuba hantar /laporan kepada bot.":""):"❌ "+(j.ralat||("Ralat "+r.status));}
catch(e){o.textContent="❌ Tak dapat hubungi server: "+e.message}};</script></body></html>`;

async function setup(req, res) {
  try {
    if (!req.headers["x-markas-code"]) { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); return res.status(200).send(SETUP_PAGE); }
    if (!isViewer(req)) return send(res, 401, { ok: false, ralat: "Kod akses salah. Semak MARKAS_VIEW_CODE di Vercel." });
    if (!tgReady()) return send(res, 400, { ok: false, ralat: "TELEGRAM_BOT_TOKEN belum ada. Tambah di Vercel → Settings → Environment Variables, kemudian Deployments → Redeploy, dan cuba semula." });
    const url = `https://${req.headers["x-forwarded-host"] || req.headers.host}/api/telegram`;
    const a = await tg("setWebhook", { url, secret_token: webhookSecret(), allowed_updates: ["message", "callback_query"] });
    await tg("setMyCommands", { commands: [
      { command: "start", description: "Dapatkan Chat ID anda" },
      { command: "laporan", description: "Laporan harian Nadi (Danial)" },
      { command: "keputusan", description: "Perkara perlu keputusan (Danial)" },
    ] });
    const me = await tg("getMe", {});
    if (!me.ok) return send(res, 400, { ok: false, ralat: "Token Telegram ditolak (" + (me.description || "tidak sah") + "). Salin semula token dari @BotFather ke TELEGRAM_BOT_TOKEN, Redeploy." });
    return send(res, 200, { ok: !!a.ok, bot: me.result ? "@" + me.result.username : null, danial: !!danialChat(), ralat: a.ok ? null : a.description });
  } catch (e) { return fail(res, e); }
}

async function onMessage(m) {
  const chat = String(m.chat.id), text = m.text.trim().split(/\s+/)[0].replace(/@.*$/, "").toLowerCase();
  const isDanial = chat === danialChat();
  if (text === "/start" || !isDanial) {
    return sendTo(chat, `Salam ${m.from && m.from.first_name || ""}! 👋\nIni bot Markas ROI Resources.\n\nChat ID anda: ${chat}\n\nBeri nombor ini kepada Danial untuk disambung.` +
      (isDanial ? "\n\n✅ Anda disambung sebagai Danial. Cuba /laporan atau /keputusan." : ""));
  }
  const all = await readAll();
  if (text === "/laporan") {
    const s = all[leaderId(CONFIG)];
    return sendTo(chat, s && s.report ? "📋 " + s.report : "Nadi belum rumus laporan hari ini.");
  }
  if (text === "/keputusan") {
    const open = Object.entries(all).filter(([, s]) => s.keputusan);
    if (!open.length) return sendTo(chat, "Tiada perkara perlu keputusan. 👍");
    for (const [id, s] of open.slice(0, 8)) await sendTo(chat, `⚠️ ${nama(id)}\n\n${s.keputusan}`, decisionButtons(id));
    return;
  }
  return sendTo(chat, "Arahan: /laporan · /keputusan");
}

async function onButton(q) {
  const chat = String(q.message && q.message.chat.id), [kind, id, ans] = String(q.data || "").split("|");
  if (chat !== danialChat() || kind !== "d" || !AGENT_IDS.has(id) || !JAWAPAN[ans]) {
    return tg("answerCallbackQuery", { callback_query_id: q.id, text: "Hanya Danial boleh buat keputusan." });
  }
  const [raw] = await redis([["GET", K.status(id)]]);
  const s = raw ? JSON.parse(raw) : null;
  const now = new Date().toISOString();
  let note;
  if (!s || !s.keputusan) note = "Perkara ini dah selesai sebelum ini.";
  else if (ans === "later") {
    await redis([["LPUSH", K.log(id), JSON.stringify({ masa: now, sedang: "🕐 Danial: bincang nanti", sibuk: !!s.sibuk })], ["LTRIM", K.log(id), 0, LOG_MAX - 1]]);
    note = "Ditangguh. Nadi akan ingatkan dalam laporan pagi.";
  } else {
    const was = s.keputusan; s.keputusan = null; s.jawapanDanial = { jawapan: JAWAPAN[ans], pada: now };
    await redis([
      ["SET", K.status(id), JSON.stringify(s)],
      ["SET", K.jawab(id), was, "EX", JAWAB_TTL],
      ["LPUSH", K.log(id), JSON.stringify({ masa: now, selesai: `${was} → ${JAWAPAN[ans]}`, oleh: "Danial (Telegram)" })],
      ["LTRIM", K.log(id), 0, LOG_MAX - 1],
    ]);
    note = `${JAWAPAN[ans]} · disimpan`;
  }
  await tg("answerCallbackQuery", { callback_query_id: q.id, text: note });
  if (q.message && q.message.text) {
    await tg("editMessageText", { chat_id: q.message.chat.id, message_id: q.message.message_id,
      text: `${q.message.text}\n\n— ${JAWAPAN[ans]} oleh Danial (${jam()})`, ...(ans === "later" ? { reply_markup: { inline_keyboard: decisionButtons(id) } } : {}) });
  }
}
