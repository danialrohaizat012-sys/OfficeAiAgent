import * as THREE from "three";
import { bakeStatic } from "./decor.js";

// Tapak bangunan: tanah berumput, dataran berturap, laluan pejalan kaki dari
// Command ke setiap pejabat, jalan raya di depan, pokok, lampu jalan dan kereta.
// Semua bangunan duduk atas tanah (tiada lagi platform terapung).

export const GROUND_Y = -0.25;

// Tandakan bahan yang menyala lebih terang waktu malam (lampu jalan, lampu kereta)
export function glow(mat, nightIntensity) {
  mat.userData.nightGlow = nightIntensity;
  return mat;
}
const PI = Math.PI;
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const matCache = new Map();
const std = (color, extra = {}) => {
  const k = color + JSON.stringify(extra);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...extra }));
  return matCache.get(k);
};
const basicCache = new Map();
const basic = color => { if (!basicCache.has(color)) basicCache.set(color, new THREE.MeshBasicMaterial({ color })); return basicCache.get(color); };

function rect(w, d, mat, x, z, y = GROUND_Y + 0.005) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -PI / 2; m.position.set(x, y, z);
  return m;
}

export function buildSite(scene, offices) {
  const site = new THREE.Group();

  // sempadan semua bangunan
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  let hub = null;
  for (const o of Object.values(offices)) {
    const [x, , z] = o.pos;
    const hw = o.kind === "hub" ? 3.4 : o.plan.W / 2;
    const z0 = o.kind === "hub" ? z - 3.4 : z + o.platformShift - o.platformDepth / 2;
    const z1 = o.kind === "hub" ? z + 3.4 : z + o.platformShift + o.platformDepth / 2;
    minX = Math.min(minX, x - hw); maxX = Math.max(maxX, x + hw); minZ = Math.min(minZ, z0); maxZ = Math.max(maxZ, z1);
    if (o.kind === "hub") hub = o;
  }

  // rumput
  site.add(rect(140, 140, std(0x2c4a38, { roughness: 1 }), (minX + maxX) / 2, (minZ + maxZ) / 2, GROUND_Y));
  // dataran berturap di sekeliling bangunan
  const pad = 1.6;
  site.add(rect(maxX - minX + pad * 2, maxZ - minZ + pad * 2, std(0x4b5266), (minX + maxX) / 2, (minZ + maxZ) / 2));
  // garisan jubin dataran
  const tiles = [], tw = maxX - minX + pad * 2, td = maxZ - minZ + pad * 2, cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  for (let x = -tw / 2; x <= tw / 2; x += 1.2) tiles.push(cx + x, GROUND_Y + 0.012, cz - td / 2, cx + x, GROUND_Y + 0.012, cz + td / 2);
  for (let z = -td / 2; z <= td / 2; z += 1.2) tiles.push(cx - tw / 2, GROUND_Y + 0.012, cz + z, cx + tw / 2, GROUND_Y + 0.012, cz + z);
  const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute(tiles, 3));
  scene.add(new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: 0x3c4255 })));

  // laluan pejalan kaki dari Command ke pintu setiap pejabat
  if (hub) {
    for (const o of Object.values(offices)) {
      if (o.kind === "hub") continue;
      const A = new THREE.Vector2(hub.pos[0], hub.pos[2]);
      const B = new THREE.Vector2(o.pos[0], o.pos[2] + o.platformShift + o.platformDepth / 2 + 0.4);
      const len = A.distanceTo(B), mid = A.clone().add(B).multiplyScalar(0.5);
      const th = Math.atan2(B.x - A.x, B.y - A.y);      // arah laluan
      const path = rect(1.3, len, std(0x8a8f9e), mid.x, mid.y, GROUND_Y + 0.02);
      path.rotation.z = th; site.add(path);
      // jalur warna jenama di kiri dan kanan laluan
      for (const s of [-1, 1]) {
        const edge = rect(0.06, len, basic(o.color), mid.x + s * 0.68 * Math.cos(th), mid.y - s * 0.68 * Math.sin(th), GROUND_Y + 0.025);
        edge.rotation.z = th; site.add(edge);
      }
    }
  }

  // jalan raya di depan kompleks
  const roadZ = maxZ + pad + 2.4, roadW = 3.2, roadL = 140;
  site.add(rect(roadL, 1.0, std(0x8a8f9e), cx, roadZ - roadW / 2 - 0.5, GROUND_Y + 0.01));          // kaki lima
  site.add(rect(roadL, roadW, std(0x23262f, { roughness: 0.95 }), cx, roadZ, GROUND_Y + 0.01));      // asfalt
  for (let x = cx - 60; x < cx + 60; x += 2.2) site.add(rect(1.1, 0.12, basic(0xe9e3c8), x, roadZ, GROUND_Y + 0.015));
  // kereta bergerak di dua lorong (tidak digabung supaya boleh bergerak)
  const cars = [];
  [[-6, 0.75, 1, 0x5ab0ff], [9, -0.75, -1, 0xf2c14e], [22, 0.75, 1, 0xe0303a], [-20, -0.75, -1, 0xeef1f6]].forEach(([x, dz, dir, c], i) => {
    const m = car(cx + x, roadZ + dz, dir > 0 ? 0 : PI, c);
    scene.add(m);
    cars.push({ m, dir, speed: 2.2 + (i % 3) * 0.6, minX: cx - 45, maxX: cx + 45 });
  });

  // lampu jalan di kaki lima
  for (let x = Math.floor((minX - 2) / 5) * 5; x <= maxX + 2; x += 5) site.add(streetLamp(x, roadZ - roadW / 2 - 0.5));

  // pokok di sekeliling dataran
  const trees = [];
  for (let x = minX - pad - 1.2; x <= maxX + pad + 1.2; x += 2.6) trees.push([x, minZ - pad - 1.4]);
  for (let z = minZ - pad; z <= maxZ + pad; z += 2.6) { trees.push([minX - pad - 1.4, z]); trees.push([maxX + pad + 1.4, z]); }
  trees.forEach(([x, z], i) => site.add(tree(x, z, 0.85 + ((i * 37) % 10) / 25, i)));
  // pokok jauh di belakang (latar)
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * PI * 2;
    site.add(tree(cx + Math.cos(a) * (tw / 2 + 9 + (i % 3) * 2), cz + Math.sin(a) * (td / 2 + 9 + (i % 2) * 3), 1.2, i));
  }

  scene.add(bakeStatic(site));
  return { roadZ, roadW, minX, maxX, minZ, maxZ, cars, center: { x: cx, z: cz }, size: Math.max(tw, td) };
}

