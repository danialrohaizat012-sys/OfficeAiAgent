import { person } from "../scene/person.js";
import { enableShadows } from "../scene/stage.js";
import { GROUND_Y } from "../scene/site.js";

// Pelanggan (watak tambahan) berjalan dari kaki lima, masuk ke kedai bertema
// "kedai" (Meney), ke kaunter, kemudian keluar. Mod Data contoh: hiasan sahaja.
// Nanti boleh dicetus oleh jualan sebenar dari POS.

const SHIRTS = ["#e0303a", "#3a6df0", "#f2c14e", "#ffffff", "#2fc1b0", "#ff8a4c", "#9b5de5"];
const HAIRS = ["pendek", "kemas", "panjang", "topi", "tudung"];
const HAIR_C = ["#2A1B12", "#5A3A22", "#1E1410", "#F4A6B8", "#9FD3F0", "#C9B6E8"];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rand = (a, b) => a + Math.random() * (b - a);
const SPEED = 1.0;

export function createCustomers(offices, officeGroups, site) {
  const shops = Object.entries(offices).filter(([, o]) => o.kind === "office" && o.theme === "kedai");
  const people = [];
  let timer = 4;

  function spawn() {
    if (!shops.length || people.length >= 2) return;
    const [key, o] = pick(shops);
    const plan = o.plan, W2 = plan.W / 2;
    const sideZ = site.roadZ - site.roadW / 2 - 0.5 - o.pos[2];   // kaki lima (koordinat pejabat)
    const doorZ = plan.shift + plan.D / 2 + 0.9;
    const startX = rand(1.5, 3.5) * (Math.random() < 0.5 ? -1 : 1);
    const counter = { x: W2 - 2.25, z: plan.lanes.front + 0.45 + people.length * 0.5 };
    const m = person({ shirt: pick(SHIRTS), pants: pick(["#2B3550", "#3d3d3d", "#5a4a3a"]), hairStyle: pick(HAIRS), hairColor: pick(HAIR_C), npc: true });
    m.position.set(startX, GROUND_Y, sideZ);
    officeGroups[key].add(m); enableShadows(m);
    const inPath = [{ x: 0, z: sideZ }, { x: 0, z: doorZ }, { x: 0, z: plan.lanes.front }, { x: counter.x, z: plan.lanes.front }, counter];
    const outPath = [{ x: counter.x, z: plan.lanes.front }, { x: 0, z: plan.lanes.front }, { x: 0, z: doorZ }, { x: 0, z: sideZ }, { x: -startX, z: sideZ }];
    const front = plan.shift + plan.D / 2;
    people.push({ m, key, front, path: inPath, out: outPath, mode: "in", walk: 0, face: 0, wait: rand(5, 9), ph: Math.random() * 6 });
  }

  function update(dt, t) {
    timer -= dt;
    if (timer <= 0) { spawn(); timer = rand(14, 30); }
    for (let i = people.length - 1; i >= 0; i--) {
      const c = people[i], m = c.m;
      if (c.mode === "wait") {
        c.wait -= dt; c.face = Math.PI / 2;
        if (c.wait <= 0) { c.mode = "out"; c.path = c.out; }
      } else {
        const p = c.path[0];
        const dx = p.x - m.position.x, dz = p.z - m.position.z, d = Math.hypot(dx, dz), step = SPEED * dt;
        if (d <= step) {
          m.position.x = p.x; m.position.z = p.z; c.path.shift();
          if (!c.path.length) {
            if (c.mode === "in") c.mode = "wait";
            else { m.parent.remove(m); people.splice(i, 1); continue; }
          }
        } else {
          m.position.x += dx / d * step; m.position.z += dz / d * step;
          c.face = Math.atan2(dx, dz);
        }
        c.walk += dt * 9;
      }
      let diff = c.face - m.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      m.rotation.y += diff * Math.min(1, dt * 8);
      // naik tangga: di luar bangunan kaki atas tanah, di dalam atas lantai
      const k = Math.min(1, Math.max(0, (c.front + 0.45 - m.position.z) / 0.45));
      m.position.y = GROUND_Y * (1 - k);
      m.userData.animate(t, { ph: c.ph, walk: c.mode === "wait" ? null : c.walk });
    }
  }

  return { update, get count() { return people.length; } };
}
