// Mod Hidup: baca status agent sebenar dari /api/status setiap 20 saat.
// Kod akses disimpan dalam pelayar (localStorage) dan dihantar sebagai header.

const CODE_KEY = "markas-kod", MODE_KEY = "markas-mod";
const POLL_MS = 20000;
const read = k => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* abaikan */ } };

export const savedMode = () => read(MODE_KEY) || "contoh";
export const saveMode = m => write(MODE_KEY, m);
export const savedCode = () => read(CODE_KEY);
export const saveCode = c => write(CODE_KEY, c);

export async function fetchStatus(code) {
  const r = await fetch("/api/status", { headers: { "x-markas-code": code }, cache: "no-store" });
  if (r.status === 401) throw Object.assign(new Error("Kod akses salah"), { auth: true });
  if (!r.ok) throw new Error(`Server ralat ${r.status}`);
  return r.json();
}

export async function fetchLog(code, agentId) {
  const r = await fetch(`/api/log?agent=${encodeURIComponent(agentId)}`, { headers: { "x-markas-code": code }, cache: "no-store" });
  if (r.status === 401) throw Object.assign(new Error("Kod akses salah"), { auth: true });
  if (!r.ok) throw new Error(`Server ralat ${r.status}`);
  return (await r.json()).log || [];
}

export async function runNadi(code) {
  const r = await fetch("/api/nadi", { method: "POST", headers: { "x-markas-code": code } });
  if (r.status === 401) throw Object.assign(new Error("Kod akses salah"), { auth: true });
  if (!r.ok) throw new Error(`Server ralat ${r.status}`);
  return r.json();
}

export async function markDecisionDone(code, agentId) {
  const r = await fetch("/api/decision", {
    method: "POST",
    headers: { "x-markas-code": code, "Content-Type": "application/json" },
    body: JSON.stringify({ agent: agentId }),
  });
  if (r.status === 401) throw Object.assign(new Error("Kod akses salah"), { auth: true });
  if (!r.ok) throw new Error(`Server ralat ${r.status}`);
  return r.json();
}

// Polling: panggil onData(data) setiap kali berjaya; berhenti sementara bila tab tersembunyi
export function startPolling(code, { onData, onError }) {
  let timer = null, stopped = false;
  async function tick() {
    if (stopped) return;
    if (!document.hidden) {
      try { onData(await fetchStatus(code)); }
      catch (e) { onError(e); if (e.auth) return; }
    }
    timer = setTimeout(tick, POLL_MS);
  }
  const onVis = () => { if (!document.hidden && !stopped) { clearTimeout(timer); tick(); } };
  document.addEventListener("visibilitychange", onVis);
  tick();
  return () => { stopped = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVis); };
}
