import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { roundedShape } from "./parts.js";

// Perabot dan hiasan pejabat. Bentuk ringkas (kotak, silinder) supaya laju
// di iPhone; semua perabot statik digabung (bakeStatic) jadi beberapa objek.

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s);
const PI = Math.PI;

// Bahan dikongsi ikut warna (jimat memori dan membolehkan penggabungan)
const matCache = new Map();
function std(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1, ...extra }));
  return matCache.get(key);
}
function basic(color, extra = {}) {
  const key = "b" + color + JSON.stringify(extra);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshBasicMaterial({ color, ...extra }));
  return matCache.get(key);
}
const M = {
  deskTop: () => std(0x3a4260, { roughness: 0.5 }),
  deskWood: () => std(0xb08a64, { roughness: 0.6 }),
  metal: () => std(0x8a93a8, { roughness: 0.35, metalness: 0.6 }),
  dark: () => std(0x1b2030),
  chair: () => std(0x252b3d),
  laptop: () => std(0x5a6274, { roughness: 0.3, metalness: 0.5 }),
  pot: () => std(0xd9d4c7, { roughness: 0.8 }),
  potDark: () => std(0x2a2f3d, { roughness: 0.8 }),
  leaf: () => std(0x3f9e5a, { roughness: 0.8 }),
  leaf2: () => std(0x58b86f, { roughness: 0.8 }),
  white: () => std(0xeef1f6, { roughness: 0.4 }),
  wood: () => std(0x6b5440, { roughness: 0.8 }),
};

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}
function grp(x = 0, y = 0, z = 0, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; return g;
}
const hexStr = c => "#" + c.toString(16).padStart(6, "0");

// ==================== LANTAI ====================
export function officeFloor(plan, color, theme) {
  const g = grp(0, 0, plan.shift);
  const studio = theme !== "kedai";
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(roundedShape(plan.W - 0.5, plan.D - 0.5, 0.85), 10),
    std(studio ? 0x9b7656 : 0x1d2335, { roughness: studio ? 0.75 : 0.5, metalness: studio ? 0.05 : 0.3 }));
  floor.rotation.x = -PI / 2; floor.position.y = 0.015; g.add(floor);
  // garisan papan kayu (studio) atau grid neon (kedai)
  const pts = [], hw = (plan.W - 1.3) / 2, hd = (plan.D - 1.3) / 2;
  if (studio) {
    for (let z = -hd, r = 0; z <= hd; z += 0.32, r++) {
      pts.push(-hw, 0.02, z, hw, 0.02, z);
      for (let x = -hw + (r % 3) * 0.55; x < hw; x += 1.65) pts.push(x, 0.02, z, x, 0.02, Math.min(z + 0.32, hd));
    }
  } else {
    for (let x = -hw; x <= hw + 0.01; x += 0.9) pts.push(x, 0.02, -hd, x, 0.02, hd);
    for (let z = -hd; z <= hd + 0.01; z += 0.9) pts.push(-hw, 0.02, z, hw, 0.02, z);
  }
  const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: studio ? 0x5e4430 : color, transparent: true, opacity: studio ? 0.45 : 0.22 })));
  return g;
}

