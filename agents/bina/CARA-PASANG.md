# Cara pasang Bina (agent pipeline & prospek)

Bina ialah Google Apps Script milik Danial. Setiap pagi, ia baca tracker prospek
dan hantar **ringkasan sahaja** (angka, bukan nama atau telefon prospek) ke Markas.

Masa: lebih kurang 10 minit, sekali sahaja. Buat di komputer (lebih senang daripada phone).

## 1. Buat projek Apps Script
1. Buka https://script.google.com dan log masuk dengan akaun Google yang memiliki tracker prospek.
2. Tekan **New project**. Tukar nama (atas kiri) kepada **Bina – Markas**.
3. Padam semua kod dalam `Code.gs`, kemudian tampal **seluruh** isi fail `agents/bina/Code.gs` dari repo.
4. Tekan ikon 💾 **Save**.

## 2. Masukkan tetapan (rahsia tidak masuk dalam kod)
1. Tekan ⚙ **Project Settings** (menu kiri), skrol ke **Script Properties**, tekan **Add script property**.
2. Tambah 4 baris:

| Property | Nilai |
|---|---|
| `MARKAS_URL` | `https://office-ai-agent-tawny.vercel.app` |
| `MARKAS_AGENT_KEY` | kunci agent dari Vercel (`MARKAS_AGENT_KEY`) |
| `SHEET_MY` | ID Sheet **(Fakhri) BinaLab Malaysia Prospect Database** |
| `SHEET_GLOBAL` | ID Sheet **BinaLab Global** (boleh kosong kalau tak mahu) |

**Cara dapat ID Sheet:** buka Sheet itu, lihat URL:
`https://docs.google.com/spreadsheets/d/`**`INI_ID_SHEET`**`/edit`. Salin bahagian tengah itu sahaja.

3. Tekan **Save script properties**.

## 3. Uji sekali
1. Kembali ke **Editor** (ikon `< >`).
2. Di atas, pilih fungsi **`ujiBina`**, tekan **▶ Run**.
3. Kali pertama Google minta kebenaran: **Review permissions** → pilih akaun → kalau keluar "Google hasn't verified this app", tekan **Advanced** → **Go to Bina – Markas** → **Allow**.
   (Ini skrip Danial sendiri; ia hanya baca Sheet dan hantar ke Markas.)
4. Lihat **Execution log** di bawah. Kalau berjaya, keluar `Berjaya dihantar ke Markas:` dan report penuh.
5. Buka Markas di iPhone → **● Hidup** → Bina patut tunjuk ringkasan pipeline. Tekan Bina untuk lihat report.

## 4. Pasang jadual harian
1. Pilih fungsi **`pasangJadual`**, tekan **▶ Run** sekali.
2. Siap. Bina akan jalan setiap hari sekitar **8:00 pagi**.

## Kalau ada ralat
| Mesej | Maksud |
|---|---|
| `Tetapan belum lengkap` | Salah satu Script Property belum diisi |
| `Markas tolak (401)` | `MARKAS_AGENT_KEY` tak sama dengan di Vercel |
| `Markas tolak (400)` | Agent `bina` tiada dalam `markas.config.js` |
| `You do not have permission` / `not found` | ID Sheet salah, atau akaun ini tiada akses ke Sheet itu |
