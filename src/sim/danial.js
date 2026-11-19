// Danial (CEO ROI Resources) di taman bumbung: pandu kereta F1 keliling litar.
// Bila Nadi perlukan keputusan: kart masuk pit di garisan mula, Danial turun,
// jalan ke meja dan duduk. Selepas selesai, Danial kembali ke kart dan sambung memandu.
// Hanya Nadi yang jumpa Danial (staf & ketua venture melalui Nadi).

const MAX_V = 2.4, WALK = 1.1, STAND_TIME = 0.4;
const KART_SEAT = { x: 0, y: -0.02, z: -0.02 };   // kedudukan Danial dalam kokpit F1 (unit kereta sebelum skala)

export function createDanial({ mesh, kart, hub, roof }) {
  const P = roof.track, N = P.length, Y = roof.y;
  const cum = [0];
  for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(P[i % N].x - P[i - 1].x, P[i % N].z - P[i - 1].z));
  const L = cum[N], pitS = 0;                     // pit = garisan mula (titik 0)
  const at = s => {
    s = ((s % L) + L) % L;
    let i = 1; while (cum[i] < s) i++;
    const a = P[i - 1], b = P[i % N], f = (s - cum[i - 1]) / (cum[i] - cum[i - 1]);
    return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, h: Math.atan2(b.x - a.x, b.z - a.z) };
  };

  let mode = "drive", s = 0.5, v = 0, sit = 1, sitTarget = 1, face = 0, walk = null, path = [], wantMeet = false;
  const seat = roof.danial;
  const aisle = roof.aisleX;

  function mount() {
    kart.add(mesh); mesh.position.set(KART_SEAT.x, KART_SEAT.y, KART_SEAT.z); mesh.rotation.y = 0;
    mesh.scale.setScalar(1 / kart.scale.x);
    if (mesh.userData.setHelmet) mesh.userData.setHelmet(true);    // pakai topi keledar dalam kereta
  }
  function dismount() {
    const p = at(s);
    hub.add(mesh); mesh.scale.setScalar(1);
    if (mesh.userData.setHelmet) mesh.userData.setHelmet(false);   // tanggal topi keledar ke meja
    mesh.position.set(p.x + 0.6, Y, p.z); mesh.rotation.y = Math.PI / 2;
  }
  mount();
  place();

  function place() {
    const p = at(s);
    kart.position.set(p.x, Y, p.z); kart.rotation.y = p.h;
  }

  function update(dt, t) {
    sit += Math.sign(sitTarget - sit) * Math.min(Math.abs(sitTarget - sit), dt / STAND_TIME);
    if (mode === "drive" || mode === "pit") {
      let target = MAX_V;
      if (mode === "pit") {
        const left = ((pitS - s) % L + L) % L;
        target = Math.max(0.25, Math.min(MAX_V, left * 1.4));
        if (left < 0.04) {
          v = 0; s = pitS + Math.floor(s / L + 0.5) * L; place();
          dismount(); sitTarget = 0; mode = "rise";
          const p = at(s);
          path = [{ x: aisle, z: p.z }, { x: aisle, z: seat.z }, { x: seat.x, z: seat.z }];
          return;
        }
      }
      v += Math.sign(target - v) * Math.min(Math.abs(target - v), dt * 1.5);
      s += v * dt; place();
      kart.position.y = Y + Math.abs(Math.sin(t * 22)) * 0.008 * (v / MAX_V);   // getaran enjin
      return;
    }
    if (mode === "rise") { if (sit <= 0.02) { mode = "walk"; walk = 0; } return; }
    if (mode === "walk" || mode === "back") {
      const p = path[0], dx = p.x - mesh.position.x, dz = p.z - mesh.position.z, d = Math.hypot(dx, dz), st = WALK * dt;
      if (d <= st) {
        mesh.position.x = p.x; mesh.position.z = p.z; path.shift();
        if (!path.length) {
          walk = null;
          if (mode === "walk") { mode = "table"; face = seat.face; sitTarget = 1; }
          else { mount(); mode = wantMeet ? "pit" : "drive"; sitTarget = 1; sit = 1; v = 0; }
        }
      } else { mesh.position.x += dx / d * st; mesh.position.z += dz / d * st; face = Math.atan2(dx, dz); }
      if (walk != null) walk += dt * 9;
      let df = face - mesh.rotation.y; df = Math.atan2(Math.sin(df), Math.cos(df)); mesh.rotation.y += df * Math.min(1, dt * 8);
      return;
    }
    if (mode === "table") {
      let df = face - mesh.rotation.y; df = Math.atan2(Math.sin(df), Math.cos(df)); mesh.rotation.y += df * Math.min(1, dt * 8);
      if (!wantMeet && sit > 0.95) {
        sitTarget = 0; mode = "leave";
        const p = at(pitS);
        path = [{ x: aisle, z: seat.z }, { x: aisle, z: p.z }, { x: p.x + 0.6, z: p.z }];
      }
      return;
    }
    if (mode === "leave") { if (sit <= 0.02) { mode = "back"; walk = 0; } }
  }

  return {
    update,
    // Nadi datang: masuk pit dan ke meja
    requestMeeting() { wantMeet = true; if (mode === "drive") mode = "pit"; },
    release() { wantMeet = false; },
    get mode() { return mode; },
    get atTable() { return mode === "table" && sit > 0.9; },
    get driving() { return mode === "drive" || mode === "pit"; },
    pose() {
      const inKart = mode === "drive" || mode === "pit";
      return { sit: inKart ? 1 : sit, seatY: inKart ? 0.24 : 0.5, walk, typing: inKart || (mode === "table" && !wantMeet) };
    },
  };
}
