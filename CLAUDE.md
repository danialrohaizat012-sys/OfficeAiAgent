# Markas Agent: BinaLab

## Siapa dan apa
Pemilik projek: Danial, pemilik BinaLab (projek bina app/produk dan monetisasi).
Danial bukan developer sepenuh masa. Terangkan dalam Bahasa Melayu yang ringkas dan jelas.

Markas Agent ialah sistem AI agent untuk bisnes Danial: satu hab Command, pejabat **BinaLab** (studio perisian), pejabat **Meney Gaming** (kedai gaming), makmal **Cipta Robo** (R&D robot AI companion NURI), serta **EHNAKAMA**, **GilaPips** dan **LAKAR** (venture ROI Resources), dipaparkan sebagai dashboard 3D **menara ROI Resources** (syarikat induk; setiap venture = anak syarikat di satu tingkat). Satu kod, satu dashboard, tetapi data kedua-dua bisnes kekal berasingan.

## Struktur projek
- `index.html`: kerangka halaman (header, tab, roster, panel detail).
- `src/main.js`: sambung semua bahagian + gelung animasi.
- `src/style.css`: semua gaya (warna jenama, mesra phone).
- `markas.config.js`: **satu-satunya tempat** untuk tambah, buang atau namakan semula pejabat dan agent (penerangan medan ada di atas fail).
- `src/config.js`: baca config, semak kesilapan (ID berulang, pejabat tiada), kira susun atur MENARA: setiap pejabat satu tingkat (`FLOOR_H` = 3.3), hab di atas; meja grid 2 lajur ikut bilangan agent; `viewFit` beri tinggi/lebar menara untuk kamera.
- `src/scene/`: dunia 3D. `stage.js` (renderer, lampu, bayang-bayang), `parts.js` (bentuk asas, papan tanda bumbung `signBoard`), `site.js` (tanah, dataran, laluan, jalan, pokok, lampu, kereta), `decor.js` (asas bangunan, lantai, dinding bangunan, tingkap/neon, meja kerja, kerusi, zon pantri/kaunter, sofa/sudut gaming, printer/meja repair, pokok, meja Command + hologram; `bakeStatic` gabung perabot statik supaya laju), `spots.js` (tempat yang pekerja boleh pergi + laluan), `person.js` (figura pekerja bersendi: duduk, berdiri, berjalan; ekspresi muka senyum/fokus/risau), `world.js` (susun semuanya + lampu dalam bangunan), `facade.js` (muka luar belakang & sisi setiap tingkat: kelongsong gelap, jalur tingkap menyala waktu malam, sirip aluminium, spandrel dengan LED warna venture, papan nama venture di belakang & sisi kiri; jalur cahaya ROI di penjuru belakang ada dalam `tower()`), `camera.js` (gerakan kamera), `daylight.js` (siang/malam ikut waktu Malaysia; uji dengan `?jam=21`), `effects.js` (sampul report terbang ke Nadi), `weather.js` (cuaca sebenar Pasir Tumboh dari Open-Meteo, percuma tanpa key: awan di ufuk (disembunyi bila phone tegak, dimalapkan waktu malam), hujan, kilat; uji dengan `?cuaca=hujan|mendung|ribut|cerah`), `quality.js` (mod Cantik/Laju; auto tukar ke Laju kalau FPS < 32, pilihan disimpan dalam localStorage).
- `src/ui/ui.js`: tab, roster, panel detail, gelembung, tanda nama atas kepala, notis (toast). Tekan bangunan = zum ke pejabat itu.
- `src/live/live.js`: mod Hidup (baca `/api/status` setiap 20 saat, berhenti bila tab tersembunyi; simpan kod akses + mod dalam localStorage; `markDecisionDone`). Butang "Data contoh / ● Hidup" di header; skrin kod akses (`#codeModal`, autofill Password Manager). Dalam mod Hidup: `a.live` = status server (null = belum hantar, chip pudar), senarai tugas contoh disembunyi, pelanggan contoh dimatikan, sampul terbang bila `reportPada` berubah.
- `src/sim/sample.js`: mod "Data contoh" (status simulasi, report ke Nadi, contoh "perlu keputusan" dari `contohKeputusan` dalam config).
- `src/sim/customers.js`: pelanggan masuk kedai bertema "kedai" (Meney) dari kaki lima ke kaunter. Mod Data contoh; nanti boleh dicetus oleh jualan POS.
- `src/sim/life.js`: pekerja tak sibuk sekali-sekala bangun ke pantri/sofa/whiteboard/rakan dan kembali. Hiasan visual sahaja, tidak ubah status.
- `api/`: backend (Vercel Functions). `_lib.js` (Upstash REST, semak kunci), `status.js` (POST agent hantar status dengan `Authorization: Bearer MARKAS_AGENT_KEY`; GET dashboard baca dengan `x-markas-code`), `log.js` (50 aktiviti terakhir), `decision.js` (tanda keputusan selesai), `health.js` (semakan tanpa rahsia + cadangan kunci rawak), `nadi.js` (Nadi rumus laporan harian dari status semua agent: ringkasan ikut pejabat + baris penting dari report, senarai perlu keputusan, agent senyap ikut `senyapSelepasJam` dalam config; dicetus Vercel Cron `vercel.json` 00:30 UTC = 8:30 MYT dengan `CRON_SECRET`, atau butang "Rumus laporan sekarang" dalam panel Nadi dengan kod akses). Data Redis: `markas:status:<id>` (JSON) dan `markas:log:<id>` (senarai, maks 50).
- `agents/bina/`: agent Bina (Google Apps Script). `Code.gs` (baca tracker MY + Global, kira ringkasan, hantar ke `/api/status`; tetapan dalam Script Properties: `MARKAS_URL`, `MARKAS_AGENT_KEY`, `SHEET_MY`, `SHEET_GLOBAL`), `appsscript.json` (zon waktu KL, skop baca sahaja), `CARA-PASANG.md` (panduan BM). ID Sheet TIDAK dalam repo.
- `agents/meney/`: agent Lina + Faris (Google Apps Script, projek berasingan dari Bina). Baca Firestore `meney-daily-mission` melalui REST dengan token OAuth akaun Danial (`ScriptApp.getOAuthToken()` + skop `datastore` dalam `appsscript.json`; header `x-goog-user-project`). BACA SAHAJA. Lina: jualan hari/bulan (`sales.saleDate`), untung kasar (kos item; konsainan guna `consignmentPayable`), repair siap (`completedTransactionDate`), sasaran (`SASARAN_BULAN`), shift + beza tunai (|beza| ≥ RM5 = keputusan). Faris: repair terbuka ikut status, siap belum diambil ≥3 hari, terbuka ≥7 hari (≥3 tiket = keputusan). Jadual setiap jam 9 pagi–11 malam. Medan ikut `pos.html` v2.9.1 (disahkan sepadan dengan POS live oleh Danial).
- Rahsia di Vercel sahaja (lihat `.env.example`): `MARKAS_AGENT_KEY`, `MARKAS_VIEW_CODE`, `CRON_SECRET`; `KV_REST_API_URL`/`KV_REST_API_TOKEN` diisi oleh Upstash.
- Tambah `?debug` pada URL untuk dedah `window.__markas` (renderer + agent) semasa ujian.
- `logos/`: logo BinaLab dan Meney (SVG/PNG). `-dark` untuk latar gelap. Logo dibaca terus dari fail SVG.
- `prototaip/markas-binalab.html`: prototaip asal satu fail. Rujukan rupa sahaja, jangan ubah.

