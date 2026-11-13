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
//    jenis  : "hab" untuk Command di tengah (satu sahaja), "pejabat" untuk yang lain
//    warna  : warna jenama (bingkai platform, jambatan, skrin meja)
//    tema   : (pilihan) hiasan dinding: "studio" (whiteboard, rak buku) atau "kedai" (rak game, TV)
//    papanPesan: (pilihan) teks di whiteboard (studio) atau papan promo luar pintu (kedai).
//             Baris pertama = tajuk kalau guna "\n", contoh "PROMO\nTrade-in PS5 dapat lebih".
//    logo   : (pilihan) papan tanda atas bumbung. "fail" = SVG dalam folder logos/.
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
//    senyapSelepasJam: (pilihan) Nadi beri amaran kalau agent ini tiada laporan lebih dari N jam
//    contohKeputusan: (pilihan) contoh perkara yang perlu keputusan Danial (mod "Data contoh")
//
//  Susunan agent di bawah = susunan dalam roster dan meja.

export default {
  tajuk: "Markas Agent",
  subtajuk: "BinaLab · Meney Gaming",

  pejabat: [
    { id: "command", nama: "Command", label: "Command", jenis: "hab", warna: "#8E9BFF" },
    { id: "binalab", nama: "BinaLab", label: "Pejabat BinaLab", jenis: "pejabat", tema: "studio", warna: "#4CC26C",
      papanPesan: "Fokus minggu ini\nFollow-up semua quotation & demo Bina Review",
      logo: { fail: "binalab-logo-dark.svg", ikon: "112 88 382 440", tulisan: "80 558 450 90" } },
    { id: "meney", nama: "Meney", label: "Pejabat Meney Gaming", jenis: "pejabat", tema: "kedai", warna: "#8DC63F",
      papanPesan: "Promo\nTrade-in PS5 anda di sini. Tanya di kaunter!",
      logo: { fail: "meney-logo-dark.svg" } },
  ],

  agent: [
    // Command
    { id: "nadi", nama: "Nadi", pejabat: "command", peranan: "Ketua Command: agih kerja dan rumus laporan", warna: "#9AA8FF", rambut: "kemas", warnaRambut: "#2A1B12",
      tugas: ["Agih 6 tugasan pagi ini", "Semak siapa belum hantar report", "Rumus laporan harian", "Hantar ringkasan ke Danial"] },

    // BinaLab
    { id: "bina", nama: "Bina", pejabat: "binalab", peranan: "Pipeline dan prospek", warna: "#4CC26C", senyapSelepasJam: 26, rambut: "pendek",
      contohKeputusan: ["Prospek minta diskaun 15% untuk quotation sistem stok", "2 lead automotive AS: hubungi dulu yang mana?"],
      tugas: ["Kemas kini 5 prospek baru", "Tanda deal yang perlu follow-up", "Kira nilai pipeline minggu ini"] },
    { id: "riza", nama: "Riza", pejabat: "binalab", peranan: "Riset pasaran", warna: "#2FC1B0", rambut: "kemas", warnaRambut: "#5A3A22",
      tugas: ["Senarai 10 pelanggan sasaran", "Banding harga pesaing", "Ringkas maklum balas pengguna"] },
    { id: "mira", nama: "Mira", pejabat: "binalab", peranan: "Produk dan MVP", warna: "#B6EBC5", rambut: "tudung", warnaRambut: "#C9B6E8",
      tugas: ["Draf ciri MVP aplikasi utama", "Cadang 3 pakej harga", "Susun roadmap 4 minggu"] },
    { id: "ayu", nama: "Ayu", pejabat: "binalab", peranan: "Admin dan customer care", warna: "#F2C14E", rambut: "tudung", warnaRambut: "#F4A6B8",
      contohKeputusan: ["Klien minta tangguh bayaran ansuran kedua 2 minggu"],
      tugas: ["Balas 8 pertanyaan pelanggan", "Susun tiket sokongan", "Jadual demo dengan prospek"] },

    // Meney Gaming
    { id: "kai", nama: "Kai", pejabat: "meney", peranan: "Jual beli dan stok", warna: "#8DC63F", rambut: "topi",
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