// ==================== DINDING ====================
export function officeWalls(plan, color, theme) {
  const g = new THREE.Group();
  const studio = theme !== "kedai";
  const wallW = plan.W - 1.3, h = 2.5, z = plan.backZ;
  g.add(mesh(box(wallW, h, 0.14), std(studio ? 0xe8e3da : 0x1f2538, { roughness: 0.9 }), 0, h / 2, z - 0.02));
  // bingkai bawah (skirting) + jalur lampu atas
  g.add(mesh(box(wallW, 0.1, 0.16), std(studio ? 0x8a6a4c : 0x12161f), 0, 0.05, z));
  g.add(mesh(box(wallW, 0.05, 0.18), basic(color), 0, h + 0.02, z));
  if (studio) {
    // tingkap panjang dengan pemandangan bandar waktu senja
    const win = mesh(new THREE.PlaneGeometry(wallW - 0.4, 0.62), new THREE.MeshBasicMaterial({ map: skylineTexture() }), 0, 2.1, z + 0.075);
    g.add(win);
    g.add(mesh(box(wallW - 0.3, 0.05, 0.08), M.white(), 0, 1.77, z + 0.08));
    g.add(mesh(box(wallW - 0.3, 0.05, 0.08), M.white(), 0, 2.43, z + 0.08));
    for (let i = 0; i <= 5; i++) g.add(mesh(box(0.05, 0.66, 0.08), M.white(), -(wallW - 0.4) / 2 + i * (wallW - 0.4) / 5, 2.1, z + 0.08));
  } else {
    // papan neon "GAME ON"
    g.add(mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: neonTexture("GAME ON", hexStr(color)), transparent: true }), 0, 2.08, z + 0.08));
    // jalur LED tepi
    g.add(mesh(box(wallW, 0.03, 0.03), basic(color), 0, 1.78, z + 0.08));
  }
  // dinding kaca sisi
  const glass = new THREE.MeshStandardMaterial({ color: studio ? 0xcfe6ff : color, transparent: true, opacity: 0.12, roughness: 0.1, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const frame = basic(color, { transparent: true, opacity: 0.7 });
  const zEnd = plan.lanes.front - 1.05, sideLen = zEnd - (z + 0.1), gh = 1.5;
  for (const sx of [-1, 1]) {
    const x = sx * (plan.W / 2 - 0.12), zc = z + 0.1 + sideLen / 2;
    g.add(mesh(box(0.04, gh, sideLen), glass, x, gh / 2, zc));
    g.add(mesh(box(0.06, 0.04, sideLen), frame, x, gh, zc));
    g.add(mesh(box(0.06, gh, 0.06), frame, x, gh / 2, zEnd));
  }
  return g;
}

function skylineTexture() {
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 64;
  const c = cv.getContext("2d");
  const sky = c.createLinearGradient(0, 0, 0, 64);
  sky.addColorStop(0, "#2b3f74"); sky.addColorStop(0.55, "#d9826a"); sky.addColorStop(1, "#f6c27a");
  c.fillStyle = sky; c.fillRect(0, 0, 512, 64);
  let x = 0, seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  while (x < 512) {
    const w = 14 + rnd() * 26, h = 14 + rnd() * 40;
    c.fillStyle = rnd() > 0.5 ? "#1b2440" : "#222c4c"; c.fillRect(x, 64 - h, w, h);
    c.fillStyle = "rgba(255,220,140,.8)";
    for (let wy = 64 - h + 4; wy < 60; wy += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5) if (rnd() > 0.55) c.fillRect(wx, wy, 2, 2);
    x += w + 1;
  }
  return new THREE.CanvasTexture(cv);
}

function neonTexture(text, hex) {
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 128;
  const c = cv.getContext("2d");
  c.font = "italic 900 78px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  c.shadowColor = hex; c.shadowBlur = 24; c.fillStyle = hex; c.fillText(text, 256, 66);
  c.shadowBlur = 0; c.fillStyle = "#ffffff"; c.globalAlpha = 0.85; c.fillText(text, 256, 66);
  return new THREE.CanvasTexture(cv);
}

// ==================== MEJA KERJA ====================
export function workstation(color, side, theme, i) {
  const g = new THREE.Group();
  const kedai = theme === "kedai";
  const top = kedai ? M.deskTop() : M.deskWood();
  g.add(mesh(box(1.5, 0.06, 0.7), top, 0, 0.64, 0));
  g.add(mesh(box(1.5, 0.03, 0.02), basic(color), 0, 0.64, 0.355));
  for (const x of [-0.68, 0.68]) for (const z of [-0.3, 0.3]) g.add(mesh(cyl(0.02, 0.02, 0.62, 6), M.metal(), x, 0.31, z));
  g.add(mesh(box(1.36, 0.36, 0.03), kedai ? M.dark() : std(0x8f7254), 0, 0.42, 0.3));
  // laci kecil di sisi
  g.add(mesh(box(0.38, 0.5, 0.55), kedai ? M.dark() : std(0xe8e3da), 0.5 * side, 0.27, 0));
  if (kedai) {
    // cahaya RGB di lantai bawah meja
    const glow = mesh(new THREE.PlaneGeometry(1.7, 0.9), basic(color, { transparent: true, opacity: 0.22, depthWrite: false }), 0, 0.025, 0);
    glow.rotation.x = -PI / 2; g.add(glow);
  }

  // laptop (skrin menghadap pekerja; kamera nampak belakang laptop)
  const lap = grp(-0.15 * side, 0.68, 0.02);
  lap.add(mesh(box(0.44, 0.02, 0.3), M.laptop(), 0, 0, 0));
  const scr = grp(0, 0.01, 0.15); scr.rotation.x = -0.25;
  scr.add(mesh(box(0.44, 0.29, 0.015), M.laptop(), 0, 0.145, 0));
  const sc = mesh(new THREE.PlaneGeometry(0.4, 0.25), basic(color, { transparent: true, opacity: 0.85 }), 0, 0.145, -0.009); sc.rotation.y = PI; scr.add(sc);
  scr.add(mesh(new THREE.CircleGeometry(0.025, 16), basic(0xffffff), 0, 0.15, 0.009));
  lap.add(scr); g.add(lap);

  // monitor kedua condong ke arah pekerja
  const mon = grp(0.48 * side, 0.68, -0.08, -side * 0.6);
  mon.add(mesh(box(0.2, 0.015, 0.14), M.metal(), 0, 0, 0));
  mon.add(mesh(cyl(0.015, 0.015, 0.3, 6), M.metal(), 0, 0.15, 0));
  mon.add(mesh(box(0.6, 0.36, 0.03), M.dark(), 0, 0.42, 0));
  const gl = mesh(new THREE.PlaneGeometry(0.55, 0.31), basic(color, { transparent: true, opacity: 0.75 }), 0, 0.42, -0.016); gl.rotation.y = PI; mon.add(gl);
  g.add(mon);

  // barang atas meja: berbeza untuk setiap meja supaya nampak hidup
  const v = i % 4, ix = -0.6 * side;
  if (v === 0) {
    g.add(mesh(cyl(0.04, 0.035, 0.09, 10), M.white(), ix, 0.715, 0.2));
    const sp = grp(0.62 * side, 0.67, 0.22); sp.add(mesh(cyl(0.05, 0.04, 0.08, 8), M.pot(), 0, 0.04, 0)); sp.add(mesh(new THREE.IcosahedronGeometry(0.08, 0), M.leaf2(), 0, 0.13, 0)); g.add(sp);
  } else if (v === 1) {
    [0xd06a4a, 0x2fc1b0, 0xf2c14e].forEach((c, k) => g.add(mesh(box(0.26, 0.04, 0.18), std(c), ix, 0.69 + k * 0.04, 0.15)));
    g.add(mesh(new THREE.TorusGeometry(0.08, 0.018, 6, 16, PI), M.dark(), 0.6 * side, 0.68, 0.18));
  } else if (v === 2) {
    const lamp = grp(ix, 0.67, 0.1);
    lamp.add(mesh(cyl(0.06, 0.07, 0.02, 12), M.dark(), 0, 0, 0));
    const arm = mesh(cyl(0.012, 0.012, 0.35, 6), M.metal(), 0, 0.17, 0); lamp.add(arm);
    const shade = mesh(cyl(0.03, 0.08, 0.08, 12, 1, true), std(color), 0.04, 0.35, 0.03); shade.rotation.z = -0.6; lamp.add(shade);
    g.add(lamp);
    g.add(mesh(cyl(0.04, 0.035, 0.09, 10), std(color), 0.62 * side, 0.715, 0.2));
  } else {
    // kotak kecil + "figura" kecil di atas meja
    g.add(mesh(box(0.1, 0.12, 0.1), std(0xf2c14e), ix, 0.73, 0.18));
    g.add(mesh(box(0.2, 0.02, 0.28), M.white(), 0.6 * side, 0.68, 0.15));
  }
  if (kedai) {
    // controller atas meja
    const ctrl = grp(0.15 * side, 0.68, 0.25);
    ctrl.add(mesh(box(0.16, 0.03, 0.08), M.dark(), 0, 0, 0));
    ctrl.add(mesh(cyl(0.035, 0.035, 0.03, 8), M.dark(), -0.08, 0, 0.02));
    ctrl.add(mesh(cyl(0.035, 0.035, 0.03, 8), M.dark(), 0.08, 0, 0.02));
    g.add(ctrl);
  }

  g.add(kedai ? gamingChair(color, 0, -0.62) : chair(color, 0, -0.62));
  return g;
}

function chair(color, x, z) {
  const g = grp(x, 0, z);
  for (let i = 0; i < 5; i++) { const leg = mesh(box(0.04, 0.03, 0.28), M.metal(), 0, 0.04, 0); leg.rotation.y = i / 5 * PI * 2; leg.translateZ(0.13); g.add(leg); }
  g.add(mesh(cyl(0.025, 0.025, 0.36, 6), M.metal(), 0, 0.22, 0));
  g.add(mesh(box(0.5, 0.07, 0.46), M.chair(), 0, 0.42, 0));
  const back = mesh(box(0.5, 0.62, 0.06), M.chair(), 0, 0.8, -0.24); back.rotation.x = -0.08; g.add(back);
  g.add(mesh(box(0.36, 0.05, 0.065), basic(color), 0, 1.02, -0.245));
  return g;
}

function gamingChair(color, x, z) {
  const g = grp(x, 0, z);
  for (let i = 0; i < 5; i++) { const leg = mesh(box(0.04, 0.03, 0.3), M.metal(), 0, 0.04, 0); leg.rotation.y = i / 5 * PI * 2; leg.translateZ(0.14); g.add(leg); }
  g.add(mesh(cyl(0.03, 0.03, 0.36, 6), M.metal(), 0, 0.22, 0));
  g.add(mesh(box(0.52, 0.08, 0.48), M.dark(), 0, 0.42, 0));
  const back = grp(0, 0, -0.25); back.rotation.x = -0.12;
  back.add(mesh(box(0.52, 0.95, 0.08), M.dark(), 0, 0.95, 0));
  back.add(mesh(box(0.1, 0.9, 0.085), std(color), -0.17, 0.95, 0));
  back.add(mesh(box(0.1, 0.9, 0.085), std(color), 0.17, 0.95, 0));
  back.add(mesh(box(0.3, 0.12, 0.1), std(color), 0, 1.3, 0.02));
  g.add(back);
  for (const sx of [-1, 1]) g.add(mesh(box(0.06, 0.04, 0.32), M.dark(), sx * 0.28, 0.62, 0));
  return g;
}

// ==================== POKOK ====================
export function plant(x, z, scale = 1, kind = 0) {
  const g = grp(x, 0, z); g.scale.setScalar(scale);
  if (kind === 1) {
    // pokok lidah jin (tinggi, daun tegak)
    g.add(mesh(cyl(0.18, 0.15, 0.36, 14), M.potDark(), 0, 0.18, 0));
    for (let i = 0; i < 7; i++) {
      const leaf = mesh(box(0.06, 0.7 + (i % 3) * 0.15, 0.015), i % 2 ? M.leaf() : M.leaf2(), 0, 0.65, 0);
      leaf.rotation.y = i * 0.9; leaf.rotation.z = (i % 3 - 1) * 0.15; leaf.translateX(0.05);
      g.add(leaf);
    }
  } else {
    g.add(mesh(cyl(0.2, 0.15, 0.4, 14), M.pot(), 0, 0.2, 0));
    g.add(mesh(new THREE.IcosahedronGeometry(0.3, 0), M.leaf(), 0, 0.62, 0));
    g.add(mesh(new THREE.IcosahedronGeometry(0.22, 0), M.leaf2(), 0.12, 0.85, 0.05));
    g.add(mesh(new THREE.IcosahedronGeometry(0.18, 0), M.leaf(), -0.1, 0.95, -0.05));
  }
  return g;
}

// ==================== ZON PEJABAT ====================
// Pantri (studio) atau kaunter jualan (kedai) di depan kanan
export function counterZone(a, color, theme) {
  const g = grp(a.x, 0, a.z, -PI / 2);   // menghadap ke dalam pejabat (-x)
  if (theme === "kedai") {
    g.add(mesh(box(1.7, 0.8, 0.55), M.dark(), 0, 0.4, 0));
    g.add(mesh(box(1.7, 0.04, 0.57), basic(color), 0, 0.8, 0));
    // kotak kaca display controller
    const glass = new THREE.MeshStandardMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false });
    g.add(mesh(box(0.9, 0.3, 0.45), glass, -0.35, 0.97, 0));
    [0xffffff, 0x1b2030, 0xe0303a, 0x3a6df0].forEach((c, k) => g.add(mesh(box(0.15, 0.04, 0.1), std(c), -0.68 + k * 0.22, 0.86, 0)));
    // terminal POS
    const pos = grp(0.45, 0.82, 0);
    pos.add(mesh(box(0.12, 0.1, 0.12), M.dark(), 0, 0.05, 0));
    const scr = mesh(box(0.42, 0.28, 0.03), M.dark(), 0, 0.26, 0); scr.rotation.x = -0.3; pos.add(scr);
    const glow = mesh(new THREE.PlaneGeometry(0.38, 0.24), basic(color), 0, 0.265, 0.02); glow.rotation.x = -0.3; pos.add(glow);
    g.add(pos);
    g.add(mesh(box(0.3, 0.12, 0.25), M.metal(), 0.45, 0.07, 0.3));
  } else {
    g.add(mesh(box(1.7, 0.85, 0.55), std(0xe8e3da), 0, 0.425, 0));
    g.add(mesh(box(1.74, 0.05, 0.6), std(0x3b3f4a, { roughness: 0.3 }), 0, 0.875, 0));
    for (let k = 0; k < 3; k++) g.add(mesh(box(0.02, 0.6, 0.01), M.metal(), -0.56 + k * 0.56, 0.45, 0.28));
    // mesin kopi
    const cm = grp(-0.45, 0.9, -0.05);
    cm.add(mesh(box(0.32, 0.38, 0.3), M.dark(), 0, 0.19, 0));
    cm.add(mesh(box(0.2, 0.05, 0.12), M.metal(), 0, 0.12, 0.12));
    cm.add(mesh(cyl(0.035, 0.03, 0.07, 10), M.white(), 0, 0.04, 0.12));
    cm.add(mesh(new THREE.CircleGeometry(0.02, 10), basic(0x46d37a), 0.1, 0.3, 0.151));
    g.add(cm);
    // mangkuk buah + cawan
    g.add(mesh(cyl(0.14, 0.08, 0.06, 14), M.white(), 0.2, 0.93, 0));
    [[0.15, 0xf2c14e], [0.24, 0xe8743b], [0.2, 0x7cc25b]].forEach(([x, c], k) => g.add(mesh(new THREE.SphereGeometry(0.05, 10, 8), std(c), x, 0.99 + (k === 2 ? 0.04 : 0), (k - 1) * 0.04)));
    g.add(mesh(cyl(0.035, 0.03, 0.08, 10), std(color), 0.55, 0.94, 0.1));
    // peti sejuk kecil di hujung
    g.add(mesh(box(0.5, 1.4, 0.55), M.white(), 1.15, 0.7, 0));
    g.add(mesh(box(0.03, 0.5, 0.03), M.metal(), 0.95, 0.95, 0.29));
  }
  return g;
}

