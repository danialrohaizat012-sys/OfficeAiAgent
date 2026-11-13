import * as THREE from "three";
import { LEGACY_LIGHT } from "./stage.js";

// Siang dan malam ikut waktu Malaysia sebenar (Asia/Kuala_Lumpur).
// Untuk uji, tambah ?jam=21 (atau 6.5, 13, 19...) pada URL.

// Titik kunci sepanjang hari: jam -> warna langit, kekuatan matahari, warna matahari, tahap malam
const KEYS = [
  { h: 0,    sky: 0x0F1B2D, sun: 0.18, sunC: 0x9fb4ff, night: 1 },
  { h: 5.6,  sky: 0x101c33, sun: 0.18, sunC: 0x9fb4ff, night: 1 },
  { h: 6.6,  sky: 0xc98a78, sun: 0.55, sunC: 0xffb98a, night: 0.45 },
  { h: 7.6,  sky: 0x86b6db, sun: 0.85, sunC: 0xfff1dc, night: 0 },
  { h: 17.6, sky: 0x86b6db, sun: 0.85, sunC: 0xfff1dc, night: 0 },
  { h: 18.9, sky: 0xd38461, sun: 0.6,  sunC: 0xffa86b, night: 0.35 },
  { h: 19.8, sky: 0x2f2a52, sun: 0.3,  sunC: 0xb7a6ff, night: 0.8 },
  { h: 20.6, sky: 0x0F1B2D, sun: 0.18, sunC: 0x9fb4ff, night: 1 },
  { h: 24,   sky: 0x0F1B2D, sun: 0.18, sunC: 0x9fb4ff, night: 1 },
];

export function malaysiaHour() {
  const q = new URLSearchParams(location.search).get("jam");
  if (q !== null && !isNaN(parseFloat(q))) return ((parseFloat(q) % 24) + 24) % 24;
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const h = +parts.find(p => p.type === "hour").value, m = +parts.find(p => p.type === "minute").value;
    return h + m / 60;
  } catch {
    const d = new Date(); return (d.getUTCHours() + 8 + d.getUTCMinutes() / 60) % 24;
  }
}

function sample(h) {
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].h <= h) i++;
  const a = KEYS[i], b = KEYS[i + 1], k = (h - a.h) / (b.h - a.h || 1);
  const c = new THREE.Color(a.sky).lerp(new THREE.Color(b.sky), k);
  const sc = new THREE.Color(a.sunC).lerp(new THREE.Color(b.sunC), k);
  return { sky: c, sun: a.sun + (b.sun - a.sun) * k, sunC: sc, night: a.night + (b.night - a.night) * k };
}

export function createDaylight({ scene, renderer, hemi, key, nightLights, center }) {
  const glowMats = [];
  scene.traverse(o => {
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) if (m.userData && m.userData.nightGlow && !glowMats.includes(m)) {
      m.userData.dayGlow = m.emissiveIntensity; glowMats.push(m);
    }
  });

  let hour = malaysiaHour(), state = null;

  function apply() {
    const s = sample(hour);
    state = s;
    renderer.setClearColor(s.sky);
    scene.fog.color.copy(s.sky);
    // matahari bergerak dari timur (pagi) ke barat (petang); waktu malam jadi cahaya bulan
    const dayK = THREE.MathUtils.clamp((hour - 6.5) / 12.5, 0, 1);
    const az = (dayK - 0.5) * 1.6;
    key.position.set(center.x + Math.sin(az) * 18, 22, center.z + 13);
    key.target.position.set(center.x, 0, center.z);
    key.intensity = s.sun * LEGACY_LIGHT;
    key.color.copy(s.sunC);
    hemi.intensity = (0.25 + 0.4 * (1 - s.night)) * LEGACY_LIGHT;
    hemi.color.set(s.night > 0.5 ? 0x8fa2d8 : 0xdfe8ff);
    for (const l of nightLights) l.intensity = s.night * 9;
    for (const m of glowMats) m.emissiveIntensity = m.userData.dayGlow + (m.userData.nightGlow - m.userData.dayGlow) * s.night;
  }

  apply();
  // kemas kini setiap minit
  setInterval(() => { hour = malaysiaHour(); apply(); }, 60000);

  return {
    get hour() { return hour; },
    get isNight() { return state.night > 0.5; },
    label() {
      const h = Math.floor(hour), m = Math.floor((hour - h) * 60);
      const icon = state.night > 0.6 ? "🌙" : state.night > 0.2 ? "🌇" : "☀️";
      return `${icon} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    },
  };
}
