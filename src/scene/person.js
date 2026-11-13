import * as THREE from "three";

// Figura pekerja gaya blok mainan: kepala silinder, badan trapezium,
// tangan "C", kaki blok. Duduk di kerusi (pejabat) atau berdiri (Command).

const SKIN_DEFAULT = "#F6C944";
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05, ...extra });

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m;
}

// Badan: kotak yang mengecil di bahagian atas (bahu lebih sempit dari pinggang)
function torsoGeo() {
  const g = new THREE.BoxGeometry(0.5, 0.42, 0.26);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setX(i, p.getX(i) * 0.72);
  g.computeVertexNormals();
  return g;
}

// Muka dilukis atas kanvas, dibalut pada kepala silinder
const faceCache = new Map();
function faceTexture(skin, mood) {
  const key = skin + mood;
  if (faceCache.has(key)) return faceCache.get(key);
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 128;
  const c = cv.getContext("2d");
  c.fillStyle = skin; c.fillRect(0, 0, 256, 128);
  c.fillStyle = "#1a1a1a";
  c.beginPath(); c.ellipse(110, 54, 6, 9, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(146, 54, 6, 9, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,255,255,.9)";
  c.beginPath(); c.arc(112, 50, 2, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(148, 50, 2, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#1a1a1a"; c.lineWidth = 4; c.lineCap = "round";
  c.beginPath(); c.moveTo(102, 38); c.lineTo(116, 36); c.moveTo(140, 36); c.lineTo(154, 38); c.stroke();
  c.lineWidth = 5; c.beginPath(); c.arc(128, 72, 20, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  const tex = new THREE.CanvasTexture(cv);
  faceCache.set(key, tex);
  return tex;
}

function hair(style, color, accent) {
  const g = new THREE.Group();
  const mat = std(color, { roughness: 0.6 });
  if (style === "tudung") {
    const cloth = std(color, { roughness: 0.8, side: THREE.DoubleSide });
    const open = 1.0; // bukaan muka (radian)
    const ps = Math.PI / 2 + open, pl = Math.PI * 2 - open * 2;
    g.add(mesh(new THREE.SphereGeometry(0.205, 24, 12, ps, pl, 0, Math.PI / 2), cloth, 0, 0.07, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.205, 0.215, 0.2, 24, 1, true, open, Math.PI * 2 - open * 2), cloth, 0, -0.03, 0));
    // lilitan dagu dan labuh di bahu
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.34, 0.22, 24), cloth, 0, -0.22, -0.01));
    const chin = mesh(new THREE.TorusGeometry(0.17, 0.035, 8, 24, Math.PI), cloth, 0, -0.07, 0.04);
    chin.rotation.set(Math.PI / 2 + 0.15, Math.PI, 0); g.add(chin);
    // pin kecil warna jenama
    g.add(mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: accent }), 0.14, -0.08, 0.12));
    return g;
  }
  if (style === "topi") {
    g.add(mesh(new THREE.SphereGeometry(0.2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(accent), 0, 0.1, 0));
    const brim = mesh(new THREE.BoxGeometry(0.3, 0.025, 0.2), std(accent), 0, 0.11, -0.2); g.add(brim); // topi terbalik ala gamer
    g.add(mesh(new THREE.SphereGeometry(0.03, 8, 6), std(0xffffff), 0, 0.3, 0));
    g.add(mesh(new THREE.BoxGeometry(0.36, 0.08, 0.3), mat, 0, 0.0, -0.02));
    return g;
  }
  // rambut: pendek / kemas / panjang
  g.add(mesh(new THREE.SphereGeometry(0.2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat, 0, 0.08, -0.005));
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 20, 1, false, 0.9, Math.PI * 2 - 1.8), mat, 0, 0.04, 0));
  if (style === "kemas") {
    const part = mesh(new THREE.BoxGeometry(0.16, 0.06, 0.12), mat, 0.07, 0.22, 0.1); part.rotation.z = -0.3; g.add(part);
  } else if (style === "panjang") {
    g.add(mesh(new THREE.BoxGeometry(0.4, 0.42, 0.14), mat, 0, -0.12, -0.12));
    const fr = mesh(new THREE.BoxGeometry(0.3, 0.06, 0.08), mat, -0.03, 0.17, 0.15); fr.rotation.z = 0.2; g.add(fr);
  } else {
    const fr = mesh(new THREE.BoxGeometry(0.32, 0.06, 0.08), mat, 0, 0.17, 0.15); fr.rotation.x = 0.3; g.add(fr);
  }
  return g;
}

