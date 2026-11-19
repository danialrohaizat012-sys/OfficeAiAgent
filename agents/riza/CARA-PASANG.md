# Riza V2 — OpenStreetMap + Overpass API (tanpa Google Cloud)

**Status:** kod sudah dikemas kini dalam GitHub; **belum dipasang atau diaktifkan** dalam Google Apps Script milik Danial. Tiada Google Cloud, Google Places key, atau API model AI diperlukan. Public Overpass API disediakan komuniti dan tiada jaminan uptime. Kita hanya jalankan **1 carian ringan sehari, 20 carian sebulan** secara default.

## Fungsi
- Baca listing perniagaan OSM (kedai, restoran, kafe dan bengkel) di kawasan kecil Kelantan & Kuala Terengganu.
- Simpan sehingga **5 calon perniagaan sehari** secara default (maksimum 10).
- Simpan ID OSM, nama, kategori, alamat/telefon/website **jika tersedia di OSM**, pautan sumber, produk BinaLab disyorkan dan skor heuristik.
- Semak pendua berdasarkan OSM ID dan nama pada **spreadsheet sama**.
- Tambah **tab baru `Riza OSM Leads`**, tidak padam tab Fakhri dan tidak mengganggu `Riza Leads` versi Google Places lama.
- Hantar status `riza` ke Virtual Office apabila kunci Markas dikonfigurasi.
- Tiada WhatsApp, email, DM automatik. Prospek memerlukan semakan Fakhri.

