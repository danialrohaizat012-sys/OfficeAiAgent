import * as THREE from "three";
import "./style.css";
import { loadConfig } from "./config.js";
import { createStage, enableShadows } from "./scene/stage.js";
import { buildWorld } from "./scene/world.js";
import { createCameraRig } from "./scene/camera.js";
import { createUI } from "./ui/ui.js";
import { initSample, startSample } from "./sim/sample.js";
import { createLife } from "./sim/life.js";
import { createDaylight } from "./scene/daylight.js";
import { createEnvelopes } from "./scene/effects.js";
import { createCustomers } from "./sim/customers.js";
import { createQuality } from "./scene/quality.js";

const { title, subtitle, offices: OFFICES, agents: AGENTS, view, errors } = loadConfig();
document.title = subtitle ? `${title}: ${subtitle}` : title;
document.querySelector("header h1").textContent = title;
document.querySelector("header p").textContent = subtitle + (errors.length ? " · ⚠ semak markas.config.js" : "");

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("stage");

let stage;
try {
  stage = createStage(canvas, reduce);
} catch (e) {
  document.getElementById("loading").textContent = "Paparan 3D gagal dimuat. Muat semula halaman.";
  throw e;
}
const { renderer, scene, camera, controls, hemi, key } = stage;

initSample(AGENTS);
const world = buildWorld(scene, OFFICES, AGENTS);
enableShadows(scene);
const rig = createCameraRig(camera, controls, OFFICES, view, reduce);

const ui = createUI({
  offices: OFFICES, agents: AGENTS, reduceMotion: reduce,
  onSelect: select,
  onFilter: f => rig.focus(f === "all" ? null : f),
  onClose: f => rig.focus(f === "all" ? null : f),
  onDecisionDone: a => { ui.toast(`✓ Keputusan untuk ${a.name} ditanda selesai`); },
});

// Siang/malam ikut waktu Malaysia + jam kecil di header
const daylight = createDaylight({ scene, renderer, hemi, key, nightLights: world.nightLights, center: { x: view.target[0], z: view.target[2] } });
const clockEl = document.getElementById("clock");
const showClock = () => { clockEl.textContent = daylight.label(); };
showClock(); setInterval(showClock, 30000);

// Kualiti grafik (auto tukar ke "laju" kalau telefon berat)
const quality = createQuality({ renderer, scene, key, button: document.getElementById("quality"), toast: ui.toast });

// Sampul report terbang ke Nadi + pelanggan masuk kedai
const envelopes = createEnvelopes(scene);
const customers = createCustomers(OFFICES, world.officeGroups, world.site);
const leader = AGENTS.find(a => a.home.standing);

function select(id, fromChip) {
  const a = AGENTS.find(x => x.id === id); if (!a) return;
  ui.openSheet(a, fromChip);
  const wp = new THREE.Vector3(); a.mesh.getWorldPosition(wp);
  rig.focus(a.office, wp);
}

// Tekan robot untuk buka detail (abaikan kalau jari sedang seret)
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
canvas.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; });
canvas.addEventListener("pointerup", e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(world.pickables, false)[0];
  if (hit) select(hit.object.userData.agent, true);
});

// Gelembung teks muncul seketika bila agent tukar tugas
const shown = new Set();
const showBubble = a => { shown.add(a); a.until = performance.now() + 4200; };
const wp = new THREE.Vector3(), wq = new THREE.Vector3();
startSample(AGENTS, ui, {
  onShow: showBubble,
  onReport: a => {
    if (!leader || reduce) return;
    a.mesh.getWorldPosition(wp); wp.y += 1.4;
    leader.mesh.getWorldPosition(wq); wq.y += 1.5;
    envelopes.spawn(wp, wq, "#" + OFFICES[a.office].color.toString(16).padStart(6, "0"), () => {
      leader.bubble.querySelector("span").textContent = `📨 Report dari ${a.name} diterima`;
      showBubble(leader);
    });
  },
  onDecision: a => {
    a.bubble.querySelector("span").textContent = "⚠ Perlu keputusan Danial";
    showBubble(a);
  },
});

// Pekerja bangun dan berjalan sekali-sekala (hiasan visual sahaja)


const life = createLife(OFFICES, AGENTS, {
  onErrand: (a, label) => { a.bubble.querySelector("span").textContent = label; showBubble(a); },
});

if (location.search.includes("debug")) window.__markas = { renderer, AGENTS, customers, daylight, quality };

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
addEventListener("resize", () => { resize(); if (!ui.selected && ui.filter === "all" && !rig.moving) camera.position.copy(rig.homePos()); });
resize(); rig.goHome();
document.getElementById("loading").remove();

const timer = new THREE.Timer(), v = new THREE.Vector3();
function loop() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05), t = timer.getElapsed();
  rig.update(dt);
  if (!reduce) {
    world.bobbers.forEach(b => { if (b.type === "bob") b.m.position.y = b.base + Math.sin(t * 1.1 + b.ph) * (b.amp ?? 0.18); else if (b.type === "spinY") b.m.rotation.y += b.speed * dt; else b.m.rotation.z += b.m.userData.spin * dt; });
    life.update(dt);
    envelopes.update(dt);
    customers.update(dt, t);
    AGENTS.forEach(a => a.mesh.userData.animate(t, { busy: a.busy, ph: a.ph, decision: !!a.decision, ...life.pose(a) }));
  } else {
    AGENTS.forEach(a => a.mesh.userData.animate(0, { busy: a.busy, decision: !!a.decision, ...life.pose(a) }));
  }
  controls.update();
  renderer.render(scene, camera);
  quality.tick(performance.now());

  const now = performance.now();
  AGENTS.forEach(a => {
    const vis = shown.has(a) && a.until > now && ui.visible(a) && !a.chip.hidden;
    if (vis) {
      a.mesh.getWorldPosition(v); v.y += 2.15; v.project(camera);
      if (v.z < 1) { a.bubble.style.left = (v.x * 0.5 + 0.5) * innerWidth + "px"; a.bubble.style.top = (-v.y * 0.5 + 0.5) * innerHeight + "px"; }
    }
    a.bubble.classList.toggle("show", vis && v.z < 1);
    if (!vis && a.until <= now) shown.delete(a);
  });
  requestAnimationFrame(loop);
}
loop();
