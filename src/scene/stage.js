import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Prototaip asal guna three.js r128 (pencahayaan "legacy", tanpa pengurusan warna).
// Tetapan di bawah kekalkan rupa yang sama pada three.js moden.
THREE.ColorManagement.enabled = false;
const LEGACY_LIGHT = Math.PI;
const BG = 0x0F1B2D; // navy jenama

export function createStage(canvas, reduceMotion) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(BG);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 45, 100);

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

  // Pencahayaan pejabat: cahaya langit lembut + matahari hangat yang buat bayang-bayang
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a2236, 0.6 * LEGACY_LIGHT));
  const key = new THREE.DirectionalLight(0xfff1dc, 0.85 * LEGACY_LIGHT);
  key.position.set(7, 16, 9);
  key.castShadow = true;
  const size = Math.min(innerWidth, innerHeight) < 600 ? 1024 : 2048;
  key.shadow.mapSize.set(size, size);
  Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 50 });
  key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
  scene.add(key);

  return { renderer, scene, camera, controls };
}

// Hidupkan bayang-bayang untuk semua objek pepejal (bukan kaca, cahaya atau hologram)
export function enableShadows(root) {
  root.traverse(m => {
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    const solid = mats.every(x => x.isMeshStandardMaterial && !x.transparent);
    m.castShadow = solid;
    m.receiveShadow = mats.some(x => x.isMeshStandardMaterial);
  });
}
