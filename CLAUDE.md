# Markas Agent: BinaLab

## Siapa dan apa
Pemilik projek: Danial, pemilik BinaLab (projek bina app/produk dan monetisasi).
Danial bukan developer sepenuh masa. Terangkan dalam Bahasa Melayu yang ringkas dan jelas.

Markas Agent ialah sistem AI agent untuk dua bisnes Danial: satu hab Command, pejabat **BinaLab** (studio perisian) dan pejabat **Meney Gaming** (kedai gaming), dipaparkan sebagai dashboard 3D kompleks bangunan pejabat. Satu kod, satu dashboard, tetapi data kedua-dua bisnes kekal berasingan.

## Struktur projek
- `index.html`: kerangka halaman (header, tab, roster, panel detail).
- `src/main.js`: sambung semua bahagian + gelung animasi.
- `src/style.css`: semua gaya (warna jenama, mesra phone).
- `markas.config.js`: **satu-satunya tempat** untuk tambah, buang atau namakan semula pejabat dan agent (penerangan medan ada di atas fail).
- `src/config.js`: baca config, semak kesilapan (ID berulang, pejabat tiada), kira susun atur 3D: pejabat sebaris di belakang hab, meja grid 2 lajur ikut bilangan agent, kamera muat seluruh markas.
- `src/scene/`: dunia 3D. `stage.js` (renderer, lampu, bayang-bayang), `parts.js` (bentuk asas, papan tanda bumbung `signBoard`), `site.js` (tanah, dataran, laluan, jalan, pokok, lampu, kereta), `decor.js` (asas bangunan, lantai, dinding bangunan, tingkap/neon, meja kerja, kerusi, zon pantri/kaunter, sofa/sudut gaming, printer/meja repair, pokok, meja Command + hologram; `bakeStatic` gabung perabot statik supaya laju), `spots.js` (tempat yang pekerja boleh pergi + laluan), `person.js` (figura pekerja bersendi: duduk, berdiri, berjalan; ekspresi muka senyum/fokus/risau), `world.js` (susun semuanya + lampu dalam bangunan), `camera.js` (gerakan kamera), `daylight.js` (siang/malam ikut waktu Malaysia; uji dengan `?jam=21`), `effects.js` (sampul report terbang ke Nadi), `weather.js` (cuaca sebenar Pasir Tumboh dari Open-Meteo, percuma tanpa key: awan di ufuk, hujan, kilat; uji dengan `?cuaca=hujan|mendung|ribut|cerah`), `quality.js` (mod Cantik/Laju; auto tukar ke Laju kalau FPS < 32, pilihan disimpan dalam localStorage).
- `src/ui/ui.js`: tab, roster, panel detail, gelembung, tanda nama atas kepala, notis (toast). Tekan bangunan = zum ke pejabat itu.
- `src/sim/sample.js`: mod "Data contoh" (status simulasi, report ke Nadi, contoh "perlu keputusan" dari `contohKeputusan` dalam config).
- `src/sim/customers.js`: pelanggan masuk kedai bertema "kedai" (Meney) dari kaki lima ke kaunter. Mod Data contoh; nanti boleh dicetus oleh jualan POS.
- `src/sim/life.js`: pekerja tak sibuk sekali-sekala bangun ke pantri/sofa/whiteboard/rakan dan kembali. Hiasan visual sahaja, tidak ubah status.
- `api/`: backend (Vercel Functions). `_lib.js` (Upstash REST, semak kunci), `status.js` (POST agent hantar status dengan `Authorization: Bearer MARKAS_AGENT_KEY`; GET dashboard baca dengan `x-markas-code`), `log.js` (50 aktiviti terakhir), `decision.js` (tanda keputusan selesai), `health.js` (semakan tanpa rahsia + cadangan kunci rawak). Data Redis: `markas:status:<id>` (JSON) dan `markas:log:<id>` (senarai, maks 50).
- Rahsia di Vercel sahaja (lihat `.env.example`): `MARKAS_AGENT_KEY`, `MARKAS_VIEW_CODE`; `KV_REST_API_URL`/`KV_REST_API_TOKEN` diisi oleh Upstash.
- Tambah `?debug` pada URL untuk dedah `window.__markas` (renderer + agent) semasa ujian.
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
- JANGAN mula dari kosong. Kekalkan rupa dan rasa visual semasa (susun atur, warna jenama, logo terapung, gerakan kamera).
- Arah visual (dipersetujui Danial, 13 Nov 2026): **kompleks bangunan atas tanah**, bukan platform terapung atau tema angkasa. Bangunan "dipotong" di depan dan tiada bumbung (macam rumah anak patung) supaya dalam nampak. Papan tanda di atas bumbung dengan tiang (BinaLab: ikon kiri, tulisan kanan). Command = pavilion kaca oktagon. Tapak: rumput, dataran, laluan pejalan kaki, jalan raya, pokok, lampu jalan, kereta. Latar navy #0F1B2D, bayang-bayang lembut. Pekerja ialah **figura blok gaya mainan** (kepala silinder kuning, tangan "C"), duduk di meja; Nadi berdiri di hab Command. Jangan guna nama atau logo jenama mainan.
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
- Backend (ditukar 13 Nov 2026, dipersetujui Danial): **Vercel Functions + Upstash Redis** (bukan Supabase lagi). Semua kod API dalam `api/` repo ini, deploy automatik bersama dashboard. Upstash disambung melalui Vercel Marketplace (pelan percuma).
- Hosting dashboard: **Vercel** (team `bina-lab`, projek `office-ai-agent`). Alamat live: https://office-ai-agent-tawny.vercel.app (semakan backend: `/api/health`). Repo GitHub: `danialrohaizat012-sys/OfficeAiAgent`.
- Agent Bina: **Google Apps Script berasingan** milik Danial. Ia baca tracker prospek dalam Google Sheet, kira ringkasan, dan hantar **ringkasan sahaja** ke `/api/status`. Data prospek mentah kekal dalam Google.
- Sumber data Bina: tracker prospek Malaysia (milik Fakhri, aktif) dan tracker BinaLab Global. Tracker Baihaqi belum aktif, jadi abaikan dulu.
- Tracker Malaysia belum ada nilai RM berbentuk nombor atau tarikh follow-up. Bina v1 lapor kiraan sahaja dan tanda isu kualiti data (contoh: Lead ID berulang).
- **Repo ini public**: jangan commit ID Sheet, nama atau nombor telefon prospek, data klien, atau apa-apa rahsia.