// Sudut rehat: sofa (studio) atau bean bag + TV (kedai) di depan kiri
export function loungeZone(a, color, theme) {
  const g = grp(a.x, 0, a.z);
  const rug = mesh(new THREE.CircleGeometry(1, 32), std(theme === "kedai" ? 0x2a2f45 : color, { roughness: 0.95 }), 0.75, 0.025, 0);
  rug.rotation.x = -PI / 2; rug.scale.set(1.15, 0.85, 1); g.add(rug);
  if (theme === "kedai") {
    // TV gaming di sisi kiri, menghadap ke kanan
    const tv = grp(-0.3, 0, 0, PI / 2);
    tv.add(mesh(box(1.3, 0.4, 0.4), M.dark(), 0, 0.2, 0));
    tv.add(mesh(box(0.35, 0.07, 0.25), M.white(), -0.3, 0.44, 0));
    tv.add(mesh(cyl(0.03, 0.03, 0.4, 6), M.metal(), 0, 0.6, -0.1));
    tv.add(mesh(box(1.25, 0.72, 0.05), M.dark(), 0, 1.1, -0.1));
    tv.add(mesh(new THREE.PlaneGeometry(1.18, 0.66), new THREE.MeshBasicMaterial({ map: gameScreen(color) }), 0, 1.1, -0.07));
    g.add(tv);
    // bean bag (tempat duduk spot lounge1/lounge2)
    [[-0.38, color], [0.38, 0xff8a4c]].forEach(([z, c]) => {
      const bb = mesh(new THREE.SphereGeometry(0.42, 18, 12), std(c, { roughness: 0.9 }), 0.65, 0.2, z);
      bb.scale.set(1, 0.5, 1); g.add(bb);
    });
  } else {
    // sofa menghadap ke kanan (ke dalam pejabat)
    const sofaC = 0x5b6b8c;
    g.add(mesh(box(0.75, 0.4, 1.7), std(sofaC, { roughness: 0.9 }), 0, 0.2, 0));
    g.add(mesh(box(0.2, 0.85, 1.7), std(sofaC, { roughness: 0.9 }), -0.3, 0.43, 0));
    for (const sz of [-1, 1]) g.add(mesh(box(0.75, 0.55, 0.16), std(sofaC, { roughness: 0.9 }), 0, 0.28, sz * 0.84));
    for (const sz of [-1, 1]) g.add(mesh(box(0.55, 0.12, 0.72), std(0x6d7ea2, { roughness: 0.95 }), 0.05, 0.45, sz * 0.38));
    g.add(mesh(box(0.12, 0.3, 0.3), std(color, { roughness: 0.95 }), -0.15, 0.62, -0.5));
    // meja kopi
    const t = grp(1.1, 0, 0);
    t.add(mesh(box(0.5, 0.05, 0.9), M.deskWood(), 0, 0.38, 0));
    for (const x of [-0.2, 0.2]) for (const z of [-0.4, 0.4]) t.add(mesh(cyl(0.02, 0.02, 0.36, 6), M.metal(), x, 0.18, z));
    t.add(mesh(box(0.2, 0.02, 0.28), std(0xd06a4a), 0, 0.42, -0.2));
    t.add(mesh(cyl(0.04, 0.035, 0.08, 10), M.white(), 0.05, 0.44, 0.22));
    g.add(t);
    // lampu lantai
    const lamp = grp(-0.1, 0, -1.15);
    lamp.add(mesh(cyl(0.15, 0.17, 0.03, 16), M.dark(), 0, 0.015, 0));
    lamp.add(mesh(cyl(0.015, 0.015, 1.4, 6), M.metal(), 0, 0.7, 0));
    lamp.add(mesh(cyl(0.12, 0.2, 0.25, 16, 1, true), std(0xfff1d6, { emissive: 0xffd9a0, emissiveIntensity: 0.6, side: THREE.DoubleSide }), 0, 1.45, 0));
    g.add(lamp);
  }
  return g;
}