Jalankan: `npm install`, kemudian `npm run dev`. Bina: `npm run build`, hasilnya dalam `dist/`.
three.js 0.187 dengan tetapan "legacy" (ColorManagement off, output linear, lampu × π) supaya warna sama dengan r128.

## Agent sekarang
- Command: Nadi, **Virtual CEO ROI Resources** (agih kerja ke semua venture, rumus laporan harian). Tingkat paling atas = Pejabat CEO (`ceoSuite` dalam `src/scene/gaya.js`): meja eksekutif (Nadi duduk, `a.home.leader`), dinding portfolio satu skrin bagi setiap venture, meja mesyuarat lembaga (kerusi warna venture), sudut rehat, papan "PEJABAT CEO · NADI".
- BinaLab: Bina (pipeline & prospek), Riza (riset pasaran), Mira (produk & MVP), Ayu (admin & customer care)
- Meney: Kai (jual beli & stok), Faris (repair & servis), Zara (content & posting), Lina (laporan & angka). Warna Meney: hijau lime #8DC63F. Logo Meney melintang (kanvas 1400×700, skala 3.1).
- Cipta Robo (tema `robotik`, makmal NURI dalam `src/scene/nuriLab.js`; ditambah melalui PR #1): Muhafiz (hardware & prototaip NURI: K151, Suit, Dock), Reka (website ciptarobo.com, 3D & reka bentuk NURI). Status/tugas masih SIMULASI. Warna jenama hijau-teal #4FBF9F, gelap #15191D, latar cerah #F4F3EF. Logo papan tanda: `logos/ciptarobo-logo.png` (logo yang Danial hantar, dipotong tepi; latar `#F4F3EF`). `logos/ciptarobo-logo-light.svg` (dari Drive) disimpan sebagai sandaran. Papan tanda terima SVG atau PNG. NURI: AI companion berasaskan M5Stack StackChan K151, sasaran RM999 (NURI Suit, Slim Dock, ukiran); 4 contoh kegunaan Learn/Reception/Assist/Companion (bukan SKU). Jangan dakwa ciri konsep sebagai tersedia. Rujukan: Drive › Cipta Robo › "NURI Use Cases V2.x".
- Baris kedua (ditambah 19 Nov 2026; staf & tugas CONTOH, belum ada agent sebenar). Sumber maklumat: Drive "ROI RESOURCES - Venture List & Operating Structure V1.0" + repo GitHub venture.
  - Eh Nakama (tema `media`, merah #D7252C): studio media cerita anime/manga/manhwa/game + merchandise; slogan "Different stories. Same nakama."; perkongsian Fakhri 60% / Danial 40% (jangan anggap milik ROI). Hana (cerita & skrip), Ikmal (merchandise & stok), Nisa (sponsorship, affiliate & komuniti). Logo bulat asal dari Danial; logo panjang `logos/ehnakama-logo.png` (1200×400) dijana oleh `logos/ehnakama-logo-panjang.py` (emblem bulat + tulisan berus EH NAKAMA, matahari merah, cop 仲間).
  - GilaPips (tema `pasaran`, emas #D4B26A; repo `GilaPips`): edukasi pasaran & emas, komuniti, ebook; slogan "Ilmu Biasa. Hasil Luar Biasa." Amin (kandungan edukasi), Syafiq (komuniti & Telegram), Wani (ebook & produk digital). Jangan beri nasihat pelaburan. Logo `logos/gilapips-logo.svg` (ikon tiga bar dari repo + tulisan).
  - LAKAR (tema `seni`, terracotta #C4513B / teal #176B63; repo `lakar`, lakar.my): mural & seni ruang. Dina (konsep & reka mural), Fahmi (sebut harga & projek tapak), Ain (portfolio & media sosial). Logo `logos/lakar-logo.png` (dari repo, latar #F9F4EC).
- Susun atur kini menara (lihat Arah visual). Setiap venture ada susun atur khas ikut `tema` (`src/scene/gaya.js`, palet dalam `PAL` di `decor.js`): `kedai` Meney (rak game, kaunter POS, meja repair), `perisian` BinaLab (kanban PROSPEK→SIAP, dinding mockup app, meja uji peranti, rak server), `robotik` Cipta Robo (makmal NURI), `media` Eh Nakama (dinding panel manga, rak manga + figura umum, sudut podcast + ring light, meja lukis storyboard, kaunter & rak baju merch, neon 仲間), `pasaran` GilaPips (dinding 3 skrin carta + ticker "bukan nasihat pelaburan", set rakaman video, kelas mini, rak ebook emas), `seni` LAKAR (mural besar separuh siap, tangga & tin cat, mood board, kuda-kuda, sinki berus, meja konsultasi klien, lantai konkrit berpercik cat). Label aktiviti pekerja juga ikut tema. Logo papan tanda boleh SVG atau PNG.
- Lif (`world.lift` dalam `tower()`): pengawal giliran (`go(tingkat, then, hold)`, permintaan ke tingkat sama digabung, `carry(warna)` nyalakan lampu muatan). Report: sampul terbang meja → lif → naik ke tingkat CEO → Nadi (`flyReport` dalam main.js; kalau lif sibuk ≥3 giliran, sampul terus ke Nadi). Bila lapang lif merayau sendiri.
- Taman bumbung (`roofGarden` dalam gaya.js) atas Pejabat CEO: dek kayu, pasu tepi, pokok, rumput, kerusi malas, meja payung, pagar kaca LED, lampu tali (menyala malam). Papan ROI RESOURCES & antena dinaikkan atas slab.
- Waktu kerja (`waktuKerja` dalam config, lalai masuk 8.5 / balik 18): pekerja datang naik lif dan jalan ke meja (berperingkat ~8:00–8:45), balik selepas ~18:00–19:05 ke lobi lif dan hilang (`a.away`, chip pudar "🏠 Dah balik"). Nadi sentiasa ada; agent yang sibuk dalam mod Hidup kekal. Logik dalam `src/sim/life.js`; mod contoh tak beri tugas kepada yang dah balik.
- Prestasi: figura guna satu bahan warna-bucu (vertex color) supaya setiap sendi jadi satu objek (375 → 246 mesh figura). Tingkat di luar pandangan kamera tak dilukis (± satu tingkat jiran untuk bayang-bayang; lampu dalam dipindah ke scene supaya bilangan lampu tetap): ~780 draw calls pandangan penuh, ~320–420 bila fokus satu tingkat. Mod Laju (auto bila FPS < 32) buang bayang-bayang.
- Logo ROI Resources RASMI dari repo `danialrohaizat012-sys/roi` (`assets/roi-logo.svg` → `logos/roi-resources-logo.svg`, monogram → `logos/roi-resources-mark.svg`): R geometri Carbon #091411 + laluan Legacy Brass #B58A4A, tagline "FORGING VENTURES THAT MATTER". Papan bumbung latar Warm Bone #F4F1E8, bingkai brass (`bangunan.logo = { fail, latar }`). Warna jenama ROI lain: Heritage Emerald #0E624D, Forward Mint #71C7A2, Soft Sage #A8B4AE (rujuk BRAND_GUIDE.md dalam repo roi). Jangan regangkan/putar/tambah gradien pada logo.
- Ketua venture (`ketua: true` dalam config, satu setiap pejabat; kini Kai, Bina, Muhafiz, Hana, Amin, Dina): lencana bintang emas di dada, ★ pada nama. Mesyuarat (`src/sim/meeting.js` + `summon/dismiss` dalam life.js): ketua jalan ke lif → naik ke Pejabat CEO → keluar seorang demi seorang → duduk di kerusi warna venture (kerusi ke-i = tingkat i, `meet.seats` dari `ceoSuite`); Nadi jalan ke kepala meja. Giliran bercakap (gelembung), kemudian semua turun semula. Figura dipindah antara kumpulan tingkat (`a.at` = tingkat semasa). Dicetus bila: (1) ada "perlu keputusan" (Nadi + ketua venture itu, sediakan cadangan untuk Danial), (2) mesyuarat pagi `mesyuarat.harian` (lalai 9:15, semua ketua, sekali sehari), (3) butang "🗓️ Panggil mesyuarat" dalam panel Nadi (semua) atau ketua (seorang), (4) mod contoh: sekali-sekala 2–3 ketua. Maksimum 3 mesyuarat menunggu giliran.
- **Danial Rohaizat (CEO ROI Resources)** = figura Lego di bumbung (bukan agent; tiada roster/status), pakai **sut lumba** Heritage Emerald #0E624D + jalur Legacy Brass, rambut pendek gelap. Danial **pandu kereta F1** (`f1Car()` dalam gaya.js: muncung, sayap depan & belakang, halo, pod sisi, roda terbuka, nombor 1, warna ROI) keliling **litar superelips** di tengah bumbung (rumput di tengah, kerb merah-putih, garisan mula berpetak + gantri = pit, timbunan tayar). Pengawal `src/sim/danial.js` (drive → pit → turun dari kereta → jalan ke meja → duduk; selepas itu kembali ke kereta). Meja payung hijau di kanan bumbung dengan **2 kerusi sahaja: Danial (brass) & Nadi**. Hanya Nadi jumpa Danial (staf & ketua venture semua melalui Nadi). Bila perlu keputusan: Nadi mesyuarat dengan ketua venture dulu, kemudian (`meetings.escalate`) Nadi naik lif ke hentian bumbung (`lift.roofFloor`) → duduk di kerusinya; Danial masuk pit & duduk; perbincangan bermula bila kedua-dua duduk; selepas itu Nadi turun, Danial "🏎️ Sambung pusing!". Tanda keputusan selesai = Danial kata "✅ Keputusan dibuat". Tab ROI HQ: kamera dari lebih atas supaya litar nampak.

Keutamaan: BinaLab perlukan data pipeline yang bermakna. Agent Bina (pipeline & prospek) ialah agent pertama yang patut dihidupkan.

## Peraturan
- JANGAN mula dari kosong. Kekalkan rupa dan rasa visual semasa (susun atur, warna jenama, logo terapung, gerakan kamera).
- Arah visual (dikemas kini 19 Nov 2026, permintaan Danial): **menara bertingkat ROI Resources**. Satu venture setiap tingkat (susunan `pejabat` dalam config = tingkat, pertama = aras jalan: Meney → BinaLab → Cipta Robo → EHNAKAMA → GilaPips → LAKAR), **Pejabat CEO (Nadi, Virtual CEO) di tingkat paling atas**, taman bumbung dengan Danial (CEO sebenar), papan tanda **ROI RESOURCES** atas bumbung (`bangunan.logo` dalam config → `logos/roi-resources-logo.svg`, logo rasmi). Setiap tingkat "dipotong" di depan (macam rumah anak patung), papan logo venture di depan lantai atas setiap tingkat (`fasciaSign`), lif kaca di sisi kanan dengan kereta lif bergerak dan lampu warna setiap venture. Tapak: rumput, dataran, laluan pintu masuk ke kaki lima, jalan raya, pokok, lampu jalan, kereta. Lampu siling dalam menara sentiasa sedikit menyala. Pelanggan contoh hanya masuk kedai di aras jalan. Latar navy #0F1B2D, bayang-bayang lembut. (Sebelum ini: kompleks bangunan berasingan, 13 Nov.)
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
- [x] Peringkat 4: dashboard baca status + suis Data contoh / Hidup + kod akses (diuji dengan API tiruan; 12/12 lulus)
- [x] Peringkat 5: report terakhir + aktiviti terkini dalam panel detail (mod Hidup dari `/api/log`; mod contoh dari log simulasi `a.sampleLog`)
- [x] Peringkat 6: Bina hidup di Apps Script akaun Danial (ujiBina berjaya ke server sebenar 13 Nov 2026; jadual harian 8:00 pagi dipasang)
- [x] Peringkat 7: README BM (`README.md`)

- [x] Peringkat 8: agent Meney (Lina + Faris) dipasang di Apps Script "Meney – Markas" akaun Danial; ujiMeney berjaya ke server sebenar 13 Nov 2026; jadual setiap jam dipasang. Danial sahkan angka Lina & Faris SAMA dengan POS (medan POS live sepadan dengan v2.9.1).
- [x] Peringkat 12: rombak jadi menara ROI Resources (6 tingkat venture + ROI Command Centre di atas, papan bumbung ROI RESOURCES, lif, kamera menegak).
- [x] Peringkat 11: pejabat EHNAKAMA, GilaPips, LAKAR (3 staf contoh setiap satu), susun atur 2 baris, roster desktop satu baris boleh skrol.
- [x] Peringkat 10: makmal Cipta Robo (PR #1) + logo sebenar atas papan cerah, warna jenama teal, Reqa → Reka, kamera/kabus muat 3 bangunan di phone tegak.
- [x] Peringkat 9: Nadi rumus laporan harian (api/nadi.js + Vercel Cron 8:30 MYT + butang dalam panel). `CRON_SECRET` ditambah di Vercel dan diredeploy 13 Nov 2026.

## Seterusnya (dipersetujui Danial; mula petang ini)
Arah: agent mesti BUAT kerja / sediakan kerja sedia-lulus, bukan sekadar report. Setiap agent jawab: bila jalan, data apa, apa diputuskan, tindakan/draf apa, siapa lulus, ukuran berjaya.
- **Telegram Bot (percuma)** untuk hantar kepada manusia (bukan WhatsApp API berbayar; gateway WhatsApp tidak rasmi DITOLAK kerana risiko ban).
  1. Nadi → Danial: ringkasan pagi ke Telegram (uji dulu).
  2. Faris → Amirul: follow-up repair dengan butang "Hantar WhatsApp" (link `wa.me` klik-untuk-hantar dari nombor Meney; manusia tekan Send). Nombor pelanggan dihantar kepada Amirul sahaja, TIDAK disimpan di Markas.
  3. Bina → Fakhri: 5 prospek untuk dihubungi hari ini (perlu Fakhri tambah lajur Last Contact + Next Follow-up dalam tracker MY).
- Danial perlu: buat bot di @BotFather, simpan token sebagai `TELEGRAM_BOT_TOKEN` di Vercel (jangan dalam chat), Danial/Amirul/Fakhri tekan Start pada bot.
- Kemudian: draf mesej guna AI (Claude API) — ada kos, bincang anggaran dulu. Sesi brainstorm "kerja yang betul-betul membantu bisnes" masih perlu dibuat.

## Cadangan seterusnya (belum dipersetujui)
- Tukar repo ke Private; tukar kunci yang pernah terdedah dalam chat.
- Pelanggan Meney dicetus oleh jualan POS sebenar (ganti simulasi).
