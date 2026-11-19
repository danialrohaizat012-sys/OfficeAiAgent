// Mesyuarat ketua venture dengan Nadi di Pejabat CEO (tingkat paling atas).
// Ketua jalan ke lif, naik ke tingkat CEO, duduk di kerusi warna venture; Nadi duduk
// di kepala meja. Selepas perbincangan, semua kembali ke meja masing-masing.
// Dicetus bila: ada perkara perlu keputusan, mesyuarat pagi harian, atau butang dalam panel Nadi.

const GATHER_MAX = 120;    // saat maksimum menunggu semua sampai
const LINE_GAP = 3.6;     // saat antara setiap giliran bercakap

export function createMeetings({ offices, agents, life, say, toast, onLog, reduce = false, current }) {
  const hubKey = Object.keys(offices).find(k => offices[k].kind === "hub");
  const hub = offices[hubKey], M = hub.meet;
  const nadi = agents.find(a => a.home.leader);
  const leaderOf = key => agents.find(a => a.office === key && a.lead);
  const ventures = Object.entries(offices).filter(([, o]) => o.kind === "office");
  let state = null, pending = [], lastEnd = -1e9, clock = 0;

  // Laluan dari lobi lif tingkat CEO ke kerusi (ikut lorong depan meja, kemudian lorong sisi)
  function planFor(a) {
    const o = offices[a.office];
    const seat = M.seats[o.floor % M.seats.length];
    const pathIn = [M.lobby, { x: M.aisleX, z: M.lobby.z }, { x: M.aisleX, z: M.frontZ }, { x: seat.lane, z: M.frontZ }, { x: seat.lane, z: seat.z }, { x: seat.x, z: seat.z }];
    return { hubKey, seat, pathIn, pathOut: pathIn.slice(0, -1).reverse(), viaLift: true };
  }
  function nadiPlan() {
    const h = nadi.home, H = M.head, side = -1.6;
    const pathIn = [{ x: side, z: h.z }, { x: side, z: H.z }, { x: H.x, z: H.z }];
    return { hubKey, seat: H, pathIn, pathOut: [{ x: side, z: H.z }, { x: side, z: h.z }, { x: h.x, z: h.z }], viaLift: false };
  }

  // who: senarai id pejabat venture (kosong = semua). Pulangkan false kalau tiada ketua boleh hadir.
  function call(keys, reason) {
    if (state) { if (pending.length < 3 && !pending.some(p => p.reason === reason)) pending.push({ keys, reason }); return true; }
    const list = (keys && keys.length ? keys : ventures.map(([k]) => k)).map(leaderOf)
      .filter(a => a && !a.away && !a.inMeeting);
    if (!list.length || !nadi) return false;
    state = { list, reason, phase: "gather", t: 0, lines: [], said: 0 };
    toast(`🗓️ Nadi panggil mesyuarat: ${list.map(a => a.name).join(", ")}`);
    say(nadi, `🗓️ Mesyuarat: ${reason}`);
    list.forEach(a => say(a, "🛗 Naik ke Pejabat CEO untuk mesyuarat"));
    if (!reduce) { list.forEach(a => life.summon(a, planFor(a))); life.summon(nadi, nadiPlan()); }
    return true;
  }

  function startTalk() {
    const s = state;
    s.phase = "talk"; s.t = 0;
    s.lines = [
      [nadi, `📋 ${s.reason}`],
      ...s.list.map(a => [a, `📊 ${offices[a.office].short}: ${current(a)}`]),
      [nadi, s.list.length > 1 ? "✅ Baik. Teruskan ikut keutamaan. Terima kasih semua!" : `✅ Baik ${s.list[0].name}, saya sediakan ringkasan untuk Danial.`],
    ];
    s.said = 0;
  }

  function finish() {
    const s = state; state = null; lastEnd = clock;
    if (!reduce) { s.list.forEach((a, i) => life.dismiss(a, i * 1.1)); life.dismiss(nadi, s.list.length * 1.1); }
    onLog(nadi, `Mesyuarat dengan ${s.list.map(a => a.name).join(", ")}: ${s.reason}`);
    s.list.forEach(a => say(a, "🛗 Kembali ke pejabat"));
  }

  function update(dt) {
    clock += dt;
    if (!state) {
      if (pending.length && clock - lastEnd > 8) { const p = pending.shift(); call(p.keys, p.reason); }
      return;
    }
    const s = state;
    s.t += dt;
    if (s.phase === "gather") {
      const ready = reduce || (s.list.every(a => a.inMeeting || a.away) && nadi.inMeeting);
      if (ready || s.t > GATHER_MAX) startTalk();
    } else if (s.phase === "talk") {
      if (s.said < s.lines.length && s.t >= s.said * LINE_GAP) { const [a, text] = s.lines[s.said++]; say(a, text); }
      if (s.said >= s.lines.length && s.t > s.lines.length * LINE_GAP + 1.5) finish();
    }
  }

  return {
    call, update, leaderOf,
    get active() { return !!state; },
    get idleFor() { return state ? 0 : clock - lastEnd; },
  };
}
