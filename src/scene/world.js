import * as THREE from "three";
import { signBoard } from "./parts.js";
import { buildSite, GROUND_Y } from "./site.js";
import { person } from "./person.js";
import { officeSpots } from "./spots.js";
import { buildNuriLab } from "./nuriLab.js";
import { GAYA, ceoSuite } from "./gaya.js";
import { facade } from "./facade.js";

const liftZ = plan => [plan.backZ + 0.6, plan.backZ + 2.2];   // julat z lif kaca di sisi kanan
import {
  officeFloor, officeWalls, foundation, workstation, plant, wallDecor,
  counterZone, loungeZone, sideZone, sideRZone, bakeStatic, WALL_H, aFrameSign,
} from "./decor.js";

// Semua logo SVG dalam folder logos/ (dimuat sebagai teks).
const LOGO_FILES = {
  ...import.meta.glob("../../logos/*.svg", { query: "?raw", import: "default", eager: true }),   // SVG: teks
  ...import.meta.glob("../../logos/*.png", { query: "?url", import: "default", eager: true }),   // PNG: alamat fail
};
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const logoSvg = file => LOGO_FILES["../../logos/" + file];

// Bina seluruh dunia 3D: tapak, menara ROI Resources (satu venture setiap tingkat,
// ROI Command Centre di atas), lif, papan tanda bumbung dan pekerja.
export function buildWorld(scene, offices, agents, building = {}) {
  const officeGroups = {}, pickables = [], bobbers = [], nightLights = [];
  const site = buildSite(scene, offices);

  for (const [key, o] of Object.entries(offices)) {
    const grp = o.kind === "hub" ? hub(o, bobbers, offices) : office(o, bobbers);
    grp.position.set(...o.pos);
    grp.userData.officeKey = key;
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
      // Nadi (Virtual CEO) duduk di meja eksekutif; agent hab lain berdiri di sebelah
      const seat = o.ceoSeat || { x: 0, z: -1.5 };
      if (i === 0) { r.position.set(seat.x, 0, seat.z); a.home = { x: seat.x, z: seat.z, leader: true }; }
      else { r.position.set(seat.x + (i % 2 ? 1.6 : -1.6), 0, seat.z + 0.4); a.home = { x: r.position.x, z: seat.z + 0.4, standing: true }; }
    } else {
      // pekerja duduk di kerusi di belakang meja, menghadap kamera
      const [x, z] = o.deskSpots[i];
      if (o.theme === "robotik") {
        const labX = i === 0 ? -1.25 : 1.25, labZ = -0.55;
        r.position.set(labX, 0, labZ);
        a.home = { x: labX, z: labZ, desk: i };
      } else {
        r.position.set(x, 0, z - 0.62);
        a.home = { x, z: z - 0.62, desk: i };
      }
    }
    officeGroups[a.office].add(r);
    r.traverse(m => { if (m.isMesh) { m.userData.agent = a.id; pickables.push(m); } });
    a.mesh = r;
    a.ph = Math.random() * 6;
  }

  // lampu dalam bangunan (menyala waktu malam)
  for (const [key, o] of Object.entries(offices)) {
    const lamp = new THREE.PointLight(o.kind === "hub" ? 0xb8c4ff : 0xffe2b0, 0, o.kind === "hub" ? 8 : 11, 1.2);
    lamp.position.set(0, 2.4, o.kind === "hub" ? 0 : o.platformShift);
    officeGroups[key].add(lamp); nightLights.push(lamp);
  }
  scene.add(tower(offices, building, bobbers));
  return { officeGroups, pickables, bobbers, nightLights, site };
}

