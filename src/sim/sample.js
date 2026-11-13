// Mod "Data contoh": status agent disimulasi secara rawak.

export function startSample(agents, ui, onShow) {
  function tick() {
    const pool = agents.filter(ui.visible);
    const a = pool[Math.floor(Math.random() * pool.length)];
    if (!a) return;
    a.step = (a.step + 1) % a.tasks.length;
    a.busy = !a.busy || Math.random() < 0.6;
    ui.refresh(a);
    onShow(a);
  }

  const id = setInterval(tick, 2600);
  tick(); setTimeout(tick, 900);
  return () => clearInterval(id);
}

export function initSample(agents) {
  agents.forEach(a => { a.step = 0; a.busy = Math.random() < 0.5; });
}
