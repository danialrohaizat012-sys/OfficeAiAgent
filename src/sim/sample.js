// Mod "Data contoh": status agent disimulasi secara rawak.
// onShow(a)      : tunjuk gelembung agent
// onReport(a)    : agent "hantar report" ke Nadi (sampul terbang)
// onDecision(a)  : agent perlukan keputusan Danial

export function startSample(agents, ui, { onShow, onReport, onDecision } = {}) {
  function tick() {
    const pool = agents.filter(ui.visible);
    const a = pool[Math.floor(Math.random() * pool.length)];
    if (!a) return;
    const prev = a.step;
    a.step = (a.step + 1) % a.tasks.length;
    a.busy = !a.busy || Math.random() < 0.6;
    ui.refresh(a);
    if (onShow) onShow(a);
    // tugas terakhir dalam senarai selesai = report dihantar ke Command
    if (onReport && a.step === 0 && prev !== 0 && !a.home.standing) onReport(a);
    else if (onReport && Math.random() < 0.12 && !a.home.standing) onReport(a);
    // sekali-sekala, agent perlukan keputusan Danial
    const open = agents.filter(x => x.decision).length;
    if (onDecision && open < 2 && Math.random() < 0.08) {
      const cand = agents.filter(x => !x.decision && x.sampleDecisions.length);
      const b = cand[Math.floor(Math.random() * cand.length)];
      if (b) { b.decision = b.sampleDecisions[Math.floor(Math.random() * b.sampleDecisions.length)]; ui.refresh(b); onDecision(b); }
    }
  }

  const id = setInterval(tick, 2600);
  tick(); setTimeout(tick, 900);
  return () => clearInterval(id);
}

export function initSample(agents) {
  agents.forEach(a => { a.step = 0; a.busy = Math.random() < 0.5; a.decision = null; });
}