// Struktur menara: lif kaca di sisi kanan (dengan kereta lif bergerak) dan
// papan tanda ROI RESOURCES atas bumbung.
function tower(offices, building, bobbers) {
  const g = new THREE.Group();
  const list = Object.values(offices);
  const top = list.reduce((m, o) => Math.max(m, o.pos[1]), 0);
  const plan = list[0].plan, W2 = plan.W / 2;
  const H = top + WALL_H + 0.12 - GROUND_Y;
  // lif kaca
  const lift = new THREE.Group(); lift.position.set(W2 + 0.72, GROUND_Y, plan.backZ + 1.4);
  const frame = new THREE.MeshStandardMaterial({ color: 0x3a4152, roughness: 0.5, metalness: 0.4 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fd4ff, transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false });
  lift.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, H, 1.6), glass), 0, H / 2, 0));
  for (const [x, z] of [[-0.6, -0.8], [0.6, -0.8], [-0.6, 0.8], [0.6, 0.8]]) lift.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.08, H, 0.08), frame), x, H / 2, z));
  for (const o of list) {
    // lampu nombor tingkat di depan lif, warna venture
    lift.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.04), new THREE.MeshBasicMaterial({ color: o.color })), 0, o.pos[1] - GROUND_Y + 2.2, 0.82));
  }
  const car = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 1.35), new THREE.MeshStandardMaterial({ color: 0xd8dde6, roughness: 0.4, metalness: 0.5 }));
  lift.add(car);
  const span = top;
  bobbers.push({ type: "lift", update: t => {
    const k = (Math.sin(t * 0.18) + 1) / 2;                      // naik turun perlahan
    car.position.y = -GROUND_Y + 0.95 + k * span;
  } });
  g.add(lift);
  // jalur cahaya ROI di dua penjuru belakang menara (dari tanah ke bumbung)
  const strip = new THREE.MeshBasicMaterial({ color: 0x8E9BFF });
  for (const sx of [-1, 1]) {
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, H, 0.12), new THREE.MeshStandardMaterial({ color: 0x2b3142, roughness: 0.5, metalness: 0.3 })), sx * (W2 + 0.06), GROUND_Y + H / 2, plan.backZ - 0.32));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.04, H, 0.04), strip), sx * (W2 + 0.13), GROUND_Y + H / 2, plan.backZ - 0.4));
  }
  // papan tanda syarikat induk atas bumbung
  const svg = building.logo && logoSvg(building.logo);
  if (svg) {
    const sign = signBoard(svg, null, "#8E9BFF", 2.0);
    sign.position.set(0, top + WALL_H + 0.12, plan.backZ - 0.2);
    g.add(sign);
  }
  return g;
}

// Tingkat paling atas: Pejabat CEO ROI Resources (Nadi, Virtual CEO).
function hub(o, bobbers, offices) {
  const grp = new THREE.Group();
  const plan = o.plan, W2 = plan.W / 2;
  const ventures = Object.values(offices).filter(v => v.kind === "office").sort((a, b) => a.floor - b.floor);
  const shell = new THREE.Group();
  shell.add(foundation(plan, o.color, -0.3, false));
  shell.add(officeFloor(plan, o.color, "ceo"));
  shell.add(officeWalls(plan, o.color, "ceo"));
  const suite = ceoSuite(plan, o.color, ventures);
  shell.add(suite.group);
  shell.add(facade(o, "ROI · CEO", liftZ(plan)));
  o.ceoSeat = suite.nadiSeat;
  grp.add(bakeStatic(shell));

  // hologram kecil berputar atas meja CEO (globe ROI)
  const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1),
    new THREE.MeshBasicMaterial({ color: o.color, wireframe: true, transparent: true, opacity: 0.85 }));
  globe.position.set(0.75, 1.02, -0.75); globe.userData.dynamic = true;
  grp.add(globe); bobbers.push({ m: globe, type: "spinY", speed: 0.8 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.01, 6, 32), new THREE.MeshBasicMaterial({ color: 0x9fd4ff, transparent: true, opacity: 0.6 }));
  ring.rotation.x = Math.PI / 2; ring.position.set(0.75, 0.82, -0.75); ring.userData.spin = 0.6;
  grp.add(ring); bobbers.push({ m: ring, type: "spin" });

  // antena + radar atas bumbung (penjuru belakang kiri)
  const mast = new THREE.Group(); mast.position.set(-(W2 - 0.6), WALL_H + 0.12, plan.backZ - 0.1);
  const metal = new THREE.MeshStandardMaterial({ color: 0x8a93a8, metalness: 0.6, roughness: 0.35 });
  mast.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.4, 8), metal), 0, 1.2, 0));
  const dish = new THREE.Group(); dish.position.y = 2.35; dish.scale.setScalar(0.6);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3), new THREE.MeshStandardMaterial({ color: 0xeef1f6, side: THREE.DoubleSide, roughness: 0.4 }));
  bowl.rotation.x = -Math.PI / 2 - 0.4; dish.add(bowl);
  dish.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: o.color })), 0, 0.25, 0.3));
  mast.add(dish); bobbers.push({ m: dish, type: "spinY", speed: 0.6 });
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff5a5a }));
  tip.position.y = 2.5; mast.add(tip);
  grp.add(mast);
  fasciaSign(grp, o, "#" + o.color.toString(16).padStart(6, "0"));
  return grp;
}