- **Keputusan A (13 Nov 2026)**: satu Markas, dua pejabat (BinaLab + Meney), Nadi ketua Command. Prototaip Meney (meney-markas.zip) ialah kod yang sama; hanya agent, warna dan logo berbeza.
- Data Meney ada dalam **Firebase/Firestore** (POS, accounting, KroniMeney). Markas hanya **baca** dan simpan **ringkasan** sahaja. Tiada tulis ke Firestore, dan tiada perubahan harga, stok, rekod kewangan atau mesej pelanggan tanpa kelulusan Danial.
- Login dashboard: **kod akses** (`MARKAS_VIEW_CODE`) dimasukkan sekali dan diingat pelayar; dihantar sebagai header `x-markas-code`. Mod Data contoh kekal terbuka tanpa kod.

## Status peringkat
- [x] Peringkat 0: repo, `.gitignore`, prototaip asal sebagai titik mula
- [x] Peringkat 1: susun semula ke Vite + three.js terkini (rupa sama; pepijat kanvas Retina dibetulkan)
- [x] Peringkat 2: config agent + pejabat Meney (9 agent, 3 pejabat)
- [x] Peringkat 2b: rupa pejabat sebenar + figura pekerja (tema "studio" BinaLab, "kedai" Meney)
- [x] Peringkat 2c: pejabat lebih besar dan detail + pekerja berjalan
- [x] Peringkat 2d: konsep bangunan atas tanah + papan tanda bumbung (tiada lagi terapung)
- [x] Peringkat 2e: siang/malam, mod laju, sampul report, tanda "perlu keputusan", pelanggan Meney
- [x] Peringkat 2f: tanda nama, ekspresi muka, tekan bangunan untuk zum, cuaca sebenar, kereta bergerak + awan, papan pesan (`papanPesan` dalam config), animasi pembukaan
- [x] Peringkat 3: backend Vercel Functions + Upstash (diuji tempatan dengan Redis tiruan; ujian sebenar perlu Danial buka /api/health)
- [ ] Peringkat 4: dashboard baca status + toggle data contoh
- [ ] Peringkat 5: log aktiviti + report terakhir
- [ ] Peringkat 6: hidupkan Bina (Apps Script)
- [ ] Peringkat 7: README BM
