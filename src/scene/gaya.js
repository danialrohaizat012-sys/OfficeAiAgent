import * as THREE from "three";
import { std, basic, mesh, grp, box, cyl, M, nightGlow, hexStr, openShelf, chair, boardTexture, plant } from "./decor.js";

// Susun atur khas setiap venture (tema dalam markas.config.js):
//   perisian = BinaLab (studio perisian)   media   = Eh Nakama (studio cerita anime/manga)
//   pasaran  = GilaPips (edukasi pasaran)   seni    = LAKAR (studio mural)
// Setiap tema boleh ganti zon: counter (depan kanan), lounge (depan kiri),
// side (tengah kiri), sideR (tengah kanan) dan wall (dinding belakang).
// Zon yang tidak diganti guna rupa "studio" asal dalam decor.js.

const PI = Math.PI;

// ---------- tekstur kanvas (dicache supaya tidak dibina berulang) ----------
const texCache = new Map();
function tex(key, w, h, draw) {
  if (!texCache.has(key)) {
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    draw(cv.getContext("2d"), w, h);
    texCache.set(key, new THREE.CanvasTexture(cv));
  }
  return texCache.get(key);
}
const pic = (t, opts = {}) => new THREE.MeshBasicMaterial({ map: t, ...opts });
let seed = 11;
const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

function appScreen(hex, i) {
  return tex("app" + hex + i, 96, 192, (c, w, h) => {
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, h);
    c.fillStyle = hex; c.fillRect(0, 0, w, 34);
    c.fillStyle = "#ffffff"; c.fillRect(10, 13, 40, 8);
    seed = 3 + i * 7;
    for (let r = 0; r < 5; r++) {
      c.fillStyle = r % 2 ? "#eef1f6" : "#f6f7f9"; c.fillRect(8, 44 + r * 28, 80, 22);
      c.fillStyle = hex; c.globalAlpha = 0.6; c.fillRect(12, 50 + r * 28, 10, 10); c.globalAlpha = 1;
      c.fillStyle = "#9aa3b5"; c.fillRect(28, 52 + r * 28, 30 + rnd() * 26, 5);
    }
    c.fillStyle = hex; c.fillRect(20, 170, 56, 14);
  });
}

function kanbanTex(hex) {
  return tex("kanban" + hex, 384, 240, (c, w, h) => {
    c.fillStyle = "#fbfbf8"; c.fillRect(0, 0, w, h);
    const cols = ["PROSPEK", "DEMO", "QUOTE", "SIAP"];
    seed = 5;
    cols.forEach((t, i) => {
      const x = 8 + i * 94;
      c.fillStyle = "#22304a"; c.font = "800 17px sans-serif"; c.fillText(t, x + 4, 24);
      c.fillStyle = "#dfe3ea"; c.fillRect(x + 90, 8, 2, h - 16);
      const n = 4 - (i === 3 ? 1 : 0) - (i === 1 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        c.fillStyle = ["#f2c14e", "#ff9fb2", "#8fd3ff", "#b6ebc5"][(i + k) % 4];
        c.fillRect(x + 4 + (k % 2) * 6, 36 + k * 48, 74, 40);
        c.fillStyle = "rgba(34,48,74,.55)"; c.fillRect(x + 12 + (k % 2) * 6, 48 + k * 48, 40 + rnd() * 18, 5); c.fillRect(x + 12 + (k % 2) * 6, 58 + k * 48, 30, 5);
      }
    });
    c.fillStyle = hex; c.fillRect(0, h - 8, w, 8);
  });
}

function chartTex(hex, k) {
  return tex("chart" + hex + k, 256, 150, (c, w, h) => {
    c.fillStyle = "#0e1422"; c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(255,255,255,.07)"; c.lineWidth = 1;
    for (let y = 20; y < h; y += 26) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    seed = 17 + k * 13;
    let p = 80;
    for (let i = 0; i < 24; i++) {
      const o = p, cl = Math.max(25, Math.min(125, p + (rnd() - 0.45) * 18)), hi = Math.min(o, cl) - rnd() * 8, lo = Math.max(o, cl) + rnd() * 8;
      const up = cl < o, x = 10 + i * 10;
      c.strokeStyle = c.fillStyle = up ? "#3fcf8e" : "#e5484d";
      c.beginPath(); c.moveTo(x + 3, hi); c.lineTo(x + 3, lo); c.stroke();
      c.fillRect(x, Math.min(o, cl), 7, Math.max(2, Math.abs(cl - o)));
      p = cl;
    }
    c.fillStyle = hex; c.font = "800 15px sans-serif"; c.fillText(["XAU · EMAS", "EDUKASI", "MODUL 3"][k % 3], 8, 16);
  });
}

function tickerTex(hex) {
  return tex("ticker" + hex, 1024, 32, (c, w, h) => {
    c.fillStyle = "#0b0f19"; c.fillRect(0, 0, w, h);
    c.fillStyle = hex; c.font = "800 20px sans-serif"; c.textBaseline = "middle";
    c.fillText("ILMU BIASA. HASIL LUAR BIASA.  ·  KELAS EDUKASI MALAM INI  ·  EBOOK BAHARU  ·  KOMUNITI TELEGRAM  ·  BUKAN NASIHAT PELABURAN", 12, h / 2 + 1);
  });
}

function mangaWall() {
  return tex("manga", 320, 200, (c, w, h) => {
    c.fillStyle = "#f4f1e6"; c.fillRect(0, 0, w, h);
    c.strokeStyle = "#111"; c.lineWidth = 4;
    const panels = [[6, 6, 150, 90], [162, 6, 152, 56], [162, 68, 152, 28], [6, 102, 96, 92], [108, 102, 206, 92]];
    seed = 29;
    panels.forEach(([x, y, pw, ph], i) => {
      c.fillStyle = i === 4 ? "#d7252c" : i === 0 ? "#1b1622" : "#fff"; c.fillRect(x, y, pw, ph);
      // garisan laju / bentuk ringkas (tiada watak sebenar)
      c.strokeStyle = i === 0 ? "#fff" : "#111"; c.lineWidth = 1.5;
      for (let k = 0; k < 10; k++) { const a = rnd() * PI * 2; c.beginPath(); c.moveTo(x + pw / 2, y + ph / 2); c.lineTo(x + pw / 2 + Math.cos(a) * pw, y + ph / 2 + Math.sin(a) * ph); c.stroke(); }
      c.strokeStyle = "#111"; c.lineWidth = 4; c.strokeRect(x, y, pw, ph);
    });
    c.fillStyle = "#fff"; c.beginPath(); c.ellipse(232, 140, 54, 24, 0, 0, PI * 2); c.fill(); c.stroke();
    c.fillStyle = "#111"; c.font = "900 22px sans-serif"; c.textAlign = "center"; c.fillText("NAKAMA!", 232, 148);
    c.fillStyle = "#d7252c"; c.beginPath(); c.arc(80, 50, 26, 0, PI * 2); c.fill();
  });
}

