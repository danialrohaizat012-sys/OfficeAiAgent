# Cara pasang agent Meney (Lina + Faris)

Satu Google Apps Script yang menghidupkan dua agent Meney:
- **Lina**: jualan hari ini dan bulan ini, untung kasar, kemajuan sasaran, bayaran, shift dan beza tunai.
- **Faris**: repair terbuka ikut status, siap tapi belum diambil, tunggu kelulusan, dan tiket yang lama.

Skrip **hanya membaca** Firestore POS Meney dan hantar **ringkasan** ke Markas. Tiada nama atau telefon pelanggan dihantar, dan tiada apa-apa ditulis ke POS.

Masa: lebih kurang 10 minit, sekali sahaja. Buat di komputer.

> Guna akaun Google yang menjadi **Owner** projek Firebase `meney-daily-mission`.
> Buat projek Apps Script **berasingan** daripada Bina (data Meney dan BinaLab kekal terpisah).

## 1. Buat projek Apps Script
1. Buka https://script.google.com, kemudian **New project**. Namakan **Meney – Markas**.
2. Padam kod dalam `Code.gs` dan tampal **seluruh** isi `agents/meney/Code.gs`. Simpan dengan ⌘S.

## 2. Pasang fail kebenaran (wajib untuk Firestore)
1. Pergi ke ⚙ **Project Settings** dan tanda **Show "appsscript.json" manifest file in editor**.
2. Kembali ke **Editor**. Fail `appsscript.json` kini muncul. Buka fail itu.
3. Padam isinya dan tampal **seluruh** isi `agents/meney/appsscript.json`. Simpan dengan ⌘S.

## 3. Script Properties
Di ⚙ **Project Settings**, pergi ke **Script Properties** dan tambah:

| Property | Nilai |
|---|---|
| `MARKAS_URL` | `https://office-ai-agent-tawny.vercel.app` |
| `MARKAS_AGENT_KEY` | kunci agent (sama dengan yang Bina guna) |
| `FIREBASE_PROJECT` | `meney-daily-mission` |
| `SASARAN_BULAN` | `30000` |

## 4. Uji sekali
1. Di Editor, pilih fungsi **`ujiMeney`** dan tekan **▶ Run**.
2. Benarkan akses. Kali ini Google akan minta akses **Cloud Datastore** (Firestore). Pilih **Select all**, kemudian **Continue**.
3. **Execution log** patut tunjuk `Berjaya dihantar ke Markas:` dan report Lina + Faris.
4. Di Markas (mod **● Hidup**), Lina dan Faris patut aktif. Tekan mereka untuk lihat report.

## 5. Jadual
Pilih **`pasangJadual`** dan tekan **▶ Run** sekali. Lina dan Faris akan dikemas kini **setiap jam**, dari 9 pagi hingga 11 malam.

## Kalau ada ralat
| Mesej | Maksud |
|---|---|
| `Firestore (sales) ralat 403` | Akaun ini bukan Owner/Editor projek Firebase, atau `appsscript.json` belum dipasang |
| `Firestore ... ralat 400` + "index" | Perlu index Firestore. Salin pautan dalam mesej, buka, dan tekan **Create index** |
| `Markas tolak (401)` | `MARKAS_AGENT_KEY` tak sama dengan di Vercel |
| `Markas tolak (400)` | Agent `lina`/`faris` tiada dalam `markas.config.js` |

## Andaian yang perlu disahkan
Skrip ini ditulis berdasarkan `pos.html` v2.9.1 (repo MeneyStaffDailyMission):
- `sales`: `saleDate` (YYYY-MM-DD), `total`, `status`, `payments`, `items[].cost/qty/category`
- `repairs`: `status`, `ticketNo`, `device`, `estimate`, `transactionDate`, `completedTransactionDate`, `finalPrice`, `netProfit`
- `shifts`: `status`, `shiftNo`, `openingCash`, `expectedCash`, `closingCash`, `cashVariance`, `openedAt`

Kalau POS yang digunakan di kedai ialah versi lain dan nama medan berbeza, angka mungkin kosong. Beritahu supaya skrip dilaraskan.
