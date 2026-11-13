import * as THREE from "three";

// Gerakan kamera: pandangan utama, fokus pejabat, fokus agent.
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function createCameraRig(camera, controls, offices, view, reduceMotion) {
  // Titik tengah dan skala dikira dari susun atur (src/config.js)
  const homeTarget = new THREE.Vector3(...view.target);
  let tween = null;

  const frameDist = () => { const asp = innerWidth / innerHeight; return asp < 0.8 ? 30 : asp < 1.2 ? 24 : 20; };
  // Jarak supaya seluruh lebar markas muat dalam skrin (penting untuk phone tegak)
  const widthFit = () => {
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (innerWidth / innerHeight);
    return (view.width + 2) / (2 * halfH) / 1.03;
  };
  const homePos = () => { const d = Math.max(frameDist() * view.scale, widthFit()); return homeTarget.clone().add(new THREE.Vector3(0, d * 0.62 - 1, d * 0.82 + 0.6)); };

  function focus(key, agentPos) {
    let tgt, pos;
    if (!key) { tgt = homeTarget.clone(); pos = homePos(); }
    else {
      const base = new THREE.Vector3(...offices[key].pos);
      tgt = agentPos ? agentPos.clone().setY(1) : base.clone().setY(0.8);
      const d = (agentPos ? 8 : 15.5) * (innerWidth / innerHeight < 0.8 ? 1.45 : 1);
      const dir = tgt.clone().setY(0).normalize(); if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
      pos = tgt.clone().add(new THREE.Vector3(dir.x * d * 0.35, d * 0.6, d * 0.8));
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