function muralTex() {
  return tex("mural", 512, 210, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#f2c14e"); g.addColorStop(0.5, "#f6d8a8"); g.addColorStop(1, "#9fd0c5");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = "#c4513b"; c.beginPath(); c.arc(150, 92, 52, 0, PI * 2); c.fill();
    // bukit berlapis
    [["#176b63", 150], ["#2a8a7e", 170], ["#c4513b", 190]].forEach(([col, base], k) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, h);
      for (let x = 0; x <= w; x += 16) c.lineTo(x, base - 30 * Math.sin(x / (70 + k * 25) + k) - 12 * k);
      c.lineTo(w, h); c.fill();
    });
    // daun tropika
    c.strokeStyle = "#0f4d47"; c.lineWidth = 7;
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(380 + i * 22, h); c.quadraticCurveTo(360 + i * 30, 90, 330 + i * 40, 40 + i * 10); c.stroke(); }
    c.fillStyle = "#f9f4ec"; c.font = "italic 900 30px sans-serif"; c.fillText("lakar", 26, 44);
    // bahagian belum siap (garis lakaran pensel)
    c.fillStyle = "#f4ede2"; c.fillRect(w - 110, 0, 110, h);
    c.strokeStyle = "#9c8a74"; c.lineWidth = 2;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(w - 55, 90, 20 + i * 14, PI, PI * 2); c.stroke(); }
    c.beginPath(); c.moveTo(w - 110, 160); c.lineTo(w, 140); c.stroke();
  });
}

