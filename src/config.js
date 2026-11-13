import raw from "../markas.config.js";

// Baca markas.config.js, semak kesilapan biasa, dan kira susun atur 3D.

const HUB_POS = [0, 0, 3.6];
const OFFICE_Z = -5.3;
const OFFICE_SPACING = 11;    // jarak tengah ke tengah antara pejabat
const OFFICE_W = 9.6, OFFICE_D = 7.4, ROW_GAP = 2.6;
const DESK_X = 1.9, FIRST_ROW_Z = -1.4;
const HUB_RADIUS = 3.4;
const BASE_HALF = 7.35;       // separuh saiz markas prototaip asal (rujukan skala kamera)

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
      look: { rambut: a.rambut || "pendek", warnaRambut: a.warnaRambut || "#3B2618", kulit: a.kulit || "#F6C944", seluar: a.seluar || "#2B3550" },
    });
  }

  const offices = {};
  if (hubs[0]) {
    const h = hubs[0];
    offices[h.id] = { kind: "hub", label: h.label || h.nama, short: h.nama, color: hexNum(h.warna), pos: HUB_POS.slice() };
  }
  rooms.forEach((o, i) => {
    const x = (i - (rooms.length - 1) / 2) * OFFICE_SPACING;
    const count = agents.filter(a => a.office === o.id).length;
    offices[o.id] = {
      kind: "office", label: o.label || o.nama, short: o.nama, color: hexNum(o.warna),
      pos: [x, 0, OFFICE_Z], logo: o.logo || null, theme: o.tema || "studio", logoPhase: i * 1.3,
      ...deskLayout(count),
    };
  });

  return { title: raw.tajuk || "Markas Agent", subtitle: raw.subtajuk || "", offices, agents, errors, view: viewFit(offices) };
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

// Kira titik tengah dan saiz keseluruhan markas supaya kamera boleh muat semuanya.
function viewFit(offices) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const o of Object.values(offices)) {
    const [x, , z] = o.pos;
    const hw = o.kind === "hub" ? HUB_RADIUS : o.plan.W / 2;
    const zMin = o.kind === "hub" ? z - HUB_RADIUS : z + o.platformShift - o.platformDepth / 2;
    const zMax = o.kind === "hub" ? z + HUB_RADIUS : z + o.platformShift + o.platformDepth / 2;
    minX = Math.min(minX, x - hw); maxX = Math.max(maxX, x + hw);
    minZ = Math.min(minZ, zMin); maxZ = Math.max(maxZ, zMax);
  }
  const half = Math.max(maxX - minX, maxZ - minZ) / 2;
  return {
    target: [(minX + maxX) / 2, 1, (minZ + maxZ) / 2 - 0.25],
    scale: Math.max(1, half / BASE_HALF),
    width: maxX - minX,
  };
}
