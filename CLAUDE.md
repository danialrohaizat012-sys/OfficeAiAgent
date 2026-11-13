# Markas Agent: BinaLab

## Siapa dan apa
Pemilik projek: Danial, pemilik BinaLab (projek bina app/produk dan monetisasi).
Danial bukan developer sepenuh masa. Terangkan dalam Bahasa Melayu yang ringkas dan jelas.

Markas Agent BinaLab ialah sistem AI agent untuk BinaLab: satu hab Command dan satu pejabat BinaLab, dipaparkan sebagai dashboard 3D bertema angkasa. (Meney Gaming diurus secara berasingan dan BUKAN sebahagian projek ini.)

## Fail sedia ada
- `markas-binalab.html`: prototaip dashboard 3D (three.js r128 dari CDN, satu fail). Ada hab Command, pejabat BinaLab dengan logo terapung, jambatan, 5 robot agent, roster di bawah, tab penapis, panel detail agent, dan status SIMULASI (data contoh).
- `logos/`: logo BinaLab dalam SVG dan PNG. `-dark` untuk latar gelap, `-light` untuk latar terang. Logo dark kini dibenamkan dalam HTML sebagai string.

## Agent sekarang
- Command: Nadi (agih kerja, rumus laporan harian)
- BinaLab: Bina (pipeline & prospek), Riza (riset pasaran), Mira (produk & MVP), Ayu (admin & customer care)

Keutamaan: BinaLab perlukan data pipeline yang bermakna. Agent Bina (pipeline & prospek) ialah agent pertama yang patut dihidupkan.

## Peraturan
- JANGAN mula dari kosong. Kekalkan rupa dan rasa visual prototaip (susun atur, warna, robot, logo, gerakan).
- Warna jenama: hijau #4CC26C, navy #0F1B2D; Command biru-ungu #8E9BFF.
- Mesra phone (Danial guna iPhone) dan laju.
- Kerja satu peringkat pada satu masa. Uji setiap peringkat sebelum teruskan.
- Sebelum keputusan besar (teknologi, hosting, apa-apa yang ada kos), cadangkan pilihan dan TUNGGU persetujuan Danial.
- Jangan simpan API key atau rahsia dalam kod. Guna `.env` dan masukkan dalam `.gitignore`.

## Matlamat
1. Susun semula prototaip jadi projek kemas (contoh: Vite + three.js versi moden, modul berasingan untuk scene, agent, UI). Logo dibaca dari fail SVG.
2. Senarai agent dalam satu fail config, supaya boleh tambah, buang atau namakan semula agent tanpa sentuh kod 3D.
3. Backend ringkas untuk status agent sebenar: agent hantar status (sedang buat apa, busy/idle, report terakhir, masa) ke satu API endpoint yang dilindungi API key. Dashboard baca status (polling atau realtime).
4. Kekalkan mod "data contoh" sebagai toggle.
5. Log aktiviti dan report terakhir setiap agent dalam panel detail.
6. README dalam Bahasa Melayu: cara jalankan, tambah agent, dan hantar status.

## Keputusan yang dah dipersetujui (13 Nov 2026)
- Backend: **Supabase** (jadual status + log aktiviti, Edge Function `/status` dilindungi API key).
- Hosting dashboard: **Vercel**.
- Agent Bina: **Google Apps Script berasingan** milik Danial. Ia baca tracker prospek dalam Google Sheet, kira ringkasan, dan hantar **ringkasan sahaja** ke Supabase. Data prospek mentah kekal dalam Google.
- Sumber data Bina: tracker prospek Malaysia (milik Fakhri, aktif) dan tracker BinaLab Global. Tracker Baihaqi belum aktif, jadi abaikan dulu.
- Tracker Malaysia belum ada nilai RM berbentuk nombor atau tarikh follow-up. Bina v1 lapor kiraan sahaja dan tanda isu kualiti data (contoh: Lead ID berulang).
- **Repo ini public**: jangan commit ID Sheet, nama atau nombor telefon prospek, data klien, atau apa-apa rahsia.

## Status peringkat
- [x] Peringkat 0: repo, `.gitignore`, prototaip asal sebagai titik mula
- [ ] Peringkat 1: susun semula ke Vite + three.js terkini (rupa mesti sama)
- [ ] Peringkat 2: config agent
- [ ] Peringkat 3: backend Supabase
- [ ] Peringkat 4: dashboard baca status + toggle data contoh
- [ ] Peringkat 5: log aktiviti + report terakhir
- [ ] Peringkat 6: hidupkan Bina (Apps Script)
- [ ] Peringkat 7: README BM
