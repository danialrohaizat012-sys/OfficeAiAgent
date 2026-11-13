import * as THREE from "three";
import { roundedShape } from "./parts.js";

// Perabot dan hiasan pejabat: lantai, dinding, meja kerja, kerusi, rak, pokok.
// Bentuk ringkas (kotak, silinder) supaya laju di iPhone.

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s);
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1, ...extra });

// Bahan dikongsi (jimat memori)
const M = {
  deskTop: std(0x3a4260, { roughness: 0.5 }),
  metal: std(0x8a93a8, { roughness: 0.35, metalness: 0.6 }),
  dark: std(0x1b2030),
  chair: std(0x252b3d),
  laptop: std(0x5a6274, { roughness: 0.3, metalness: 0.5 }),
  wall: std(0x1f2538, { roughness: 0.9 }),
  pot: std(0xd9d4c7, { roughness: 0.8 }),
  leaf: std(0x3f9e5a, { roughness: 0.8 }),
  leaf2: std(0x58b86f, { roughness: 0.8 }),
  white: std(0xeef1f6, { roughness: 0.4 }),
  wood: std(0x6b5440, { roughness: 0.8 }),
  mug: std(0xf2f2f2),
};

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

// ---------- Lantai berjubin di atas platform ----------
export function officeFloor(width, depth, color) {
  const g = new THREE.Group();
  const shape = roundedShape(width - 0.5, depth - 0.5, 0.85);
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape, 10), std(0x262d44, { roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.015; g.add(floor);
  // garisan jubin
  const pts = [], step = 0.8, hw = (width - 1.2) / 2, hd = (depth - 1.2) / 2;
  for (let x = -hw; x <= hw + 0.01; x += step) pts.push(x, 0.02, -hd, x, 0.02, hd);
  for (let z = -hd; z <= hd + 0.01; z += step) pts.push(-hw, 0.02, z, hw, 0.02, z);
  const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.1 })));
  return g;
}

// ---------- Dinding belakang + dinding kaca sisi ----------
export function officeWalls(width, depth, color, backZ) {
  const g = new THREE.Group();
  const wallW = width - 1.2, h = 1.9;
  g.add(mesh(box(wallW, h, 0.12), M.wall, 0, h / 2, backZ));
  // jalur lampu di atas dinding
  g.add(mesh(box(wallW, 0.05, 0.14), new THREE.MeshBasicMaterial({ color }), 0, h + 0.02, backZ));
  // dinding kaca sisi (separuh, supaya kamera masih nampak ke dalam)
  const glass = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.12, roughness: 0.1, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const frame = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
  const sideLen = Math.min(3.0, depth - 2.6), gh = 1.3;
  for (const sx of [-1, 1]) {
    const x = sx * (width / 2 - 0.12), z = backZ + 0.9 + sideLen / 2;
    g.add(mesh(box(0.04, gh, sideLen), glass, x, gh / 2, z));
    g.add(mesh(box(0.06, 0.04, sideLen), frame, x, gh, z));
    g.add(mesh(box(0.06, gh, 0.06), frame, x, gh / 2, z + sideLen / 2));
  }
  return g;
}

