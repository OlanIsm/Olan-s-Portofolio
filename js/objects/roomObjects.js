import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene, tvLight, lampLight } from '../scene/sceneSetup.js';
import { M } from '../scene/materials.js';
import { batchStatic, canvasTexture } from '../scene/sceneUtils.js';

export function box(w, h, d, mat, x = 0, y = 0, z = 0, castShadow = true, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (castShadow) { m.castShadow = true; m.receiveShadow = true; }
  parent.add(m);
  return m;
}

export function prepModel(root) {
  root.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.material && 'fog' in obj.material) obj.material.fog = true;
    }
  });
}

export function fitModelToHeight(root, targetHeight) {
  root.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(root);
  const size = b.getSize(new THREE.Vector3());
  if (size.y > 0) {
    root.scale.multiplyScalar(targetHeight / size.y);
  }
  root.updateMatrixWorld(true);
  const fittedBox = new THREE.Box3().setFromObject(root);
  root.position.y += -fittedBox.min.y;
}

export function createRoomObjects() {
  const gltfLoader = new GLTFLoader();

  // ── ROOM GEOMETRY ──
  const floor = box(16, 0.2, 22, M.floor, 0, -0.1, 4, false);
  floor.receiveShadow = true;
  for (let i = -7; i < 15; i++) {
    box(16, 0.01, 0.026, M.floorLine, 0, 0.012, i, false);
    for (let j = -7; j <= 7; j += 3.5) box(0.025, 0.01, 0.97, M.floorLine, j + (i % 2) * 1.2, 0.013, i + 0.5, false);
  }

  const rug = box(9.2, 0.045, 7.8, M.rug, 0, 0.032, 1.1, false);
  rug.receiveShadow = true;
  for (const z of [-2.55, 4.75]) box(8.8, 0.012, 0.12, M.rugAcc, 0, 0.062, z, false);
  for (const x of [-4.35, 4.35]) box(0.12, 0.012, 7.4, M.rugAcc, x, 0.062, 1.1, false);
  for (let x = -4; x <= 4; x += 0.32) {
    for (const z of [-2.92, 5.12]) box(0.06, 0.02, 0.22, M.rugAcc, x, 0.03, z, false);
  }
  box(16, 10, 0.2, M.wall, 0, 4, -7, false);
  box(0.2, 10, 22, M.wall, -8, 4, 4, false);
  // A real opening lets the small outdoor set show through the glass.
  box(0.2, 2.2, 22, M.wall, 8, 1.1, 4, false);
  box(0.2, 2.3, 22, M.wall, 8, 6.85, 4, false);
  box(0.2, 3.5, 4.5, M.wall, 8, 3.95, -4.75, false);
  box(0.2, 3.5, 14.5, M.wall, 8, 3.95, 7.75, false);
  box(15.8, 2.1, 0.07, M.wallAcc, 0, 1.05, -6.85, false);
  box(15.8, 0.12, 0.16, M.shelf, 0, 2.12, -6.8, false);
  for (let x = -7.6; x < 8; x += 1.55) box(0.04, 1.8, 0.07, M.windowFrame, x, 1.07, -6.79, false);
  for (const y of [0.18, 7.8]) {
    box(16, 0.22, 0.16, M.windowFrame, 0, y, -6.8, false);
    for (const x of [-7.85, 7.85]) box(0.14, 0.22, 22, M.windowFrame, x, y, 4, false);
  }
  box(16, 0.2, 22, M.wall, 0, 8, 4, false);

  // ── WINDOW on RIGHT WALL ──
  const windowGroup = new THREE.Group();
  windowGroup.position.set(7.85, 4.0, -1);
  windowGroup.rotation.y = -Math.PI / 2;
  scene.add(windowGroup);

  for (const x of [-1.48, 1.48]) box(0.12, 3.5, 0.18, M.windowFrame, x, 0, 0, false, windowGroup);
  for (const y of [-1.72, 1.72]) box(3.08, 0.12, 0.18, M.windowFrame, 0, y, 0, false, windowGroup);
  const wGlass1 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.04), M.windowGlass); wGlass1.position.set(-0.7, 0.4, 0.05); windowGroup.add(wGlass1);
  const wGlass2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.04), M.windowGlass); wGlass2.position.set(0.7, 0.4, 0.05); windowGroup.add(wGlass2);
  const wGlass3 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.04), M.windowGlass); wGlass3.position.set(-0.7, -1.1, 0.05); windowGroup.add(wGlass3);
  const wGlass4 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.04), M.windowGlass); wGlass4.position.set(0.7, -1.1, 0.05); windowGroup.add(wGlass4);
  const wDivH = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 0.14), M.windowFrame); wDivH.position.set(0, -0.3, 0); windowGroup.add(wDivH);
  const wDivV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.3, 0.14), M.windowFrame); wDivV.position.set(0, 0, 0); windowGroup.add(wDivV);
  const wSill = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.4), M.windowFrame); wSill.position.set(0, -1.7, 0.15); windowGroup.add(wSill);

  // ── AIR CONDITIONER ──
  const acGroup = new THREE.Group(); acGroup.position.set(7.8, 6.5, -1); scene.add(acGroup);
  const acBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 2.4), new THREE.MeshLambertMaterial({ color: 0xffffff })); acGroup.add(acBody);
  const acVent = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 2.2), new THREE.MeshLambertMaterial({ color: 0x222222 })); acVent.position.set(-0.02, -0.25, 0); acGroup.add(acVent);
  acGroup.name = 'AirConditioner';
  acGroup.userData = { clickable: true, id: 'ac', label: 'AC // SERVICE PANEL' };
  box(0.012, 0.045, 0.08, new THREE.MeshBasicMaterial({ color: 0x94eab5 }), -0.258, 0.04, 0.88, false, acGroup);

  const curtainMat = new THREE.MeshLambertMaterial({ color: 0xd6ba87 });
  box(4.3, 0.07, 0.07, M.shelf, 0, 2.02, 0.28, false, windowGroup);
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
    const fold = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.21, 3.8, 5), curtainMat);
    fold.position.set(side * (1.5 + i * 0.13), -0.03, 0.2); windowGroup.add(fold);
  }

  // Volumetric window beam
  const paneBeamMat = new THREE.MeshBasicMaterial({
    color: 0xffdeb0, transparent: true, opacity: 0.018, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const dir = new THREE.Vector3(-4.35, -3.55, 1.4);
  const floorY = 0.1;
  const wCorners = [
    new THREE.Vector3(7.85, 5.15, -2.35),
    new THREE.Vector3(7.85, 5.15, 0.35),
    new THREE.Vector3(7.85, 2.15, -2.35),
    new THREE.Vector3(7.85, 2.15, 0.35),
  ];
  const vertices = [];
  wCorners.forEach(v => vertices.push(v.x, v.y, v.z));
  wCorners.forEach(v => {
    const t = (floorY - v.y) / dir.y;
    vertices.push(v.x + t * dir.x, floorY, v.z + t * dir.z);
  });
  const indices = [
    0, 2, 1, 2, 3, 1,
    4, 5, 6, 6, 5, 7,
    0, 4, 2, 2, 4, 6,
    1, 3, 5, 3, 7, 5,
    0, 1, 4, 1, 5, 4,
    2, 6, 3, 3, 6, 7
  ];
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  bGeo.setIndex(indices);
  scene.add(new THREE.Mesh(bGeo, paneBeamMat));

  const sunPatch = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.5), new THREE.MeshBasicMaterial({ color: 0xffd99b, transparent: true, opacity: 0.12, depthWrite: false }));
  sunPatch.rotation.x = -Math.PI / 2; sunPatch.rotation.z = -0.45; sunPatch.position.set(3.6, 0.068, 1); scene.add(sunPatch);

  // ── OUTSIDE SCENERY ──
  const sceneryGroup = new THREE.Group(); sceneryGroup.position.set(12, 0, -1); scene.add(sceneryGroup);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0xc5d8ce, fog: false });
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff4aa, fog: false });
  const buildMat1 = new THREE.MeshBasicMaterial({ color: 0x698770, fog: false });
  const buildMat2 = new THREE.MeshBasicMaterial({ color: 0x8ea381, fog: false });
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });

  const sky = new THREE.Mesh(new THREE.BoxGeometry(0.5, 40, 60), skyMat); sky.position.set(2, 10, 0); sceneryGroup.add(sky);
  const sun = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5, 5), sunMat); sun.position.set(1, 16, -6); sceneryGroup.add(sun);
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(1, 20, 6), buildMat1); b1.position.set(1, 0, -8); sceneryGroup.add(b1);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(1, 28, 5), buildMat2); b2.position.set(1, 4, -1); sceneryGroup.add(b2);
  const b3 = new THREE.Mesh(new THREE.BoxGeometry(1, 16, 7), buildMat1); b3.position.set(1, -2, 7); sceneryGroup.add(b3);
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.5, 8), cloudMat); c1.position.set(1.5, 16, -4); sceneryGroup.add(c1);
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3, 10), cloudMat); c2.position.set(1.5, 14, 5); sceneryGroup.add(c2);


  // ── CEILING BULB ──
  const ceilingBulbG = new THREE.Group(); ceilingBulbG.position.set(0, 7.6, 0); scene.add(ceilingBulbG);
  const cWire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4), new THREE.MeshLambertMaterial({ color: 0x333333 })); cWire.position.y = -0.1; ceilingBulbG.add(cWire);
  const cBulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshLambertMaterial({ color: 0xffffee, emissive: 0xffffdd, emissiveIntensity: 0.0 })); cBulb.position.y = -0.45; ceilingBulbG.add(cBulb);
  const cShade = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.1, 0.12, 8), new THREE.MeshLambertMaterial({ color: 0x222222 })); cShade.position.y = -0.35; ceilingBulbG.add(cShade);

  const ceilingLight = new THREE.PointLight(0xffffff, 0, 18); ceilingLight.position.set(0, 5.8, 0); scene.add(ceilingLight);
  ceilingBulbG.userData = { clickable: true, id: 'lamp', on: false, toggleLight: ceilingLight, mat: cBulb.material, emissiveOn: 0.9, baseLightInt: 1.4 };

  // ── FLOOR LAMP LEFT ──
  const floorLampL = new THREE.Group(); floorLampL.position.set(-7, 0, 1); scene.add(floorLampL);
  const flBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.1, 8), new THREE.MeshLambertMaterial({ color: 0x2a2a2a })); flBase.position.y = 0.05; floorLampL.add(flBase);
  const flPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.5, 6), new THREE.MeshLambertMaterial({ color: 0x888888 })); flPole.position.y = 2.3; floorLampL.add(flPole);
  const flShade = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0xf5e8d0, emissive: 0xffcc88, emissiveIntensity: 0.4 })); flShade.position.y = 4.6; floorLampL.add(flShade);
  const flLightL = new THREE.PointLight(0xffcc88, 1.2, 11); flLightL.position.set(-7, 4.8, 1); scene.add(flLightL);
  floorLampL.userData = { clickable: true, id: 'lamp', on: true, toggleLight: flLightL, mat: flShade.material, emissiveOn: 0.4, baseLightInt: 1.2 };

  // ── FLOOR LAMP RIGHT ──
  const floorLampR = new THREE.Group(); floorLampR.position.set(7, 0, 2); scene.add(floorLampR);
  const frBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.1, 8), new THREE.MeshLambertMaterial({ color: 0x2a2a2a })); frBase.position.y = 0.05; floorLampR.add(frBase);
  const frPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.5, 6), new THREE.MeshLambertMaterial({ color: 0x888888 })); frPole.position.y = 2.3; floorLampR.add(frPole);
  const frShade = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0xf5e8d0, emissive: 0xffcc88, emissiveIntensity: 0.4 })); frShade.position.y = 4.6; floorLampR.add(frShade);
  const flLightR = new THREE.PointLight(0xffcc88, 1.2, 11); flLightR.position.set(7, 4.8, 2); scene.add(flLightR);
  floorLampR.userData = { clickable: true, id: 'lamp', on: true, toggleLight: flLightR, mat: frShade.material, emissiveOn: 0.4, baseLightInt: 1.2 };

  // ── MUSIC KEYBOARD ──
  const musicKeyboardG = new THREE.Group(); musicKeyboardG.position.set(-7.35, 0, -2.0); musicKeyboardG.rotation.y = Math.PI / 2; musicKeyboardG.scale.setScalar(1.2); scene.add(musicKeyboardG);
  const pianoBody = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.22, 0.62), M.piano); pianoBody.position.set(0, 1.36, 0); pianoBody.castShadow = true; musicKeyboardG.add(pianoBody);
  const pianoTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.7), new THREE.MeshLambertMaterial({ color: 0x20202a })); pianoTop.position.set(0, 1.52, -0.02); musicKeyboardG.add(pianoTop);
  const pianoKeyBed = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.04, 0.34), new THREE.MeshLambertMaterial({ color: 0xd8d2c7 })); pianoKeyBed.position.set(0, 1.51, 0.2); musicKeyboardG.add(pianoKeyBed);

  for (let i = 0; i < 21; i++) {
    const key = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.035, 0.3), M.pianoKeyWhite);
    key.position.set(-1.32 + i * 0.132, 1.55, 0.21);
    musicKeyboardG.add(key);
  }
  for (let i = 0; i < 18; i++) {
    if ([2, 6, 9, 13, 16].includes(i % 17)) continue;
    const blackKey = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.055, 0.18), M.pianoKeyBlack);
    blackKey.position.set(-1.25 + i * 0.132, 1.59, 0.12);
    musicKeyboardG.add(blackKey);
  }
  const musicRest = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.72, 0.06), new THREE.MeshLambertMaterial({ color: 0x191923 })); musicRest.position.set(0, 2.0, -0.22); musicRest.rotation.x = -0.25; musicKeyboardG.add(musicRest);
  const restLip = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.06, 0.08), M.piano); restLip.position.set(0, 1.63, -0.08); musicKeyboardG.add(restLip);

  [[-1.3, -0.22], [1.3, -0.22], [-1.3, 0.25], [1.3, 0.25]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.3, 6), M.piano); leg.position.set(x, 0.68, z); musicKeyboardG.add(leg);
  });

  const pedalBar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.08), new THREE.MeshLambertMaterial({ color: 0x333333 })); pedalBar.position.set(0, 0.16, 0.33); musicKeyboardG.add(pedalBar);
  [-0.18, 0, 0.18].forEach(x => {
    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.18), new THREE.MeshLambertMaterial({ color: 0xaaaa88 })); pedal.position.set(x, 0.11, 0.42); musicKeyboardG.add(pedal);
  });

  // ── DESK ──
  const deskGroup = new THREE.Group(); scene.add(deskGroup);
  const deskTopM = new THREE.Mesh(new THREE.BoxGeometry(7, 0.15, 2.2), M.deskTop); deskTopM.position.set(0, 2.5, 0.4); deskGroup.add(deskTopM);
  const deskSideL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 2.0), M.desk); deskSideL.position.set(-3.44, 1.25, 0.4); deskGroup.add(deskSideL);
  const deskSideR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 2.0), M.desk); deskSideR.position.set(3.44, 1.25, 0.4); deskGroup.add(deskSideR);
  const deskBackP = new THREE.Mesh(new THREE.BoxGeometry(6.8, 2.3, 0.1), M.desk); deskBackP.position.set(0, 1.25, -0.55); deskGroup.add(deskBackP);
  const deskCab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.3, 1.9), M.desk); deskCab.position.set(2.4, 1.25, 0.45); deskGroup.add(deskCab);
  const drawer = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.05), M.deskTop); drawer.position.set(2.4, 1.6, 1.41); deskGroup.add(drawer);
  const drawerKnob = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.1), M.lamp); drawerKnob.position.set(2.4, 1.6, 1.47); deskGroup.add(drawerKnob);
  const drawer2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.05), M.deskTop); drawer2.position.set(2.4, 0.9, 1.41); deskGroup.add(drawer2);
  const drawerKnob2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.1), M.lamp); drawerKnob2.position.set(2.4, 0.9, 1.47); deskGroup.add(drawerKnob2);
  const deskBar = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 0.1), M.desk); deskBar.position.set(-0.5, 0.15, 0.4); deskGroup.add(deskBar);
  deskTopM.castShadow = true; deskTopM.receiveShadow = true;
  box(7.05, 0.08, 2.25, M.shelf, 0, 2.4, 0.4, true, deskGroup);
  for (const z of [-0.2, 0.45, 1.1]) box(6.95, 0.009, 0.012, M.shelf, 0, 2.581, z, false, deskGroup);
  for (const y of [0.9, 1.6]) box(0.48, 0.06, 0.12, M.lamp, 2.4, y, 1.51, true, deskGroup);

  // ── MOUSEPAD ──
  const mousepad = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.02, 1.4), M.mousepad); mousepad.position.set(0, 2.59, 0.3); deskGroup.add(mousepad);
  const mpEdge = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.025, 0.05), new THREE.MeshLambertMaterial({ color: 0x333333 })); mpEdge.position.set(0, 2.59, 1.0); deskGroup.add(mpEdge);
  const mpEdge2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.025, 0.05), new THREE.MeshLambertMaterial({ color: 0x333333 })); mpEdge2.position.set(0, 2.59, -0.4); deskGroup.add(mpEdge2);

  // ── KEYBOARD ──
  const kbGroup = new THREE.Group(); kbGroup.position.set(-1.5, 2.6, 0.9); deskGroup.add(kbGroup);
  const kbBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.6), M.keyboard); kbGroup.add(kbBase);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 14; col++) {
    const key = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.1), M.keycap);
    key.position.set(-0.78 + col * 0.12, 0.05, -0.2 + row * 0.14); kbGroup.add(key);
  }
  const spaceBar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.1), M.keycap); spaceBar.position.set(0, 0.05, 0.22); kbGroup.add(spaceBar);

  // ── MOUSE ──
  const mouseGroup = new THREE.Group(); mouseGroup.position.set(1.8, 2.6, 0.6); deskGroup.add(mouseGroup);
  const mouseBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.3), M.mouseMat); mouseGroup.add(mouseBody);
  const mouseWheel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.08), new THREE.MeshLambertMaterial({ color: 0xcccccc })); mouseWheel.position.set(0, 0.05, -0.05); mouseGroup.add(mouseWheel);

  // ── LAPTOP (CLICKABLE) ──
  const laptopGroup = new THREE.Group(); laptopGroup.position.set(0.8, 2.58, 0.3); scene.add(laptopGroup);
  const lapBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1), M.laptop); lapBase.castShadow = true; laptopGroup.add(lapBase);
  const lid = new THREE.Group(); lid.position.set(0, 0.05, -0.46); lid.rotation.x = -0.22; laptopGroup.add(lid);
  box(1.4, 0.9, 0.06, M.laptop, 0, 0.45, 0, true, lid);
  const lapScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.77), screenMaterial('projects'));
  lapScreen.position.set(0, 0.45, 0.033); lid.add(lapScreen);
  box(0.42, 0.008, 0.23, M.keyboard, 0, 0.034, 0.3, false, laptopGroup);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 10; col++) box(0.085, 0.012, 0.085, M.keycap, -0.5 + col * 0.11, 0.038, -0.25 + row * 0.11, false, laptopGroup);
  laptopGroup.userData = { clickable: true, id: 'laptop', label: `<svg class="pixel-icon" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="9" /><rect x="3" y="3" width="10" height="7" fill="#1a140e" /><rect x="0" y="12" width="16" height="2" /><rect x="7" y="12" width="2" height="1" fill="#1a140e" /></svg> OLAN'S PROJECTS &middot; Click to view` };

  // ── DESK LAMP ──
  const lampG = new THREE.Group(); lampG.position.set(-2.8, 2.58, 0.2); scene.add(lampG);
  lampG.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.08, 8), M.lamp));
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), M.lamp); lampPole.position.set(0, 0.64, 0); lampG.add(lampPole);
  const lampHead = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.18, 0.25, 8), M.lampShade); lampHead.position.set(0, 1.28, 0); lampG.add(lampHead);

  // ── MONITOR ──
  const tvGroup = new THREE.Group(); tvGroup.position.set(-1.5, 2.58, -0.1); scene.add(tvGroup);
  const tvBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.1), M.tv); tvBody.position.set(0, 0.7, 0); tvGroup.add(tvBody);
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 1.02), screenMaterial('about')); tvScreen.position.set(0, 0.7, 0.056); tvGroup.add(tvScreen);
  const tvStand = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.15), M.tv); tvStand.position.set(0, 0.18, 0); tvGroup.add(tvStand);
  const tvBase2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.4), M.tv); tvBase2.position.set(0, 0.0, 0); tvGroup.add(tvBase2);
  tvGroup.userData = { clickable: true, id: 'about', label: `<svg class="pixel-icon" viewBox="0 0 16 16"><rect x="3" y="2" width="10" height="12" fill="none" stroke="#ffd080" stroke-width="1.5" /><circle cx="8" cy="6" r="2.5" fill="#ffd080" /><path d="M4 12v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" fill="#ffd080" /></svg> ABOUT ME &mdash; Click to view` };

  // ── BOOKSHELF (CLICKABLE) ──
  const shelfGroup = new THREE.Group(); shelfGroup.position.set(5, 0, -4); scene.add(shelfGroup);
  const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(2.8, 5, 0.1), M.shelf); shelfBack.position.set(0, 2.5, -0.5); shelfGroup.add(shelfBack);
  const shelfSideL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5, 1), M.shelf); shelfSideL.position.set(-1.4, 2.5, 0); shelfGroup.add(shelfSideL);
  const shelfSideR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5, 1), M.shelf); shelfSideR.position.set(1.4, 2.5, 0); shelfGroup.add(shelfSideR);
  [0.8, 1.9, 3.0, 4.1].forEach(y => { const s = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 1), M.shelf); s.position.set(0, y, 0); shelfGroup.add(s); });
  const bookColors = [M.bookA, M.bookB, M.bookC, M.bookD], bookW = [0.2, 0.25, 0.18, 0.22, 0.2, 0.24, 0.19, 0.23];
  [1.05, 2.15, 3.25].forEach((y, ri) => {
    let x = -1.1; bookW.forEach((w, bi) => {
      const h = 0.7 + Math.random() * 0.3;
      const bk = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.7), bookColors[(ri + bi) % 4]);
      bk.position.set(x + w / 2, 0.85 + ri * 1.1 + h / 2, -0.1); shelfGroup.add(bk);
      for (const band of [0.16, h - 0.12]) box(w * 0.75, 0.025, 0.012, M.rugAcc, x + w / 2, 0.85 + ri * 1.1 + band, 0.257, false, shelfGroup);
      x += w + 0.02; if (x > 1.1) return;
    });
  });
  shelfGroup.userData = { clickable: true, id: 'shelf', label: `<svg class="pixel-icon" viewBox="0 0 16 16"><rect x="2" y="1" width="12" height="14" /><rect x="3" y="2" width="10" height="3" fill="#1a140e" /><rect x="3" y="6" width="10" height="3" fill="#1a140e" /><rect x="3" y="10" width="10" height="4" fill="#1a140e" /><rect x="4" y="2" width="2" height="3" fill="#ff88aa" /><rect x="7" y="2" width="2" height="3" fill="#88ccff" /><rect x="10" y="2" width="2" height="3" fill="#ffd080" /><rect x="5" y="6" width="2" height="3" fill="#ffd080" /><rect x="8" y="6" width="3" height="3" fill="#ff88aa" /><rect x="4" y="11" width="8" height="3" fill="#88ccff" /><rect x="7" y="11" width="2" height="3" fill="#ffdd66" /></svg> EXPERIENCE &mdash; Click to view` };

  // ── PLANTS (CLICKABLE) ──
  const plantG = new THREE.Group(); plantG.position.set(-5.8, 0, -4); scene.add(plantG);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 0.8, 8), M.pot); pot.position.y = 0.4; plantG.add(pot);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 8), new THREE.MeshLambertMaterial({ color: 0x3a2a1a })); soil.position.y = 0.82; plantG.add(soil);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.0, 6), new THREE.MeshLambertMaterial({ color: 0x4a3520 })); trunk.position.y = 1.8; plantG.add(trunk);
  const plantCrown = new THREE.Group(); plantCrown.position.y = 1.8; plantG.add(plantCrown);
  [[0, 3.2, 0, 0.55], [0.4, 2.8, 0.15, 0.45], [-0.4, 2.8, -0.15, 0.45], [0.15, 3.5, 0.2, 0.4], [-0.2, 3.4, -0.2, 0.4],
  [0.35, 3.6, 0, 0.35], [-0.3, 3.7, 0.1, 0.32], [0, 3.9, 0, 0.3], [0.25, 2.5, 0.2, 0.35], [-0.35, 2.6, -0.1, 0.38],
  [0, 4.1, 0, 0.22], [0.2, 4.0, -0.1, 0.25]].forEach(([x, y, z, r], i) => {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), [M.plant, M.bookC, M.wallAcc][i % 3]);
    leaf.position.set(x * 1.3, y - 1.8, z); leaf.scale.set(1.3, 0.85, 1); leaf.castShadow = true; plantCrown.add(leaf);
  });
  const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.065, 4, 8), M.pot); potRim.rotation.x = Math.PI / 2; potRim.position.y = 0.79; plantG.add(potRim);
  plantG.userData = { clickable: true, id: 'plant', label: `<svg class="pixel-icon" viewBox="0 0 16 16"><rect x="3" y="5" width="2" height="2" /><rect x="4" y="7" width="2" height="2" /><rect x="7" y="2" width="2" height="12" /><rect x="11" y="4" width="2" height="2" /><rect x="10" y="6" width="2" height="2" /><rect x="9" y="8" width="2" height="2" /><rect x="4" y="14" width="8" height="2" /></svg> SKILL TREE &mdash; Click to view` };

  const plant2 = new THREE.Group(); plant2.position.set(-5.5, 0, 3); scene.add(plant2);
  const pot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.5, 8), M.pot); pot2.position.y = 0.25; plant2.add(pot2);
  [[0, 0.8, 0, 0.3], [0.2, 0.65, 0.1, 0.25], [-0.2, 0.7, -0.1, 0.25], [0, 1.0, 0, 0.2]].forEach(([x, y, z, r], i) => {
    const lf = new THREE.Mesh(new THREE.SphereGeometry(r, 5, 5), new THREE.MeshLambertMaterial({ color: [0x1f7e30, 0x2a9940, 0x1a6a28, 0x33aa44][i] }));
    lf.position.set(x, y, z); plant2.add(lf);
  });

  // ── POSTER on back wall (CLICKABLE) ──
  const posterGroup = new THREE.Group(); posterGroup.position.set(1, 4.5, -6.75); scene.add(posterGroup);
  const posterBg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.8), new THREE.MeshLambertMaterial({ map: canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#ead3a5'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ba664c'; ctx.beginPath(); ctx.arc(256, 150, 83, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#284e43'; ctx.textAlign = 'center'; ctx.font = 'bold 64px monospace';
    ['LET\'S MAKE', 'SOMETHING', 'GOOD.'].forEach((line, i) => ctx.fillText(line, w / 2, 330 + i * 78));
    ctx.font = '24px monospace'; ctx.fillText('say hello  →', w / 2, 630);
    ctx.strokeStyle = '#b59c73'; ctx.lineWidth = 3; ctx.strokeRect(24, 24, w - 48, h - 48);
  }, 512, 720) })); posterBg.position.z = 0.031; posterGroup.add(posterBg);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3, 0.04), new THREE.MeshLambertMaterial({ color: 0x2a1a0a })); frame.position.z = -0.04; posterGroup.add(frame);
  posterGroup.userData = { clickable: true, id: 'poster', label: `<svg class="pixel-icon" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="2" /><rect x="4" y="5" width="2" height="2" fill="#ff88aa" /><rect x="7" y="5" width="2" height="2" fill="#88ccff" /><rect x="10" y="5" width="2" height="2" fill="#ffd080" /><rect x="5" y="9" width="2" height="2" fill="#88ffcc" /><rect x="9" y="9" width="2" height="2" fill="#1a140e" /></svg> CONTACT &mdash; Click to view` };

  // ── ONE PIECE POSTER on LEFT WALL ──
  const opTexture = new THREE.TextureLoader().load('onepiece.jpg');
  opTexture.encoding = THREE.sRGBEncoding;
  const opPoster = new THREE.Group(); opPoster.position.set(-7.85, 3.8, -3); opPoster.rotation.y = Math.PI / 2; scene.add(opPoster);
  const opBg = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.05), new THREE.MeshLambertMaterial({ map: opTexture })); opPoster.add(opBg);
  const opFrame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 0.04), new THREE.MeshLambertMaterial({ color: 0x3a2a1a })); opFrame.position.z = -0.03; opPoster.add(opFrame);

  // ── CAT (Sleeping curled up) ──
  const catGroup = new THREE.Group(); catGroup.position.set(5.5, 0.1, 2); scene.add(catGroup);
  const bedGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16);
  const bedMat = new THREE.MeshLambertMaterial({ color: 0xb77755 });
  const bed = new THREE.Mesh(bedGeo, bedMat); catGroup.add(bed);
  const bedInner = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.12, 16), new THREE.MeshLambertMaterial({ color: 0xcc6666 })); catGroup.add(bedInner);
  const bolster = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.1, 5, 12), M.rugAcc); bolster.rotation.x = Math.PI / 2; bolster.position.y = 0.08; catGroup.add(bolster);
  gltfLoader.load('model/sleeping_cat.glb', gltf => {
    const catModel = gltf.scene;
    prepModel(catModel);
    fitModelToHeight(catModel, 0.37);
    catModel.position.set(0, 0.18, 0);
    catModel.rotation.y = -Math.PI / 2;
    catGroup.add(catModel);
  });
  catGroup.userData = { clickable: true, id: 'cat', label: `<svg class="pixel-icon" viewBox="0 0 16 16"><rect x="2" y="3" width="2" height="3" /><rect x="12" y="3" width="2" height="3" /><rect x="3" y="5" width="10" height="7" /><rect x="4" y="8" width="2" height="1" fill="#1a140e" /><rect x="10" y="8" width="2" height="1" fill="#1a140e" /><rect x="7" y="9" width="2" height="1" fill="#ff88aa" /><rect x="3" y="9" width="1" height="1" fill="#ff88cc" /><rect x="12" y="9" width="1" height="1" fill="#ff88cc" /></svg> SLEEPING CAT &mdash; Meow` };

  // ── CHAIR ──
  const chairG = new THREE.Group(); chairG.position.set(0, 0, 3); scene.add(chairG);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.2), M.chairCushion); seat.position.y = 1.1; chairG.add(seat);
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.12), M.chair); chairBack.position.set(0, 1.76, 0.54); chairG.add(chairBack);
  box(1.08, 0.94, 0.17, M.chairCushion, 0, 1.8, 0.43, true, chairG);
  for (const x of [-0.66, 0.66]) {
    box(0.12, 0.1, 1.0, M.shelf, x, 1.58, 0, true, chairG);
    box(0.07, 0.5, 0.07, M.chair, x, 1.32, -0.35, true, chairG);
  }
  [[-0.5, 0.55, 0.5], [0.5, 0.55, 0.5], [-0.5, 0.55, -0.5], [0.5, 0.55, -0.5]].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), M.chair); leg.position.set(x, y, z); chairG.add(leg);
  });

  // ── SPARKLES FOR INTERACTIVE OBJECTS ──
  const interactiveSparkles = [];
  const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffdfa0, transparent: true, opacity: 0.7, depthWrite: false });
  function addSparkle(objGroup) {
    const b = new THREE.Box3().setFromObject(objGroup);
    const center = b.getCenter(new THREE.Vector3());
    const geo = new THREE.OctahedronGeometry(0.08);
    for (let i = 0; i < 1; i++) {
      const s = new THREE.Mesh(geo, sparkleMat);
      s.position.copy(center);
      s.position.y = b.max.y + 0.24;
      s.userData = { object: objGroup, baseY: s.position.y, phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 0.5 };
      scene.add(s);
      interactiveSparkles.push(s);
    }
  }

  [laptopGroup, tvGroup, posterGroup, shelfGroup, plantG].forEach(addSparkle);

  // ── DUST PARTICLES ──
  const dust = [];
  for (let i = 0; i < 38; i++) dust.push((Math.random() - 0.5) * 13, Math.random() * 6 + 0.5, (Math.random() - 0.5) * 11);
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dust, 3));
  const particles = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffe2b0, size: 0.027, opacity: 0.42, transparent: true, depthWrite: false }));
  scene.add(particles);

  addStudioDetails(deskGroup, shelfGroup, windowGroup);
  const clickables = [laptopGroup, tvGroup, shelfGroup, posterGroup, plantG, floorLampL, floorLampR, ceilingBulbG, catGroup, acGroup];
  clickables.forEach(obj => batchStatic(obj, [plantCrown]));
  const movableProps = [chairG, deskGroup, musicKeyboardG, opPoster, plant2];
  movableProps.forEach(obj => batchStatic(obj));

  scene.updateMatrixWorld(true);

  return {
    acGroup,
    movableProps,
    screens: [lapScreen, tvScreen],
    laptopGroup,
    shelfGroup,
    posterGroup,
    plantG,
    plantCrown,
    floorLampL,
    floorLampR,
    ceilingBulbG,
    catGroup,
    tvLight,
    lampLight,
    ceilingLight,
    flLightL,
    flLightR,
    interactiveSparkles,
    particles,
    clickables
  };
}