function tree(x, z, s, i) {
  const g = new THREE.Group(); g.position.set(x, GROUND_Y, z); g.scale.setScalar(s);
  g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.9, 8), std(0x6b4a33)), 0, 0.45, 0));
  const leaf = std(i % 3 === 0 ? 0x3d8a52 : i % 3 === 1 ? 0x4f9e5f : 0x357a48);
  const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), leaf); c1.position.y = 1.4; g.add(c1);
  const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), leaf); c2.position.set(0.3, 1.85, 0.1); g.add(c2);
  return g;
}

function streetLamp(x, z) {
  const g = new THREE.Group(); g.position.set(x, GROUND_Y, z);
  const metal = std(0x3a3f4d, { metalness: 0.5, roughness: 0.4 });
  g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.6, 8), metal), 0, 1.3, 0));
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.6), metal), 0, 2.58, 0.27));
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.32), glow(std(0xfff1d0, { emissive: 0xffe2a8, emissiveIntensity: 0.9 }), 1.4)), 0, 2.52, 0.5));
  return g;
}

function car(x, z, ry, color) {
  const g = new THREE.Group(); g.position.set(x, GROUND_Y, z); g.rotation.y = ry;
  const body = std(color, { roughness: 0.35, metalness: 0.3 });
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.38, 0.9), body), 0, 0.36, 0));
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.34, 0.8), std(0x9fc4e6, { roughness: 0.1, metalness: 0.4 })), -0.1, 0.72, 0));
  for (const wx of [-0.6, 0.6]) for (const wz of [-0.45, 0.45]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 12), std(0x15171d));
    w.rotation.x = PI / 2; w.position.set(wx, 0.17, wz); g.add(w);
  }
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.6), glow(std(0xfff6d8, { emissive: 0xfff0c0, emissiveIntensity: 0.8 }), 1.2)), 0.96, 0.4, 0));
  return g;
}