// ---------- Meja kerja lengkap (robot duduk di belakang, menghadap kamera) ----------
export function workstation(color, side) {
  const g = new THREE.Group();
  // permukaan meja + jalur warna jenama di tepi depan
  g.add(mesh(box(1.5, 0.06, 0.7), M.deskTop, 0, 0.64, 0));
  g.add(mesh(box(1.5, 0.03, 0.02), new THREE.MeshBasicMaterial({ color }), 0, 0.64, 0.355));
  // kaki besi
  for (const x of [-0.68, 0.68]) for (const z of [-0.3, 0.3]) g.add(mesh(cyl(0.02, 0.02, 0.62, 6), M.metal, x, 0.31, z));
  // panel modesty depan
  g.add(mesh(box(1.36, 0.36, 0.03), M.dark, 0, 0.42, 0.3));

  // laptop (skrin menghadap robot; kamera nampak belakang laptop)
  const lap = new THREE.Group();
  lap.add(mesh(box(0.44, 0.02, 0.3), M.laptop, 0, 0, 0));
  const scr = new THREE.Group(); scr.position.set(0, 0.01, 0.15); scr.rotation.x = -0.25;
  scr.add(mesh(box(0.44, 0.29, 0.015), M.laptop, 0, 0.145, 0));
  scr.add(mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }), 0, 0.145, -0.009));
  scr.children[1].rotation.y = Math.PI;
  scr.add(mesh(new THREE.CircleGeometry(0.025, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 0.15, 0.009));
  lap.add(scr);
  lap.position.set(-0.15 * side, 0.68, 0.02);
  g.add(lap);

  // monitor kedua di sisi, condong ke arah robot
  const mon = new THREE.Group();
  mon.add(mesh(box(0.2, 0.015, 0.14), M.metal, 0, 0, 0));
  mon.add(mesh(cyl(0.015, 0.015, 0.3, 6), M.metal, 0, 0.15, 0));
  mon.add(mesh(box(0.6, 0.36, 0.03), M.dark, 0, 0.42, 0));
  const glow = mesh(new THREE.PlaneGeometry(0.55, 0.31), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 }), 0, 0.42, -0.016);
  glow.rotation.y = Math.PI; mon.add(glow);
  mon.position.set(0.48 * side, 0.68, -0.08);
  mon.rotation.y = side * 0.55 + Math.PI;
  mon.rotation.y = -side * 0.6;
  g.add(mon);

  // barang kecil: mug dan pokok kecil
  g.add(mesh(cyl(0.04, 0.035, 0.09, 10), M.mug, -0.6 * side, 0.715, 0.2));
  const sp = new THREE.Group(); sp.position.set(0.62 * side, 0.67, 0.22);
  sp.add(mesh(cyl(0.05, 0.04, 0.08, 8), M.pot, 0, 0.04, 0));
  sp.add(mesh(new THREE.IcosahedronGeometry(0.08, 0), M.leaf2, 0, 0.13, 0));
  g.add(sp);

  // kerusi pejabat di belakang meja
  g.add(chair(color, 0, -0.62));
  return g;
}

function chair(color, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  for (let i = 0; i < 5; i++) {
    const leg = mesh(box(0.04, 0.03, 0.28), M.metal, 0, 0.04, 0);
    leg.rotation.y = i / 5 * Math.PI * 2; leg.translateZ(0.13); g.add(leg);
  }
  g.add(mesh(cyl(0.025, 0.025, 0.36, 6), M.metal, 0, 0.22, 0));
  g.add(mesh(box(0.5, 0.07, 0.46), M.chair, 0, 0.42, 0));
  const back = mesh(box(0.5, 0.62, 0.06), M.chair, 0, 0.8, -0.24); back.rotation.x = -0.08; g.add(back);
  g.add(mesh(box(0.36, 0.05, 0.065), new THREE.MeshBasicMaterial({ color }), 0, 1.02, -0.245));
  return g;
}

// ---------- Pokok hiasan ----------
export function plant(x, z, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale);
  g.add(mesh(cyl(0.2, 0.15, 0.4, 14), M.pot, 0, 0.2, 0));
  g.add(mesh(new THREE.IcosahedronGeometry(0.3, 0), M.leaf, 0, 0.62, 0));
  g.add(mesh(new THREE.IcosahedronGeometry(0.22, 0), M.leaf2, 0.12, 0.85, 0.05));
  g.add(mesh(new THREE.IcosahedronGeometry(0.18, 0), M.leaf, -0.1, 0.95, -0.05));
  return g;
}

