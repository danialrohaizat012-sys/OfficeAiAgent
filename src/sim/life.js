import { officeSpots } from "../scene/spots.js";

// Kehidupan pejabat: pekerja yang tidak sibuk sekali-sekala bangun, berjalan
// ke pantri / sofa / whiteboard / rakan sekerja, kemudian kembali ke meja.
// Ini hiasan visual sahaja; ia tidak mengubah status atau tugas agent.

const SPEED = 1.15;          // unit sesaat
const STAND_TIME = 0.45;     // masa bangun / duduk (saat)
const rand = (a, b) => a + Math.random() * (b - a);

// Waktu kerja: pekerja datang ikut lif dan berjalan ke meja, petang balik ke lif.
// Nadi (Virtual CEO, AI) sentiasa ada. Agent yang sedang sibuk (mod Hidup) kekal walaupun lewat.
export function createLife(offices, agents, { onErrand, hour = () => 12, shift = { masuk: 8.5, balik: 18 }, lift = null, groups = {}, onMeetSeat } = {}) {
  const spotsByOffice = {};
  for (const [k, o] of Object.entries(offices)) if (o.kind === "office") spotsByOffice[k] = officeSpots(o.plan, o.theme).spots;
  const taken = new Set();
  const lobbyOf = o => ({ x: o.plan.W / 2 - 0.9, z: o.plan.backZ + 1.4 });
  const backLane = o => o.plan.lanes.back;
  agents.forEach((a, i) => {
    a.shiftIn = shift.masuk - 0.5 + (i % 6) * 0.15;
    a.shiftOut = shift.balik + ((i * 7) % 8) * 0.15;
  });
  const onDuty = a => {
    if (a.home.leader || a.home.standing) return true;
    if (a.live && a.live.sibuk) return true;
    const h = hour();
    return h >= a.shiftIn && h < a.shiftOut;
  };
  const toLobby = a => {
    const o = offices[a.office], L = lobbyOf(o), lane = backLane(o);
    return [{ x: 0, z: a.home.z }, { x: 0, z: lane }, { x: L.x, z: lane }, L];
  };

  for (const a of agents) {
    a.life = {
      mode: "seated", sit: a.home.standing ? 0 : 1, sitTarget: a.home.standing ? 0 : 1, seatY: 0.5,
      timer: rand(4, 20), path: [], face: 0, walk: null, spot: null,
    };
    if (a.home.standing) a.life.mode = "fixed";
    if (!onDuty(a)) goAway(a);
  }

  function goAway(a) {
    const L = a.life;
    L.mode = "away"; L.sit = L.sitTarget = 0; L.walk = null; a.away = true;
    a.mesh.visible = false;
  }

  // Laluan: keluar ke lorong tengah (x = 0), ikut lorong ke baris sasaran, kemudian ke sasaran
  function route(from, to, lane) {
    const pts = [{ x: 0, z: from.z }, { x: 0, z: lane }, { x: to.x, z: lane }, { x: to.x, z: to.z }];
    return pts.filter((p, i) => {
      const prev = i ? pts[i - 1] : from;
      return Math.hypot(p.x - prev.x, p.z - prev.z) > 0.01;
    });
  }

  function pickErrand(a) {
    const options = (spotsByOffice[a.office] || []).filter(s => !taken.has(a.office + s.id));
    // lawat rakan sekerja di pejabat sama yang sedang duduk
    const mates = agents.filter(b => b !== a && b.office === a.office && b.life.mode === "seated" && !taken.has(a.office + "rakan" + b.id));
    if (mates.length && Math.random() < 0.3) {
      const b = mates[Math.floor(Math.random() * mates.length)];
      const side = b.home.x < 0 ? -1 : 1;
      return { id: "rakan" + b.id, x: side * 0.75, z: b.home.z, face: side * Math.PI / 2, pose: "stand", lane: b.home.z,
        label: `💬 Bincang dengan ${b.name}` };
    }
    if (!options.length) return null;
    return options[Math.floor(Math.random() * options.length)];
  }

  function startWalk(a, path, then) {
    const L = a.life;
    L.path = path; L.then = then; L.mode = "rising"; L.sitTarget = 0;
  }

  let clock = 0, exitSlot = 0;
  function update(dt) {
    clock += dt;
    for (const a of agents) {
      const L = a.life;
      if (L.mode === "fixed") continue;
      const m = a.mesh;
      // duduk / bangun secara lembut
      L.sit += Math.sign(L.sitTarget - L.sit) * Math.min(Math.abs(L.sitTarget - L.sit), dt / STAND_TIME);

      if (L.mode === "away") {
        if (onDuty(a)) {
          L.mode = "lift";
          const o = offices[a.office];
          const appear = () => {
            const P = lobbyOf(o);
            m.position.set(P.x, 0, P.z); m.visible = true; a.away = false;
            L.mode = "walking"; L.walk = 0; L.then = "home"; L.sit = L.sitTarget = 0;
            L.path = [{ x: P.x, z: backLane(o) }, { x: 0, z: backLane(o) }, { x: 0, z: a.home.z }, { x: a.home.x, z: a.home.z }];
            if (onErrand) onErrand(a, "👋 Selamat pagi! Baru sampai");
          };
          if (lift) lift.go(o.floor, appear, 0.6); else appear();
        }
        continue;
      }
      if (L.mode === "lift") continue;
      if (L.mode === "lobbyWait") { L.timer -= dt; if (L.timer <= 0) L.onExit(); continue; }
      // dipanggil mesyuarat: ketua naik lif ke Pejabat CEO; Nadi jalan ke kepala meja
      if (L.summon && L.mode === "seated" && L.sit > 0.95) {
        const P = L.summon; L.summon = null; L.meet = P;
        if (P.viaLift && lift) startWalk(a, toLobby(a), "meetLift");
        else { startWalk(a, P.pathIn.slice(P.viaLift ? 1 : 0), "meetSeat"); if (P.viaLift) teleport(a, P.hubKey, P.pathIn[0]); }
        continue;
      }
      if (L.mode === "meeting") {
        if (L.dismiss && (L.dismissAt ?? 0) <= clock) { L.dismiss = false; startWalk(a, L.meet.pathOut.slice(), L.meet.viaLift ? "meetBack" : "home"); }
        else { let diff = L.face - m.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); m.rotation.y += diff * Math.min(1, dt * 8); }
        continue;
      }
      if (L.mode === "seated" && !onDuty(a) && L.sit > 0.95) {
        if (onErrand) onErrand(a, "🏠 Balik dulu. Jumpa esok!");
        startWalk(a, toLobby(a), "gone");
        continue;
      }
      if (L.mode === "seated") {
        if (!a.busy) L.timer -= dt;
        if (L.timer <= 0) {
          const spot = pickErrand(a);
          L.timer = rand(10, 30);
          if (spot) {
            taken.add(a.office + spot.id); L.spot = spot;
            startWalk(a, route(a.home, spot, spot.lane), "arrive");
          }
        }
      } else if (L.mode === "rising") {
        if (L.sit <= 0.02) { L.mode = "walking"; L.walk = 0; }
      } else if (L.mode === "walking") {
        const p = L.path[0];
        const dx = p.x - m.position.x, dz = p.z - m.position.z, d = Math.hypot(dx, dz);
        const step = SPEED * dt;
        if (d <= step) {
          m.position.x = p.x; m.position.z = p.z; L.path.shift();
          if (!L.path.length) arrive(a);
        } else {
          m.position.x += dx / d * step; m.position.z += dz / d * step;
          L.face = Math.atan2(dx, dz);
        }
        L.walk += dt * 9;
      } else if (L.mode === "at") {
        L.timer -= dt;
        if (L.timer <= 0 || (a.busy && L.timer < 6)) {
          const s = L.spot;
          // laluan pulang: sasaran -> lorong -> lorong tengah -> meja
          const home = [{ x: s.x, z: s.lane }, { x: 0, z: s.lane }, { x: 0, z: a.home.z }, { x: a.home.x, z: a.home.z }]
            .filter((p, i, arr) => Math.hypot(p.x - (i ? arr[i - 1].x : s.x), p.z - (i ? arr[i - 1].z : s.z)) > 0.01);
          taken.delete(a.office + s.id); L.spot = null;
          startWalk(a, home, "home");
        }
      }
      // pusing badan ke arah sasaran dengan lembut
      let diff = L.face - m.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      m.rotation.y += diff * Math.min(1, dt * 8);
    }
  }

  // pindah figura ke tingkat lain (anak kumpulan tingkat itu), koordinat tempatan sama
  function teleport(a, key, p) {
    groups[key].add(a.mesh); a.mesh.position.set(p.x, 0, p.z); a.mesh.visible = true;
    a.at = key === a.office ? null : key;
  }

  function arrive(a) {
    const L = a.life, m = a.mesh;
    L.walk = null;
    if (L.then === "meetLift") {
      const P = L.meet, o = offices[a.office];
      m.visible = false; L.mode = "lift";
      lift.go(o.floor, () => lift.go(lift.topFloor, () => {
        // keluar lif seorang demi seorang
        L.mode = "lobbyWait"; L.timer = (exitSlot = Math.max(exitSlot, clock) + 1.3) - clock;
        L.onExit = () => { teleport(a, P.hubKey, P.pathIn[0]); L.mode = "walking"; L.walk = 0; L.then = "meetSeat"; L.path = P.pathIn.slice(1); };
      }, 0.5), 0.5);
      return;
    }
    if (L.then === "meetSeat") {
      const st = L.meet.seat;
      L.mode = "meeting"; L.face = st.face; L.sitTarget = 1; L.seatY = 0.5; a.inMeeting = true;
      if (onMeetSeat) onMeetSeat(a);
      return;
    }
    if (L.then === "meetBack") {
      const o = offices[a.office];
      m.visible = false; L.mode = "lift"; a.inMeeting = false;
      lift.go(lift.topFloor, () => lift.go(o.floor, () => {
        const P = lobbyOf(o); teleport(a, a.office, P);
        L.mode = "walking"; L.walk = 0; L.then = "home";
        L.path = [{ x: P.x, z: backLane(o) }, { x: 0, z: backLane(o) }, { x: 0, z: a.home.z }, { x: a.home.x, z: a.home.z }];
      }, 0.5), 0.5);
      return;
    }
    if (L.then === "gone") {
      if (lift) lift.go(offices[a.office].floor, null, 0.6);
      goAway(a); return;
    }
    if (L.then === "home") {
      a.inMeeting = false;
      L.mode = "seated"; L.face = 0; L.sitTarget = 1; L.seatY = 0.5; L.timer = rand(12, 35);
    } else {
      const s = L.spot;
      L.mode = "at"; L.face = s.face; L.sitTarget = s.pose === "sit" ? 1 : 0; L.seatY = s.seatY ?? 0.5;
      L.timer = s.pose === "sit" ? rand(8, 14) : rand(4, 8);
      if (onErrand) onErrand(a, s.label);
    }
  }

  // keadaan untuk animasi figura
  function pose(a) {
    const L = a.life;
    const atDesk = L.mode === "seated" && L.sit > 0.95;
    return { sit: L.sit, seatY: L.seatY, walk: L.walk, typing: atDesk && a.busy };
  }

  // Mesyuarat: plan = { hubKey, seat, pathIn, pathOut, viaLift }
  const summon = (a, plan) => { a.life.summon = plan; a.life.dismiss = false; };
  const dismiss = (a, delay = 0) => { if (a.life.summon) a.life.summon = null; else { a.life.dismiss = true; a.life.dismissAt = clock + delay; } };
  return { update, pose, summon, dismiss };
}
