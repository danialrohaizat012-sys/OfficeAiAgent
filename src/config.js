import raw from "../markas.config.js";

// Baca markas.config.js, semak kesilapan biasa, dan kira susun atur 3D.

const OFFICE_W = 9.6, OFFICE_D = 7.4, ROW_GAP = 2.6;
const DESK_X = 1.9, FIRST_ROW_Z = -1.4;
export const FLOOR_H = 3.3;    // tinggi satu tingkat (dinding 2.6 + lantai atas)

const hexNum = h => parseInt(String(h).replace("#", ""), 16);

function fail(msg) {
  console.error("[markas.config.js] " + msg);
  return msg;
}

export function loadConfig() {
  const errors = [];
  const list = raw.pejabat || [];
  const hubs = list.filter(o => o.jenis === "hab");
  if (hubs.length !== 1) errors.push(fail(`Mesti ada tepat satu pejabat jenis "hab" (jumpa ${hubs.length}).`));
  const rooms = list.filter(o => o.jenis !== "hab");

  const ids = new Set();
  for (const o of list) {
    if (ids.has(o.id)) errors.push(fail(`ID pejabat "${o.id}" berulang.`));
    ids.add(o.id);
  }

  const agents = [];
  const seen = new Set();
  for (const a of raw.agent || []) {
    if (seen.has(a.id)) { errors.push(fail(`ID agent "${a.id}" berulang. Agent kedua diabaikan.`)); continue; }
    if (!ids.has(a.pejabat)) { errors.push(fail(`Agent "${a.id}" merujuk pejabat "${a.pejabat}" yang tiada. Agent diabaikan.`)); continue; }
    seen.add(a.id);
    agents.push({
      id: a.id, name: a.nama, office: a.pejabat, role: a.peranan || "",
      color: a.warna || "#cccccc",
      tasks: a.tugas && a.tugas.length ? a.tugas : ["Menunggu tugasan"],
      sampleDecisions: a.contohKeputusan || [],
      look: { rambut: a.rambut || "pendek", warnaRambut: a.warnaRambut || "#3B2618", kulit: a.kulit || "#F6C944", seluar: a.seluar || "#2B3550" },
    });
  }

  // MENARA: setiap venture satu tingkat (ikut susunan dalam config, bawah → atas).
  // Pejabat jenis "hab" (ROI Command Centre) di tingkat paling atas.
  const offices = {};
  rooms.forEach((o, i) => {
    const count = agents.filter(a => a.office === o.id).length;
    offices[o.id] = {
      kind: "office", label: o.label || o.nama, short: o.nama, color: hexNum(o.warna),
      pos: [0, i * FLOOR_H, 0], floor: i, logo: o.logo || null, theme: o.tema || "studio", message: o.papanPesan || null,
      ...deskLayout(count),
    };
  });
  if (hubs[0]) {
    const h = hubs[0];
    offices[h.id] = { kind: "hub", label: h.label || h.nama, short: h.nama, color: hexNum(h.warna),
      pos: [0, rooms.length * FLOOR_H, 0], floor: rooms.length, logo: h.logo || null, ...deskLayout(0) };
  }
  const building = raw.bangunan || {};

  return { title: raw.tajuk || "Markas Agent", subtitle: raw.subtajuk || "", offices, agents, errors, building, view: viewFit(offices) };
}

// Pelan pejabat: meja dalam grid 2 lajur, laluan pejalan kaki, dan tempat
// yang pekerja boleh pergi (pantri, sofa, whiteboard...). Semua relatif
// kepada tengah pejabat.
function deskLayout(n) {
  const rows = Math.max(2, Math.ceil(n / 2));
  const deskSpots = [];
  for (let r = 0; r < rows; r++) deskSpots.push([-DESK_X, FIRST_ROW_Z + r * ROW_GAP], [DESK_X, FIRST_ROW_Z + r * ROW_GAP]);
  const extra = (rows - 2) * ROW_GAP;
  const W = OFFICE_W, D = OFFICE_D + extra, shift = extra / 2;
  const backZ = shift - D / 2 + 0.35;
  const lastRow = FIRST_ROW_Z + (rows - 1) * ROW_GAP;
  const lanes = {
    back: backZ + 0.65,
    mid: Array.from({ length: rows - 1 }, (_, r) => FIRST_ROW_Z + r * ROW_GAP + 1.015),
    front: lastRow + 1.1,
  };
  return { deskSpots, platformDepth: D, platformShift: shift, plan: { W, D, shift, backZ, rows, lanes, deskX: DESK_X } };
}

// Kira saiz menara supaya kamera boleh muat semuanya.
function viewFit(offices) {
  const list = Object.values(offices);
  const floors = list.length;
  const W = Math.max(...list.map(o => o.plan.W)), D = Math.max(...list.map(o => o.plan.D));
  const height = floors * FLOOR_H + 2.6;            // + papan tanda bumbung
  return { target: [0, height / 2 - 0.5, 0], width: W + 2.6, height, depth: D, floorH: FLOOR_H };
}
