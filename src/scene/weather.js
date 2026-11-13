import * as THREE from "three";

// Cuaca sebenar Pasir Tumboh, Kelantan (Open-Meteo: percuma, tanpa API key).
// Hanya koordinat kedai dihantar; tiada data peribadi.
// Untuk uji: ?cuaca=cerah | mendung | hujan | ribut

const LAT = 6.03, LON = 102.31;
const URL_API = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=weather_code,cloud_cover,precipitation&timezone=Asia%2FKuala_Lumpur`;

const PRESETS = {
  cerah: { cloud: 0.15, rain: 0, storm: false, icon: "", text: "Cerah" },
  mendung: { cloud: 0.8, rain: 0, storm: false, icon: "☁️", text: "Mendung" },
  hujan: { cloud: 0.9, rain: 0.7, storm: false, icon: "🌧", text: "Hujan" },
  ribut: { cloud: 1, rain: 1, storm: true, icon: "⛈", text: "Ribut petir" },
};

function fromCode(code, cloudCover) {
  const cloud = Math.min(1, (cloudCover ?? 30) / 100);
  if (code >= 95) return { ...PRESETS.ribut };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { ...PRESETS.hujan, rain: code === 61 || code === 80 ? 0.45 : 0.8 };
  if (code >= 51 && code <= 57) return { ...PRESETS.hujan, rain: 0.25, text: "Gerimis" };
  if (code === 45 || code === 48) return { cloud: 0.85, rain: 0, storm: false, icon: "🌫", text: "Berkabus" };
  if (code === 3 || cloud > 0.75) return { ...PRESETS.mendung, cloud };
  return { ...PRESETS.cerah, cloud };
}

export function createWeather({ scene, center, size, onChange }) {
  let state = { ...PRESETS.cerah };

  // ---- awan: gumpalan bulat yang bergerak perlahan ----
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true, transparent: true, opacity: 0.92 });
  const clouds = [];
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group(); g.scale.setScalar(2.6);
    const n = 3 + (i % 3);
    for (let k = 0; k < n; k++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 + ((i + k) % 3) * 0.4, 1), cloudMat);
      puff.position.set(k * 1.5 - n * 0.7, ((k * 7) % 3) * 0.3, ((k * 5) % 3) * 0.6 - 0.6);
      puff.scale.y = 0.6; g.add(puff);
    }
    // awan di ufuk (cincin jauh di luar kompleks) supaya tak menghalang pandangan
    g.userData.angle = i / 10 * Math.PI * 2 + (i % 3) * 0.2;
    g.userData.radius = size / 2 + 48 + (i % 3) * 8;   // lebih jauh dari kamera: sentiasa di latar
    g.userData.speed = 0.012 + (i % 3) * 0.005;
    g.position.y = 9 + (i % 4) * 2.5;
    scene.add(g); clouds.push(g);
  }

  // ---- hujan: garisan pendek jatuh ----
  const DROPS = 700, area = size + 10;
  const pos = new Float32Array(DROPS * 6);
  const seed = new Float32Array(DROPS * 3);
  for (let i = 0; i < DROPS; i++) {
    seed[i * 3] = center.x + (Math.random() - 0.5) * area;
    seed[i * 3 + 1] = Math.random() * 16;
    seed[i * 3 + 2] = center.z + (Math.random() - 0.5) * area;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xaec8e8, transparent: true, opacity: 0.55 }));
  rain.frustumCulled = false; rain.visible = false;
  scene.add(rain);

  let flash = 0, nextFlash = 4;

  function set(s) {
    state = s;
    cloudMat.color.set(s.rain > 0 ? 0x8d95a3 : s.cloud > 0.7 ? 0xc9ced8 : 0xffffff);
    clouds.forEach((c, i) => { c.visible = i < 3 + Math.round(s.cloud * 7); });
    rain.visible = s.rain > 0;
    onChange(s);
  }

  async function fetchNow() {
    const q = new URLSearchParams(location.search).get("cuaca");
    if (q && PRESETS[q]) { set({ ...PRESETS[q] }); return; }
    try {
      const r = await fetch(URL_API);
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      set(fromCode(j.current.weather_code, j.current.cloud_cover));
    } catch {
      // tiada internet / servis tak dapat dihubungi: kekalkan cuaca semasa
      set(state);
    }
  }
  fetchNow();
  setInterval(fetchNow, 15 * 60 * 1000);

  function update(dt) {
    for (const c of clouds) {
      c.userData.angle += c.userData.speed * dt;
      c.position.x = center.x + Math.cos(c.userData.angle) * c.userData.radius;
      c.position.z = center.z + Math.sin(c.userData.angle) * c.userData.radius;
    }
    if (rain.visible) {
      const fall = 14 * dt, len = 0.45, count = Math.round(DROPS * state.rain);
      for (let i = 0; i < DROPS; i++) {
        let y = seed[i * 3 + 1] - fall;
        if (y < -0.3) y += 16;
        seed[i * 3 + 1] = y;
        const o = i * 6, show = i < count;
        pos[o] = pos[o + 3] = seed[i * 3] + 0.05;
        pos[o + 1] = show ? y + len : -50; pos[o + 4] = show ? y : -50;
        pos[o + 2] = seed[i * 3 + 2]; pos[o + 5] = seed[i * 3 + 2] + 0.05;
      }
      rainGeo.attributes.position.needsUpdate = true;
    }
    // kilat waktu ribut
    let lightning = 0;
    if (state.storm) {
      nextFlash -= dt;
      if (nextFlash <= 0) { flash = 0.35; nextFlash = 5 + Math.random() * 9; }
      if (flash > 0) { flash -= dt; lightning = flash > 0.25 || (flash > 0.1 && flash < 0.18) ? 1 : 0; }
    }
    return lightning;
  }

  return { update, get state() { return state; } };
}