// Rak terbuka di depan: panel belakang, sisi, atas, bawah dan papan rak
function openShelf(w, h, d, mat, rows) {
  const g = new THREE.Group();
  g.add(mesh(box(w, h, 0.03), mat, 0, h / 2, -d / 2 + 0.015));
  for (const sx of [-1, 1]) g.add(mesh(box(0.04, h, d), mat, sx * (w / 2 - 0.02), h / 2, 0));
  g.add(mesh(box(w, 0.04, d), mat, 0, h - 0.02, 0));
  g.add(mesh(box(w, 0.06, d), mat, 0, 0.03, 0));
  for (let r = 1; r < rows; r++) g.add(mesh(box(w - 0.06, 0.03, d - 0.02), mat, 0, r * (h / rows), 0));
  return g;
}

// ---------- Hiasan dinding ikut tema ----------
export function wallDecor(theme, color, backZ) {
  const g = new THREE.Group();
  const z = backZ + 0.08;
  if (theme === "kedai") {
    // rak display kotak game + TV gaming
    for (const sx of [-1, 1]) {
      const shelf = new THREE.Group(); shelf.position.set(sx * 2.0, 0, z + 0.12);
      shelf.add(openShelf(1.5, 1.6, 0.32, M.dark, 3));
      const boxColors = [0x8DC63F, 0xff8a4c, 0x5ab0ff, 0xe879d3, 0xf2c14e, 0xeef1f6, 0x2fc1b0];
      for (let r = 0; r < 3; r++) {
        for (let i = 0; i < 7; i++) {
          const c = boxColors[(i * 3 + r * 2 + (sx > 0 ? 1 : 0)) % boxColors.length];
          shelf.add(mesh(box(0.14, 0.22, 0.04), std(c, { roughness: 0.5 }), -0.6 + i * 0.2, 0.06 + r * 0.533 + 0.13, 0.04));
        }
      }
      g.add(shelf);
    }
    const tv = new THREE.Group(); tv.position.set(0, 1.2, z + 0.05);
    tv.add(mesh(box(1.5, 0.86, 0.06), M.dark, 0, 0, 0));
    tv.add(mesh(new THREE.PlaneGeometry(1.4, 0.78), new THREE.MeshBasicMaterial({ map: gameScreen(color) }), 0, 0, 0.032));
    g.add(tv);
    g.add(mesh(box(1.2, 0.3, 0.35), M.dark, 0, 0.15, z + 0.2));
    g.add(mesh(box(0.34, 0.07, 0.24), M.white, -0.2, 0.34, z + 0.2));
    g.add(mesh(box(0.34, 0.07, 0.24), M.dark, 0.25, 0.34, z + 0.2));
  } else {
    // studio: whiteboard dengan nota, rak buku, jam dinding
    const wb = new THREE.Group(); wb.position.set(-1.7, 1.15, z + 0.03);
    wb.add(mesh(box(1.7, 0.95, 0.04), M.metal, 0, 0, 0));
    wb.add(mesh(box(1.62, 0.87, 0.02), M.white, 0, 0, 0.02));
    const notes = [0xf2c14e, 0x8fd3ff, 0xff9fb2, 0xb6ebc5, color];
    notes.forEach((c, i) => wb.add(mesh(box(0.18, 0.18, 0.01), new THREE.MeshBasicMaterial({ color: c }), -0.6 + (i % 3) * 0.26, 0.2 - Math.floor(i / 3) * 0.26, 0.035)));
    const lines = [];
    for (let i = 0; i < 4; i++) lines.push(0.1, 0.22 - i * 0.14, 0.035, 0.6, 0.22 - i * 0.14, 0.035);
    const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    wb.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x334 })));
    g.add(wb);

    const bk = new THREE.Group(); bk.position.set(1.8, 0, z + 0.15);
    bk.add(openShelf(1.4, 1.6, 0.32, M.wood, 3));
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

    const clock = new THREE.Group(); clock.position.set(0, 1.45, z + 0.03);
    clock.add(mesh(cyl(0.2, 0.2, 0.04, 24), M.white, 0, 0, 0)); clock.children[0].rotation.x = Math.PI / 2;
    const hand1 = mesh(box(0.02, 0.13, 0.01), M.dark, 0, 0.05, 0.025); clock.add(hand1);
    const hand2 = mesh(box(0.1, 0.02, 0.01), M.dark, 0.04, 0, 0.025); clock.add(hand2);
    g.add(clock);
  }
  return g;
}

