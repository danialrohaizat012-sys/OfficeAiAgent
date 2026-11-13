import * as THREE from "three";

// Gerakan kamera: pandangan utama, fokus pejabat, fokus agent.
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function createCameraRig(camera, controls, offices, reduceMotion) {
  const homeTarget = new THREE.Vector3(0, 1, -0.6);
  let tween = null;

  const frameDist = () => { const asp = innerWidth / innerHeight; return asp < 0.8 ? 30 : asp < 1.2 ? 24 : 20; };
  const homePos = () => { const d = frameDist(); return new THREE.Vector3(0, d * 0.62, d * 0.82); };

  function focus(key, agentPos) {
    let tgt, pos;
    if (!key) { tgt = homeTarget.clone(); pos = homePos(); }
    else {
      const base = new THREE.Vector3(...offices[key].pos);
      tgt = agentPos ? agentPos.clone().setY(1) : base.clone().setY(0.8);
      const d = (agentPos ? 8 : 13) * (innerWidth / innerHeight < 0.8 ? 1.45 : 1);
      const dir = tgt.clone().setY(0).normalize(); if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
      pos = tgt.clone().add(new THREE.Vector3(dir.x * d * 0.35, d * 0.6, d * 0.8));
    }
    tween = { t: 0, dur: reduceMotion ? 1 : 1.1, p0: camera.position.clone(), p1: pos, t0: controls.target.clone(), t1: tgt };
    controls.autoRotate = false;
  }

  function goHome() { camera.position.copy(homePos()); controls.target.copy(homeTarget); }

  function update(dt) {
    if (!tween) return;
    tween.t += dt / tween.dur;
    const k = ease(Math.min(tween.t, 1));
    camera.position.lerpVectors(tween.p0, tween.p1, k);
    controls.target.lerpVectors(tween.t0, tween.t1, k);
    if (tween.t >= 1) tween = null;
  }

  controls.addEventListener("start", () => { tween = null; controls.autoRotate = false; });

  return { focus, goHome, update, homePos, get moving() { return !!tween; } };
}