// Printer (studio) atau meja repair (kedai) di sisi kiri
export function sideZone(a, color, theme) {
  const g = grp(a.x, 0, a.z, PI / 2);  // menghadap ke kanan
  if (theme === "kedai") {
    g.add(mesh(box(1.4, 0.06, 0.6), M.deskWood(), 0, 0.85, 0));
    for (const x of [-0.65, 0.65]) g.add(mesh(box(0.06, 0.85, 0.55), M.dark(), x, 0.425, 0));
    // papan alat (pegboard)
    g.add(mesh(box(1.4, 0.8, 0.04), std(0x2e3448), 0, 1.4, -0.28));
    [[-0.5, 1.5, 0xe0303a], [-0.25, 1.45, 0xf2c14e], [0, 1.55, 0x8a93a8], [0.3, 1.4, color], [0.5, 1.5, 0x3a6df0]].forEach(([x, y, c]) => g.add(mesh(box(0.05, 0.28, 0.03), std(c), x, y, -0.25)));
    // konsol dibuka + lampu kerja
    g.add(mesh(box(0.42, 0.06, 0.28), M.white(), -0.15, 0.91, 0.05));
    g.add(mesh(box(0.3, 0.02, 0.2), std(0x2d6a3e), -0.15, 0.95, 0.05));
    g.add(mesh(box(0.16, 0.03, 0.08), M.dark(), 0.35, 0.89, 0.12));
    const lamp = grp(0.5, 0.88, -0.15);
    lamp.add(mesh(cyl(0.012, 0.012, 0.5, 6), M.metal(), 0, 0.25, 0));
    const head = mesh(cyl(0.04, 0.09, 0.08, 12, 1, true), std(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6, side: THREE.DoubleSide }), -0.12, 0.5, 0.05); head.rotation.z = 0.8; lamp.add(head);
    g.add(lamp);
  } else {
    g.add(mesh(box(0.8, 0.7, 0.5), std(0xe8e3da), 0, 0.35, 0));
    g.add(mesh(box(0.6, 0.28, 0.42), std(0xf5f6f8, { roughness: 0.4 }), 0, 0.84, 0));
    g.add(mesh(box(0.4, 0.02, 0.2), M.dark(), 0, 0.99, 0.05));
    g.add(mesh(box(0.3, 0.03, 0.2), M.white(), 0, 0.75, 0.25));
    g.add(mesh(new THREE.CircleGeometry(0.02, 10), basic(color), 0.22, 0.86, 0.211));
    // kotak kertas
    g.add(mesh(box(0.35, 0.25, 0.3), std(0xc9a77c), 0.6, 0.125, 0));
  }
  return g;
}

