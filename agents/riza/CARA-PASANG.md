# Riza V1.1 — Free-First / Places ID-Only (BinaLab)

**Kod tersedia di GitHub, belum diaktifkan di akaun Google.** Laluan ini direka untuk menggunakan hanya Google Places **Text Search Essentials (IDs Only)**: medan `places.id` sahaja, tanpa telefon, nama, alamat atau laman web daripada API. Mengikut harga Google semasa, SKU **IDs Only** ialah *unlimited no-cost*, tetapi mengaktifkan Places API lazimnya memerlukan projek Google Cloud dan billing. **Tiada jaminan kos keseluruhan RM0 jika perkhidmatan lain diaktifkan.**

Sumber rasmi:
- [Text Search field masks dan SKU](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Google Maps pricing](https://developers.google.com/maps/billing-and-pricing/overview)
- [Places storage/caching policies](https://developers.google.com/maps/documentation/places/web-service/policies)

## Had Free-First
- **Hanya** meminta `places.id`. Jangan tambah `displayName`, `formattedAddress`, `nationalPhoneNumber`, `websiteUri` atau medan lain tanpa audit kos.
- 1 permintaan carian setiap hari dijadualkan. Default maksimum **5 kandidat** sehari, boleh set `DAILY_LEAD_LIMIT=10`.
- Default maksimum **20 permintaan sebulan** (`MONTHLY_REQUEST_LIMIT=20`). Bilangan ini bukan hard budget dari Google Cloud, cuma kawalan tambahan dalam Apps Script. Letakkan juga kuota dan amaran bil di Cloud Console.
- Skrip menggunakan 7 query bergilir-gilir, tidak menjalankan crawling besar-besaran.
- Tempat masuk sebagai **Place ID + pautan review**, tidak secara automatik memasukkan nama/telefon dari data Google. Google membenarkan menyimpan Place ID, tetapi mengehadkan penyimpanan content tempat lain. Sumber data perniagaan lain mesti mempunyai hak simpan sendiri.
- Tiada model GPT/Claude berbayar. Tiada outreach automatik.

## Setup (diperlukan untuk mengaktifkan)
1. Cipta Google Apps Script **Riza – Prospecting** di [script.google.com](https://script.google.com) menggunakan akaun yang boleh mengedit spreadsheet prospek BinaLab.
2. Tampalkan **seluruh** [Code.gs](Code.gs) dalam projek itu. **Jangan** guna versi Riza V1 lama yang meminta medan Enterprise.
3. Dalam Google Cloud, aktifkan **Places API (New)**. Konfigurasikan API key yang dihadkan kepada Places API (New), kuota rendah dan amaran bil. Semak keperluan billing di Console.
4. Apps Script → Project Settings → Script Properties:
   - `PROSPECT_SHEET_ID`: ID spreadsheet prospek BinaLab (bukan URL penuh).
   - `GOOGLE_PLACES_API_KEY`: API key Places API (New). **Jangan** masukkan ke GitHub.
   - `RIZA_ENABLE`: `YES` selepas semak kos dan akses.
   - `RIZA_ALLOW_PAID`: `NO` (opsyen pilihan, mesti NO jika ada).
   - `DAILY_LEAD_LIMIT`: `5` (pilihan, maks 10).
   - `MONTHLY_REQUEST_LIMIT`: `20` (pilihan, maksimum 31).
   - `MARKAS_URL`: `https://office-ai-agent-tawny.vercel.app` (pilihan).
   - `MARKAS_AGENT_KEY`: kunci rahsia agent Markas dari Vercel (pilihan).
5. Run `ujiRiza` dan benarkan akses apabila diminta. Skrip mencipta tab **Riza Leads** dan menambah kandidat ID. Jika tab lama dengan schema lain ada, skrip berhenti dan tidak memadamnya. Sediakan tab baru atau migrasi dengan kelulusan.
6. Semak hasil dengan Fakhri. Setiap baris hanya **candidate ID**; Fakhri buka Review Link, sahkan maklumat perniagaan dari sumber yang boleh digunakan dan lengkapkan medan manual hanya dengan kebenaran data yang sesuai.
7. Bila berjaya, run `pasangJadual`. Seterusnya sekitar 9:00 pagi MYT setiap hari. Untuk berhenti, run `hentikanJadual` dan set `RIZA_ENABLE=NO`.

## Cara sahkan
- [ ] Tiada caj luar jangka di Google Cloud billing/usage.
- [ ] Kod `X-Goog-FieldMask: places.id` sahaja.
- [ ] Rekod baru terhad sehingga 5 kandidat/hari secara default.
- [ ] Tiada kandidat direka jika carian pulangkan kurang daripada 5.
- [ ] Run semula hari sama tidak membuat permintaan API lain.
- [ ] Place ID dalam spreadsheet sama tidak dimasukkan dua kali.
- [ ] Tiada nama, nombor telefon atau alamat Google disalin ke sheet secara automatik.
- [ ] Status Riza muncul di Markas jika kunci diset.
- [ ] Tiada WhatsApp/DM/email dihantar.

## Batasan
ID-only ialah **research queue**, bukan autonomous CRM lengkap. Untuk membina CRM dengan nama, telefon dan bukti fit yang berkekalan, kita perlu sumber dengan lesen penyimpanan yang jelas atau input daripada penyelidik manusia. Jangan anggap adanya Places API key bermaksud semua medan API percuma.

Perkhidmatan percuma/billing dan TOS berubah. Semak semula sumber rasmi sebelum mengaktifkan atau membesarkan skala.
