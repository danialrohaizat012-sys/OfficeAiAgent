import * as THREE from "three";
import "./style.css";
import { loadConfig } from "./config.js";
import { createStage, enableShadows } from "./scene/stage.js";
import { buildWorld } from "./scene/world.js";
import { createCameraRig } from "./scene/camera.js";
import { createUI } from "./ui/ui.js";
import { initSample, startSample } from "./sim/sample.js";
import { createLife } from "./sim/life.js";
import { createMeetings } from "./sim/meeting.js";
import { nowText } from "./ui/ui.js";
import { createDaylight } from "./scene/daylight.js";
import { createEnvelopes } from "./scene/effects.js";
import { createCustomers } from "./sim/customers.js";
import { createQuality } from "./scene/quality.js";
import { createWeather } from "./scene/weather.js";
import { savedMode, saveMode, savedCode, saveCode, fetchStatus, fetchLog, startPolling, markDecisionDone, runNadi } from "./live/live.js";
import { log as sampleLog } from "./sim/sample.js";

const { title, subtitle, offices: OFFICES, agents: AGENTS, view, errors, building, shift: SHIFT, meeting: MEETING } = loadConfig();
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
const world = buildWorld(scene, OFFICES, AGENTS, building);
enableShadows(scene);
const rig = createCameraRig(camera, controls, OFFICES, view, reduce);

const ui = createUI({
  offices: OFFICES, agents: AGENTS, reduceMotion: reduce,
  onSelect: select,
  onFilter: f => rig.focus(f === "all" ? null : f),
  onClose: f => rig.focus(f === "all" ? null : f),
  onDecisionDone: async (a, was) => {
    if (danialP) { danialP.say("✅ Keputusan dibuat. Teruskan!"); }
    if (mode !== "hidup") { sampleLog(a, { selesai: was || "keputusan" }); ui.refresh(a); ui.toast(`✓ Keputusan untuk ${a.name} ditanda selesai`); return; }
    try { await markDecisionDone(savedCode(), a.id); ui.toast(`✓ Keputusan untuk ${a.name} disimpan sebagai selesai`); loadLog(a, false); }
    catch (e) { ui.toast("⚠ Tak dapat simpan: " + e.message); }
  },
});

// Siang/malam ikut waktu Malaysia + jam kecil di header
const homeDist = rig.homePos().distanceTo(new THREE.Vector3(...view.target));
const daylight = createDaylight({ scene, renderer, hemi, key, nightLights: world.nightLights, center: { x: view.target[0], z: view.target[2] },
  fogScale: Math.max(1, homeDist / 40) });
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
const leader = AGENTS.find(a => a.home.leader);

function select(id, fromChip) {
  const a = AGENTS.find(x => x.id === id); if (!a) return;
  ui.openSheet(a, fromChip);
  if (a.live !== undefined) loadLog(a, true);
  const wp = new THREE.Vector3(); a.mesh.getWorldPosition(wp);
  rig.focus(a.at || a.office, wp);
}

// Tekan robot untuk buka detail (abaikan kalau jari sedang seret)
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
canvas.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; });
canvas.addEventListener("pointerup", e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(world.pickables, false)[0];
  if (hit && hit.object.userData.danial) { danialP.say("👋 Danial Rohaizat · CEO ROI Resources"); ui.toast("Danial Rohaizat · CEO ROI Resources (taman bumbung)"); return; }
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
// Report: sampul terbang dari meja agent ke lif, lif bawa naik ke tingkat CEO, kemudian terbang ke Nadi
const lift = world.lift;
function flyReport(a) {
  if (!leader || a === leader) return;
  const received = () => { leader.bubble.querySelector("span").textContent = `📨 Report dari ${a.name} diterima`; showBubble(leader); };
  if (reduce) { received(); return; }
  if (lift.load >= 3) {   // lif sibuk: sampul terus terbang ke Nadi
    a.mesh.getWorldPosition(wp); wp.y += 1.4; leader.mesh.getWorldPosition(wq); wq.y += 1.5;
    envelopes.spawn(wp, wq, officeHex(a), received); return;
  }
  const floor = OFFICES[a.office].floor, top = OFFICES[leader.office].floor, color = officeHex(a);
  lift.go(floor, () => {
    const from = new THREE.Vector3(); a.mesh.getWorldPosition(from); from.y += 1.4;
    envelopes.spawn(from, lift.door(floor), color, () => {
      lift.carry(color);
      lift.go(top, () => {
        lift.carry(null);
        const to = new THREE.Vector3(); leader.mesh.getWorldPosition(to); to.y += 1.5;
        envelopes.spawn(lift.door(top), to, color, received);
      });
    }, 0.4);
  }, 1.4);
}
const sampleHooks = {
  onShow: showBubble,
  onReport: flyReport,
  onDecision: a => { a.bubble.querySelector("span").textContent = "⚠ Perlu keputusan Danial"; showBubble(a); decisionMeeting(a); },
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
    if (s && s.keputusan && (!prev || prev.keputusan !== s.keputusan)) { a.bubble.querySelector("span").textContent = "⚠ Perlu keputusan Danial"; showBubble(a); decisionMeeting(a); }
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
  onErrand: (a, label) => { ui.refresh(a); a.bubble.querySelector("span").textContent = label; showBubble(a); },
  hour: () => daylight.hour, shift: SHIFT, lift: world.lift, groups: world.officeGroups,
});

