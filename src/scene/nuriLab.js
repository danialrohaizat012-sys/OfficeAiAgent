import * as THREE from "three";

// Makmal Nuri: persembahan 3D sahaja. Tiada latihan model atau sambungan hardware.
const metal = new THREE.MeshStandardMaterial({ color: 0x28354b, metalness: 0.55, roughness: 0.35 });
const white = new THREE.MeshStandardMaterial({ color: 0xe7f5ff, roughness: 0.35 });
const cyan = new THREE.MeshStandardMaterial({ color: 0x4fbf9f, emissive: 0x1f7a60, emissiveIntensity: 0.35 });   // hijau-teal jenama Cipta Robo
const screen = new THREE.MeshBasicMaterial({ color: 0x081c32 });
const glow = new THREE.MeshBasicMaterial({ color: 0x8ff0cf });

function add(g, geometry, material, x, y, z) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  g.add(m);
  return m;
}
const cube = (g, w, h, d, mat, x, y, z) => add(g, new THREE.BoxGeometry(w, h, d), mat, x, y, z);

function displayTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#15191d"; ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = "#4fbf9f"; ctx.font = "bold 35px sans-serif";
  ctx.fillText("CIPTA ROBO · NURI", 30, 57);
  ctx.fillStyle = "#ffcc72"; ctx.font = "bold 23px sans-serif";
  ctx.fillText("● SIMULASI / DEMO", 30, 98);
  ctx.fillStyle = "#e6ebe8"; ctx.font = "22px sans-serif";
  ctx.fillText("Muhafiz  •  Hardware & prototaip", 30, 146);
  ctx.fillText("Reka  •  Website, 3D & reka bentuk", 30, 182);
  ctx.fillStyle = "#4fbf9f"; ctx.fillText("NURI Base · sasaran RM999", 30, 226);
  return new THREE.CanvasTexture(c);
}

export function buildNuriLab() {
  const group = new THREE.Group();
  // Satu meja eksperimen besar, bukan dua workstation berasingan.
  cube(group, 4.2, 0.12, 1.7, metal, 0, 0.75, 0.65);
  for (const x of [-1.85, 1.85]) for (const z of [0.05, 1.3])
    cube(group, 0.09, 0.73, 0.09, metal, x, 0.365, z);
  cube(group, 4.25, 0.045, 0.06, cyan, 0, 0.77, 1.52);
  // Alas robotik bercahaya.
  add(group, new THREE.CylinderGeometry(0.65, 0.7, 0.12, 32), metal, 0, 0.88, 0.65);
  add(group, new THREE.CylinderGeometry(0.56, 0.56, 0.025, 32), cyan, 0, 0.95, 0.65);

  // Nuri: robot desktop comel dengan muka digital, kepala bergerak, antena.
  const nuri = new THREE.Group();
  nuri.position.set(0, 0.97, 0.65);
  cube(nuri, 0.58, 0.43, 0.40, white, 0, 0.28, 0);
  cube(nuri, 0.36, 0.09, 0.3, metal, 0, 0.06, 0);
  for (const side of [-1, 1]) {
    add(nuri, new THREE.SphereGeometry(0.12, 12, 10), cyan, side * 0.36, 0.28, 0);
    cube(nuri, 0.11, 0.1, 0.23, white, side * 0.21, 0.07, 0);
  }
  const head = new THREE.Group();
  head.position.set(0, 0.69, 0);
  cube(head, 1.03, 0.75, 0.64, white, 0, 0, 0);
  cube(head, 0.87, 0.55, 0.035, screen, 0, 0, 0.337);
  const leftEye = cube(head, 0.13, 0.14, 0.018, glow, -0.20, 0.05, 0.362);
  const rightEye = cube(head, 0.13, 0.14, 0.018, glow, 0.20, 0.05, 0.362);
  cube(head, 0.23, 0.03, 0.018, glow, 0, -0.16, 0.362);
  cube(head, 0.07, 0.25, 0.07, metal, 0, 0.49, 0);
  add(head, new THREE.SphereGeometry(0.09, 12, 8), cyan, 0, 0.63, 0);
  nuri.add(head); group.add(nuri);

  // Dua kerusi kerja berhadapan dengan robot; figura pekerja ditambah oleh world.js.
  for (const x of [-1.25, 1.25]) {
    cube(group, 0.56, 0.10, 0.52, metal, x, 0.42, -0.55);
    cube(group, 0.56, 0.60, 0.09, metal, x, 0.79, -0.82);
    cube(group, 0.06, 0.36, 0.06, white, x, 0.19, -0.55);
  }
  // Skrin eksperimen di belakang makmal.
  cube(group, 2.8, 1.47, 0.09, metal, 0, 1.58, -3.11);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.62, 1.31),
    new THREE.MeshBasicMaterial({ map: displayTexture() }));
  board.position.set(0, 1.58, -3.055);
  group.add(board);

  // Peralatan di kiri-kanan meja.
  for (const x of [-1.58, 1.58]) {
    cube(group, 0.48, 0.055, 0.36, metal, x, 0.84, 0.46);
    cube(group, 0.43, 0.35, 0.05, cyan, x, 1.06, 0.26);
  }

  return {
    group,
    update(t) {
      head.rotation.y = Math.sin(t * 0.9) * 0.22;
      head.rotation.z = Math.sin(t * 0.65) * 0.055;
      nuri.position.y = 0.97 + Math.sin(t * 1.5) * 0.025;
      const blink = Math.sin(t * 2.3) > 0.992 ? 0.10 : 1;
      leftEye.scale.y = blink;
      rightEye.scale.y = blink;
    },
  };
}
