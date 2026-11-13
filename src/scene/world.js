import * as THREE from "three";
import { octagonShape, roundedShape, platform, desk, robot, logoSprite } from "./parts.js";
import binalabLogoDark from "../../logos/binalab-logo-dark.svg?raw";

const LOGOS = { binalab: binalabLogoDark };

// Kedudukan meja dalam pejabat (Peringkat 2 akan jana ikut bilangan agent).
const DESK_SPOTS = [[-1.8, -1.2], [1.8, -1.2], [-1.8, 1.4], [1.8, 1.4]];

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
    const r = robot(a.color);
    if (offices[a.office].kind === "hub") {
      r.position.set(0, 0, 0.6);
    } else {
      const [x, z] = DESK_SPOTS[used[a.office] = (used[a.office] ?? -1) + 1];
      r.position.set(x, 0, z + 0.75);
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
  const console_ = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.7), new THREE.MeshStandardMaterial({ color: 0x2a3149, emissive: 0x3b44a0, emissiveIntensity: 0.35 }));
  console_.position.set(0, 0.25, 1.6); grp.add(console_);
  return grp;
}

function office(o, bobbers) {
  const grp = new THREE.Group();
  const accent = "#" + o.color.toString(16).padStart(6, "0");
  grp.add(platform(roundedShape(7.6, 6.2, 1.1), o.color));
  DESK_SPOTS.forEach(([x, z]) => { const d = desk(o.color); d.position.set(x, 0, z); grp.add(d); });
  if (o.logo && LOGOS[o.logo]) {
    const sp = logoSprite(LOGOS[o.logo], 1024, 1240, accent, 4.4);
    sp.position.set(0, 5.4, -2.6); grp.add(sp);
    bobbers.push({ m: sp, type: "bob", base: 5.4, ph: 0 });
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8), new THREE.MeshBasicMaterial({ color: o.color, transparent: true, opacity: 0.5 }));
  pole.position.set(0, 1.6, -2.6); grp.add(pole);
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
