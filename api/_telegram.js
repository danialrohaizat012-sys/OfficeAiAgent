// Fungsi kongsi Telegram Bot (fail bermula "_" tidak jadi laluan API).
//
// Rahsia di Vercel → Settings → Environment Variables (JANGAN dalam kod):
//   TELEGRAM_BOT_TOKEN    token dari @BotFather
//   TELEGRAM_CHAT_DANIAL  Chat ID Danial (bot balas Chat ID bila tekan Start)
//   TELEGRAM_WEBHOOK_SECRET (pilihan) rahsia webhook; kalau tiada, dikira dari token
// Tanpa token, semua fungsi di sini senyap (tiada ralat), jadi Markas tetap jalan.

import crypto from "node:crypto";

export const tgReady = () => !!process.env.TELEGRAM_BOT_TOKEN;
export const danialChat = () => String(process.env.TELEGRAM_CHAT_DANIAL || "").trim();

export function webhookSecret() {
  if (process.env.TELEGRAM_WEBHOOK_SECRET) return process.env.TELEGRAM_WEBHOOK_SECRET;
  const t = process.env.TELEGRAM_BOT_TOKEN || "";
  return crypto.createHash("sha256").update("markas-webhook:" + t).digest("hex").slice(0, 48);
}

export async function tg(method, payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, skip: true };
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  return r.json().catch(() => ({ ok: false }));
}

const cut = t => (t.length > 4000 ? t.slice(0, 3990) + "\n…" : t);

export async function sendTo(chatId, text, keyboard) {
  if (!chatId || !tgReady()) return { ok: false, skip: true };
  return tg("sendMessage", { chat_id: chatId, text: cut(text), disable_web_page_preview: true, ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}) });
}

export const sendDanial = (text, keyboard) => sendTo(danialChat(), text, keyboard);

// Butang keputusan untuk satu agent (callback_data maks 64 bait)
export function decisionButtons(agentId) {
  return [
    [{ text: "✅ Setuju", callback_data: `d|${agentId}|ok` }, { text: "❌ Tolak", callback_data: `d|${agentId}|no` }],
    [{ text: "🕐 Bincang nanti", callback_data: `d|${agentId}|later` }],
  ];
}