// Papan logo venture di depan lantai tingkat atasnya (macam papan nama setiap tingkat)
function fasciaSign(grp, o, accent) {
  if (o.kind === "hub" && !o.logo) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="150" viewBox="0 0 900 150"><text x="450" y="98" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="900" font-size="68" letter-spacing="6" fill="#ffffff">PEJABAT CEO <tspan fill="${accent}">· NADI</tspan></text></svg>`;
    const sign = signBoard(svg, null, accent, 0.62, "dinding");
    sign.position.set(0, WALL_H + 0.08, o.plan.shift + o.plan.D / 2 + 0.14);
    grp.add(sign); return;
  }
  const svg = o.logo && logoSvg(o.logo.fail);
  if (o.logo && !svg) console.error(`[markas.config.js] Logo "${o.logo.fail}" tiada dalam folder logos/.`);
  if (!svg) return;
  const sign = signBoard(svg, o.logo, accent, 0.62, "dinding");
  sign.position.set(0, WALL_H + 0.08, o.plan.shift + o.plan.D / 2 + 0.14);
  grp.add(sign);
}

function office(o, bobbers) {
  const grp = new THREE.Group();
  const accent = "#" + o.color.toString(16).padStart(6, "0");
  const plan = o.plan, theme = o.theme;
  const { anchors } = officeSpots(plan, theme);

  // perabot statik: dibina dalam satu kumpulan, kemudian digabung
  const furniture = new THREE.Group();
  const ground = o.floor === 0;
  furniture.add(foundation(plan, o.color, ground ? GROUND_Y : -0.3, ground));
  furniture.add(officeFloor(plan, o.color, theme));
  furniture.add(officeWalls(plan, o.color, theme));
  furniture.add(facade(o, o.short.toUpperCase(), liftZ(plan)));
  const gaya = GAYA[theme] || {};
  furniture.add(gaya.wall ? gaya.wall(plan, o.color, o.message) : wallDecor(plan, o.color, theme, theme !== "kedai" ? o.message : null));
  if (gaya.floorDecor) furniture.add(gaya.floorDecor(plan, o.color));
  if (theme !== "robotik") o.deskSpots.forEach(([x, z], i) => { const d = workstation(o.color, x < 0 ? -1 : 1, theme, i); d.position.set(x, 0, z); furniture.add(d); });
  furniture.add((gaya.counter || counterZone)(anchors.counter, o.color, theme));
  furniture.add((gaya.lounge || loungeZone)(anchors.lounge, o.color, theme));
  furniture.add((gaya.side || sideZone)(anchors.side, o.color, theme));
  furniture.add((gaya.sideR || sideRZone)(anchors.sideR, o.color, theme));
  const W2 = plan.W / 2;
  furniture.add(plant(-(W2 - 0.55), plan.lanes.back - 0.2, 1, 1));
  furniture.add(plant(W2 - 0.55, plan.lanes.back - 0.2, 1, 0));
  furniture.add(plant(-0.95, plan.lanes.front + 0.75, 0.7, 0));
  furniture.add(plant(0.95, plan.lanes.front + 0.75, 0.7, 0));
  if (theme === "kedai" && o.message && ground) {
    const sign = aFrameSign(o.message, o.color);
    sign.position.set(-1.7, GROUND_Y, plan.shift + plan.D / 2 + 0.9); sign.rotation.y = 0.25;
    furniture.add(sign);
  }
  grp.add(bakeStatic(furniture));
  if (theme === "robotik") {
    const lab = buildNuriLab();
    grp.add(lab.group);
    bobbers.push({ type: "nuri", update: lab.update });
  }

  fasciaSign(grp, o, accent);
  return grp;
}

