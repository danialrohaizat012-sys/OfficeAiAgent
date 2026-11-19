# Riza V1 — Autonomous Prospecting (BinaLab)

Riza ialah staf **Riset Pasaran** dalam BinaLab Virtual Office (agent ID: `riza`). Ia boleh mencari prospek **Google Places awam**, mengelakkan pendua, mengisi Google Sheets dan menghantar ringkasan kepada Markas. Ia **tidak** menghantar email, WhatsApp atau DM.

> Status: **Kod disediakan, belum diaktifkan** sehingga API key, Spreadsheet ID, keizinan Apps Script dan trigger berjadual disediakan. Google Places API (New) memerlukan akaun Google Cloud, billing dan kuota. Kos penggunaan mungkin dikenakan.

## Setup 1 kali
1. Buka [Google Apps Script](https://script.google.com) menggunakan akaun yang boleh edit sheet prospek BinaLab. Cipta projek **Riza – Prospecting**.
2. Tampalkan seluruh fail [Code.gs](./Code.gs) ke editor.
3. **Project Settings → Script Properties**. Tambah:
   - `GOOGLE_PLACES_API_KEY`: Google Cloud API key yang hanya membenarkan Places API (New). Hadkan API key dan kuota/belanjawan di Google Cloud.
   - `PROSPECT_SHEET_ID`: ID Google Sheet prospek BinaLab (bukan URL penuh).
   - `DAILY_LEAD_LIMIT`: `10` (pilihan, maksimum automatik 10).
   - `MARKAS_URL`: `https://office-ai-agent-tawny.vercel.app` (pilihan untuk status).
   - `MARKAS_AGENT_KEY`: nilai rahsia yang sama seperti Vercel (pilihan jika mahu status).
4. Aktifkan **Places API (New)** dalam projek Google Cloud yang mempunyai billing. Fahami billing, ToS dan kuota. Google Places data tertakluk pada terma penggunaan Google Maps Platform; semak hak penyimpanan, penggunaan ulang data dan tempoh retensi sebelum digunakan sebagai pangkalan data kekal. Jika terma tidak membenarkan retensi, ubah kepada sumber yang membenarkannya.
5. Pilih fungsi `ujiRiza` lalu **Run**. Benarkan akses Spreadsheet/UrlFetch. Ia mencipta tab berasingan **Riza Leads**. Semak output, sumber, format dan kos API.
6. Jika ujian memuaskan, jalankan `pasangJadual` sekali. Trigger harian sekitar **9:00 pagi MYT**. Untuk hentikan: jalankan `hentikanJadual`.

## Workflow
Google Places Search → tapisan perniagaan aktif → dedup (Place ID, nama, nombor perniagaan awam, domain) → penilaian heuristic → tambah tab Riza Leads → status `riza` di Markas → Fakhri semak → **manusia** buat outreach.

- Nama dan telefon prospek **tidak dihantar ke Markas**, hanya ringkasan jumlah.
- Lead Score bukan bukti niat membeli. Sumber + URL penting untuk pengesahan manusia.
- Hasil mungkin **kurang daripada 10** pada sesetengah hari. Tidak mencipta nama atau data palsu untuk capai target.
- Tidak mengubah tab prospek Fakhri sedia ada. Nama yang sudah terdapat dalam tab lain pada spreadsheet yang sama digunakan untuk dedup.
- Untuk dedup antara fail Google Sheets berbeza, tambah semakan terpisah selepas audit schema dan akses. Jangan menganggap dedup sedia ada merangkumi fail lain.
- Bila API tidak tersedia, job gagal dengan jelas, bukannya menulis prospek rekaan.
- Pastikan hanya fakta perniagaan awam yang sesuai untuk business prospecting disimpan. Jangan kutip data peribadi individu.
- Data Google Places tertakluk pada polisi Google Maps Platform. **Jangan aktifkan penyimpanan kekal/eksport secara komersial tanpa menyemak terma berkaitan.**

## Ujian penerimaan
- [ ] `ujiRiza` berjaya, API request boleh dibayar dan memberi data sah
- [ ] Tab `Riza Leads` dibuat; lajur sama dengan definisi dalam kod
- [ ] Run kedua tidak menambah Place ID/nama/domain/telefon pendua
- [ ] Tiada outreach automatik
- [ ] Markas mod Hidup memaparkan status `riza` selepas konfigurasi rahsia
- [ ] Trigger harian disahkan dalam menu Triggers
- [ ] Fakhri semak 10 rekod dan catat kualiti untuk iterasi berikutnya

## Next iteration
Sumber research yang membenarkan penyimpanan CRM jangka panjang; integrasi dengan tracker Fakhri melalui adapter schema; lead scoring berpandukan bukti masalah digital sebenar (bukan sekadar kategori), audit trail, monthly dashboard serta jadual berkala berasaskan kos/kuota.
