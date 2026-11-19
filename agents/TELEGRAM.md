# Sambung Telegram Bot Markas (percuma)

Selepas disambung:
- **Nadi → Danial**: ringkasan pagi setiap hari 8:30 pagi.
- **Perlu keputusan → Danial**: notis serta-merta dengan butang **✅ Setuju / ❌ Tolak / 🕐 Bincang nanti**. Tekan butang → status dalam Markas dikemas kini, Danial di bumbung 3D beri reaksi.
- **Faris → Amirul**: senarai repair siap belum diambil + tunggu kelulusan, dengan butang **📲 WhatsApp** (draf mesej; Amirul semak dan tekan Send dari telefon Meney). Sekali sehari selepas 10 pagi.
- **Bina → Fakhri**: 5 prospek untuk dihubungi hari ini, dengan butang **📲 WhatsApp** (draf). Setiap pagi 8:00.
- Arahan bot untuk Danial: `/laporan`, `/keputusan`.

Nombor telefon pelanggan & prospek pergi **terus** dari Apps Script ke Telegram Amirul / Fakhri. Ia **tidak** disimpan di Markas.

## 1. Buat bot (Danial, 2 minit)
1. Dalam Telegram, cari **@BotFather** → hantar `/newbot`.
2. Nama: `Markas ROI` (bebas). Username: contoh `MarkasROIbot` (mesti berakhir dengan `bot`).
3. BotFather beri **token** (contoh `123456:ABC-…`). **Jangan hantar token dalam chat.**

## 2. Simpan token di Vercel
Vercel → projek `office-ai-agent` → **Settings → Environment Variables** → tambah:

| Nama | Nilai |
|---|---|
| `TELEGRAM_BOT_TOKEN` | token dari BotFather |

Kemudian **Deployments → … → Redeploy**.

## 3. Sambung webhook (sekali)
**Cara paling mudah:** buka pautan ini dalam Safari:

https://office-ai-agent-tawny.vercel.app/api/telegram?setup=1

Masukkan **kod akses Markas** (`MARKAS_VIEW_CODE`), kemudian tekan **Sambung**. Mesej "✅ Berjaya! Bot @… disambung" patut muncul.

(Cara lain: dalam Markas mod **● Hidup** → butang **📋** di atas → **⚙️ Sambung Telegram**. Di iPhone butang 📋 tiada tulisan "Laporan".)

| Mesej | Maksud / cara betulkan |
|---|---|
| `TELEGRAM_BOT_TOKEN belum ada` | Token belum ditambah, atau belum **Redeploy** selepas tambah |
| `Token Telegram ditolak` | Token tersalah salin. Salin semula dari @BotFather (`/mybots` → bot → API Token) |
| `Kod akses salah` | Guna nilai `MARKAS_VIEW_CODE` di Vercel |
| Halaman tak wujud (404) | Deploy terbaru belum siap. Tunggu 1–2 minit dan cuba semula |

## 4. Dapatkan Chat ID setiap orang
Danial, Amirul dan Fakhri buka bot dalam Telegram dan tekan **Start**. Bot balas **Chat ID** masing-masing.

| Siapa | Simpan di mana | Nama |
|---|---|---|
| Danial | Vercel → Environment Variables (kemudian Redeploy) | `TELEGRAM_CHAT_DANIAL` |
| Amirul | Apps Script **Meney – Markas** → Script Properties | `TELEGRAM_CHAT_AMIRUL` + `TELEGRAM_BOT_TOKEN` |
| Fakhri | Apps Script **Bina** → Script Properties | `TELEGRAM_CHAT_FAKHRI` + `TELEGRAM_BOT_TOKEN` |

## 5. Kemas kini kod Apps Script
Tampal semula **seluruh** `agents/meney/Code.gs` dan `agents/bina/Code.gs` ke projek Apps Script masing-masing (kod baharu hantar angka ke dinding skrin CEO + mesej Telegram).

## 6. Uji
- Markas → **📋 Laporan** → **📨 Hantar ke Telegram** → Danial terima laporan.
- Apps Script Meney → Run **`ujiTelegramFaris`** → Amirul terima senarai repair.
- Apps Script Bina → Run **`ujiTelegramBina`** → Fakhri terima 5 prospek.
- Semak `/api/health`: `TELEGRAM_BOT_TOKEN: ada`, `TELEGRAM_CHAT_DANIAL: ada`.

## Untuk Bina → Fakhri lebih tepat
Tambah 2 lajur dalam tracker Malaysia (semua tab Prospect): **`Last Contact`** dan **`Next Follow-up`** (tarikh). Bina pilih prospek ikut tarikh follow-up. Tanpa lajur ini, Bina pilih lead yang belum pernah dihubungi.