// ===== Danial Rohaizat (CEO ROI Resources) di taman bumbung =====
// Bukan agent: tiada status atau roster, cuma figura + tanda nama + gelembung.
const danialP = world.danial ? (() => {
  const bubbles = document.getElementById("bubbles");
  const bubble = document.createElement("div"); bubble.className = "bubble"; bubble.innerHTML = "<b>Danial</b><span></span>"; bubbles.appendChild(bubble);
  const tag = document.createElement("div"); tag.className = "tag"; tag.innerHTML = '<i style="background:#B58A4A"></i><span>👑 Danial · CEO</span>'; bubbles.appendChild(tag);
  return { ...world.danial, bubble, tag, until: 0, say(text) { bubble.querySelector("span").textContent = text; this.until = performance.now() + 4200; } };
})() : null;

// ===== Mesyuarat ketua venture dengan Nadi di Pejabat CEO =====
const say = (a, text) => { if (a === danialP) { a.say(text); return; } a.bubble.querySelector("span").textContent = text; showBubble(a); };
const meetings = createMeetings({
  offices: OFFICES, agents: AGENTS, life, lift: world.lift, danial: danialP, say, toast: ui.toast, reduce,
  current: a => nowText(a),
  onLog: (a, text) => { if (a.live === undefined) { sampleLog(a, { sedang: "🗓️ " + text }); ui.refresh(a); } },
});
// perkara perlu keputusan: Nadi panggil ketua venture itu untuk sediakan cadangan kepada Danial
// selepas mesyuarat, Nadi naik ke bumbung bawa cadangan kepada Danial
function decisionMeeting(a) {
  const text = a.decision;
  if (a.home.leader) { meetings.escalate(text); return; }
  if (!meetings.call([a.office], `Sediakan cadangan untuk Danial: ${text}`, () => meetings.escalate(`${OFFICES[a.office].short}: ${text}`))) meetings.escalate(`${OFFICES[a.office].short}: ${text}`);
}
// mesyuarat pagi harian (sekali sehari, ikut waktu Malaysia)
let dailyDone = null;
function checkDaily() {
  const h = daylight.hour, today = new Date().toDateString();
  if (dailyDone !== today && h >= MEETING.harian && h < MEETING.harian + 1.5 && meetings.call([], "Mesyuarat pagi: semak sasaran & agih kerja hari ini")) dailyDone = today;
}
setInterval(checkDaily, 30000); setTimeout(checkDaily, 9000);
// mod Data contoh: sekali-sekala Nadi panggil 2–3 ketua untuk semakan
const SAMPLE_REASONS = ["Semakan prestasi minggu ini", "Selaras promosi bersama antara venture", "Semak bajet & keutamaan bulan ini", "Kongsi pelanggan & peluang kerjasama"];
setInterval(() => {
  if (mode !== "contoh" || meetings.active || meetings.idleFor < 150 || Math.random() > 0.4) return;
  const keys = Object.keys(OFFICES).filter(k => OFFICES[k].kind === "office").sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
  meetings.call(keys, SAMPLE_REASONS[Math.floor(Math.random() * SAMPLE_REASONS.length)]);
}, 45000);
document.getElementById("sMeet").onclick = () => {
  const a = ui.selected; if (!a) return;
  const ok = a.home.leader ? meetings.call([], "Mesyuarat dipanggil oleh Danial: kemas kini semua venture")
    : meetings.call([a.office], `Danial minta kemas kini ${OFFICES[a.office].short}`);
  if (!ok) ui.toast("Ketua belum masuk kerja atau sedang balik. Cuba lagi waktu pejabat.");
  if (ok) { ui.closeSheet(); ui.setFilter(Object.keys(OFFICES).find(k => OFFICES[k].kind === "hub")); }
};