export function person(opts) {
  const { shirt, skin = SKIN_DEFAULT, pants = "#2B3550", hairStyle = "pendek", hairColor = "#3B2618", accent = shirt, seated = true } = opts;
  const g = new THREE.Group();
  const skinM = std(skin), shirtM = std(shirt), pantsM = std(pants);
  const parts = {};

  // --- pinggul + kaki
  const hipY = seated ? 0.5 : 0.62;
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.1, 0.26), pantsM, 0, hipY, 0));
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(sx * 0.125, hipY - 0.04, 0);
    if (seated) {
      leg.add(mesh(new THREE.BoxGeometry(0.23, 0.16, 0.36), pantsM, 0, 0, 0.16));          // peha (mendatar)
      leg.add(mesh(new THREE.BoxGeometry(0.23, 0.38, 0.2), pantsM, 0, -0.17, 0.3));       // betis
      leg.add(mesh(new THREE.BoxGeometry(0.23, 0.08, 0.28), pantsM, 0, -0.38, 0.34));     // kaki
    } else {
      leg.add(mesh(new THREE.BoxGeometry(0.23, 0.5, 0.24), pantsM, 0, -0.27, 0));
      leg.add(mesh(new THREE.BoxGeometry(0.23, 0.08, 0.3), pantsM, 0, -0.52, 0.04));
    }
    g.add(leg);
  }

  // --- badan + leher
  const torsoY = hipY + 0.26;
  const torso = mesh(torsoGeo(), shirtM, 0, torsoY, 0); g.add(torso);
  // kolar / tali leher kecil supaya nampak "pekerja pejabat"
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.2, 0.01), std(0x1a2238), 0, torsoY + 0.06, 0.132));
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12), skinM, 0, torsoY + 0.235, 0));

  // --- lengan + tangan "C"
  parts.arms = [];
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(sx * 0.22, torsoY + 0.15, 0);
    const upper = mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.3, 10), shirtM, sx * 0.04, -0.13, 0); upper.rotation.z = sx * 0.18; arm.add(upper);
    const hand = mesh(new THREE.TorusGeometry(0.05, 0.022, 6, 12, Math.PI * 1.45), skinM, sx * 0.07, -0.32, 0.04);
    hand.rotation.set(Math.PI / 2, 0, Math.PI * 0.27); arm.add(hand);
    arm.rotation.x = seated ? -0.9 : -0.15; // lengan ke depan ke arah papan kekunci
    g.add(arm); parts.arms.push(arm);
  }

  // --- kepala + rambut
  const head = new THREE.Group(); head.position.set(0, torsoY + 0.42, 0);
  const headGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.27, 28); headGeo.rotateY(Math.PI);
  const face = new THREE.MeshStandardMaterial({ map: faceTexture(skin, "senyum"), roughness: 0.45 });
  head.add(mesh(headGeo, [face, skinM, skinM]));
  const crown = mesh(new THREE.SphereGeometry(0.17, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), skinM, 0, 0.135, 0); crown.scale.y = 0.35; head.add(crown);
  const chinB = mesh(new THREE.SphereGeometry(0.17, 20, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), skinM, 0, -0.135, 0); chinB.scale.y = 0.35; head.add(chinB);
  if (hairStyle === "botak") head.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 16), skinM, 0, 0.2, 0));
  else head.add(hair(hairStyle, hairColor, accent));
  g.add(head); parts.head = head;

  // --- penunjuk status kecil terapung (hijau = sedia, kuning berkelip = sibuk)
  const dot = mesh(new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshBasicMaterial({ color: 0x46D37A }), 0, torsoY + 0.85, 0);
  g.add(dot); parts.dot = dot;

  g.userData.animate = (t, busy, ph) => {
    const k = Math.sin(t * 14 + ph);
    if (seated) {
      parts.arms[0].rotation.x = -0.9 + (busy ? k * 0.12 : 0);
      parts.arms[1].rotation.x = -0.9 - (busy ? k * 0.12 : 0);
    }
    parts.head.rotation.y = Math.sin(t * 0.7 + ph) * (busy ? 0.08 : 0.25);
    parts.head.rotation.x = busy ? 0.08 : 0;
    dot.rotation.y = t * 2;
    dot.position.y = torsoY + 0.85 + Math.sin(t * 2 + ph) * 0.03;
    dot.material.color.set(busy ? (Math.sin(t * 6 + ph) > 0 ? 0xF2C14E : 0xffe9a8) : 0x46D37A);
  };
  return g;
}
