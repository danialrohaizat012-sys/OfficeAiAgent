// Data pejabat dan agent. (Peringkat 2 akan pindahkan ini ke satu fail config.)

export const OFFICES = {
  command: { label: "Command", short: "Command", color: 0x8E9BFF, pos: [0, 0, 3.6], kind: "hub" },
  binalab: { label: "Pejabat BinaLab", short: "BinaLab", color: 0x4CC26C, pos: [0, 0, -4.6], kind: "office", logo: "binalab" },
};

export const AGENTS = [
  { id: "nadi", name: "Nadi", office: "command", role: "Ketua Command: agih kerja dan rumus laporan", color: "#9AA8FF",
    tasks: ["Agih 6 tugasan pagi ini", "Semak siapa belum hantar report", "Rumus laporan harian", "Hantar ringkasan ke Danial"] },
  { id: "bina", name: "Bina", office: "binalab", role: "Pipeline dan prospek", color: "#4CC26C",
    tasks: ["Kemas kini 5 prospek baru", "Tanda deal yang perlu follow-up", "Kira nilai pipeline minggu ini"] },
  { id: "riza", name: "Riza", office: "binalab", role: "Riset pasaran", color: "#2FC1B0",
    tasks: ["Senarai 10 pelanggan sasaran", "Banding harga pesaing", "Ringkas maklum balas pengguna"] },
  { id: "mira", name: "Mira", office: "binalab", role: "Produk dan MVP", color: "#B6EBC5",
    tasks: ["Draf ciri MVP aplikasi utama", "Cadang 3 pakej harga", "Susun roadmap 4 minggu"] },
  { id: "ayu", name: "Ayu", office: "binalab", role: "Admin dan customer care", color: "#F2C14E",
    tasks: ["Balas 8 pertanyaan pelanggan", "Susun tiket sokongan", "Jadual demo dengan prospek"] },
];
