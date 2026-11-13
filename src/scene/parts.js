import * as THREE from "three";

// Blok binaan 3D: bentuk platform dan papan logo.

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

// Papan tanda bumbung: kotak dengan muka depan bercetak. Kalau "ikon" dan
// "tulisan" diberi (viewBox dalam SVG logo), ikon diletak di kiri dan
// tulisan di kanan. Kalau tidak, logo penuh diletak di tengah.
export function signBoard(svg, opt, accent, height) {
  const W = 1600, H = 420;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
  const r = 60;
  ctx.beginPath(); ctx.moveTo(r, 8); ctx.arcTo(W - 8, 8, W - 8, H - 8, r); ctx.arcTo(W - 8, H - 8, 8, H - 8, r); ctx.arcTo(8, H - 8, 8, 8, r); ctx.arcTo(8, 8, W - 8, 8, r); ctx.closePath();
  ctx.fillStyle = "#0b1222"; ctx.fill();
  ctx.lineWidth = 12; ctx.strokeStyle = accent; ctx.stroke();

  const load = (box) => new Promise(res => {
    const src = box ? svg.replace(/viewBox="[^"]*"/, `viewBox="${box}"`).replace(/ width="[^"]*"/, "").replace(/ height="[^"]*"/, "") : svg;
    const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
  });
  const fit = (img, x, y, w, h) => {
    const ar = (img.naturalWidth || 1) / (img.naturalHeight || 1);
    let dw = w, dh = w / ar; if (dh > h) { dh = h; dw = h * ar; }
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  };
  if (opt && opt.ikon && opt.tulisan) {
    Promise.all([load(opt.ikon), load(opt.tulisan)]).then(([icon, word]) => {
      if (icon) fit(icon, 70, 50, 320, 320);
      if (word) fit(word, 430, 90, W - 500, 240);
      tex.needsUpdate = true;
    });
  } else {
    load(null).then(img => { if (img) fit(img, 60, 40, W - 120, H - 80); tex.needsUpdate = true; });
  }

  const width = height * W / H;
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x0b1222, roughness: 0.6 });
  const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.55 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.12), [frame, frame, frame, frame, front, frame]);
  board.position.y = height / 2 + 0.55; g.add(board);
  // tiang penyokong ke bumbung
  const postM = new THREE.MeshStandardMaterial({ color: 0x8a93a8, roughness: 0.4, metalness: 0.6 });
  for (const x of [-width * 0.32, width * 0.32]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), postM);
    post.position.set(x, 0.3, -0.02); g.add(post);
  }
  // jalur lampu di bawah papan
  const strip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: accent }));
  strip.position.set(0, 0.53, 0.1); g.add(strip);
  return g;
}
