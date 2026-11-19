import * as THREE from "three";
import { std, basic, mesh, box, hexStr, WALL_H } from "./decor.js";

// Muka luar menara (belakang + sisi) supaya cantik bila kamera pusing:
// panel kelongsong gelap, jalur tingkap (menyala waktu malam), sirip aluminium,
// jalur lantai (spandrel) dengan LED warna venture, dan papan nama venture.

const PI = Math.PI;
const SPANDREL = 0.4;   // ruang antara bumbung dinding (2.6) dan lantai tingkat atas (3.0)
const texCache = new Map();

function windowsTex(variant) {
  const key = "win" + variant;
  if (texCache.has(key)) return texCache.get(key);
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 128;
  const c = cv.getContext("2d");
  let seed = 7 + variant * 31;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const cols = 16, rows = 2, pw = 512 / cols, ph = 128 / rows;
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
    const lit = rnd();
    if (lit < 0.32) c.fillStyle = "#ffd98a";            // lampu kuning
    else if (lit < 0.42) c.fillStyle = "#dfe9ff";       // lampu putih
    else {
      const g = c.createLinearGradient(i * pw, r * ph, i * pw + pw, r * ph + ph);
      g.addColorStop(0, "#2a3c5e"); g.addColorStop(1, "#14203a"); c.fillStyle = g;
    }
    c.fillRect(i * pw, r * ph, pw, ph);
    // pantulan langit
    c.fillStyle = "rgba(255,255,255,.07)"; c.fillRect(i * pw + 3, r * ph + 3, pw * 0.35, ph - 6);
  }
  c.strokeStyle = "#0c111c"; c.lineWidth = 4;
  for (let i = 0; i <= cols; i++) { c.beginPath(); c.moveTo(i * pw, 0); c.lineTo(i * pw, 128); c.stroke(); }
  for (let r = 0; r <= rows; r++) { c.beginPath(); c.moveTo(0, r * ph); c.lineTo(512, r * ph); c.stroke(); }
  const t = new THREE.CanvasTexture(cv);
  texCache.set(key, t);
  return t;
}

function plaqueTex(text, hex) {
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 96;
  const c = cv.getContext("2d");
  c.fillStyle = "#121722"; c.fillRect(0, 0, 512, 96);
  c.fillStyle = hex; c.fillRect(0, 0, 10, 96); c.fillRect(502, 0, 10, 96);
  c.font = "900 54px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  c.shadowColor = hex; c.shadowBlur = 14; c.fillStyle = hex; c.fillText(text, 256, 50);
  c.shadowBlur = 0; c.globalAlpha = 0.9; c.fillStyle = "#ffffff"; c.fillText(text, 256, 50);
  return new THREE.CanvasTexture(cv);
}

const glowMat = (map, day, night) => {
  const m = new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: day, roughness: 0.25, metalness: 0.3 });
  m.userData.nightGlow = night;
  return m;
};

// o = pejabat (dari config), liftZ = [mula, akhir] julat z lif di sisi kanan (tiada sirip di situ)
export function facade(o, label, liftZ) {
  const g = new THREE.Group();
  const plan = o.plan, W = plan.W, W2 = W / 2, color = o.color, hex = hexStr(color);
  const zBack = plan.backZ - 0.1, zOut = zBack - 0.15, zFront = plan.shift + plan.D / 2 - 0.1;
  const clad = std(0x2b3142, { roughness: 0.6, metalness: 0.25 });
  const fin = std(0x8a93a8, { roughness: 0.35, metalness: 0.6 });
  const led = basic(color);
  const top = WALL_H + SPANDREL / 2;

  // ---- belakang ----
  const back = mesh(new THREE.PlaneGeometry(W, WALL_H), clad, 0, WALL_H / 2, zOut); back.rotation.y = PI; g.add(back);
  const ribbon = mesh(new THREE.PlaneGeometry(W - 0.9, 1.15), glowMat(windowsTex(o.floor % 3), 0.12, 1.0), 0, 1.55, zOut - 0.01);
  ribbon.rotation.y = PI; g.add(ribbon);
  // ambang tingkap
  g.add(mesh(box(W - 0.8, 0.05, 0.12), fin, 0, 0.95, zOut - 0.05));
  for (let x = -W2 + 0.45; x <= W2 - 0.44; x += (W - 0.9) / 8) g.add(mesh(box(0.07, WALL_H, 0.18), fin, x, WALL_H / 2, zOut - 0.09));
  // spandrel + LED + papan nama
  g.add(mesh(box(W + 0.2, SPANDREL, 0.3), clad, 0, top, zOut - 0.05));
  for (const y of [top - SPANDREL / 2 + 0.04, top + SPANDREL / 2 - 0.04]) g.add(mesh(box(W + 0.22, 0.035, 0.03), led, 0, y, zOut - 0.21));
  const pl = mesh(new THREE.PlaneGeometry(1.9, 0.33), new THREE.MeshBasicMaterial({ map: plaqueTex(label, hex) }), 0, top, zOut - 0.215);
  pl.rotation.y = PI; g.add(pl);

  // ---- sisi kiri & kanan ----
  const len = zFront - zOut, zc = (zFront + zOut) / 2;
  for (const sx of [-1, 1]) {
    const x = sx * (W2 + 0.02);
    g.add(mesh(box(0.3, SPANDREL, len + 0.2), clad, sx * (W2 - 0.03), top, zc));
    for (const y of [top - SPANDREL / 2 + 0.04, top + SPANDREL / 2 - 0.04]) g.add(mesh(box(0.03, 0.035, len + 0.22), led, sx * (W2 + 0.125), y, zc));
    // sirip menegak di luar kaca (tiada di belakang lif)
    const n = Math.round(len / 0.9);
    for (let i = 1; i < n; i++) {
      const z = zOut + i * len / n;
      if (sx > 0 && liftZ && z > liftZ[0] - 0.1 && z < liftZ[1] + 0.1) continue;
      g.add(mesh(box(0.16, WALL_H, 0.06), fin, x + sx * 0.06, WALL_H / 2, z));
    }
  }
  // papan nama di sisi kiri (nampak bila kamera pusing)
  const side = mesh(new THREE.PlaneGeometry(1.9, 0.33), new THREE.MeshBasicMaterial({ map: plaqueTex(label, hex) }), -(W2 + 0.13), top, zc);
  side.rotation.y = -PI / 2; g.add(side);
  return g;
}
