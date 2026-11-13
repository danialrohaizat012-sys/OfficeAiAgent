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
import { createWeather } from "./scene/weather.js";
import { savedMode, saveMode, savedCode, saveCode, fetchStatus, fetchLog, startPolling, markDecisionDone, runNadi } from "./live/live.js";
import { log as sampleLog } from "./sim/sample.js";

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
  onDecisionDone: async (a, was) => {
    if (mode !== "hidup") { sampleLog(a, { selesai: was || "keputusan" }); ui.refresh(a); ui.toast(`✓ Keputusan untuk ${a.name} ditanda selesai`); return; }
    try { await markDecisionDone(savedCode(), a.id); ui.toast(`✓ Keputusan untuk ${a.name} disimpan sebagai selesai`); loadLog(a, false); }
    catch (e) { ui.toast("⚠ Tak dapat simpan: " + e.message); }
  },
});

// Siang/malam ikut waktu Malaysia + jam kecil di header
const daylight = createDaylight({ scene, renderer, hemi, key, nightLights: world.nightLights, center: { x: view.target[0], z: view.target[2] } });
const clockEl = document.getElementById("clock");
const showClock = () => { clockEl.textContent = daylight.label(); };
showClock(); setInterval(showClock, 30000);

// Cuaca sebenar Pasir Tumboh (awan, hujan, kilat)
const weather = createWeather({
  scene, center: world.site.center, size: world.site.size,
  onChange: w => { daylight.setWeather(w); showClock(); clockEl.title = `Waktu Malaysia · ${w.text}`; },
});

// Kualiti grafik (auto tukar ke "laju" kalau telefon berat)
const quality = createQuality({ renderer, scene, key, button: document.getElementById("quality"), toast: ui.toast });

// Sampul report terbang ke Nadi + pelanggan masuk kedai
const envelopes = createEnvelopes(scene);
const customers = createCustomers(OFFICES, world.officeGroups, world.site);
const leader = AGENTS.find(a => a.home.standing);

function select(id, fromChip) {
  const a = AGENTS.find(x => x.id === id); if (!a) return;
  ui.openSheet(a, fromChip);
  if (a.live !== undefined) loadLog(a, true);
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
  if (hit) { select(hit.object.userData.agent, true); return; }
  // tekan bangunan / papan tanda: zum ke pejabat itu
  const b = ray.intersectObjects(Object.values(world.officeGroups), true)[0];
  if (b) {
    let o = b.object; while (o && !o.userData.officeKey) o = o.parent;
    if (o && ui.filter !== o.userData.officeKey) ui.setFilter(o.userData.officeKey);
  }
});

// Gelembung teks muncul seketika bila agent tukar tugas
const shown = new Set();
const showBubble = a => { shown.add(a); a.until = performance.now() + 4200; };
const wp = new THREE.Vector3(), wq = new THREE.Vector3();
const officeHex = a => "#" + OFFICES[a.office].color.toString(16).padStart(6, "0");
function flyReport(a) {
  if (!leader || reduce || a === leader) return;
  a.mesh.getWorldPosition(wp); wp.y += 1.4;
  leader.mesh.getWorldPosition(wq); wq.y += 1.5;
  envelopes.spawn(wp, wq, officeHex(a), () => {
    leader.bubble.querySelector("span").textContent = `📨 Report dari ${a.name} diterima`;
    showBubble(leader);
  });
}
const sampleHooks = {
  onShow: showBubble,
  onReport: flyReport,
  onDecision: a => { a.bubble.querySelector("span").textContent = "⚠ Perlu keputusan Danial"; showBubble(a); },
};

// ===== Suis mod: "Data contoh" (simulasi) atau "Hidup" (status sebenar dari server) =====
const modeBtn = document.getElementById("mode");
let mode = "contoh", stopSample = null, stopPoll = null;

function applyLive(data) {
  for (const a of AGENTS) {
    const s = data.agents[a.id] || null, prev = a.live;
    a.live = s;
    a.busy = s ? !!s.sibuk : false;
    a.decision = s ? s.keputusan : null;
    ui.refresh(a);
    if (prev === undefined) continue;                     // muatan pertama: jangan cetus kesan
    if (s && (!prev || prev.dikemaskini !== s.dikemaskini)) { showBubble(a); if (ui.selected === a) loadLog(a, false); }
    if (s && s.reportPada && (!prev || prev.reportPada !== s.reportPada)) flyReport(a);
    if (s && s.keputusan && (!prev || prev.keputusan !== s.keputusan)) { a.bubble.querySelector("span").textContent = "⚠ Perlu keputusan Danial"; showBubble(a); }
  }
  const n = Object.keys(data.agents).length;
  modeBtn.title = `Mod Hidup · ${n}/${AGENTS.length} agent pernah hantar status`;
}

