import * as THREE from "three";
import { octagonShape, signBoard } from "./parts.js";
import { buildSite, GROUND_Y } from "./site.js";
import { person } from "./person.js";
import { officeSpots } from "./spots.js";
import {
  officeFloor, officeWalls, foundation, workstation, plant, wallDecor, commandDeck,
  counterZone, loungeZone, sideZone, sideRZone, bakeStatic, WALL_H,
} from "./decor.js";

// Semua logo SVG dalam folder logos/ (dimuat sebagai teks).
const LOGO_FILES = import.meta.glob("../../logos/*.svg", { query: "?raw", import: "default", eager: true });
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const logoSvg = file => LOGO_FILES["../../logos/" + file];

// Bina seluruh dunia 3D: tapak, bangunan Command, bangunan pejabat dan pekerja.
export function buildWorld(scene, offices, agents) {
  const officeGroups = {}, pickables = [], bobbers = [], bridges = [];
  buildSite(scene, offices);

  for (const [key, o] of Object.entries(offices)) {
    const grp = o.kind === "hub" ? hub(o, bobbers) : office(o);
    grp.position.set(...o.pos);
    scene.add(grp);
    officeGroups[key] = grp;
  }

  const used = {};
  for (const a of agents) {
    const o = offices[a.office];
    const r = person({ shirt: a.color, skin: a.look.kulit, pants: a.look.seluar, hairStyle: a.look.rambut, hairColor: a.look.warnaRambut,
      accent: "#" + o.color.toString(16).padStart(6, "0") });
    const i = used[a.office] = (used[a.office] ?? -1) + 1;
    if (o.kind === "hub") {
      const n = agents.filter(x => x.office === a.office).length;
      r.position.set((i - (n - 1) / 2) * 1.4, 0, 0.6);
      a.home = { x: r.position.x, z: 0.6, standing: true };
    } else {
      // pekerja duduk di kerusi di belakang meja, menghadap kamera
      const [x, z] = o.deskSpots[i];
      r.position.set(x, 0, z - 0.62);
      a.home = { x, z: z - 0.62, desk: i };
    }
    officeGroups[a.office].add(r);
    r.traverse(m => { if (m.isMesh) { m.userData.agent = a.id; pickables.push(m); } });
    a.mesh = r;
    a.ph = Math.random() * 6;
  }

  return { officeGroups, pickables, bobbers, bridges };
}

