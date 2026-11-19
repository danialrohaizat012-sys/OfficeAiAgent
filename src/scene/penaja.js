import * as THREE from "three";

// Logo penaja (sponsor) pada sut lumba dan kereta F1 Danial: logo venture ROI Resources.
// Fail PNG dalam logos/penaja/ dijana dari logo venture (latar lutsinar, tampalan bulat).
const FILES = import.meta.glob("../../logos/penaja/*.png", { query: "?url", import: "default", eager: true });
const cache = new Map(), loader = new THREE.TextureLoader();

export function penajaMat(name) {
  if (!cache.has(name)) {
    const url = FILES[`../../logos/penaja/${name}.png`];
    if (!url) { console.error(`[penaja] Tiada fail logos/penaja/${name}.png`); return null; }
    const tex = loader.load(url);
    tex.anisotropy = 4;
    cache.set(name, new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.05, roughness: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  }
  return cache.get(name);
}

// Satah logo (w × h) — dipasang pada permukaan objek
export function decal(name, w, h) {
  const m = penajaMat(name);
  return m ? new THREE.Mesh(new THREE.PlaneGeometry(w, h), m) : new THREE.Group();
}