function screenMaterial(kind) {
  return new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTexture(ctx => {
    ctx.fillStyle = '#172c2b'; ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = '#29423c'; ctx.fillRect(0, 0, 512, 35);
    ['#bd7358', '#d7ae63', '#8faa84'].forEach((color, i) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(18 + i * 19, 18, 5, 0, Math.PI * 2); ctx.fill(); });
    ctx.font = '14px monospace'; ctx.fillStyle = '#aebca7'; ctx.fillText('olan.dev / studio', 245, 23);
    ctx.fillStyle = '#e5c993'; ctx.font = 'bold 44px monospace';
    ctx.fillText(kind === 'about' ? 'Hi, I\'m Olan.' : 'Selected work.', 32, 104);
    ctx.font = '18px monospace'; ctx.fillStyle = '#a9c3b4';
    ctx.fillText(kind === 'about' ? 'A curious mind. A work in progress.' : 'Ideas, built into real things.', 32, 145);
    ['const studio = {', '  curiosity: "always",', '  status: "creating"', '};'].forEach((line, i) => { ctx.fillStyle = i % 2 ? '#cdb687' : '#8bb4ab'; ctx.fillText(line, 32, 190 + i * 25); });
  }, 512, 320) });
}

function addStudioDetails(desk, shelf, windowGroup) {
  // Coffee, stationery and a notebook make the desktop feel used.
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.28, 10), M.windowFrame);
  mug.position.set(2.7, 2.74, 0.65); desk.add(mug);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), M.floorLine);
  coffee.rotation.x = -Math.PI / 2; coffee.position.set(2.7, 2.883, 0.65); desk.add(coffee);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.026, 4, 8), M.windowFrame);
  handle.position.set(2.86, 2.75, 0.65); desk.add(handle);
  box(0.7, 0.055, 0.83, M.bookA, 2.7, 2.61, -0.24, true, desk);
  box(0.64, 0.03, 0.76, M.windowFrame, 2.7, 2.648, -0.24, false, desk);
  const pen = box(0.035, 0.035, 0.56, M.tv, 2.75, 2.69, -0.22, true, desk); pen.rotation.y = 0.3;
  const pencilCup = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.24, 8), M.bookB);
  pencilCup.position.set(-3.0, 2.7, -0.32); desk.add(pencilCup);
  for (let i = 0; i < 5; i++) {
    const pencil = box(0.025, 0.39, 0.025, [M.bookA, M.bookD, M.plant][i % 3], -3.07 + i * 0.035, 2.96, -0.32, false, desk);
    pencil.rotation.z = (i - 2) * 0.08;
  }
  for (const x of [-2.58, -0.3]) {
    box(0.3, 0.48, 0.32, M.tv, x, 2.83, -0.32, true, desk);
    const speaker = new THREE.Mesh(new THREE.CircleGeometry(0.095, 10), M.wallAcc); speaker.position.set(x, 2.8, -0.153); desk.add(speaker);
  }

  // Top-shelf ceramics, a framed print and a small trailing plant.
  box(2.94, 0.15, 1.12, M.shelf, 0, 5.04, 0, true, shelf);
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.27, 0.52, 8), M.bookB); vase.position.set(-0.8, 5.36, 0); shelf.add(vase);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.22, 8), M.bookB); neck.position.set(-0.8, 5.7, 0); shelf.add(neck);
  box(0.64, 0.72, 0.1, M.lamp, -0.05, 4.52, 0, true, shelf);
  box(0.52, 0.59, 0.02, M.windowFrame, -0.05, 4.52, 0.062, false, shelf);
  const photo = new THREE.Mesh(new THREE.CircleGeometry(0.15, 8), M.bookA); photo.position.set(-0.05, 4.58, 0.075); shelf.add(photo);
  const basket = box(0.86, 0.52, 0.75, M.rugAcc, 0.75, 0.35, 0, true, shelf);
  for (let y = 0.15; y < 0.6; y += 0.1) box(0.87, 0.018, 0.02, M.shelf, 0.75, y, 0.383, false, shelf);
  box(0.3, 0.06, 0.02, M.floorLine, 0.75, 0.4, 0.39, false, shelf);
  const littlePot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.32, 7), M.pot); littlePot.position.set(0.85, 5.28, 0); shelf.add(littlePot);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), M.plant);
    leaf.position.set(0.85 + Math.sin(i * 2.4) * 0.23, 5.55 + Math.cos(i) * 0.12, Math.cos(i * 2.4) * 0.22); leaf.scale.set(1, 1.8, 0.6); shelf.add(leaf);
  }

  // Floating shelf and a pinboard fill the wall without covering navigation objects.
  box(3.5, 0.12, 0.65, M.shelf, -3.1, 5.65, -6.5);
  for (const x of [-4.3, -1.9]) box(0.08, 0.5, 0.4, M.lamp, x, 5.35, -6.6);
  for (let i = 0; i < 5; i++) box(0.21, 0.5 + i % 2 * 0.15, 0.42, [M.bookA, M.bookB, M.bookD][i % 3], -4.1 + i * 0.26, 5.97, -6.5);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.29, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), M.pot);
  bowl.rotation.x = Math.PI; bowl.position.set(-2.4, 5.98, -6.5); scene.add(bowl);
  box(2.6, 1.58, 0.07, M.shelf, -2.7, 4.2, -6.82);
  const boardMat = new THREE.MeshLambertMaterial({ color: 0xb89260 });
  box(2.45, 1.43, 0.02, boardMat, -2.7, 4.2, -6.77, false);
  for (let i = 0; i < 3; i++) {
    const note = box(0.58, 0.67, 0.013, [M.windowFrame, M.rugAcc, M.bookC][i], -3.45 + i * 0.74, 4.27 + (i % 2) * 0.1, -6.746, false);
    note.rotation.z = (i - 1) * 0.13;
    box(0.065, 0.065, 0.035, M.bookA, note.position.x, 4.52 + (i % 2) * 0.1, -6.71, false);
  }
  const clock = new THREE.Group(); clock.position.set(4.5, 6.35, -6.7); scene.add(clock);
  const clockFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.1, 12), M.shelf); clockFrame.rotation.x = Math.PI / 2; clock.add(clockFrame);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.47, 12), M.windowFrame); face.position.z = 0.055; clock.add(face);
  const hour = box(0.045, 0.24, 0.02, M.tv, 0.07, 0.045, 0.075, false, clock); hour.rotation.z = -1.1;
  const minute = box(0.025, 0.37, 0.02, M.tv, 0, 0.15, 0.08, false, clock);
  for (let i = 0; i < 12; i++) {
    const tick = box(0.028, 0.065, 0.012, M.shelf, Math.sin(i * Math.PI / 6) * 0.4, Math.cos(i * Math.PI / 6) * 0.4, 0.07, false, clock);
    tick.rotation.z = -i * Math.PI / 6;
  }
  for (let i = 0; i < 10; i++) {
    const x = -6.2 + i * 1.32, y = 6.9 - Math.sin(i / 9 * Math.PI) * 0.38;
    box(1.36, 0.018, 0.025, M.shelf, x, y + 0.1, -6.78, false);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 4), M.lampShade); bulb.position.set(x, y, -6.75); scene.add(bulb);
  }
  // A little windowsill planter catches the afternoon sun.
  box(0.58, 0.26, 0.28, M.pot, 0.9, -1.52, 0.15, true, windowGroup);
  for (const x of [0.7, 0.9, 1.1]) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.48, 5), M.plant); leaf.position.set(x, -1.15, 0.15); windowGroup.add(leaf);
  }
}