// Water cooler (studio) atau peti minuman bercahaya (kedai) di sisi kanan
export function sideRZone(a, color, theme) {
  const g = grp(a.x, 0, a.z, -PI / 2);
  if (theme === "kedai") {
    g.add(mesh(box(0.7, 1.7, 0.55), M.dark(), 0, 0.85, 0));
    g.add(mesh(new THREE.PlaneGeometry(0.58, 1.2), new THREE.MeshBasicMaterial({ map: fridgeTexture(hexStr(color)) }), 0, 0.95, 0.28));
    g.add(mesh(box(0.7, 0.25, 0.04), basic(color), 0, 1.72, 0.28));
  } else {
    g.add(mesh(box(0.35, 0.95, 0.35), M.white(), 0, 0.475, 0));
    g.add(mesh(cyl(0.15, 0.15, 0.42, 16), std(0x8fd3ff, { transparent: true, opacity: 0.55, roughness: 0.1 }), 0, 1.17, 0));
    g.add(mesh(box(0.06, 0.04, 0.04), M.dark(), 0, 0.75, 0.19));
    g.add(plant(0.55, 0, 0.85, 1));
  }
  return g;
}

function fridgeTexture(hex) {
  const cv = document.createElement("canvas"); cv.width = 128; cv.height = 256;
  const c = cv.getContext("2d");
  c.fillStyle = "#cfe8ff"; c.fillRect(0, 0, 128, 256);
  const cols = ["#e0303a", "#3a6df0", "#f2c14e", hex, "#ff8a4c"];
  for (let r = 0; r < 4; r++) {
    c.fillStyle = "#9fb4c8"; c.fillRect(0, 60 + r * 62, 128, 4);
    for (let i = 0; i < 6; i++) { c.fillStyle = cols[(i + r) % cols.length]; c.fillRect(8 + i * 19, 18 + r * 62, 12, 40); }
  }
  return new THREE.CanvasTexture(cv);
}