function setMode(m) {
  if (stopSample) { stopSample(); stopSample = null; }
  if (stopPoll) { stopPoll(); stopPoll = null; }
  mode = m; saveMode(m);
  modeBtn.classList.toggle("live", m === "hidup");
  modeBtn.textContent = m === "hidup" ? "Hidup" : "Data contoh";
  if (m === "hidup") {
    AGENTS.forEach(a => { a.live = undefined; });
    stopPoll = startPolling(savedCode(), {
      onData: applyLive,
      onError: e => {
        if (e.auth) { saveCode(null); ui.toast("⚠ Kod akses tak sah lagi. Masukkan semula."); setMode("contoh"); askCode(); }
        else ui.toast("⚠ Tak dapat hubungi server. Cuba lagi sebentar.");
      },
    });
  } else {
    AGENTS.forEach(a => { delete a.live; });
    initSample(AGENTS);
    AGENTS.forEach(a => ui.refresh(a));
    stopSample = startSample(AGENTS, ui, sampleHooks);
  }
  customers.enabled = m !== "hidup";   // pelanggan contoh hanya dalam mod contoh (nanti: ikut jualan POS)
}

// Log aktiviti dari server (mod Hidup)
async function loadLog(a, showLoading) {
  if (showLoading) ui.showLog(a, null, true);
  try { ui.showLog(a, await fetchLog(savedCode(), a.id)); }
  catch (e) { ui.showLog(a, []); if (!e.auth) ui.toast("⚠ Tak dapat muat aktiviti: " + e.message); }
}

// Butang "Rumus laporan sekarang" dalam panel Nadi (mod Hidup)
const actionBtn = document.getElementById("sAction");
actionBtn.onclick = async () => {
  const a = ui.selected; if (!a) return;
  actionBtn.disabled = true; actionBtn.textContent = "Nadi sedang merumus…";
  try {
    await runNadi(savedCode());
    ui.toast("✓ Laporan harian Nadi dikemas kini");
    document.dispatchEvent(new Event("visibilitychange"));   // baca status baru segera
    loadLog(a, false);
  } catch (e) { ui.toast("⚠ Tak dapat rumus: " + e.message); }
  finally { actionBtn.disabled = false; actionBtn.textContent = "↻ Rumus laporan sekarang"; }
};

// Skrin kod akses
const modal = document.getElementById("codeModal"), codeInput = document.getElementById("codeInput"), codeErr = document.getElementById("codeErr");
function askCode() { modal.hidden = false; codeErr.hidden = true; codeInput.value = ""; setTimeout(() => codeInput.focus(), 50); }
document.getElementById("codeCancel").onclick = () => { modal.hidden = true; };
document.getElementById("codeForm").onsubmit = async e => {
  e.preventDefault();
  const code = codeInput.value.trim(); if (!code) return;
  const ok = document.getElementById("codeOk"); ok.disabled = true; ok.textContent = "Menyemak…";
  try {
    await fetchStatus(code);
    saveCode(code); modal.hidden = true; setMode("hidup");
    ui.toast("● Mod Hidup: status sebenar dari agent");
  } catch (err) {
    codeErr.hidden = false;
    codeErr.textContent = err.auth ? "Kod akses salah. Semak MARKAS_VIEW_CODE di Vercel." : "Tak dapat hubungi server: " + err.message;
  } finally { ok.disabled = false; ok.textContent = "Masuk"; }
};
modeBtn.onclick = () => {
  if (mode === "hidup") { setMode("contoh"); ui.toast("Mod Data contoh: status simulasi"); }
  else if (savedCode()) { setMode("hidup"); ui.toast("● Mod Hidup: status sebenar dari agent"); }
  else askCode();
};

// Pekerja bangun dan berjalan sekali-sekala (hiasan visual sahaja)


const life = createLife(OFFICES, AGENTS, {
  onErrand: (a, label) => { a.bubble.querySelector("span").textContent = label; showBubble(a); },
});

setMode(savedMode() === "hidup" && savedCode() ? "hidup" : "contoh");

if (location.search.includes("debug")) window.__markas = { renderer, AGENTS, customers, daylight, quality, weather };

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
addEventListener("resize", () => { resize(); if (!ui.selected && ui.filter === "all" && !rig.moving) camera.position.copy(rig.homePos()); });
resize(); rig.goHome(); rig.intro();
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
    daylight.flash(weather.update(dt, daylight.night));
    for (const c of world.site.cars) {
      c.m.position.x += c.dir * c.speed * dt;
      if (c.m.position.x > c.maxX) c.m.position.x = c.minX; else if (c.m.position.x < c.minX) c.m.position.x = c.maxX;
    }
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
    const inView = ui.visible(a) && !a.chip.hidden;
    a.mesh.getWorldPosition(v); v.y += 2.05; v.project(camera);
    const onScreen = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
    const sx = (v.x * 0.5 + 0.5) * innerWidth, sy = (-v.y * 0.5 + 0.5) * innerHeight;
    // tanda nama
    a.tag.classList.toggle("show", inView && onScreen && !ui.selected);
    if (onScreen) { a.tag.style.left = sx + "px"; a.tag.style.top = sy + "px"; }
    // gelembung (di atas tanda nama)
    const vis = shown.has(a) && a.until > now && inView;
    if (onScreen) { a.bubble.style.left = sx + "px"; a.bubble.style.top = (sy - 20) + "px"; }
    a.bubble.classList.toggle("show", vis && onScreen);
    if (!vis && a.until <= now) shown.delete(a);
  });
  requestAnimationFrame(loop);
}
loop();
