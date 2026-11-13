// Tempat-tempat dalam pejabat yang pekerja boleh pergi, dan kedudukan
// perabot berkaitan. Dikongsi oleh decor.js (letak perabot) dan life.js
// (pekerja berjalan). Semua koordinat relatif kepada tengah pejabat.
//
// face: arah pekerja menghadap (0 = ke depan/kamera, PI = ke dinding belakang,
// PI/2 = ke kanan, -PI/2 = ke kiri). pose: "stand" atau "sit".

const PI = Math.PI;

export function officeSpots(plan, theme) {
  const W2 = plan.W / 2, { front, back, mid } = plan.lanes;
  const m0 = mid[0];
  const kedai = theme === "kedai";

  const anchors = {
    counter: { x: W2 - 0.6, z: front },      // pantri (studio) / kaunter jualan (kedai)
    lounge: { x: -(W2 - 0.7), z: front },     // sofa (studio) / sudut gaming (kedai)
    side: { x: -(W2 - 0.55), z: m0 },         // printer (studio) / meja repair (kedai)
    sideR: { x: W2 - 0.5, z: m0 },            // water cooler / peti minuman
  };

  const spots = [
    { id: "counter", x: W2 - 1.5, z: front, face: PI / 2, pose: "stand", lane: front,
      label: kedai ? "🧾 Layan pelanggan di kaunter" : "☕ Rehat kopi di pantri" },
    { id: "lounge1", x: kedai ? -(W2 - 1.35) : -(W2 - 0.8), z: front - 0.38, face: kedai ? -PI / 2 : PI / 2, pose: "sit", seatY: kedai ? 0.3 : 0.48, lane: front,
      label: kedai ? "🎮 Uji game baru" : "🛋️ Rehat sekejap" },
    { id: "lounge2", x: kedai ? -(W2 - 1.35) : -(W2 - 0.8), z: front + 0.38, face: kedai ? -PI / 2 : PI / 2, pose: "sit", seatY: kedai ? 0.3 : 0.48, lane: front,
      label: kedai ? "🎮 Main sekejap" : "🛋️ Baca nota" },
    { id: "side", x: -(W2 - 1.35), z: m0, face: -PI / 2, pose: "stand", lane: m0,
      label: kedai ? "🔧 Repair di meja kerja" : "🖨️ Ambil cetakan" },
    { id: "sideR", x: W2 - 1.25, z: m0, face: PI / 2, pose: "stand", lane: m0,
      label: kedai ? "🥤 Ambil air" : "💧 Minum air" },
    { id: "board", x: -1.7, z: back, face: PI, pose: "stand", lane: back,
      label: kedai ? "📦 Susun stok di rak" : "📝 Kemas kini whiteboard" },
    { id: "shelf", x: kedai ? 1.7 : 1.8, z: back, face: PI, pose: "stand", lane: back,
      label: kedai ? "🎮 Semak rak game" : "📚 Cari rujukan" },
  ];
  return { anchors, spots };
}
