import * as THREE from "three";
import "./style.css";
import { loadConfig } from "./config.js";
import { createStage } from "./scene/stage.js";
import { buildWorld } from "./scene/world.js";
import { createCameraRig } from "./scene/camera.js";
import { createUI } from "./ui/ui.js";
import { initSample, startSample } from "./sim/sample.js";

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
const { renderer, scene, camera, controls } = stage;

initSample(AGENTS);
const world = buildWorld(scene, OFFICES, AGENTS);
const rig = createCameraRig(camera, controls, OFFICES, view, reduce);

const ui = createUI({
  offices: OFFICES, agents: AGENTS, reduceMotion: reduce,
  onSelect: select,
  onFilter: f => rig.focus(f === "all" ? null : f),
  onClose: f => rig.focus(f === "all" ? null : f),
});

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
startSample(AGENTS, ui, a => { shown.add(a); a.until = performance.now() + 4200; });

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
addEventListener("resize", () => { resize(); if (!ui.selected && ui.filter === "all" && !rig.moving) camera.position.copy(rig.homePos()); });
resize(); rig.goHome();
document.getElementById("loading").remove();

const clock = new THREE.Clock(), v = new THREE.Vector3();
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  rig.update(dt);
  if (!reduce) {
    world.bobbers.forEach(b => { if (b.type === "bob") b.m.position.y = b.base + Math.sin(t * 1.1 + b.ph) * 0.18; else b.m.rotation.z += b.m.userData.spin * dt; });
    AGENTS.forEach(a => {
      a.mesh.position.y = Math.abs(Math.sin(t * 2 + a.ph)) * (a.busy ? 0.06 : 0.02);
      a.mesh.userData.tip.material.color.set(a.busy && Math.sin(t * 6 + a.ph) > 0 ? "#ffffff" : a.color);
    });
    world.bridges.forEach(br => br.dots.forEach((d, i) => { const k = (t * 0.12 + i / br.dots.length) % 1; d.position.lerpVectors(br.A, br.B, k); d.position.y = 0.06; }));
  } else {
    world.bridges.forEach(br => br.dots.forEach((d, i) => { d.position.lerpVectors(br.A, br.B, (i + 0.5) / br.dots.length); d.position.y = 0.06; }));
  }
  controls.update();
  renderer.render(scene, camera);

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
