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
    log(a, { sedang: a.tasks[a.step], sibuk: a.busy });
    ui.refresh(a);
    if (onShow) onShow(a);
    // tugas terakhir dalam senarai selesai = report dihantar ke Command
    if (!a.home.standing && ((a.step === 0 && prev !== 0) || Math.random() < 0.12)) {
      const done = a.tasks[prev];
      a.sampleReport = { report: `Report contoh: "${done}" selesai. Tiada isu besar.`, reportPada: new Date().toISOString() };
      log(a, { report: a.sampleReport.report });
      ui.refresh(a);
      if (onReport) onReport(a);
    }
    // sekali-sekala, agent perlukan keputusan Danial
    const open = agents.filter(x => x.decision).length;
    if (onDecision && open < 2 && Math.random() < 0.08) {
      const cand = agents.filter(x => !x.decision && x.sampleDecisions.length);
      const b = cand[Math.floor(Math.random() * cand.length)];
      if (b) { b.decision = b.sampleDecisions[Math.floor(Math.random() * b.sampleDecisions.length)]; log(b, { keputusan: b.decision }); ui.refresh(b); onDecision(b); }
    }
  }

  const id = setInterval(tick, 2600);
  tick(); setTimeout(tick, 900);
  return () => clearInterval(id);
}

// Log aktiviti contoh (sama format dengan /api/log)
export function log(a, entry) {
  a.sampleLog = a.sampleLog || [];
  a.sampleLog.unshift({ masa: new Date().toISOString(), ...entry });
  a.sampleLog.length = Math.min(a.sampleLog.length, 50);
}

export function initSample(agents) {
  agents.forEach(a => {
    a.step = 0; a.busy = Math.random() < 0.5; a.decision = null; a.sampleReport = null; a.sampleLog = [];
    log(a, { sedang: a.tasks[0], sibuk: a.busy });
  });
}