setMode(savedMode() === "hidup" && savedCode() ? "hidup" : "contoh");

if (location.search.includes("debug")) window.__markas = { renderer, AGENTS, customers, daylight, quality, weather, camera, controls, lift: world.lift, meetings };

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
addEventListener("resize", () => { resize(); if (!ui.selected && ui.filter === "all" && !rig.moving) camera.position.copy(rig.homePos()); });
resize(); rig.goHome(); rig.intro();
document.getElementById("loading").remove();

// Tingkat di luar pandangan kamera tidak dilukis (termasuk bayang-bayang), tetapi tingkat
// jiran kekal supaya bayang-bayang antara tingkat betul. Lampu dipindah ke scene supaya
// bilangan lampu tetap (elak shader dibina semula).
world.nightLights.forEach(l => scene.attach(l));
const floorBoxes = Object.entries(world.officeGroups).map(([k, g]) => ({ g, floor: OFFICES[k].floor, box: new THREE.Box3().setFromObject(g).expandByScalar(0.5) }));
const frustum = new THREE.Frustum(), projView = new THREE.Matrix4();
let cullTick = 0;
function cullFloors() {
  projView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(projView);
  const seen = new Set(floorBoxes.filter(f => frustum.intersectsBox(f.box)).map(f => f.floor));
  for (const f of floorBoxes) f.g.visible = seen.has(f.floor) || seen.has(f.floor - 1) || seen.has(f.floor + 1);
}

const timer = new THREE.Timer(), v = new THREE.Vector3();
function loop() {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05), t = timer.getElapsed();
  rig.update(dt);
  if (!reduce) {
    world.bobbers.forEach(b => { if (b.type === "nuri") b.update(t); else if (b.type === "liftCtl") b.ctl.update(dt); else if (b.type === "bob") b.m.position.y = b.base + Math.sin(t * 1.1 + b.ph) * (b.amp ?? 0.18); else if (b.type === "spinY") b.m.rotation.y += b.speed * dt; else b.m.rotation.z += b.m.userData.spin * dt; });
    life.update(dt);
    envelopes.update(dt);
    daylight.flash(weather.update(dt, daylight.night));
    for (const c of world.site.cars) {
      c.m.position.x += c.dir * c.speed * dt;
      if (c.m.position.x > c.maxX) c.m.position.x = c.minX; else if (c.m.position.x < c.minX) c.m.position.x = c.maxX;
    }
    customers.update(dt, t);
    AGENTS.forEach(a => a.mesh.userData.animate(t, { busy: a.busy, ph: a.ph, decision: !!a.decision, ...life.pose(a) }));
    if (danialP) danialP.mesh.userData.animate(t, { ph: danialP.ph, sit: 1, seatY: 0.48, typing: !meetings.danialTalking, look: meetings.danialTalking ? -0.9 : 0 });
  } else {
    if (danialP) danialP.mesh.userData.animate(0, { sit: 1, seatY: 0.48 });
    AGENTS.forEach(a => a.mesh.userData.animate(0, { busy: a.busy, decision: !!a.decision, ...life.pose(a) }));
  }
  meetings.update(dt);
  controls.update();
  if (++cullTick % 6 === 0) { camera.updateMatrixWorld(); cullFloors(); }
  renderer.render(scene, camera);
  quality.tick(performance.now());

  const now = performance.now();
  AGENTS.forEach(a => {
    const vis0 = ui.visible(a);
    if (a.chip.hidden === vis0) a.chip.hidden = !vis0;          // ketua dalam mesyuarat muncul di tab ROI HQ
    const inView = vis0 && a.mesh.visible;
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
  if (danialP) {
    const d = danialP, show = d.mesh.parent.visible && (ui.filter === "all" || OFFICES[ui.filter].kind === "hub");
    d.mesh.getWorldPosition(v); v.y += 1.6; v.project(camera);
    const on = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
    const sx = (v.x * 0.5 + 0.5) * innerWidth, sy = (-v.y * 0.5 + 0.5) * innerHeight;
    if (on) { d.tag.style.left = d.bubble.style.left = sx + "px"; d.tag.style.top = sy + "px"; d.bubble.style.top = (sy - 20) + "px"; }
    d.tag.classList.toggle("show", show && on && !ui.selected);
    d.bubble.classList.toggle("show", show && on && d.until > now);
  }
  requestAnimationFrame(loop);
}
loop();
