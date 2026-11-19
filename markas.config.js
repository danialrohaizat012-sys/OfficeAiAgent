// ============================================================
//  KONFIGURASI MARKAS AGENT
//  Ubah fail ini sahaja untuk tambah, buang atau namakan semula
//  pejabat dan agent. Kod 3D akan susun semuanya secara automatik.
// ============================================================
//
//  PEJABAT
//    id     : nama ringkas unik, huruf kecil tanpa jarak (contoh "meney")
//    nama   : teks pada tab di bawah skrin
//    label  : nama penuh (dalam panel detail agent)
//    jenis  : "hab" untuk ROI Command Centre (tingkat atas, satu sahaja), "pejabat" untuk venture
//    Susunan pejabat = susunan tingkat menara (pertama = aras jalan).
//    warna  : warna jenama (bingkai platform, jambatan, skrin meja)
//    tema   : (pilihan) susun atur pejabat ikut venture:
//             "kedai" (kedai gaming: rak game, kaunter, meja repair), "perisian" (studio app: kanban, mockup, rak server),
//             "robotik" (makmal NURI), "media" (studio cerita: dinding manga, sudut podcast, meja lukis, merch),
//             "pasaran" (edukasi pasaran: dinding carta, set rakaman, kelas mini, rak ebook),
//             "seni" (studio mural: mural, kuda-kuda, rak cat, sinki berus) atau "studio" (pejabat biasa)
//    papanPesan: (pilihan) teks di whiteboard (studio) atau papan promo luar pintu (kedai).
//             Baris pertama = tajuk kalau guna "\n", contoh "PROMO\nTrade-in PS5 dapat lebih".
//    logo   : (pilihan) papan tanda atas bumbung. "fail" = SVG atau PNG dalam folder logos/. "latar" = warna papan (lalai gelap).
//             Pilihan "ikon" dan "tulisan" (viewBox dalam SVG) = ikon di kiri, tulisan di kanan.
//
//  AGENT
//    id     : nama ringkas unik, huruf kecil (dipakai oleh backend nanti)
//    nama   : nama paparan
//    pejabat: id pejabat tempat agent duduk
//    peranan: penerangan ringkas
//    warna  : warna baju
//    rambut : (pilihan) "pendek", "kemas", "panjang", "topi", "tudung" atau "botak"
//    warnaRambut: (pilihan) warna rambut / tudung
//    kulit, seluar: (pilihan) warna kulit (lalai kuning mainan) dan seluar
//    tugas  : senarai tugas contoh (dipakai dalam mod "Data contoh")
//    ketua  : (pilihan) true = ketua/pengurus venture ini (satu setiap pejabat). Ketua naik ke
//             Pejabat CEO untuk mesyuarat dengan Nadi bila perlu (keputusan, mesyuarat pagi, dipanggil).
//    senyapSelepasJam: (pilihan) Nadi beri amaran kalau agent ini tiada laporan lebih dari N jam
//    contohKeputusan: (pilihan) contoh perkara yang perlu keputusan Danial (mod "Data contoh")
//
//  Susunan agent di bawah = susunan dalam roster dan meja.