// skrin TV: gradien warna + "logo game" ringkas, dilukis sekali di kanvas
function gameScreen(color) {
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 144;
  const c = cv.getContext("2d");
  const hex = "#" + color.toString(16).padStart(6, "0");
  const gr = c.createLinearGradient(0, 0, 256, 144); gr.addColorStop(0, "#101830"); gr.addColorStop(1, hex);
  c.fillStyle = gr; c.fillRect(0, 0, 256, 144);
  c.fillStyle = "rgba(255,255,255,.85)"; c.font = "bold 30px sans-serif"; c.textAlign = "center"; c.fillText("PLAY", 128, 70);
  c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(48, 92, 160, 8);
  c.fillStyle = "#fff"; c.fillRect(48, 92, 104, 8);
  return new THREE.CanvasTexture(cv);
}

// ---------- Hab Command: meja kawalan + panel hologram ----------
export function commandDeck(color) {
  const g = new THREE.Group();
  // meja kawalan melengkung di depan Nadi
  const arc = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.5, 32, 1, true, -0.7, 1.4),
    std(0x2a3149, { emissive: 0x3b44a0, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
  arc.position.set(0, 0.25, 0.6); g.add(arc);
  const top = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.4, 32, 1, Math.PI / 2 - 0.7, 1.4), std(0x3a4260, { side: THREE.DoubleSide }));
  top.rotation.x = -Math.PI / 2; top.rotation.z = Math.PI; top.position.set(0, 0.5, 0.6);
  top.rotation.set(-Math.PI / 2, 0, 0); g.add(top);
  // tiga skrin kecil atas meja
  [-0.45, 0, 0.45].forEach(a => {
    const s = new THREE.Group();
    s.position.set(Math.sin(a) * 1.2, 0.5, 0.6 + Math.cos(a) * 1.2);
    s.rotation.y = a;
    s.add(mesh(box(0.5, 0.3, 0.03), M.dark, 0, 0.2, 0));
    const sc = mesh(new THREE.PlaneGeometry(0.46, 0.26), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }), 0, 0.2, -0.016);
    sc.rotation.y = Math.PI; s.add(sc);
    g.add(s);
  });
  // panel hologram terapung di belakang Nadi
  const tex = holoTexture(color);
  const holos = [];
  [-0.75, 0, 0.75].forEach((a, i) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    p.position.set(Math.sin(a) * 1.9, 1.9 + (i === 1 ? 0.25 : 0), 0.6 - Math.cos(a) * 1.9);
    p.lookAt(0, 1.9, 0.6 + 4);
    g.add(p); holos.push(p);
  });
  return { group: g, holos };
}

function holoTexture(color) {
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 160;
  const c = cv.getContext("2d");
  const hex = "#" + color.toString(16).padStart(6, "0");
  c.strokeStyle = hex; c.lineWidth = 3; c.strokeRect(4, 4, 248, 152);
  c.fillStyle = hex; c.globalAlpha = 0.18; c.fillRect(4, 4, 248, 152); c.globalAlpha = 1;
  const bars = [40, 70, 55, 95, 80, 110];
  bars.forEach((h, i) => { c.fillStyle = i === 5 ? "#ffffff" : hex; c.fillRect(24 + i * 26, 140 - h, 16, h); });
  c.strokeStyle = "#ffffff"; c.lineWidth = 2; c.beginPath();
  [[180, 110], [200, 90], [215, 98], [235, 60]].forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
  c.fillStyle = "#ffffff"; c.fillRect(180, 24, 56, 6); c.fillRect(180, 38, 36, 6);
  return new THREE.CanvasTexture(cv);
}
