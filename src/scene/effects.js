import * as THREE from "three";

// Sampul report yang terbang dalam lengkungan dari meja agent ke Nadi di Command.

export function createEnvelopes(scene) {
  const flying = [];
  const paper = new THREE.MeshStandardMaterial({ color: 0xf7f4ec, roughness: 0.6 });
  const geo = new THREE.BoxGeometry(0.34, 0.22, 0.03);
  const flapGeo = new THREE.ConeGeometry(0.2, 0.12, 3); flapGeo.rotateZ(Math.PI); flapGeo.rotateX(Math.PI / 2);

  function spawn(from, to, color, onArrive) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, paper));
    const flap = new THREE.Mesh(flapGeo, new THREE.MeshBasicMaterial({ color }));
    flap.position.set(0, 0.05, 0.02); flap.scale.set(1, 1, 0.15); g.add(flap);
    g.position.copy(from);
    scene.add(g);
    const dist = from.distanceTo(to);
    flying.push({ g, from: from.clone(), to: to.clone(), k: 0, dur: 1.4 + dist * 0.09, h: 2 + dist * 0.18, onArrive });
  }

  function update(dt) {
    for (let i = flying.length - 1; i >= 0; i--) {
      const f = flying[i];
      f.k += dt / f.dur;
      const k = Math.min(f.k, 1), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      f.g.position.lerpVectors(f.from, f.to, e);
      f.g.position.y += Math.sin(Math.PI * k) * f.h;
      f.g.rotation.set(Math.sin(k * 9) * 0.25, k * Math.PI * 2, Math.sin(k * 7) * 0.2);
      const s = k > 0.85 ? (1 - k) / 0.15 : Math.min(1, k * 6);
      f.g.scale.setScalar(0.4 + 0.6 * s);
      if (f.k >= 1) {
        scene.remove(f.g); flying.splice(i, 1);
        if (f.onArrive) f.onArrive();
      }
    }
  }

  return { spawn, update };
}
