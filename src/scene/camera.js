import * as THREE from "three";

// Gerakan kamera: pandangan utama, fokus pejabat, fokus agent.
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function createCameraRig(camera, controls, offices, view, reduceMotion) {
  // Titik tengah dan skala dikira dari susun atur (src/config.js)
  const homeTarget = new THREE.Vector3(...view.target);
  let tween = null;

  const tanV = () => Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  // Jarak supaya seluruh menara (tinggi dan lebar) muat dalam skrin
  const homeDist = () => {
    const byH = (view.height / 2 + 2.5) / tanV();
    const byW = (view.width + 3) / 2 / (tanV() * (innerWidth / innerHeight));
    return Math.max(byH, byW) * 1.02;
  };
  const homePos = () => { const d = homeDist(); return homeTarget.clone().add(new THREE.Vector3(d * 0.18, d * 0.2, d * 0.96)); };

  function focus(key, agentPos) {
    let tgt, pos;
    const portrait = innerWidth / innerHeight < 0.8;
    if (!key) { tgt = homeTarget.clone(); pos = homePos(); }
    else {
      const o = offices[key];
      const base = new THREE.Vector3(o.pos[0], o.pos[1], o.pos[2]);
      // pandang dari depan, sedikit atas, supaya lantai tingkat atas tidak menghalang
      tgt = agentPos ? agentPos.clone().setY(o.pos[1] + 1) : base.clone().add(new THREE.Vector3(0, 1.2, 0.3));
      const d = (agentPos ? 7.5 : 12) * (portrait ? 1.45 : 1);
      pos = tgt.clone().add(new THREE.Vector3(d * 0.12, d * 0.24, d * 0.96));
    }
    tween = { t: 0, dur: reduceMotion ? 1 : 1.1, p0: camera.position.clone(), p1: pos, t0: controls.target.clone(), t1: tgt };
    controls.autoRotate = false;
  }

  function goHome() { camera.position.copy(homePos()); controls.target.copy(homeTarget); }

  // Animasi pembukaan: kamera terbang melengkung dari jauh dan tinggi ke pandangan utama
  function intro() {
    if (reduceMotion) { goHome(); return; }
    const end = homePos().sub(homeTarget);
    const r1 = Math.hypot(end.x, end.z), y1 = end.y;
    controls.target.copy(homeTarget);
    controls.autoRotate = false;
    tween = { intro: true, t: 0, dur: 3.4, r1, y1, a1: Math.atan2(end.x, end.z) };
    update(0);
  }

  function update(dt) {
    if (!tween) return;
    if (tween.intro) {
      tween.t += dt / tween.dur;
      const k = ease(Math.min(tween.t, 1));
      const a = tween.a1 - 1.3 * (1 - k), r = tween.r1 * (1 + 1.1 * (1 - k)), y = tween.y1 * (1 + 1.4 * (1 - k));
      camera.position.set(homeTarget.x + Math.sin(a) * r, homeTarget.y + y, homeTarget.z + Math.cos(a) * r);
      if (tween.t >= 1) { tween = null; controls.autoRotate = true; }
      return;
    }
    tween.t += dt / tween.dur;
    const k = ease(Math.min(tween.t, 1));
    camera.position.lerpVectors(tween.p0, tween.p1, k);
    controls.target.lerpVectors(tween.t0, tween.t1, k);
    if (tween.t >= 1) tween = null;
  }

  controls.addEventListener("start", () => { tween = null; controls.autoRotate = false; });

  return { focus, goHome, intro, update, homePos, get moving() { return !!tween; } };
}
