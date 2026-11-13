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
//    logo   : (pilihan) fail dalam folder logos/, saiz kanvas dan skala papan logo
//
//  AGENT
//    id     : nama ringkas unik, huruf kecil (dipakai oleh backend nanti)
//    nama   : nama paparan
//    pejabat: id pejabat tempat agent duduk
//    peranan: penerangan ringkas
//    warna  : warna robot
//    tugas  : senarai tugas contoh (dipakai dalam mod "Data contoh")
//
//  Susunan agent di bawah = susunan dalam roster dan meja.

export default {
  tajuk: "Markas Agent",
  subtajuk: "BinaLab · Meney Gaming",

  pejabat: [
    { id: "command", nama: "Command", label: "Command", jenis: "hab", warna: "#8E9BFF" },
    { id: "binalab", nama: "BinaLab", label: "Pejabat BinaLab", jenis: "pejabat", warna: "#4CC26C",
      logo: { fail: "binalab-logo-dark.svg", lebar: 1024, tinggi: 1240, skala: 4.4 } },
    { id: "meney", nama: "Meney", label: "Pejabat Meney Gaming", jenis: "pejabat", warna: "#8DC63F",
      logo: { fail: "meney-logo-dark.svg", lebar: 1400, tinggi: 700, skala: 3.1 } },
  ],

  agent: [
    // Command
    { id: "nadi", nama: "Nadi", pejabat: "command", peranan: "Ketua Command: agih kerja dan rumus laporan", warna: "#9AA8FF",
      tugas: ["Agih 6 tugasan pagi ini", "Semak siapa belum hantar report", "Rumus laporan harian", "Hantar ringkasan ke Danial"] },

    // BinaLab
    { id: "bina", nama: "Bina", pejabat: "binalab", peranan: "Pipeline dan prospek", warna: "#4CC26C",
      tugas: ["Kemas kini 5 prospek baru", "Tanda deal yang perlu follow-up", "Kira nilai pipeline minggu ini"] },
    { id: "riza", nama: "Riza", pejabat: "binalab", peranan: "Riset pasaran", warna: "#2FC1B0",
      tugas: ["Senarai 10 pelanggan sasaran", "Banding harga pesaing", "Ringkas maklum balas pengguna"] },
    { id: "mira", nama: "Mira", pejabat: "binalab", peranan: "Produk dan MVP", warna: "#B6EBC5",
      tugas: ["Draf ciri MVP aplikasi utama", "Cadang 3 pakej harga", "Susun roadmap 4 minggu"] },
    { id: "ayu", nama: "Ayu", pejabat: "binalab", peranan: "Admin dan customer care", warna: "#F2C14E",
      tugas: ["Balas 8 pertanyaan pelanggan", "Susun tiket sokongan", "Jadual demo dengan prospek"] },

    // Meney Gaming
    { id: "kai", nama: "Kai", pejabat: "meney", peranan: "Jual beli dan stok", warna: "#8DC63F",
      tugas: ["Kemas kini harga 12 item", "Semak stok konsol dan aksesori", "Nilai tawaran beli barang terpakai"] },
    { id: "faris", nama: "Faris", pejabat: "meney", peranan: "Repair dan servis", warna: "#FF8A4C",
      tugas: ["Jejak 4 tiket pembaikan", "Maklum pelanggan: peranti dah siap", "Senarai alat ganti untuk order"] },
    { id: "zara", nama: "Zara", pejabat: "meney", peranan: "Content dan posting", warna: "#E879D3",
      tugas: ["Rancang 7 posting minggu ini", "Tulis caption promosi", "Jadual live TikTok"] },
    { id: "lina", nama: "Lina", pejabat: "meney", peranan: "Laporan dan angka", warna: "#5AB0FF",
      tugas: ["Kira jualan mingguan", "Ringkas prestasi media sosial", "Sediakan report satu muka"] },
  ],
};
