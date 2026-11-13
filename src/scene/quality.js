// Kualiti grafik: "cantik" (bayang-bayang, resolusi penuh) atau "laju"
// (tanpa bayang-bayang, resolusi lebih rendah). Pilihan disimpan dalam pelayar.
// Kalau belum pernah pilih, sistem ukur kelajuan (FPS) beberapa saat pertama
// dan tukar sendiri ke "laju" kalau telefon nampak berat.

const KEY = "markas-kualiti";
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const save = v => { try { localStorage.setItem(KEY, v); } catch { /* mod peribadi: abaikan */ } };

export function createQuality({ renderer, scene, key, button, toast }) {
  let mode = read() || "cantik";
  const manual = !!read();

  function apply() {
    const fast = mode === "laju";
    renderer.setPixelRatio(Math.min(devicePixelRatio, fast ? 1.5 : 2));
    renderer.shadowMap.enabled = !fast;
    key.castShadow = !fast;
    scene.traverse(o => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      mats.forEach(m => { m.needsUpdate = true; });
    });
    button.textContent = fast ? "⚡ Laju" : "✨ Cantik";
    button.setAttribute("aria-label", fast ? "Kualiti: laju. Tekan untuk cantik" : "Kualiti: cantik. Tekan untuk laju");
    dispatchEvent(new Event("resize"));
  }

  button.onclick = () => {
    mode = mode === "laju" ? "cantik" : "laju"; save(mode); apply();
    toast(mode === "laju" ? "⚡ Mod laju: tanpa bayang-bayang, lebih ringan" : "✨ Mod cantik: bayang-bayang dihidupkan");
  };
  apply();

  // ukur FPS (abaikan 2.5 saat pertama semasa memuat)
  let frames = 0, start = 0, done = manual;
  function tick(now) {
    if (done) return;
    if (!start) start = now + 2500;
    if (now >= start) frames++;
    if (now - start > 4000) {
      done = true;
      const fps = frames / ((now - start) / 1000);
      if (fps < 32 && mode !== "laju") {
        mode = "laju"; apply();
        toast("⚡ Mod laju dihidupkan supaya lebih lancar. Tekan butang ⚡ untuk tukar.");
      }
    }
  }

  return { tick, get mode() { return mode; } };
}
