# Markas Agent: BinaLab

## Siapa dan apa
Pemilik projek: Danial, pemilik BinaLab (projek bina app/produk dan monetisasi).
Danial bukan developer sepenuh masa. Terangkan dalam Bahasa Melayu yang ringkas dan jelas.

Markas Agent ialah sistem AI agent untuk dua bisnes Danial: satu hab Command, pejabat **BinaLab** (studio perisian) dan pejabat **Meney Gaming** (kedai gaming), dipaparkan sebagai dashboard 3D bertema angkasa. Satu kod, satu dashboard, tetapi data kedua-dua bisnes kekal berasingan.

## Struktur projek
- `index.html`: kerangka halaman (header, tab, roster, panel detail).
- `src/main.js`: sambung semua bahagian + gelung animasi.
- `src/style.css`: semua gaya (warna jenama, mesra phone).
- `markas.config.js`: **satu-satunya tempat** untuk tambah, buang atau namakan semula pejabat dan agent (penerangan medan ada di atas fail).
- `src/config.js`: baca config, semak kesilapan (ID berulang, pejabat tiada), kira susun atur 3D: pejabat sebaris di belakang hab, meja grid 2 lajur ikut bilangan agent, kamera muat seluruh markas.
- `src/scene/`: dunia 3D. `stage.js` (renderer, kamera, lampu, bintang), `parts.js` (platform, meja, robot, papan logo), `world.js` (susun hab, pejabat, jambatan, robot), `camera.js` (gerakan kamera).
- `src/ui/ui.js`: tab, roster, panel detail, gelembung.
- `src/sim/sample.js`: mod "Data contoh" (status simulasi).
- `logos/`: logo BinaLab dan Meney (SVG/PNG). `-dark` untuk latar gelap. Logo dibaca terus dari fail SVG.
- `prototaip/markas-binalab.html`: prototaip asal satu fail. Rujukan rupa sahaja, jangan ubah.

Jalankan: `npm install`, kemudian `npm run dev`. Bina: `npm run build`, hasilnya dalam `dist/`.
three.js 0.187 dengan tetapan "legacy" (ColorManagement off, output linear, lampu × π) supaya warna sama dengan r128.

## Agent sekarang
- Command: Nadi, ketua untuk kedua-dua bisnes (agih kerja, rumus laporan harian)
- BinaLab: Bina (pipeline & prospek), Riza (riset pasaran), Mira (produk & MVP), Ayu (admin & customer care)
- Meney: Kai (jual beli & stok), Faris (repair & servis), Zara (content & posting), Lina (laporan & angka). Warna Meney: hijau lime #8DC63F. Logo Meney melintang (kanvas 1400×700, skala 3.1).

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

- **Keputusan A (13 Nov 2026)**: satu Markas, dua pejabat (BinaLab + Meney), Nadi ketua Command. Prototaip Meney (meney-markas.zip) ialah kod yang sama; hanya agent, warna dan logo berbeza.
- Data Meney ada dalam **Firebase/Firestore** (POS, accounting, KroniMeney). Markas hanya **baca** dan simpan **ringkasan** sahaja. Tiada tulis ke Firestore, dan tiada perubahan harga, stok, rekod kewangan atau mesej pelanggan tanpa kelulusan Danial.
- Bila data hidup masuk, dashboard perlukan login (cadangan: Supabase Auth, pautan emel). Mod Data contoh boleh kekal terbuka.

## Status peringkat
- [x] Peringkat 0: repo, `.gitignore`, prototaip asal sebagai titik mula
- [x] Peringkat 1: susun semula ke Vite + three.js terkini (rupa sama; pepijat kanvas Retina dibetulkan)
- [x] Peringkat 2: config agent + pejabat Meney (9 agent, 3 pejabat)
- [ ] Peringkat 3: backend Supabase
- [ ] Peringkat 4: dashboard baca status + toggle data contoh
- [ ] Peringkat 5: log aktiviti + report terakhir
- [ ] Peringkat 6: hidupkan Bina (Apps Script)
- [ ] Peringkat 7: README BM