## Langkah 1 — Salin Code.gs
1. Buka [Kod Riza V2](Code.gs).
2. Klik **Raw / Copy raw file** di GitHub untuk salin *seluruh* kandungan.
3. Buka [script.google.com/home](https://script.google.com/home).
4. Jika **Riza – BinaLab Prospecting** sudah wujud, buka projek itu. Jika belum, pilih **New project** dan namakan **Riza – BinaLab Prospecting**.
5. Buka fail `Code.gs`. **Gantikan keseluruhan kandungan Riza lama** dengan kod V2 ini. Jangan ganti `Bina – Markas` kerana itu agent berasingan.
6. Klik **Save**. Tajuk komen di atas kod mesti `RIZA V2 — OpenStreetMap / Overpass API`.

## Langkah 2 — Google Sheet
1. Buka sheet yang kau mahu jadikan tracker prospek Riza; gunakan akaun Google yang boleh **edit** sheet.
2. Salin ID sahaja dari URL `https://docs.google.com/spreadsheets/d/ID_INI/edit`.
3. Tidak perlu buat tab secara manual. Ujian pertama akan mencipta `Riza OSM Leads`.
4. Jika sheet ada prospek lama, Riza akan semak nama pada tab yang mempunyai header **Business Name**, dan OSM ID pada tab yang mempunyai header **OSM Element ID**. Ini **bukan jaminan dedup merentas semua file**.

## Langkah 3 — Script Properties
Apps Script → ikon ⚙ **Project Settings** → **Script Properties → Add script property**.

| Property | Value | Wajib? |
|---|---|---|
| `PROSPECT_SHEET_ID` | ID sheet prospek yang disalin | Ya |
| `RIZA_ENABLE` | `YES` | Ya, selepas bersedia |
| `DAILY_LEAD_LIMIT` | `5` | Pilihan |
| `MONTHLY_REQUEST_LIMIT` | `20` | Pilihan |
| `MARKAS_URL` | `https://office-ai-agent-tawny.vercel.app` | Pilihan untuk status Markas |
| `MARKAS_AGENT_KEY` | Nilai rahsia `MARKAS_AGENT_KEY` Vercel | Pilihan untuk status Markas |

**Padam** property lama `GOOGLE_PLACES_API_KEY` kerana V2 tidak menggunakannya. Jangan tampal kunci rahsia dalam GitHub atau ChatGPT. `RIZA_ALLOW_PAID` juga tidak digunakan dalam V2.

## Langkah 4 — Uji sekali
1. Dalam editor Apps Script, pilih fungsi `ujiRiza` daripada dropdown.
2. Tekan **Run**.
3. Pada run pertama, Google meminta kebenaran mengakses Sheets dan membuat URL fetch. Semak scope sebelum pilih **Allow**.
4. Semak **Execution log**. Jika berjaya, ada mesej `RIZA OSM ... calon baharu`.
5. Buka Sheet dan lihat tab **Riza OSM Leads**.
6. Semak sekurang-kurangnya 3 rekod melalui **OSM URL** dan sahkan kewujudan perniagaan serta butiran semasa. Data OSM mungkin tidak lengkap atau lapuk.
7. Kalau server Overpass jawab HTTP 429/502/503/504, hentikan ujian. Jangan ulang bertubi-tubi. Skrip sengaja tiada retry automatik dan menandakan permintaan hari tersebut telah digunakan.

**Penting:** Jika Apps Script Riza yang lama telah menjalankan `ujiRiza` pada hari yang sama, property `RIZA_LAST_RUN` mungkin menyekat ujian baharu. Untuk menguji V2 pada hari sama, selepas semak bahawa tiada trigger serentak, padam `RIZA_LAST_RUN` sekali dalam Script Properties. Jangan padam counter bulanan semata-mata mahu melepasi had API.

## Langkah 5 — Sambung ke Virtual Office (pilihan)
1. Pergi ke Vercel project `OfficeAiAgent` → **Settings → Environment Variables**.
2. Cari `MARKAS_AGENT_KEY` tanpa mendedahkan nilainya.
3. Dalam Apps Script tambahkan `MARKAS_URL` dan `MARKAS_AGENT_KEY` yang sama.
4. Jalankan `ujiRiza` pada hari yang dibenarkan (sekali sehari), atau tunggu trigger seterusnya.
5. Buka [Office AI Agent](https://office-ai-agent-tawny.vercel.app), tukar **Data Contoh** kepada **Hidup** dan pilih **Riza** di tingkat BinaLab.

## Langkah 6 — Hidupkan jadual
1. Selepas semak hasil ujian, pilih fungsi `pasangJadual` → **Run** sekali.
2. Klik menu **Triggers** di Apps Script. Pastikan fungsi `jalankanRiza` ada trigger masa harian sekitar **9:00 pagi Malaysia**.
3. Riza berjalan dari server Google Apps Script walaupun laptop ditutup.
4. Untuk berhenti, jalankan `hentikanJadual` dan tukar `RIZA_ENABLE` kepada `NO`.

## Had penggunaan, lesen dan keselamatan
- Jangan gunakan Overpass API awam untuk data extraction besar-besaran atau SLA production. Public instance boleh sesak atau menolak permintaan. [Dasar penggunaan Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API) dan [status/limit](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html).
- Data OSM berlesen [ODbL 1.0](https://www.openstreetmap.org/copyright). Sheet menyertakan atribusi **© OpenStreetMap contributors** dan pautan lesen. Kalau menerbit atau berkongsi database terbitan secara umum, semak kewajipan share-alike dan attribution.
- Skor lead ialah heuristik berdasarkan kelengkapan maklumat, **bukan ukuran minat membeli atau kelayakan pelanggan**.
- Jangan menghantar komunikasi pukal tanpa kelulusan Fakhri dan pematuhan komunikasi pemasaran.
- Hari tanpa hasil tidak dipenuhi dengan data rekaan.
- Jadual 1 query/hari, had 20 query/bulan ialah had dalaman Apps Script, bukan kuota rasmi Overpass. Penggunaan kecil sekalipun boleh gagal apabila server sibuk.

## Ujian penerimaan
- [ ] `Code.gs` bermula dengan komen `RIZA V2`.
- [ ] Google Places API key tidak digunakan.
- [ ] `ujiRiza` berjaya tanpa HTTP 429/503.
- [ ] Tab `Riza OSM Leads` dibuat.
- [ ] Rekod ada OSM URL dan atribusi ODbL.
- [ ] Ujian ulangan tidak menghasilkan pendua.
- [ ] Riza muncul di Markas mod Hidup (jika status configured).
- [ ] Trigger harian wujud selepas `pasangJadual`.
- [ ] Tiada outreach automatik.

Untuk masa depan, apabila penggunaan komersial bertambah, pertimbangkan penyedia Overpass berbayar atau self-hosted. **Versi awam sekarang untuk fasa eksperimen volum rendah**, bukan perkhidmatan yang dijanjikan sentiasa tersedia.