// ==================== HIASAN DINDING BELAKANG ====================
function openShelf(w, h, d, mat, rows) {
  const g = new THREE.Group();
  g.add(mesh(box(w, h, 0.03), mat, 0, h / 2, -d / 2 + 0.015));
  for (const sx of [-1, 1]) g.add(mesh(box(0.04, h, d), mat, sx * (w / 2 - 0.02), h / 2, 0));
  g.add(mesh(box(w, 0.04, d), mat, 0, h - 0.02, 0));
  g.add(mesh(box(w, 0.06, d), mat, 0, 0.03, 0));
  for (let r = 1; r < rows; r++) g.add(mesh(box(w - 0.06, 0.03, d - 0.02), mat, 0, r * (h / rows), 0));
  return g;
}

export function wallDecor(plan, color, theme) {
  const g = new THREE.Group();
  const z = plan.backZ + 0.08;
  if (theme === "kedai") {
    for (const sx of [-1, 1]) {
      const shelf = grp(sx * 2.0, 0, z + 0.15);
      shelf.add(openShelf(1.5, 1.6, 0.32, M.dark(), 3));
      const boxColors = [0x8DC63F, 0xff8a4c, 0x5ab0ff, 0xe879d3, 0xf2c14e, 0xeef1f6, 0x2fc1b0];
      for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) {
        const c = boxColors[(i * 3 + r * 2 + (sx > 0 ? 1 : 0)) % boxColors.length];
        shelf.add(mesh(box(0.14, 0.22, 0.04), std(c, { roughness: 0.5 }), -0.6 + i * 0.2, 0.06 + r * 0.533 + 0.13, 0.04));
      }
      g.add(shelf);
      // jalur LED di tepi rak
      g.add(mesh(box(0.03, 1.6, 0.03), basic(color), sx * 2.0 + 0.77, 0.8, z + 0.32));
      g.add(mesh(box(0.03, 1.6, 0.03), basic(color), sx * 2.0 - 0.77, 0.8, z + 0.32));
    }
    const tv = grp(0, 1.15, z + 0.05);
    tv.add(mesh(box(1.5, 0.86, 0.06), M.dark(), 0, 0, 0));
    tv.add(mesh(new THREE.PlaneGeometry(1.4, 0.78), new THREE.MeshBasicMaterial({ map: gameScreen(color) }), 0, 0, 0.032));
    g.add(tv);
    g.add(mesh(box(1.2, 0.3, 0.35), M.dark(), 0, 0.15, z + 0.2));
    g.add(mesh(box(0.34, 0.07, 0.24), M.white(), -0.2, 0.34, z + 0.2));
    g.add(mesh(box(0.34, 0.07, 0.24), M.dark(), 0.25, 0.34, z + 0.2));
  } else {
    const wb = grp(-1.7, 1.15, z + 0.03);
    wb.add(mesh(box(1.7, 0.95, 0.04), M.metal(), 0, 0, 0));
    wb.add(mesh(box(1.62, 0.87, 0.02), M.white(), 0, 0, 0.02));
    [0xf2c14e, 0x8fd3ff, 0xff9fb2, 0xb6ebc5, color].forEach((c, i) => wb.add(mesh(box(0.18, 0.18, 0.01), basic(c), -0.6 + (i % 3) * 0.26, 0.2 - Math.floor(i / 3) * 0.26, 0.035)));
    const lines = [];
    for (let i = 0; i < 4; i++) lines.push(0.1, 0.22 - i * 0.14, 0.035, 0.6, 0.22 - i * 0.14, 0.035);
    const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    wb.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x334455 })));
    g.add(wb);

    const bk = grp(1.8, 0, z + 0.17);
    bk.add(openShelf(1.4, 1.6, 0.32, M.wood(), 3));
    const bookColors = [0x4CC26C, 0x2a3a5c, 0xeef1f6, 0x8E9BFF, 0xf2c14e, 0x2fc1b0, 0xd06a4a];
    for (let r = 0; r < 3; r++) {
      let x = -0.62;
      for (let i = 0; x < 0.5; i++) {
        const w = 0.06 + ((i * 7 + r) % 4) * 0.02, hgt = 0.26 + ((i * 5 + r) % 3) * 0.05;
        bk.add(mesh(box(w, hgt, 0.22), std(bookColors[(i + r * 3) % bookColors.length], { roughness: 0.8 }), x + w / 2, 0.06 + r * 0.533 + hgt / 2, 0.02));
        x += w + 0.01;
      }
    }
    g.add(bk);
    // jam + dua bingkai gambar
    const clock = grp(0, 1.45, z + 0.03);
    const face = mesh(cyl(0.2, 0.2, 0.04, 24), M.white(), 0, 0, 0); face.rotation.x = PI / 2; clock.add(face);
    clock.add(mesh(box(0.02, 0.13, 0.01), M.dark(), 0, 0.05, 0.025));
    clock.add(mesh(box(0.1, 0.02, 0.01), M.dark(), 0.04, 0, 0.025));
    g.add(clock);
    [[-0.35, 0.95, 0x2fc1b0], [0.35, 0.95, color]].forEach(([x, y, c]) => {
      g.add(mesh(box(0.42, 0.32, 0.03), M.dark(), x, y, z + 0.02));
      g.add(mesh(box(0.36, 0.26, 0.01), std(c), x, y, z + 0.04));
    });
  }
  return g;
}