// Bangunan Command: pavilion kaca berbentuk oktagon, bahagian depan terbuka
function hub(o, bobbers) {
  const grp = new THREE.Group();
  const shell = new THREE.Group();
  const R = 3.4, h = -GROUND_Y;
  // asas oktagon
  const base = new THREE.Mesh(new THREE.ExtrudeGeometry(octagonShape(R), { depth: h, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0x59607a, roughness: 0.9 }));
  base.rotation.x = Math.PI / 2; shell.add(base);
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(octagonShape(R - 0.15)), new THREE.MeshStandardMaterial({ color: 0x262d44, roughness: 0.4, metalness: 0.3 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.01; shell.add(floor);
  // dinding kaca di 5 sisi belakang (sisi depan terbuka)
  const glass = new THREE.MeshStandardMaterial({ color: o.color, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.3, depthWrite: false, side: THREE.DoubleSide });
  const frameM = new THREE.MeshStandardMaterial({ color: 0x3a4152, roughness: 0.6 });
  const wallH = WALL_H - 0.2;
  for (let i = 0; i < 8; i++) {
    const a0 = i / 8 * Math.PI * 2 + Math.PI / 8, a1 = a0 + Math.PI / 4;
    const p0 = [Math.cos(a0) * (R - 0.1), Math.sin(a0) * (R - 0.1)], p1 = [Math.cos(a1) * (R - 0.1), Math.sin(a1) * (R - 0.1)];
    const mx = (p0[0] + p1[0]) / 2, mz = -(p0[1] + p1[1]) / 2, len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const ang = Math.atan2(-(p1[1] - p0[1]), p1[0] - p0[0]);
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.22, wallH + 0.1, 0.22), frameM);
    pillar.position.set(p0[0], (wallH + 0.1) / 2, -p0[1]); shell.add(pillar);
    if (mz > 0.5) continue; // sisi depan dibiar terbuka
    const pane = new THREE.Mesh(new THREE.BoxGeometry(len, wallH, 0.05), glass);
    pane.position.set(mx, wallH / 2, mz); pane.rotation.y = -ang; shell.add(pane);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(len + 0.2, 0.12, 0.22), frameM);
    cap.position.set(mx, wallH + 0.06, mz); cap.rotation.y = -ang; shell.add(cap);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.2), new THREE.MeshBasicMaterial({ color: o.color }));
    sill.position.set(mx, 0.04, mz); sill.rotation.y = -ang; shell.add(sill);
  }
  shell.add(plant(-2.2, -1.2, 0.8, 1)); shell.add(plant(2.2, -1.2, 0.8, 0));
  grp.add(bakeStatic(shell));

  // cincin lantai berputar + meja kawalan + hologram
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8 + i * 0.35, 0.02, 8, 64), new THREE.MeshBasicMaterial({ color: 0x9fd4ff, transparent: true, opacity: 0.6 - i * 0.15 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.08 + i * 0.02; ring.userData.spin = (i % 2 ? -1 : 1) * (0.4 + i * 0.2);
    grp.add(ring); bobbers.push({ m: ring, type: "spin" });
  }
  const deck = commandDeck(o.color);
  grp.add(deck.group);
  deck.holos.forEach((h, i) => bobbers.push({ m: h, type: "bob", base: h.position.y, ph: i * 1.7, amp: 0.06 }));

  // menara antena + radar di belakang bumbung
  const mast = new THREE.Group(); mast.position.set(-R * 0.62, 0, -R * 0.62);
  const metal = new THREE.MeshStandardMaterial({ color: 0x8a93a8, metalness: 0.6, roughness: 0.35 });
  mast.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 3.0, 8), metal), 0, 1.5, 0));
  const dish = new THREE.Group(); dish.position.y = 2.95; dish.scale.setScalar(0.6);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3), new THREE.MeshStandardMaterial({ color: 0xeef1f6, side: THREE.DoubleSide, roughness: 0.4 }));
  bowl.rotation.x = -Math.PI / 2 - 0.4; dish.add(bowl);
  dish.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: o.color })), 0, 0.25, 0.3));
  mast.add(dish); bobbers.push({ m: dish, type: "spinY", speed: 0.6 });
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff5a5a }));
  tip.position.y = 3.1; mast.add(tip);
  grp.add(mast);
  return grp;
}

function office(o) {
  const grp = new THREE.Group();
  const accent = "#" + o.color.toString(16).padStart(6, "0");
  const plan = o.plan, theme = o.theme;
  const { anchors } = officeSpots(plan, theme);

  // perabot statik: dibina dalam satu kumpulan, kemudian digabung
  const furniture = new THREE.Group();
  furniture.add(foundation(plan, o.color, GROUND_Y));
  furniture.add(officeFloor(plan, o.color, theme));
  furniture.add(officeWalls(plan, o.color, theme));
  furniture.add(wallDecor(plan, o.color, theme));
  o.deskSpots.forEach(([x, z], i) => { const d = workstation(o.color, x < 0 ? -1 : 1, theme, i); d.position.set(x, 0, z); furniture.add(d); });
  furniture.add(counterZone(anchors.counter, o.color, theme));
  furniture.add(loungeZone(anchors.lounge, o.color, theme));
  furniture.add(sideZone(anchors.side, o.color, theme));
  furniture.add(sideRZone(anchors.sideR, o.color, theme));
  const W2 = plan.W / 2;
  furniture.add(plant(-(W2 - 0.55), plan.lanes.back - 0.2, 1, 1));
  furniture.add(plant(W2 - 0.55, plan.lanes.back - 0.2, 1, 0));
  furniture.add(plant(-0.95, plan.lanes.front + 0.75, 0.7, 0));
  furniture.add(plant(0.95, plan.lanes.front + 0.75, 0.7, 0));
  grp.add(bakeStatic(furniture));

  // papan tanda di atas bumbung dinding belakang
  const svg = o.logo && logoSvg(o.logo.fail);
  if (o.logo && !svg) console.error(`[markas.config.js] Logo "${o.logo.fail}" tiada dalam folder logos/.`);
  if (svg) {
    const sign = signBoard(svg, o.logo, accent, 1.15);
    sign.position.set(0, WALL_H + 0.12, plan.backZ - 0.2);
    grp.add(sign);
  }
  return grp;
}

