import * as THREE from "three";
import { octagonShape, roundedShape, platform, logoSprite } from "./parts.js";
import { person } from "./person.js";
import { officeFloor, officeWalls, workstation, plant, wallDecor, commandDeck } from "./decor.js";

// Semua logo SVG dalam folder logos/ (dimuat sebagai teks).
const LOGO_FILES = import.meta.glob("../../logos/*.svg", { query: "?raw", import: "default", eager: true });
const logoSvg = file => LOGO_FILES["../../logos/" + file];

// Bina seluruh dunia 3D: hab Command, pejabat, jambatan dan robot agent.
export function buildWorld(scene, offices, agents) {
  const officeGroups = {}, pickables = [], bobbers = [], bridges = [];

  for (const [key, o] of Object.entries(offices)) {
    const grp = o.kind === "hub" ? hub(o, bobbers) : office(o, bobbers);
    grp.position.set(...o.pos);
    scene.add(grp);
    officeGroups[key] = grp;
  }

  const hubKey = Object.keys(offices).find(k => offices[k].kind === "hub");
  for (const [key, o] of Object.entries(offices)) {
    if (key !== hubKey) bridges.push(bridge(scene, offices[hubKey].pos, o.pos, o.color));
  }

  const used = {};
  for (const a of agents) {
    const o = offices[a.office];
    const r = person({ shirt: a.color, skin: a.look.kulit, pants: a.look.seluar, hairStyle: a.look.rambut, hairColor: a.look.warnaRambut,
      accent: "#" + o.color.toString(16).padStart(6, "0"), seated: o.kind !== "hub" });
    const i = used[a.office] = (used[a.office] ?? -1) + 1;
    if (o.kind === "hub") {
      const n = agents.filter(x => x.office === a.office).length;
      r.position.set((i - (n - 1) / 2) * 1.4, 0, 0.6);
    } else {
      // pekerja duduk di kerusi di belakang meja, menghadap kamera
      const [x, z] = o.deskSpots[i];
      r.position.set(x, 0, z - 0.62);
    }
    officeGroups[a.office].add(r);
    r.traverse(m => { if (m.isMesh) { m.userData.agent = a.id; pickables.push(m); } });
    a.mesh = r;
    a.ph = Math.random() * 6;
  }

  return { officeGroups, pickables, bobbers, bridges };
}

function hub(o, bobbers) {
  const grp = new THREE.Group();
  grp.add(platform(octagonShape(3.4), o.color));
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 40, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x9fd4ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.y = 20; grp.add(beam);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 40, 12),
    new THREE.MeshBasicMaterial({ color: 0xe6f4ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
  core.position.y = 20; grp.add(core);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8 + i * 0.35, 0.02, 8, 64), new THREE.MeshBasicMaterial({ color: 0x9fd4ff, transparent: true, opacity: 0.6 - i * 0.15 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.08 + i * 0.02; ring.userData.spin = (i % 2 ? -1 : 1) * (0.4 + i * 0.2);
    grp.add(ring); bobbers.push({ m: ring, type: "spin" });
  }
  const deck = commandDeck(o.color);
  grp.add(deck.group);
  deck.holos.forEach((h, i) => bobbers.push({ m: h, type: "bob", base: h.position.y, ph: i * 1.7, amp: 0.06 }));
  return grp;
}

function office(o, bobbers) {
  const grp = new THREE.Group();
  const accent = "#" + o.color.toString(16).padStart(6, "0");
  const W = 7.6, D = o.platformDepth, backZ = o.platformShift - D / 2 + 0.35;
  const base = platform(roundedShape(W, D, 1.1), o.color);
  base.position.z = o.platformShift; grp.add(base);
  const floor = officeFloor(W, D, o.color); floor.position.z = o.platformShift; grp.add(floor);
  grp.add(officeWalls(W, D, o.color, backZ));
  grp.add(wallDecor(o.theme, o.color, backZ));
  o.deskSpots.forEach(([x, z]) => { const d = workstation(o.color, x < 0 ? -1 : 1); d.position.set(x, 0, z); grp.add(d); });
  const frontZ = o.platformShift + D / 2 - 0.75;
  [[-3.05, frontZ], [3.05, frontZ]].forEach(([x, z]) => grp.add(plant(x, z, 0.9)));
  const svg = o.logo && logoSvg(o.logo.fail);
  if (o.logo && !svg) console.error(`[markas.config.js] Logo "${o.logo.fail}" tiada dalam folder logos/.`);
  if (svg) {
    const sp = logoSprite(svg, o.logo.lebar, o.logo.tinggi, accent, o.logo.skala);
    sp.position.set(0, 5.4, backZ); grp.add(sp);
    bobbers.push({ m: sp, type: "bob", base: 5.4, ph: o.logoPhase });
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 8), new THREE.MeshBasicMaterial({ color: o.color, transparent: true, opacity: 0.5 }));
  pole.position.set(0, 2.55, backZ); grp.add(pole);
  return grp;
}

function bridge(scene, a, b, color) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = B.clone().sub(A).length();
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, len), new THREE.MeshStandardMaterial({ color: 0x1d2338, roughness: 0.8 }));
  m.position.copy(mid); m.position.y = -0.05; m.lookAt(B.x, -0.05, B.z); scene.add(m);
  const dots = [];
  for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color })); scene.add(d); dots.push(d); }
  return { A, B, dots };
}