function gameScreen(color) {
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 144;
  const c = cv.getContext("2d");
  const gr = c.createLinearGradient(0, 0, 256, 144); gr.addColorStop(0, "#101830"); gr.addColorStop(1, hexStr(color));
  c.fillStyle = gr; c.fillRect(0, 0, 256, 144);
  c.fillStyle = "rgba(255,255,255,.85)"; c.font = "bold 30px sans-serif"; c.textAlign = "center"; c.fillText("PLAY", 128, 70);
  c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(48, 92, 160, 8);
  c.fillStyle = "#fff"; c.fillRect(48, 92, 104, 8);
  return new THREE.CanvasTexture(cv);
}

// ==================== HAB COMMAND ====================
export function commandDeck(color) {
  const g = new THREE.Group();
  const arc = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.5, 32, 1, true, -0.7, 1.4),
    std(0x2a3149, { emissive: 0x3b44a0, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
  arc.position.set(0, 0.25, 0.6); g.add(arc);
  const top = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.4, 32, 1, PI / 2 - 0.7, 1.4), std(0x3a4260, { side: THREE.DoubleSide }));
  top.rotation.set(-PI / 2, 0, 0); top.position.set(0, 0.5, 0.6); g.add(top);
  [-0.45, 0, 0.45].forEach(a => {
    const s = grp(Math.sin(a) * 1.2, 0.5, 0.6 + Math.cos(a) * 1.2, a);
    s.add(mesh(box(0.5, 0.3, 0.03), M.dark(), 0, 0.2, 0));
    const sc = mesh(new THREE.PlaneGeometry(0.46, 0.26), basic(color, { transparent: true, opacity: 0.8 }), 0, 0.2, -0.016); sc.rotation.y = PI; s.add(sc);
    g.add(s);
  });
  const tex = holoTexture(color);
  const holos = [];
  [-0.75, 0, 0.75].forEach((a, i) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    p.position.set(Math.sin(a) * 1.9, 1.9 + (i === 1 ? 0.25 : 0), 0.6 - Math.cos(a) * 1.9);
    p.lookAt(0, 1.9, 0.6 + 4);
    p.userData.dynamic = true;
    g.add(p); holos.push(p);
  });
  return { group: g, holos };
}

