import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Prototaip asal guna three.js r128 (pencahayaan "legacy", tanpa pengurusan warna).
// Tetapan di bawah kekalkan rupa yang sama pada three.js moden.
THREE.ColorManagement.enabled = false;
const LEGACY_LIGHT = Math.PI;

export function createStage(canvas, reduceMotion) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x060913);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x060913, 40, 90);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 8;
  controls.maxDistance = 60;
  controls.maxPolarAngle = Math.PI * 0.46;
  controls.enablePan = false;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.35;

  scene.add(new THREE.HemisphereLight(0xbfd0ff, 0x10131f, 0.55 * LEGACY_LIGHT));
  const key = new THREE.DirectionalLight(0xffffff, 0.85 * LEGACY_LIGHT);
  key.position.set(6, 14, 8);
  scene.add(key);

  scene.add(stars());

  return { renderer, scene, camera, controls };
}

function stars() {
  const g = new THREE.BufferGeometry(), n = 1800, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 60 + Math.random() * 90, t = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1, s = Math.sqrt(1 - u * u);
    p[i * 3] = r * s * Math.cos(t);
    p[i * 3 + 1] = r * u * 0.8 + 10;
    p[i * 3 + 2] = r * s * Math.sin(t);
  }
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 0.35, sizeAttenuation: true, transparent: true, opacity: 0.8 }));
}
