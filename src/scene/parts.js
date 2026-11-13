import * as THREE from "three";

// Blok binaan 3D: platform, meja, robot dan papan logo.

export function roundedShape(w, d, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export function octagonShape(radius) {
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8, x = Math.cos(a) * radius, y = Math.sin(a) * radius;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  s.closePath();
  return s;
}

export function platform(shape, color) {
  const grp = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.7, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 2, curveSegments: 10 });
  geo.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x1a2033, roughness: 0.75, metalness: 0.2 }));
  m.position.y = -0.12; grp.add(m);
  const pts = shape.getPoints(64).map(p => new THREE.Vector3(p.x, 0.02, p.y));
  pts.push(pts[0].clone());
  grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 })));
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.07, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -1.4; glow.scale.setScalar(8); grp.add(glow);
  return grp;
}

export function desk(color) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.7), new THREE.MeshStandardMaterial({ color: 0x2a3149, roughness: 0.6 }));
  top.position.y = 0.62; g.add(top);
  const leg = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.6, 0.08), new THREE.MeshStandardMaterial({ color: 0x222839 }));
  leg.position.set(0, 0.3, -0.25); g.add(leg);
  const mon = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.48, 0.05), new THREE.MeshStandardMaterial({ color: 0x10131c, emissive: color, emissiveIntensity: 0.55 }));
  mon.position.set(0, 0.98, -0.18); mon.rotation.x = -0.08; g.add(mon);
  return g;
}

export function robot(hex) {
  const c = new THREE.Color(hex), g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.1 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.55, 20), mat); body.position.y = 0.5; g.add(body);
  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat); hip.position.y = 0.23; g.add(hip);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 20), mat); head.position.y = 1.12; g.add(head);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.43, 28, 20, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.33, Math.PI * 0.3),
    new THREE.MeshStandardMaterial({ color: 0x0c0f18, roughness: 0.2, metalness: 0.4 }));
  visor.position.y = 1.12; g.add(visor);
  const eyeM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-0.12, 0.12].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), eyeM); e.position.set(x, 1.16, 0.4); g.add(e); });
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), mat); ant.position.y = 1.62; g.add(ant);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: c })); tip.position.y = 1.75; g.add(tip);
  g.userData.tip = tip;
  return g;
}

// Papan logo terapung: logo SVG dilukis atas kanvas berbingkai, dijadikan sprite.
export function logoSprite(svg, w, h, accent, scale) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d");
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  const img = new Image();
  img.onload = () => {
    const pad = 46, r = 56;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath(); ctx.moveTo(r, 6); ctx.arcTo(w - 6, 6, w - 6, h - 6, r); ctx.arcTo(w - 6, h - 6, 6, h - 6, r); ctx.arcTo(6, h - 6, 6, 6, r); ctx.arcTo(6, 6, w - 6, 6, r); ctx.closePath();
    ctx.fillStyle = "rgba(8,12,24,0.86)"; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = accent; ctx.globalAlpha = 0.9; ctx.stroke(); ctx.globalAlpha = 1;
    const ar = img.naturalWidth / img.naturalHeight; let dw = w - pad * 2, dh = dw / ar;
    if (dh > h - pad * 2) { dh = h - pad * 2; dw = dh * ar; }
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    tex.needsUpdate = true;
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(scale * w / h, scale, 1);
  return sp;
}