export default {
  tajuk: "Markas Agent",
  bangunan: { nama: "ROI RESOURCES", logo: { fail: "roi-resources-logo.svg", latar: "#F4F1E8" } },   // papan tanda bumbung menara (logo rasmi dari repo roi; latar Warm Bone)
  subtajuk: "ROI Resources · 6 anak syarikat",
  // Waktu kerja pekerja dalam 3D (jam, waktu Malaysia; 8.5 = 8:30 pagi). Pekerja datang ikut lif
  // sekitar waktu masuk dan balik selepas waktu balik. Nadi (Virtual CEO) sentiasa ada.
  waktuKerja: { masuk: 8.5, balik: 18 },
  // Mesyuarat ketua venture dengan Nadi di Pejabat CEO. harian = jam mesyuarat pagi (9.25 = 9:15 pagi).
  mesyuarat: { harian: 9.25 },

  pejabat: [
    { id: "command", nama: "ROI HQ", label: "Pejabat CEO ROI Resources", jenis: "hab", warna: "#8E9BFF" },   // tingkat paling atas: Nadi, Virtual CEO
    // Venture di bawah: SUSUNAN = TINGKAT, dari bawah (aras jalan) ke atas.
    { id: "meney", nama: "Meney", label: "Pejabat Meney Gaming", jenis: "pejabat", tema: "kedai", warna: "#8DC63F",
      papanPesan: "Promo\nTrade-in PS5 anda di sini. Tanya di kaunter!",
      logo: { fail: "meney-logo-dark.svg" } },
    { id: "binalab", nama: "BinaLab", label: "Pejabat BinaLab", jenis: "pejabat", tema: "perisian", warna: "#4CC26C",
      papanPesan: "Fokus minggu ini\nFollow-up semua quotation & demo Bina Review",
      logo: { fail: "binalab-logo-dark.svg", ikon: "112 88 382 440", tulisan: "80 558 450 90" } },
    { id: "ciptarobo", nama: "Cipta Robo", label: "Makmal R&D Cipta Robo", jenis: "pejabat", tema: "robotik", warna: "#4FBF9F",
      papanPesan: "NURI LAB · SIMULASI\nMake NURI yours. Make NURI useful.",
      logo: { fail: "ciptarobo-logo.png", latar: "#F4F3EF" } },
    { id: "ehnakama", nama: "Eh Nakama", label: "Studio EH NAKAMA", jenis: "pejabat", tema: "media", warna: "#D7252C",
      papanPesan: "EH NAKAMA\nDifferent stories. Same nakama.",
      logo: { fail: "ehnakama-logo.png" } },   // logo panjang (dijana dari logo bulat rasmi)
    { id: "gilapips", nama: "GilaPips", label: "Pejabat GilaPips", jenis: "pejabat", tema: "pasaran", warna: "#D4B26A",
      papanPesan: "Ilmu Biasa.\nHasil Luar Biasa.",
      logo: { fail: "gilapips-logo.svg" } },
    { id: "lakar", nama: "Lakar", label: "Studio LAKAR", jenis: "pejabat", tema: "seni", warna: "#C4513B",
      papanPesan: "LAKAR\nMural custom untuk ruang yang ada cerita.",
      logo: { fail: "lakar-logo.png", latar: "#F9F4EC" } },
  ],

  agent: [
    // Command
    { id: "nadi", nama: "Nadi", pejabat: "command", peranan: "Virtual CEO ROI Resources: agih kerja ke semua venture dan rumus laporan", warna: "#9AA8FF", rambut: "kemas", warnaRambut: "#2A1B12",
      tugas: ["Semak dinding prestasi 6 anak syarikat", "Agih tugasan pagi ke setiap venture", "Semak siapa belum hantar report", "Rumus laporan harian untuk Danial"] },

    // BinaLab
    { id: "bina", nama: "Bina", pejabat: "binalab", ketua: true, peranan: "Pipeline dan prospek", warna: "#4CC26C", senyapSelepasJam: 26, rambut: "pendek",
      contohKeputusan: ["Prospek minta diskaun 15% untuk quotation sistem stok", "2 lead automotive AS: hubungi dulu yang mana?"],
      tugas: ["Kemas kini 5 prospek baru", "Tanda deal yang perlu follow-up", "Kira nilai pipeline minggu ini"] },
    { id: "riza", nama: "Riza", pejabat: "binalab", peranan: "Riset pasaran", warna: "#2FC1B0", rambut: "kemas", warnaRambut: "#5A3A22",
      tugas: ["Senarai 10 pelanggan sasaran", "Banding harga pesaing", "Ringkas maklum balas pengguna"] },
    { id: "mira", nama: "Mira", pejabat: "binalab", peranan: "Produk dan MVP", warna: "#B6EBC5", rambut: "tudung", warnaRambut: "#C9B6E8",
      tugas: ["Draf ciri MVP aplikasi utama", "Cadang 3 pakej harga", "Susun roadmap 4 minggu"] },
    { id: "ayu", nama: "Ayu", pejabat: "binalab", peranan: "Admin dan customer care", warna: "#F2C14E", rambut: "tudung", warnaRambut: "#F4A6B8",
      contohKeputusan: ["Klien minta tangguh bayaran ansuran kedua 2 minggu"],
      tugas: ["Balas 8 pertanyaan pelanggan", "Susun tiket sokongan", "Jadual demo dengan prospek"] },

    // Cipta Robo (status & tugas simulasi sahaja; NURI masih R&D)
    { id: "muhafiz", nama: "Muhafiz", pejabat: "ciptarobo", ketua: true, peranan: "Hardware & prototaip NURI (K151, Suit, Dock)", warna: "#4FBF9F", rambut: "kemas",
      tugas: ["Semak muat NURI Suit pada K151 (zon sentuh, kamera, USB-C)", "Uji pengecasan Slim Dock dan Nest Dock", "Semak pergerakan pan/tilt dan pengudaraan"] },
    { id: "reka", nama: "Reka", pejabat: "ciptarobo", peranan: "Website, 3D & reka bentuk NURI", warna: "#C28CFF", rambut: "panjang",
      tugas: ["Kemas kini ciptarobo.com (EN | BM)", "Animasi \"NURI in action\"", "Konfigurator rupa, warna, dock & ukiran"] },

    // EH NAKAMA (studio media cerita anime/manga/manhwa/game + merchandise; status contoh)
    { id: "hana", nama: "Hana", pejabat: "ehnakama", ketua: true, peranan: "Cerita & skrip anime/manga/manhwa/game", warna: "#D7252C", rambut: "panjang", warnaRambut: "#2A1B12",
      tugas: ["Rancang 5 video cerita manhwa minggu ini", "Tulis skrip short: anime & game baru bulan ini", "Jadual posting TikTok & IG"] },
    { id: "ikmal", nama: "Ikmal", pejabat: "ehnakama", peranan: "Merchandise & stok", warna: "#7C5CFF", rambut: "topi",
      tugas: ["Senarai idea merchandise baru", "Semak stok & kos cetakan", "Kemas kini katalog merchandise"] },
    { id: "nisa", nama: "Nisa", pejabat: "ehnakama", peranan: "Sponsorship, affiliate & komuniti", warna: "#2FC1B0", rambut: "tudung", warnaRambut: "#F4A6B8",
      tugas: ["Senarai 10 calon sponsor/affiliate", "Balas komen & DM komuniti", "Kira prestasi pautan affiliate"] },

    // GilaPips (edukasi pasaran & emas, komuniti; status contoh — bukan nasihat pelaburan)
    { id: "amin", nama: "Amin", pejabat: "gilapips", ketua: true, peranan: "Kandungan edukasi pasaran & emas", warna: "#D4B26A", rambut: "kemas", warnaRambut: "#1E1410",
      tugas: ["Tulis nota asas: apa itu pips", "Ringkasan mingguan pergerakan emas (edukasi)", "Draf infografik pengurusan risiko"] },
    { id: "syafiq", nama: "Syafiq", pejabat: "gilapips", peranan: "Komuniti & Telegram", senyapSelepasJam: 8, warna: "#3A6DF0", rambut: "pendek",
      tugas: ["Sambut ahli baru komuniti", "Jawab soalan lazim ahli", "Jadual sesi belajar mingguan"] },
    { id: "wani", nama: "Wani", pejabat: "gilapips", peranan: "Ebook & produk digital", warna: "#2FA86A", rambut: "tudung", warnaRambut: "#C9B6E8",
      tugas: ["Susun bab ebook asas pasaran", "Semak fakta & penafian risiko", "Sediakan halaman jualan ebook"] },

    // LAKAR (mural & seni ruang; status contoh)
    { id: "dina", nama: "Dina", pejabat: "lakar", ketua: true, peranan: "Konsep & reka mural", warna: "#C4513B", rambut: "panjang", warnaRambut: "#6B3E26",
      tugas: ["Lakar 3 konsep mural kafe", "Sediakan mockup dinding pelanggan", "Pilih palet warna projek"] },
    { id: "fahmi", nama: "Fahmi", pejabat: "lakar", peranan: "Sebut harga & projek tapak", warna: "#176B63", rambut: "topi",
      tugas: ["Ukur dinding & kira anggaran", "Sediakan sebut harga mural", "Jadual kerja tapak & bahan"] },
    { id: "ain", nama: "Ain", pejabat: "lakar", peranan: "Portfolio & media sosial", warna: "#F2C14E", rambut: "tudung", warnaRambut: "#176B63",
      tugas: ["Kemas kini portfolio lakar.my", "Posting proses mural (before/after)", "Kumpul testimoni pelanggan"] },

    // Meney Gaming
    { id: "kai", nama: "Kai", pejabat: "meney", ketua: true, peranan: "Jual beli dan stok", warna: "#8DC63F", rambut: "topi",
      contohKeputusan: ["Harga trade-in PS5 Slim: tawar RM1,250 atau RM1,350?", "Restock 10 controller DS5 (kos RM2,100)?"],
      tugas: ["Kemas kini harga 12 item", "Semak stok konsol dan aksesori", "Nilai tawaran beli barang terpakai"] },
    { id: "faris", nama: "Faris", pejabat: "meney", peranan: "Repair dan servis", warna: "#FF8A4C", senyapSelepasJam: 14, rambut: "pendek", warnaRambut: "#1E1410",
      contohKeputusan: ["Repair Switch OLED gagal, tiada stok ganti: setuju refund?"],
      tugas: ["Jejak 4 tiket pembaikan", "Maklum pelanggan: peranti dah siap", "Senarai alat ganti untuk order"] },
    { id: "zara", nama: "Zara", pejabat: "meney", peranan: "Content dan posting", warna: "#E879D3", rambut: "panjang", warnaRambut: "#6B3E26",
      tugas: ["Rancang 7 posting minggu ini", "Tulis caption promosi", "Jadual live TikTok"] },
    { id: "lina", nama: "Lina", pejabat: "meney", peranan: "Laporan dan angka", warna: "#5AB0FF", senyapSelepasJam: 14, rambut: "tudung", warnaRambut: "#9FD3F0",
      tugas: ["Kira jualan mingguan", "Ringkas prestasi media sosial", "Sediakan report satu muka"] },
  ],
};