function holoTexture(color) {
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 160;
  const c = cv.getContext("2d");
  const hex = hexStr(color);
  c.strokeStyle = hex; c.lineWidth = 3; c.strokeRect(4, 4, 248, 152);
  c.fillStyle = hex; c.globalAlpha = 0.18; c.fillRect(4, 4, 248, 152); c.globalAlpha = 1;
  [40, 70, 55, 95, 80, 110].forEach((h, i) => { c.fillStyle = i === 5 ? "#ffffff" : hex; c.fillRect(24 + i * 26, 140 - h, 16, h); });
  c.strokeStyle = "#ffffff"; c.lineWidth = 2; c.beginPath();
  [[180, 110], [200, 90], [215, 98], [235, 60]].forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
  c.fillStyle = "#ffffff"; c.fillRect(180, 24, 56, 6); c.fillRect(180, 38, 36, 6);
  return new THREE.CanvasTexture(cv);
}

// ==================== GABUNG PERABOT STATIK ====================
// Ratusan kotak kecil digabung ikut bahan, supaya iPhone hanya lukis
// beberapa puluh objek. Objek bertanda userData.dynamic tidak disentuh.
export function bakeStatic(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const byMat = new Map(), remove = [];
  root.traverse(o => {
    if (!o.isMesh || o.userData.dynamic || Array.isArray(o.material)) return;
    let p = o, dyn = false;
    while (p && p !== root) { if (p.userData.dynamic) { dyn = true; break; } p = p.parent; }
    if (dyn) return;
    const geo = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone());
    for (const k of Object.keys(geo.attributes)) if (!["position", "normal", "uv"].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (!byMat.has(o.material)) byMat.set(o.material, []);
    byMat.get(o.material).push(geo);
    remove.push(o);
  });
  remove.forEach(o => o.parent.remove(o));
  // buang kumpulan kosong
  const prune = o => { [...o.children].forEach(prune); if (o !== root && o.isGroup && o.children.length === 0) o.parent.remove(o); };
  prune(root);
  for (const [mat, geos] of byMat) {
    const merged = mergeGeometries(geos, false);
    if (merged) root.add(new THREE.Mesh(merged, mat));
  }
  return root;
}
