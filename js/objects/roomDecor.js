import * as THREE from 'three';
import { scene } from '../scene/sceneSetup.js';
import { canvasTexture } from '../scene/sceneUtils.js';

// Shared materials let the room's existing batching keep these little sets cheap.
export function addRoomDecor(box) {
  const cream = new THREE.MeshLambertMaterial({ color: 0xf3e7cb });
  const sage = new THREE.MeshLambertMaterial({ color: 0x85a28b });
  const dark = new THREE.MeshLambertMaterial({ color: 0x34493e });
  const peach = new THREE.MeshLambertMaterial({ color: 0xd98a72 });
  const gold = new THREE.MeshLambertMaterial({ color: 0xe0bd6e });
  const blue = new THREE.MeshLambertMaterial({ color: 0x729da9 });
  const pink = new THREE.MeshLambertMaterial({ color: 0xc68aa0 });
  const wood = new THREE.MeshLambertMaterial({ color: 0xac805a });
  const leaf = new THREE.MeshLambertMaterial({ color: 0x567e54 });
  const lightLeaf = new THREE.MeshLambertMaterial({ color: 0x94b575 });
  const glow = new THREE.MeshLambertMaterial({ color: 0xf7d98c, emissive: 0xffcc66, emissiveIntensity: 0.18 });
  const shapes = [cream, peach, sage, blue, pink, gold];
  const makeGroup = (name, x, z, rotation = 0) => {
    const group = new THREE.Group(); group.name = name;
    group.position.set(x, 0, z); group.rotation.y = rotation; scene.add(group); return group;
  };
  const cube = (parent, mat, w, h, d, x, y, z) => box(w, h, d, mat, x, y, z, true, parent);
  const sphere = (parent, mat, radius, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 0), mat);
    mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  const arcade = makeGroup('CozyArcade', -6.9, 2.6, 0.32);
  cube(arcade, dark, 1.65, 0.16, 1.35, 0, 0.13, 0);
  cube(arcade, sage, 1.5, 1.75, 1.15, 0, 1.06, 0);
  cube(arcade, cream, 1.58, 0.16, 1.45, 0, 1.98, 0.12);
  cube(arcade, dark, 1.44, 1.34, 0.85, 0, 2.72, -0.23);
  for (const x of [-0.78, 0.78]) {
    cube(arcade, cream, 0.13, 3.25, 1.2, x, 1.84, -0.1);
    cube(arcade, peach, 0.15, 0.11, 1.22, x, 1.6, -0.1);
  }
  cube(arcade, sage, 1.72, 0.42, 1.32, 0, 3.65, -0.1);
  cube(arcade, gold, 1.55, 0.06, 1.35, 0, 3.91, -0.1);
  const marquee = new THREE.MeshBasicMaterial({ map: canvasTexture(ctx => {
    ctx.fillStyle = '#d8e8bb'; ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#405943'; ctx.font = 'bold 27px monospace'; ctx.textAlign = 'center'; ctx.fillText('OLAN ARCADE', 128, 42);
    ctx.fillStyle = '#8ea673'; ctx.fillRect(6, 7, 244, 3); ctx.fillRect(6, 54, 244, 3);
  }, 256, 64), toneMapped: false });
  cube(arcade, marquee, 1.4, 0.29, 0.025, 0, 3.64, 0.57);
  const screen = new THREE.MeshBasicMaterial({ map: canvasTexture(ctx => {
    ctx.fillStyle = '#233b3b'; ctx.fillRect(0, 0, 160, 160);
    ctx.fillStyle = '#a4d4b2'; ctx.textAlign = 'center'; ctx.font = 'bold 14px monospace'; ctx.fillText('PLAYER ONE', 80, 27);
    const alien = ['001000100', '000101000', '001111100', '011010110', '111111111', '101111101', '101000101', '000101000'];
    alien.forEach((line, y) => [...line].forEach((p, x) => { if (p === '1') { ctx.fillStyle = y < 4 ? '#cde996' : '#80bc96'; ctx.fillRect(44 + x * 8, 48 + y * 8, 7, 7); } }));
    ctx.fillStyle = '#e5c17a'; ctx.font = '11px monospace'; ctx.fillText('PRESS START', 80, 140);
  }, 160, 160), toneMapped: false });
  screen.map.magFilter = THREE.NearestFilter;
  cube(arcade, screen, 1.2, 1.14, 0.025, 0, 2.78, 0.205);
  cube(arcade, dark, 0.06, 0.24, 0.06, -0.38, 2.18, 0.5);
  sphere(arcade, peach, 0.12, -0.38, 2.32, 0.5);
  [0.19, 0.44].forEach((x, i) => cube(arcade, i ? gold : peach, 0.17, 0.06, 0.17, x, 2.1, 0.52));
  cube(arcade, dark, 0.43, 0.55, 0.035, 0, 1.13, 0.59);
  cube(arcade, gold, 0.2, 0.035, 0.04, 0, 1.24, 0.62);
  cube(arcade, glow, 0.12, 0.12, 0.04, 0, 1.02, 0.62);
  arcade.userData = { clickable: true, id: 'arcade', label: 'ARCADE // PLAYER ONE', accent: glow, on: false };

  // Flower shelves sit on the left wall above the arcade, facing into the room.
  const flowers = makeGroup('FlowerShelves', -7.72, 0.7, Math.PI / 2);
  for (const [y, offset] of [[4.35, 0], [5.7, 0.3]]) {
    cube(flowers, wood, 2.7, 0.12, 0.72, offset, y, 0.28);
    for (const x of [-0.9, 0.9]) {
      cube(flowers, cream, 0.08, 0.5, 0.09, offset + x, y - 0.3, 0.02);
      cube(flowers, cream, 0.08, 0.07, 0.6, offset + x, y - 0.12, 0.3);
    }
    [-0.85, 0, 0.85].forEach((x, i) => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.35, 7), i === 1 ? cream : peach);
      pot.position.set(offset + x, y + 0.24, 0.3); pot.castShadow = true; flowers.add(pot);
      for (let stem = 0; stem < 3; stem++) {
        const sx = offset + x + (stem - 1) * 0.13, sy = y + 0.63 + (stem % 2) * 0.18;
        cube(flowers, leaf, 0.025, 0.4, 0.025, sx, sy - 0.15, 0.3);
        const petalColor = [gold, pink, cream][i];
        for (let j = 0; j < 5; j++) sphere(flowers, petalColor, 0.095, sx + Math.cos(j * Math.PI * 0.4) * 0.095, sy + Math.sin(j * Math.PI * 0.4) * 0.095, 0.34);
        sphere(flowers, gold, 0.06, sx, sy, 0.42);
        const sprig = sphere(flowers, lightLeaf, 0.11, sx + 0.07, sy - 0.2, 0.32); sprig.scale.set(1.4, 0.6, 0.5);
      }
    });
  }
  // A trailing vine breaks the straight shelf edge.
  for (let i = 0; i < 7; i++) sphere(flowers, i % 2 ? leaf : lightLeaf, 0.12, -1.12 + Math.sin(i) * 0.08, 4.42 - i * 0.15, 0.59);

  const cabinet = makeGroup('FigurineCabinet', 7.4, 3.55, -Math.PI / 2);
  cube(cabinet, sage, 1.95, 0.24, 0.88, 0, 0.35, 0);
  cube(cabinet, cream, 1.95, 3.8, 0.12, 0, 2.35, -0.43);
  for (const x of [-0.91, 0.91]) cube(cabinet, cream, 0.13, 4.05, 0.92, x, 2.27, 0);
  for (const y of [0.6, 1.76, 2.93, 4.25]) cube(cabinet, cream, 1.95, 0.12, 0.92, 0, y, 0);
  for (const x of [-0.7, 0.7]) cube(cabinet, wood, 0.13, 0.25, 0.55, x, 0.14, 0);
  const cabinetGlow = glow.clone();
  [1.65, 2.82, 4.12].forEach(y => cube(cabinet, cabinetGlow, 1.64, 0.045, 0.09, 0, y, 0.3));
  const glass = new THREE.MeshLambertMaterial({ color: 0xc7e2d9, transparent: true, opacity: 0.1, depthWrite: false });
  cube(cabinet, glass, 1.64, 3.52, 0.025, 0, 2.43, 0.47);
  cube(cabinet, gold, 0.035, 3.62, 0.03, 0, 2.42, 0.49);
  cube(cabinet, wood, 0.055, 0.25, 0.07, 0.1, 2.2, 0.52);
  // Six distinct tiny toys: astronaut, rabbit, robot, wizard, cat, and adventurer.
  for (let i = 0; i < 6; i++) {
    const x = i % 2 ? 0.43 : -0.43, y = 0.7 + Math.floor(i / 2) * 1.17;
    const color = shapes[i];
    cube(cabinet, wood, 0.6, 0.06, 0.49, x, y, 0);
    cube(cabinet, color, 0.32, 0.32, 0.23, x, y + 0.3, 0);
    cube(cabinet, dark, 0.11, 0.16, 0.17, x - 0.09, y + 0.12, 0);
    cube(cabinet, dark, 0.11, 0.16, 0.17, x + 0.09, y + 0.12, 0);
    cube(cabinet, i === 0 || i === 2 ? cream : gold, 0.35, 0.29, 0.26, x, y + 0.61, 0);
    cube(cabinet, dark, 0.055, 0.045, 0.025, x - 0.085, y + 0.62, 0.142);
    cube(cabinet, dark, 0.055, 0.045, 0.025, x + 0.085, y + 0.62, 0.142);
    for (const side of [-1, 1]) cube(cabinet, color, 0.1, 0.26, 0.14, x + side * 0.23, y + 0.32, 0);
    if (i === 0) cube(cabinet, blue, 0.28, 0.14, 0.03, x, y + 0.63, 0.15);
    if (i === 1 || i === 4) for (const side of [-1, 1]) cube(cabinet, color, 0.1, i === 1 ? 0.24 : 0.13, 0.13, x + side * 0.12, y + 0.83, 0);
    if (i === 2) { cube(cabinet, dark, 0.035, 0.15, 0.035, x, y + 0.84, 0); sphere(cabinet, peach, 0.06, x, y + 0.93, 0); }
    if (i === 3) { const hat = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.31, 5), blue); hat.position.set(x, y + 0.86, 0); cabinet.add(hat); }
    if (i === 5) { cube(cabinet, sage, 0.44, 0.08, 0.36, x, y + 0.78, 0); cube(cabinet, sage, 0.3, 0.12, 0.25, x, y + 0.87, 0); }
  }
  cabinet.userData = { clickable: true, id: 'cabinet', label: 'FIGURINES // LITTLE WORLDS', accent: cabinetGlow, on: false };
  return [arcade, cabinet];
}
