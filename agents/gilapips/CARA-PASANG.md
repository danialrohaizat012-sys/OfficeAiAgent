# Cara pasang agent GilaPips (Syafiq)

**Syafiq** (Komuniti) membaca Firestore laman GilaPips dan melapor:
- jumlah ahli berdaftar, ahli baru hari ini dan 7 hari
- permintaan pengesahan (Trading / Public Gold) yang menunggu semakan admin
- **perlu keputusan** bila ada permintaan menunggu lebih 2 hari (Danial dapat notis Telegram)

Skrip **hanya membaca** dan hantar **kiraan sahaja** ke Markas. Tiada nama, emel atau data ahli keluar dari Firebase.

Masa: lebih kurang 10 minit. Buat di komputer, guna akaun Google yang menjadi **Owner** projek Firebase `gilapips`.

## 1. Buat projek Apps Script
1. Buka https://script.google.com → **New project**. Namakan **GilaPips – Markas**.
2. Padam kod dalam `Code.gs` dan tampal **seluruh** isi `agents/gilapips/Code.gs`. Simpan (⌘S).

## 2. Fail kebenaran
1. ⚙ **Project Settings** → tanda **Show "appsscript.json" manifest file in editor**.
2. Buka `appsscript.json` dalam Editor, padam isinya dan tampal isi `agents/gilapips/appsscript.json`. Simpan.

## 3. Script Properties
| Property | Nilai |
|---|---|
| `MARKAS_URL` | `https://office-ai-agent-tawny.vercel.app` |
| `MARKAS_AGENT_KEY` | kunci agent (sama dengan Bina / Meney) |
| `FIREBASE_PROJECT` | `gilapips` |

## 4. Uji dan jadual
1. Pilih **`ujiGilaPips`** → **▶ Run** → benarkan akses (pilih **Select all**).
2. Kalau keluar ralat **400 + "index"**: salin pautan dalam mesej, buka, tekan **Create index**, tunggu 2–3 minit, kemudian Run semula.
3. Pilih **`pasangJadual`** → **▶ Run** sekali. Syafiq dikemas kini setiap 3 jam.

Di Markas (mod **● Hidup**), Syafiq di tingkat GilaPips akan aktif dan skrin GilaPips di Pejabat CEO tunjuk jumlah ahli.