function moodTex(message, hex) {
  return tex("mood" + message, 320, 220, (c, w, h) => {
    c.fillStyle = "#c9a77c"; c.fillRect(0, 0, w, h);
    seed = 41;
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(90,60,30,${rnd() * 0.25})`; c.fillRect(rnd() * w, rnd() * h, 2, 2); }
    ["#c4513b", "#176b63", "#f2c14e", "#f9f4ec", "#2a8a7e", "#e8a07a"].forEach((col, i) => {
      c.fillStyle = "#fff"; c.fillRect(14 + (i % 3) * 52, 104 + Math.floor(i / 3) * 56, 44, 50);
      c.fillStyle = col; c.fillRect(18 + (i % 3) * 52, 108 + Math.floor(i / 3) * 56, 36, 32);
    });
    c.fillStyle = "#f9f4ec"; c.fillRect(176, 100, 132, 108);
    c.strokeStyle = "#176b63"; c.lineWidth = 3; c.beginPath(); c.moveTo(186, 190); c.bezierCurveTo(210, 120, 260, 200, 298, 116); c.stroke();
    const lines = String(message || "").split("\n");
    c.fillStyle = "#f9f4ec"; c.fillRect(10, 10, w - 20, 82);
    c.fillStyle = hex; c.font = "900 26px sans-serif"; c.fillText((lines[0] || "").toUpperCase(), 20, 40);
    c.fillStyle = "#3a2b20"; c.font = "700 15px sans-serif";
    const words = (lines.slice(1).join(" ")).split(/\s+/); let row = "", y = 62;
    for (const wd of words) { const t = row ? row + " " + wd : wd; if (c.measureText(t).width > w - 44) { c.fillText(row, 20, y); row = wd; y += 18; } else row = t; }
    if (row) c.fillText(row, 20, y);
  });
}

function sketchTex() {
  return tex("sketch", 128, 160, (c, w, h) => {
    c.fillStyle = "#fbf8f2"; c.fillRect(0, 0, w, h);
    c.strokeStyle = "#6b5440"; c.lineWidth = 2;
    c.beginPath(); c.arc(64, 60, 28, 0, PI * 2); c.stroke();
    c.beginPath(); c.moveTo(10, 130); c.bezierCurveTo(40, 90, 80, 150, 118, 100); c.stroke();
    c.fillStyle = "#c4513b"; c.globalAlpha = 0.8; c.fillRect(14, 20, 40, 26); c.fillStyle = "#176b63"; c.fillRect(70, 100, 44, 40); c.globalAlpha = 1;
  });
}

function posterTex(hex, title) {
  return tex("poster" + hex + title, 160, 220, (c, w, h) => {
    c.fillStyle = "#15111a"; c.fillRect(0, 0, w, h);
    c.fillStyle = hex; c.beginPath(); c.arc(w / 2, 90, 52, 0, PI * 2); c.fill();
    c.strokeStyle = "#f4f1e6"; c.lineWidth = 6;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(10, 170 - i * 16); c.lineTo(w - 10, 120 - i * 16); c.stroke(); }
    c.fillStyle = "#f4f1e6"; c.font = "900 26px sans-serif"; c.textAlign = "center"; c.fillText(title, w / 2, 205);
  });
}

// ---------- perabot kecil yang dikongsi ----------
function armchair(color, x, z, ry = PI / 2) {
  const g = grp(x, 0, z, ry);
  g.add(mesh(box(0.5, 0.36, 0.5), std(color, { roughness: 0.9 }), 0, 0.24, 0));
  g.add(mesh(box(0.5, 0.5, 0.12), std(color, { roughness: 0.9 }), 0, 0.55, -0.22));
  for (const sx of [-1, 1]) g.add(mesh(box(0.08, 0.22, 0.46), std(color, { roughness: 0.9 }), sx * 0.25, 0.48, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(cyl(0.02, 0.02, 0.08, 6), M.dark(), sx * 0.2, 0.04, sz * 0.2));
  return g;
}
function stool(color, x, z) {
  const g = grp(x, 0, z);
  g.add(mesh(cyl(0.2, 0.2, 0.06, 14), std(color), 0, 0.45, 0));
  g.add(mesh(cyl(0.025, 0.025, 0.42, 6), M.metal(), 0, 0.22, 0));
  g.add(mesh(cyl(0.16, 0.18, 0.02, 14), M.metal(), 0, 0.01, 0));
  return g;
}
function micArm(x, y, z, ry = 0) {
  const g = grp(x, y, z, ry);
  g.add(mesh(cyl(0.012, 0.012, 0.35, 6), M.dark(), 0, 0.17, 0));
  const arm = mesh(cyl(0.01, 0.01, 0.32, 6), M.dark(), 0, 0.38, 0.12); arm.rotation.x = 1.1; g.add(arm);
  g.add(mesh(cyl(0.035, 0.035, 0.12, 10), std(0x2a2a2a, { metalness: 0.5 }), 0, 0.42, 0.26));
  return g;
}
function camera(x, z, ry, color) {
  const g = grp(x, 0, z, ry);
  for (let i = 0; i < 3; i++) { const l = mesh(cyl(0.012, 0.012, 1.2, 5), M.dark(), 0, 0.58, 0); l.rotation.z = 0.18; l.rotation.y = i * 2.1; l.translateX(0.08); g.add(l); }
  g.add(mesh(box(0.2, 0.14, 0.14), M.dark(), 0, 1.22, 0));
  const lens = mesh(cyl(0.045, 0.05, 0.1, 12), M.dark(), 0, 1.22, 0.1); lens.rotation.x = PI / 2; g.add(lens);
  g.add(mesh(box(0.03, 0.03, 0.01), basic(color), 0.07, 1.27, 0.071));
  return g;
}
function ringLight(x, z, ry) {
  const g = grp(x, 0, z, ry);
  g.add(mesh(cyl(0.012, 0.012, 1.4, 5), M.dark(), 0, 0.7, 0));
  g.add(mesh(cyl(0.12, 0.14, 0.02, 10), M.dark(), 0, 0.01, 0));
  const ring = mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 24), nightGlow(std(0xffffff, { emissive: 0xfff4e6, emissiveIntensity: 0.9 }), 1.2), 0, 1.52, 0);
  g.add(ring);
  return g;
}
function paintCan(g, x, y, z, color, s = 1) {
  g.add(mesh(cyl(0.09 * s, 0.09 * s, 0.14 * s, 12), std(0xc9ccd2, { metalness: 0.5, roughness: 0.4 }), x, y + 0.07 * s, z));
  g.add(mesh(cyl(0.092 * s, 0.092 * s, 0.05 * s, 12), std(color), x, y + 0.09 * s, z));
  g.add(mesh(cyl(0.085 * s, 0.085 * s, 0.01, 12), std(color), x, y + 0.145 * s, z));
}
function whiteboard(x, z, message, color, style = "putih") {
  const wb = grp(x, 1.15, z);
  wb.add(mesh(box(1.7, 0.95, 0.04), style === "kapur" ? M.dark() : M.metal(), 0, 0, 0));
  wb.add(mesh(new THREE.PlaneGeometry(1.6, 0.85), pic(boardTexture(message || "IDEA\nCerita baharu minggu ini", hexStr(color), style)), 0, 0, 0.025));
  return wb;
}

// ==================== BINALAB: studio perisian ====================
const perisian = {
  wall(plan, color, message) {
    const g = new THREE.Group(), z = plan.backZ + 0.08;
    g.add(whiteboard(-1.7, z + 0.03, message, color));
    // papan kanban (prospek → demo → quote → siap)
    const kb = grp(0.1, 1.2, z + 0.03);
    kb.add(mesh(box(1.32, 0.86, 0.04), M.metal(), 0, 0, 0));
    kb.add(mesh(new THREE.PlaneGeometry(1.26, 0.8), pic(kanbanTex(hexStr(color))), 0, 0, 0.025));
    g.add(kb);
    // dinding mockup app (4 telefon)
    for (let i = 0; i < 4; i++) {
      const ph = grp(1.35 + i * 0.42, 1.25 + (i % 2) * 0.12, z + 0.03);
      ph.add(mesh(box(0.32, 0.6, 0.03), M.dark(), 0, 0, 0));
      ph.add(mesh(new THREE.PlaneGeometry(0.28, 0.54), pic(appScreen(hexStr(color), i)), 0, 0, 0.017));
      g.add(ph);
    }
    // kabinet rendah + printer 3D kecil
    g.add(mesh(box(1.7, 0.55, 0.4), std(0xf1f1ee), 1.98, 0.275, z + 0.22));
    g.add(mesh(box(1.72, 0.03, 0.42), std(color), 1.98, 0.565, z + 0.22));
    const pr = grp(1.6, 0.58, z + 0.22);
    pr.add(mesh(box(0.34, 0.03, 0.3), M.dark(), 0, 0.015, 0));
    for (const sx of [-1, 1]) pr.add(mesh(box(0.03, 0.36, 0.03), M.dark(), sx * 0.15, 0.2, -0.12));
    pr.add(mesh(box(0.33, 0.03, 0.04), M.dark(), 0, 0.36, -0.12));
    pr.add(mesh(box(0.08, 0.08, 0.08), std(color), 0, 0.07, 0));
    g.add(pr);
    g.add(mesh(cyl(0.04, 0.035, 0.09, 10), M.white(), 2.4, 0.625, z + 0.25));
    return g;
  },
  side(a, color) {
    // meja uji peranti: telefon & tablet atas dirian
    const g = grp(a.x, 0, a.z, PI / 2);
    g.add(mesh(box(1.4, 0.06, 0.6), std(0xf1f1ee), 0, 0.78, 0));
    for (const x of [-0.64, 0.64]) g.add(mesh(box(0.06, 0.78, 0.55), std(color), x, 0.39, 0));
    for (let i = 0; i < 5; i++) {
      const big = i === 2, ph = grp(-0.48 + i * 0.24, 0.81, 0.05); ph.rotation.x = -0.3;
      ph.add(mesh(box(big ? 0.22 : 0.1, big ? 0.3 : 0.2, 0.012), M.dark(), 0, big ? 0.15 : 0.1, 0));
      ph.add(mesh(new THREE.PlaneGeometry(big ? 0.19 : 0.085, big ? 0.26 : 0.17), pic(appScreen(hexStr(color), i)), 0, big ? 0.15 : 0.1, 0.007));
      g.add(ph);
    }
    g.add(mesh(box(0.5, 0.04, 0.3), M.dark(), 0, 0.03, 0.1));
    return g;
  },
  sideR(a, color) {
    // rak server dengan lampu LED
    const g = grp(a.x, 0, a.z, -PI / 2);
    g.add(mesh(box(0.62, 1.7, 0.6), M.dark(), 0, 0.85, 0));
    for (let r = 0; r < 7; r++) {
      g.add(mesh(box(0.54, 0.16, 0.02), std(0x2a3044), 0, 0.3 + r * 0.2, 0.301));
      for (let k = 0; k < 3; k++) g.add(mesh(box(0.025, 0.025, 0.01), basic(k === 2 ? color : (r + k) % 3 ? 0x46d37a : 0x5ab0ff), -0.2 + k * 0.05, 0.3 + r * 0.2, 0.312));
    }
    g.add(mesh(box(0.62, 0.05, 0.6), basic(color), 0, 1.72, 0));
    g.add(plant(0, 0.62, 0.8, 1));
    return g;
  },
  labels: { board: "📝 Kemas kini whiteboard", shelf: "📱 Semak mockup app", side: "📱 Uji app di peranti", sideR: "🖥️ Semak server demo" },
};

// ==================== EH NAKAMA: studio media cerita ====================
const media = {
  floorDecor(plan, color) {
    // permaidani merah di tengah
    const g = new THREE.Group();
    const rug = mesh(new THREE.PlaneGeometry(1.2, plan.D - 2.2), std(0x3a1519, { roughness: 1 }), 0, 0.022, plan.shift);
    rug.rotation.x = -PI / 2; g.add(rug);
    return g;
  },
  wall(plan, color, message) {
    const g = new THREE.Group(), z = plan.backZ + 0.08;
    g.add(whiteboard(-2.05, z + 0.03, message, color, "kapur"));
    // dinding panel manga
    const mw = grp(-0.1, 1.2, z + 0.03);
    mw.add(mesh(box(1.66, 1.06, 0.04), M.dark(), 0, 0, 0));
    mw.add(mesh(new THREE.PlaneGeometry(1.6, 1.0), pic(mangaWall()), 0, 0, 0.025));
    g.add(mw);
    // rak manga padat + figura di atas
    const bk = grp(1.95, 0, z + 0.17);
    bk.add(openShelf(1.6, 1.75, 0.32, M.dark(), 4));
    const cols = [0xd7252c, 0xf4f1e6, 0x2a2230, 0xf2c14e, 0x5ab0ff, 0xe879d3, 0xffffff, 0x8E9BFF];
    for (let r = 0; r < 3; r++) {
      let x = -0.72;
      for (let i = 0; x < 0.66; i++) {
        const w = 0.045 + ((i + r) % 3) * 0.01, hgt = 0.3 + ((i * 3 + r) % 2) * 0.03;
        bk.add(mesh(box(w, hgt, 0.2), std(cols[(i * 5 + r * 3) % cols.length], { roughness: 0.7 }), x + w / 2, 0.06 + r * 0.4375 + hgt / 2, 0.03));
        x += w + 0.008;
      }
    }
    // figura ringkas dalam kotak paparan (bentuk umum, bukan watak sebenar)
    for (let i = 0; i < 4; i++) {
      const fx = -0.55 + i * 0.37, fy = 0.06 + 3 * 0.4375;
      bk.add(mesh(cyl(0.06, 0.07, 0.03, 10), M.dark(), fx, fy + 0.015, 0.03));
      bk.add(mesh(box(0.08, 0.16, 0.06), std(cols[i * 2]), fx, fy + 0.11, 0.03));
      bk.add(mesh(new THREE.SphereGeometry(0.055, 10, 8), std(0xf6c944), fx, fy + 0.24, 0.03));
      bk.add(mesh(box(0.13, 0.04, 0.12), std(cols[(i * 2 + 1) % cols.length]), fx, fy + 0.29, 0.03));
    }
    g.add(bk);
    g.add(mesh(box(0.03, 1.75, 0.03), basic(color), 1.95 + 0.82, 0.875, z + 0.34));
    g.add(mesh(box(0.03, 1.75, 0.03), basic(color), 1.95 - 0.82, 0.875, z + 0.34));
    // poster di dinding sisi
    for (const [x, t] of [[-4.0, "BAB 01"], [-3.45, "ARC 2"]]) {
      g.add(mesh(new THREE.PlaneGeometry(0.4, 0.55), pic(posterTex(hexStr(color), t)), x, 1.25, z + 0.03));
    }
    return g;
  },
  counter(a, color) {
    // kaunter merch: kabinet kaca dengan keychain & acrylic stand
    const g = grp(a.x, 0, a.z, -PI / 2);
    g.add(mesh(box(1.7, 0.8, 0.55), M.dark(), 0, 0.4, 0));
    g.add(mesh(box(1.7, 0.04, 0.57), basic(color), 0, 0.8, 0));
    const glass = new THREE.MeshStandardMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.16, roughness: 0.05, depthWrite: false });
    g.add(mesh(box(1.6, 0.45, 0.5), glass, 0, 1.05, 0));
    const cols = [0xd7252c, 0xf2c14e, 0x5ab0ff, 0xe879d3, 0xf4f1e6, 0x8E9BFF];
    for (let i = 0; i < 6; i++) {
      g.add(mesh(box(0.12, 0.2, 0.01), std(cols[i], { roughness: 0.3 }), -0.65 + i * 0.26, 0.93, 0.05));
      g.add(mesh(box(0.14, 0.015, 0.06), std(0xe8f4ff, { roughness: 0.1 }), -0.65 + i * 0.26, 0.83, 0.05));
    }
    // timbunan baju dilipat
    [0xd7252c, 0x1b1622, 0xf4f1e6].forEach((c, k) => g.add(mesh(box(0.3, 0.05, 0.25), std(c), 1.1, 0.03 + k * 0.05, 0.15)));
    return g;
  },
  lounge(a, color) {
    // sudut podcast: dua kerusi, meja mikrofon, kamera & ring light, panel akustik
    const g = grp(a.x, 0, a.z);
    const rug = mesh(new THREE.CircleGeometry(1, 32), std(0x2a2230, { roughness: 0.95 }), 0.6, 0.025, 0);
    rug.rotation.x = -PI / 2; rug.scale.set(1.1, 0.9, 1); g.add(rug);
    g.add(armchair(color, -0.1, -0.38)); g.add(armchair(0x2a2230, -0.1, 0.38));
    const t = grp(0.45, 0, 0);
    t.add(mesh(box(0.42, 0.05, 1.2), M.dark(), 0, 0.55, 0));
    t.add(mesh(box(0.06, 0.55, 0.06), M.metal(), 0, 0.275, 0));
    t.add(mesh(box(0.3, 0.02, 0.4), M.metal(), 0, 0.01, 0));
    g.add(t);
    g.add(micArm(0.4, 0.57, -0.38, -PI / 2)); g.add(micArm(0.4, 0.57, 0.38, -PI / 2));
    g.add(mesh(box(0.22, 0.04, 0.16), M.dark(), 0.5, 0.6, 0));
    g.add(mesh(new THREE.CircleGeometry(0.02, 8), basic(0xff3b3b), 0.5, 0.625, 0.081));
    g.add(camera(1.3, -0.15, -PI / 2, 0xff3b3b));
    g.add(ringLight(1.3, 0.45, -PI / 2));
    // panel akustik pada dinding kiri (kaca)
    for (let i = 0; i < 6; i++) {
      const p = mesh(box(0.05, 0.32, 0.32), std(i % 2 ? 0x2a2230 : color, { roughness: 1 }), -0.42, 1.25 + Math.floor(i / 3) * 0.36, -0.36 + (i % 3) * 0.36);
      g.add(p);
    }
    // papan neon ON AIR
    g.add(mesh(box(0.04, 0.16, 0.5), M.dark(), -0.42, 2.05, 0));
    g.add(mesh(box(0.045, 0.1, 0.42), basic(0xff3b3b), -0.42, 2.05, 0));
    return g;
  },
  side(a, color) {
    // meja lukis storyboard
    const g = grp(a.x, 0, a.z, PI / 2);
    g.add(mesh(box(1.4, 0.06, 0.6), std(0x2c2433), 0, 0.75, 0));
    for (const x of [-0.64, 0.64]) g.add(mesh(box(0.06, 0.75, 0.55), M.dark(), x, 0.375, 0));
    const pd = grp(-0.1, 0.78, 0); pd.rotation.x = -0.45;
    pd.add(mesh(box(0.7, 0.45, 0.03), M.dark(), 0, 0.22, 0));
    pd.add(mesh(new THREE.PlaneGeometry(0.64, 0.39), pic(mangaWall()), 0, 0.22, 0.016));
    g.add(pd);
    for (let i = 0; i < 3; i++) g.add(mesh(box(0.2, 0.005, 0.28), std(0xf4f1e6), 0.45 + i * 0.03, 0.785 + i * 0.006, 0.05 - i * 0.04));
    const lamp = grp(0.55, 0.78, -0.2);
    lamp.add(mesh(cyl(0.012, 0.012, 0.5, 6), M.metal(), 0, 0.25, 0));
    lamp.add(mesh(cyl(0.04, 0.09, 0.08, 12, 1, true), std(color, { side: THREE.DoubleSide }), -0.1, 0.5, 0.05));
    g.add(lamp);
    return g;
  },
  sideR(a, color) {
    // rak baju merch tergantung
    const g = grp(a.x, 0, a.z, -PI / 2);
    for (const x of [-0.6, 0.6]) { g.add(mesh(cyl(0.02, 0.02, 1.5, 6), M.metal(), x, 0.75, 0)); g.add(mesh(box(0.06, 0.03, 0.4), M.metal(), x, 0.02, 0)); }
    const rail = mesh(cyl(0.015, 0.015, 1.25, 6), M.metal(), 0, 1.48, 0); rail.rotation.z = PI / 2; g.add(rail);
    [color, 0x1b1622, 0xf4f1e6, color, 0x2a2230, 0xf2c14e].forEach((c, i) => {
      const t = grp(-0.48 + i * 0.19, 1.15, 0, PI / 2);
      t.add(mesh(box(0.42, 0.55, 0.025), std(c, { roughness: 0.95 }), 0, 0, 0));
      t.add(mesh(box(0.62, 0.16, 0.025), std(c, { roughness: 0.95 }), 0, 0.2, 0));
      g.add(t);
    });
    [0x2a2230, 0xd7252c].forEach((c, k) => g.add(mesh(box(0.5, 0.3, 0.4), std(c), -0.3 + k * 0.55, 0.15, 0)));
    return g;
  },
  labels: { board: "📝 Susun idea cerita", shelf: "📚 Baca manga rujukan", side: "✏️ Lukis storyboard", sideR: "👕 Semak stok merch",
    counter: "🛍️ Susun merch di kaunter", lounge1: "🎙️ Rakam podcast", lounge2: "🎙️ Sesi podcast" },
  loungeSeatY: 0.48,
};

// ==================== GILAPIPS: edukasi pasaran ====================
const GOLD = () => std(0xd4b26a, { metalness: 0.6, roughness: 0.3 });
const pasaran = {
  wall(plan, color, message) {
    const g = new THREE.Group(), z = plan.backZ + 0.08;
    g.add(whiteboard(-2.3, z + 0.03, message, color));
    // dinding video: 3 skrin carta + jalur ticker
    for (let k = 0; k < 3; k++) {
      const s = grp(-0.4 + k * 1.22, 1.2, z + 0.03);
      s.add(mesh(box(1.18, 0.7, 0.05), M.dark(), 0, 0, 0));
      s.add(mesh(new THREE.PlaneGeometry(1.12, 0.64), pic(chartTex(hexStr(color), k)), 0, 0, 0.027));
      g.add(s);
    }
    g.add(mesh(box(3.7, 0.14, 0.04), M.dark(), 0.82, 0.76, z + 0.03));
    g.add(mesh(new THREE.PlaneGeometry(3.64, 0.11), pic(tickerTex(hexStr(color))), 0.82, 0.76, z + 0.052));
    // konsol rendah emas
    g.add(mesh(box(3.6, 0.45, 0.4), std(0x1f2636), 0.82, 0.225, z + 0.22));
    g.add(mesh(box(3.62, 0.03, 0.42), GOLD(), 0.82, 0.455, z + 0.22));
    [0, 1, 2].forEach(k => g.add(mesh(box(0.18, 0.24, 0.03), GOLD(), 0.1 + k * 0.25, 0.59, z + 0.2)));   // ebook berdiri
    return g;
  },
  lounge(a, color) {
    // kelas mini: kerusi menghadap skrin pembentangan
    const g = grp(a.x, 0, a.z);
    const rug = mesh(new THREE.PlaneGeometry(1.9, 1.5), std(0x2b3448, { roughness: 1 }), 0.55, 0.025, 0);
    rug.rotation.x = -PI / 2; g.add(rug);
    g.add(armchair(0x2c3447, -0.1, -0.38)); g.add(armchair(color, -0.1, 0.38));
    const tv = grp(1.3, 0, 0, -PI / 2);
    for (const x of [-0.45, 0.45]) g.add(mesh(cyl(0.02, 0.02, 1.4, 6), M.metal(), 1.3, 0.7, x));
    tv.add(mesh(box(1.1, 0.66, 0.04), M.dark(), 0, 1.25, 0));
    tv.add(mesh(new THREE.PlaneGeometry(1.04, 0.6), pic(chartTex(hexStr(color), 2)), 0, 1.25, 0.022));
    tv.add(mesh(box(1.1, 0.03, 0.05), GOLD(), 0, 0.91, 0));
    g.add(tv);
    g.add(mesh(box(1.0, 0.03, 0.4), GOLD(), 1.3, 0.015, 0));
    return g;
  },
  side(a, color) {
    // set rakaman video edukasi: meja, mikrofon, kamera, lampu softbox
    const g = grp(a.x, 0, a.z, PI / 2);
    g.add(mesh(box(1.2, 0.06, 0.55), std(0x1f2636), 0, 0.74, 0));
    g.add(mesh(box(1.22, 0.02, 0.57), GOLD(), 0, 0.77, 0));
    for (const x of [-0.55, 0.55]) g.add(mesh(box(0.05, 0.74, 0.5), M.dark(), x, 0.37, 0));
    g.add(micArm(-0.2, 0.77, 0.1, PI));
    const mon = grp(0.25, 0.77, -0.12);
    mon.add(mesh(cyl(0.015, 0.015, 0.25, 6), M.metal(), 0, 0.12, 0));
    mon.add(mesh(box(0.5, 0.3, 0.03), M.dark(), 0, 0.36, 0));
    mon.add(mesh(new THREE.PlaneGeometry(0.46, 0.26), pic(chartTex(hexStr(color), 1)), 0, 0.36, 0.017));
    g.add(mon);
    g.add(camera(0, 0.95, PI, 0xff3b3b));
    const sb = grp(0.8, 0, 0.7);
    sb.add(mesh(cyl(0.012, 0.012, 1.5, 5), M.dark(), 0, 0.75, 0));
    const box1 = mesh(box(0.42, 0.42, 0.18), nightGlow(std(0xffffff, { emissive: 0xfff6e8, emissiveIntensity: 0.7 }), 1.2), 0, 1.55, 0); box1.rotation.y = -0.6; sb.add(box1);
    g.add(sb);
    return g;
  },
  sideR(a, color) {
    // rak ebook & produk digital
    const g = grp(a.x, 0, a.z, -PI / 2);
    const sh = openShelf(1.2, 1.5, 0.35, std(0x1f2636), 3); g.add(sh);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) {
      const b = mesh(box(0.2, 0.28, 0.03), i % 2 ? GOLD() : std(0x10151f), -0.42 + i * 0.28, 0.06 + r * 0.5 + 0.16, 0.06);
      b.rotation.x = -0.15; g.add(b);
    }
    g.add(mesh(box(1.2, 0.04, 0.36), GOLD(), 0, 1.52, 0));
    return g;
  },
  labels: { board: "📝 Kemas kini whiteboard", shelf: "📈 Siapkan carta untuk kelas", side: "🎙️ Rakam video edukasi", sideR: "📘 Semak ebook baharu",
    lounge1: "🎓 Uji slaid kelas mini", lounge2: "🎓 Ulang kaji modul" },
  loungeSeatY: 0.48,
};

// ==================== LAKAR: studio mural ====================
const seni = {
  floorDecor(plan) {
    // percikan cat di lantai konkrit + kain alas
    const g = new THREE.Group();
    const cols = [0xc4513b, 0x176b63, 0xf2c14e, 0xe8a07a, 0x2a8a7e];
    seed = 7;
    for (let i = 0; i < 16; i++) {
      const s = mesh(new THREE.CircleGeometry(0.06 + rnd() * 0.12, 10), std(cols[i % cols.length], { roughness: 0.6 }),
        (rnd() - 0.5) * (plan.W - 1.6), 0.021, plan.shift + (rnd() - 0.5) * (plan.D - 1.6));
      s.rotation.x = -PI / 2; g.add(s);
    }
    const cloth = mesh(new THREE.PlaneGeometry(2.6, 1.1), std(0xe9e2d4, { roughness: 1 }), -2.3, 0.023, plan.backZ + 0.75);
    cloth.rotation.x = -PI / 2; g.add(cloth);
    return g;
  },
  wall(plan, color, message) {
    const g = new THREE.Group(), z = plan.backZ + 0.08;
    // mural besar (contoh kerja LAKAR), bahagian kanan belum siap
    g.add(mesh(new THREE.PlaneGeometry(4.6, 1.9), pic(muralTex()), -1.45, 1.3, z + 0.02));
    // tangga lipat di depan mural
    const lad = grp(-3.3, 0, z + 0.55, 0.3);
    for (const sx of [-1, 1]) { const l = mesh(box(0.05, 1.6, 0.05), std(0xb8bcc6, { metalness: 0.5 }), sx * 0.22, 0.78, 0); l.rotation.x = 0.18; lad.add(l); }
    for (let i = 0; i < 5; i++) lad.add(mesh(box(0.44, 0.03, 0.1), std(0xb8bcc6, { metalness: 0.5 }), 0, 0.25 + i * 0.3, 0.06 - i * 0.054));
    g.add(lad);
    paintCan(g, -2.8, 0, z + 0.45, 0xc4513b); paintCan(g, -2.55, 0, z + 0.55, 0x176b63); paintCan(g, -0.4, 0, z + 0.5, 0xf2c14e);
    // dulang roller
    g.add(mesh(box(0.35, 0.04, 0.25), M.dark(), -0.75, 0.02, z + 0.5));
    const rl = mesh(cyl(0.05, 0.05, 0.22, 10), std(0x176b63), -0.75, 0.07, z + 0.5); rl.rotation.z = PI / 2; g.add(rl);
    // mood board dengan pesan
    const mb = grp(2.05, 1.3, z + 0.03);
    mb.add(mesh(box(1.5, 1.05, 0.04), std(0x6b5440), 0, 0, 0));
    mb.add(mesh(new THREE.PlaneGeometry(1.42, 0.98), pic(moodTex(message, hexStr(color))), 0, 0, 0.025));
    g.add(mb);
    // kabinet pelan (flat file)
    g.add(mesh(box(1.5, 0.6, 0.45), std(0xe3d9c9), 2.05, 0.3, z + 0.25));
    for (let i = 0; i < 3; i++) g.add(mesh(box(1.3, 0.02, 0.01), std(0x9c8a74), 2.05, 0.15 + i * 0.17, z + 0.48));
    return g;
  },
  counter(a, color) {
    // sinki cuci berus + bekas cat
    const g = grp(a.x, 0, a.z, -PI / 2);
    g.add(mesh(box(1.7, 0.85, 0.55), std(0xe3d9c9), 0, 0.425, 0));
    g.add(mesh(box(1.74, 0.05, 0.6), std(0x8a8f9e, { roughness: 0.3, metalness: 0.4 }), 0, 0.875, 0));
    g.add(mesh(box(0.5, 0.06, 0.36), std(0x5a6070), -0.4, 0.88, 0));
    const tap = grp(-0.4, 0.9, -0.2);
    tap.add(mesh(cyl(0.02, 0.02, 0.25, 6), M.metal(), 0, 0.12, 0));
    tap.add(mesh(box(0.03, 0.03, 0.14), M.metal(), 0, 0.25, 0.06));
    g.add(tap);
    for (let k = 0; k < 3; k++) {
      const cup = grp(0.2 + k * 0.2, 0.9, 0.05);
      cup.add(mesh(cyl(0.05, 0.045, 0.12, 10), std([0x176b63, 0xc4513b, 0xf2c14e][k]), 0, 0.06, 0));
      for (let b = 0; b < 3; b++) { const br = mesh(cyl(0.007, 0.007, 0.22, 5), std(0x6b5440), (b - 1) * 0.018, 0.16, 0); br.rotation.z = (b - 1) * 0.25; cup.add(br); }
      g.add(cup);
    }
    paintCan(g, 1.05, 0, 0.05, 0xc4513b, 1.3); paintCan(g, 1.05, 0.19, 0.05, 0x176b63, 1.1);
    return g;
  },
  lounge(a, color) {
    // meja konsultasi klien: dua kerusi, meja bulat, buku sampel warna
    const g = grp(a.x, 0, a.z);
    const rug = mesh(new THREE.CircleGeometry(1, 32), std(0x176b63, { roughness: 1 }), 0.45, 0.025, 0);
    rug.rotation.x = -PI / 2; rug.scale.set(1.1, 0.9, 1); g.add(rug);
    g.add(armchair(color, -0.1, -0.38)); g.add(armchair(0xe8a07a, -0.1, 0.38));
    const t = grp(0.55, 0, 0);
    t.add(mesh(cyl(0.42, 0.42, 0.04, 24), std(0xd8c6a5), 0, 0.55, 0));
    t.add(mesh(cyl(0.04, 0.04, 0.55, 8), M.dark(), 0, 0.275, 0));
    t.add(mesh(cyl(0.2, 0.2, 0.02, 16), M.dark(), 0, 0.01, 0));
    [0xc4513b, 0x176b63, 0xf2c14e, 0xe8a07a].forEach((c, k) => { const s = mesh(box(0.05, 0.005, 0.22), std(c), 0.05, 0.575 + k * 0.004, -0.1); s.rotation.y = k * 0.25; t.add(s); });
    t.add(mesh(box(0.26, 0.015, 0.2), std(0xf9f4ec), -0.05, 0.58, 0.15));
    g.add(t);
    g.add(plant(1.15, -0.55, 0.75, 0));
    return g;
  },
  side(a, color) {
    // rak cat: tin pelbagai warna + kain alas bergulung
    const g = grp(a.x, 0, a.z, PI / 2);
    g.add(openShelf(1.4, 1.3, 0.4, std(0x9c8a74), 3));
    const cols = [0xc4513b, 0x176b63, 0xf2c14e, 0xe8a07a, 0x2a8a7e, 0xf9f4ec, 0x3a2b20];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) paintCan(g, -0.5 + i * 0.25, 0.06 + r * 0.433, 0.02, cols[(i + r * 2) % cols.length], 0.9);
    const roll = mesh(cyl(0.12, 0.12, 0.9, 12), std(0xe9e2d4, { roughness: 1 }), 0.95, 0.12, 0.1); roll.rotation.x = PI / 2; roll.rotation.z = 0.4;
    g.add(roll);
    return g;
  },
  sideR(a, color) {
    // kuda-kuda (easel) dengan kanvas lakaran + bangku
    const g = grp(a.x, 0, a.z, -PI / 2);
    const wood = std(0x8a6a4c);
    for (const sx of [-1, 1]) { const l = mesh(box(0.05, 1.7, 0.05), wood, sx * 0.3, 0.82, 0); l.rotation.z = -sx * 0.12; g.add(l); }
    const back = mesh(box(0.05, 1.6, 0.05), wood, 0, 0.78, -0.35); back.rotation.x = -0.25; g.add(back);
    g.add(mesh(box(0.7, 0.04, 0.12), wood, 0, 0.62, 0.04));
    const cv = grp(0, 1.1, 0.06); cv.rotation.x = -0.08;
    cv.add(mesh(box(0.66, 0.84, 0.04), std(0xf9f4ec), 0, 0, 0));
    cv.add(mesh(new THREE.PlaneGeometry(0.62, 0.8), pic(sketchTex()), 0, 0, 0.022));
    g.add(cv);
    g.add(stool(color, 0.35, 0.7));
    // palet cat atas bangku
    g.add(mesh(cyl(0.14, 0.14, 0.015, 16), std(0xd8c6a5), 0.35, 0.49, 0.7));
    return g;
  },
  labels: { board: "🎨 Sambung mural contoh", shelf: "📌 Kemas mood board", side: "🎨 Bancuh warna cat", sideR: "🖌️ Sambung lakaran kanvas",
    counter: "🖌️ Cuci berus di sinki", lounge1: "🤝 Bincang konsep dengan klien", lounge2: "📒 Semak buku sampel warna" },
  loungeSeatY: 0.48,
};

export const GAYA = { perisian, media, pasaran, seni };

// ==================== PEJABAT CEO (Nadi) di tingkat atas ====================
// Meja eksekutif, dinding portfolio venture, bilik mesyuarat lembaga dan sudut rehat.
function ventureCard(name, hex) {
  return tex("vc" + name + hex, 200, 120, (c, w, h) => {
    c.fillStyle = "#0e1422"; c.fillRect(0, 0, w, h);
    c.fillStyle = hex; c.fillRect(0, 0, w, 8);
    c.font = "900 22px sans-serif"; c.fillText(name.toUpperCase(), 12, 38);
    seed = name.length * 7;
    for (let i = 0; i < 7; i++) { const bh = 14 + rnd() * 44; c.globalAlpha = i === 6 ? 1 : 0.55; c.fillRect(12 + i * 22, h - 12 - bh, 14, bh); }
    c.globalAlpha = 1; c.fillStyle = "#46d37a"; c.beginPath(); c.arc(w - 18, 28, 6, 0, PI * 2); c.fill();
  });
}
function namePlate(hex) {
  return tex("plate" + hex, 512, 96, (c, w, h) => {
    c.fillStyle = "#1a1f2d"; c.fillRect(0, 0, w, h);
    c.fillStyle = hex; c.fillRect(0, h - 6, w, 6);
    c.fillStyle = "#e9d9a8"; c.font = "900 40px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("NADI · VIRTUAL CEO", w / 2, h / 2 - 2);
  });
}

export function ceoSuite(plan, color, ventures) {
  const g = new THREE.Group(), z = plan.backZ + 0.08, W2 = plan.W / 2;
  const walnut = std(0x5a3e2b, { roughness: 0.55 }), gold = std(0xd4b26a, { metalness: 0.6, roughness: 0.3 });
  // dinding portfolio: satu skrin bagi setiap anak syarikat
  const n = ventures.length, sw = 1.0, gap = 0.12, total = n * sw + (n - 1) * gap;
  ventures.forEach((v, i) => {
    const s = grp(-total / 2 + sw / 2 + i * (sw + gap), 1.15, z + 0.03);
    s.add(mesh(box(sw, 0.62, 0.04), M.dark(), 0, 0, 0));
    s.add(mesh(new THREE.PlaneGeometry(sw - 0.06, 0.56), pic(ventureCard(v.short, hexStr(v.color))), 0, 0, 0.022));
    s.add(mesh(box(sw, 0.03, 0.05), basic(v.color), 0, -0.33, 0));
    g.add(s);
  });
  // kredenza rendah
  g.add(mesh(box(total, 0.5, 0.4), walnut, 0, 0.25, z + 0.22));
  g.add(mesh(box(total + 0.02, 0.03, 0.42), gold, 0, 0.515, z + 0.22));
  [[-1.2, 0.11], [1.4, 0.14]].forEach(([x, r]) => { g.add(mesh(cyl(r * 0.6, r, 0.3, 12), gold, x, 0.68, z + 0.2)); });   // trofi
  // meja eksekutif (Nadi duduk di belakang)
  const d = grp(0, 0, -0.9);
  d.add(mesh(box(2.3, 0.07, 0.95), walnut, 0, 0.68, 0));
  d.add(mesh(box(2.32, 0.02, 0.97), gold, 0, 0.645, 0));
  for (const sx of [-1, 1]) d.add(mesh(box(0.5, 0.64, 0.85), walnut, sx * 0.88, 0.32, 0));
  d.add(mesh(box(1.26, 0.5, 0.04), walnut, 0, 0.38, 0.4));
  d.add(mesh(new THREE.PlaneGeometry(1.2, 0.225), pic(namePlate(hexStr(color))), 0, 0.42, 0.421));
  for (const sx of [-1, 1]) {
    const mon = grp(sx * 0.42, 0.715, -0.15, -sx * 0.25);
    mon.add(mesh(cyl(0.015, 0.015, 0.3, 6), M.metal(), 0, 0.15, 0));
    mon.add(mesh(box(0.66, 0.38, 0.03), M.dark(), 0, 0.44, 0));
    d.add(mon);
  }
  d.add(mesh(box(0.4, 0.02, 0.28), M.laptop(), 0, 0.725, 0.15));
  d.add(mesh(cyl(0.04, 0.035, 0.09, 10), M.white(), 0.85, 0.76, 0.2));
  const lamp = grp(-0.95, 0.715, 0.05);
  lamp.add(mesh(cyl(0.07, 0.08, 0.02, 12), gold, 0, 0, 0));
  lamp.add(mesh(cyl(0.012, 0.012, 0.4, 6), gold, 0, 0.2, 0));
  lamp.add(mesh(cyl(0.08, 0.13, 0.12, 14, 1, true), nightGlow(std(0xfff1d6, { emissive: 0xffd9a0, emissiveIntensity: 0.6, side: THREE.DoubleSide }), 1.3), 0, 0.42, 0));
  d.add(lamp);
  g.add(d);
  // kerusi eksekutif (tinggi)
  const ch = chair(color, 0, -0.9 - 0.62);
  ch.add(mesh(box(0.52, 0.4, 0.07), M.chair(), 0, 1.28, -0.28));
  g.add(ch);

  // bilik mesyuarat lembaga (depan kiri): kerusi warna setiap venture
  const bx = -(W2 - 1.7), bz = 1.25;
  const tbl = grp(bx, 0, bz);
  tbl.add(mesh(box(1.0, 0.06, 2.2), walnut, 0, 0.7, 0));
  tbl.add(mesh(box(1.02, 0.02, 2.22), gold, 0, 0.665, 0));
  for (const sz of [-0.7, 0.7]) tbl.add(mesh(box(0.12, 0.66, 0.5), M.dark(), 0, 0.33, sz));
  tbl.add(mesh(cyl(0.12, 0.14, 0.04, 3), M.dark(), 0, 0.75, 0));
  g.add(tbl);
  ventures.slice(0, 6).forEach((v, i) => {
    const side = i % 2 ? 1 : -1, row = Math.floor(i / 2);
    g.add(chair(v.color, bx + side * 0.78, bz - 0.7 + row * 0.7).rotateY(-side * PI / 2));
  });
  // sudut rehat (depan kanan)
  const lx = W2 - 1.3, lz = 1.4;
  const sofa = grp(lx + 0.35, 0, lz, -PI / 2);
  const sc = std(0x3a4258, { roughness: 0.9 });
  sofa.add(mesh(box(1.7, 0.4, 0.75), sc, 0, 0.2, 0));
  sofa.add(mesh(box(1.7, 0.8, 0.2), sc, 0, 0.42, -0.3));
  for (const sx of [-1, 1]) sofa.add(mesh(box(0.16, 0.55, 0.75), sc, sx * 0.84, 0.28, 0));
  sofa.add(mesh(box(0.3, 0.3, 0.12), std(color, { roughness: 0.95 }), -0.5, 0.6, -0.18));
  g.add(sofa);
  const ct = grp(lx - 0.65, 0, lz);
  ct.add(mesh(cyl(0.38, 0.38, 0.04, 24), std(0x1a1f2d, { roughness: 0.2, metalness: 0.4 }), 0, 0.4, 0));
  ct.add(mesh(cyl(0.04, 0.06, 0.38, 8), gold, 0, 0.19, 0));
  ct.add(mesh(cyl(0.05, 0.04, 0.09, 10), M.white(), 0.1, 0.46, 0.05));
  g.add(ct);
  g.add(plant(W2 - 0.6, plan.lanes.back - 0.2, 1, 1)); g.add(plant(-(W2 - 0.6), plan.lanes.back - 0.2, 1, 1));
  g.add(plant(W2 - 0.7, 2.7, 0.8, 0));
  // permaidani di bawah meja CEO
  const rug = mesh(new THREE.PlaneGeometry(3.2, 2.3), std(0x2b3046, { roughness: 1 }), 0, 0.022, -1.0);
  rug.rotation.x = -PI / 2; g.add(rug);
  return { group: g, nadiSeat: { x: 0, z: -0.9 - 0.62 } };
}
