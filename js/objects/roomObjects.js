import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene, tvLight, lampLight } from '../scene/sceneSetup.js';
import { M } from '../scene/materials.js';

export function box(w, h, d, mat, x = 0, y = 0, z = 0, castShadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (castShadow) { m.castShadow = true; m.receiveShadow = true; }
  scene.add(m);
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
  const floor = box(16, 0.2, 14, M.floor, 0, -0.1, 0, false);
  floor.receiveShadow = true;
  for (let i = -7; i <= 7; i++) {
    box(16, 0.01, 0.05, M.floorLine, 0, 0.01, i, false);
    box(0.05, 0.01, 14, M.floorLine, i, 0.01, 0, false);
  }

  // Full-floor rug
  box(15.6, 0.06, 13.6, M.rug, 0, 0.03, 0, false);
  box(15.2, 0.06, 0.2, M.rugAcc, 0, 0.04, 6.6, false);
  box(15.2, 0.06, 0.2, M.rugAcc, 0, 0.04, -6.6, false);
  box(0.2, 0.06, 13.6, M.rugAcc, 7.6, 0.04, 0, false);
  box(0.2, 0.06, 13.6, M.rugAcc, -7.6, 0.04, 0, false);
  box(16, 10, 0.2, M.wall, 0, 4, -7, false);
  box(0.2, 10, 14, M.wall, -8, 4, 0, false);
  box(0.2, 10, 14, M.wall, 8, 4, 0, false);
  box(16, 0.15, 0.1, M.wallAcc, 0, 3.5, -6.9, false);
  box(16, 0.2, 14, M.wall, 0, 8, 0, false);

  // ── WINDOW on RIGHT WALL ──
  const windowGroup = new THREE.Group();
  windowGroup.position.set(7.85, 4.0, -1);
  windowGroup.rotation.y = -Math.PI / 2;
  scene.add(windowGroup);

  const wFrame = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.5, 0.12), M.windowFrame); windowGroup.add(wFrame);
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

  // Window ambient & sun light
  const windowLight = new THREE.PointLight(0xffeedd, 0.5, 12); windowLight.position.set(6.5, 4.0, -1); scene.add(windowLight);

  // Volumetric window beam
  const paneBeamMat = new THREE.MeshBasicMaterial({
    color: 0xfffbf0, transparent: true, opacity: 0.04, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
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

  const beamTarget = new THREE.Vector3(3.5, 0.1, 0.4);
  const sunSpot = new THREE.SpotLight(0xfff8ee, 1.5, 20, Math.PI / 4, 0.8, 1.5);
  sunSpot.position.set(7.5, 4.0, -1);
  sunSpot.target.position.copy(beamTarget);
  scene.add(sunSpot); scene.add(sunSpot.target);

  // ── OUTSIDE SCENERY ──
  const sceneryGroup = new THREE.Group(); sceneryGroup.position.set(12, 0, -1); scene.add(sceneryGroup);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, fog: false });
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff4aa, fog: false });
  const buildMat1 = new THREE.MeshBasicMaterial({ color: 0x77aacc, fog: false });
  const buildMat2 = new THREE.MeshBasicMaterial({ color: 0x6699bb, fog: false });
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });

  const sky = new THREE.Mesh(new THREE.BoxGeometry(0.5, 40, 60), skyMat); sky.position.set(2, 10, 0); sceneryGroup.add(sky);
  const sun = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5, 5), sunMat); sun.position.set(1, 16, -6); sceneryGroup.add(sun);
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(1, 20, 6), buildMat1); b1.position.set(1, 0, -8); sceneryGroup.add(b1);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(1, 28, 5), buildMat2); b2.position.set(1, 4, -1); sceneryGroup.add(b2);
  const b3 = new THREE.Mesh(new THREE.BoxGeometry(1, 16, 7), buildMat1); b3.position.set(1, -2, 7); sceneryGroup.add(b3);
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.5, 8), cloudMat); c1.position.set(1.5, 16, -4); sceneryGroup.add(c1);
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3, 10), cloudMat); c2.position.set(1.5, 14, 5); sceneryGroup.add(c2);

  const beamMergeGlow = new THREE.PointLight(0xfff8ee, 0.4, 6); beamMergeGlow.position.set(3.5, 1.5, -1); scene.add(beamMergeGlow);

  // ── CEILING BULB ──
  const ceilingBulbG = new THREE.Group(); ceilingBulbG.position.set(0, 7.6, 0); scene.add(ceilingBulbG);
  const cWire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4), new THREE.MeshLambertMaterial({ color: 0x333333 })); cWire.position.y = -0.1; ceilingBulbG.add(cWire);
  const cBulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshLambertMaterial({ color: 0xffffee, emissive: 0xffffdd, emissiveIntensity: 0.0 })); cBulb.position.y = -0.45; ceilingBulbG.add(cBulb);
  const cShade = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.1, 0.12, 8), new THREE.MeshLambertMaterial({ color: 0x222222 })); cShade.position.y = -0.35; ceilingBulbG.add(cShade);

  const ceilingLight = new THREE.PointLight(0xffffff, 0, 18); ceilingLight.position.set(0, 5.8, 0); scene.add(ceilingLight);
  const ceilSpotDown = new THREE.SpotLight(0xffffff, 0, 12, Math.PI * 0.42, 0.5, 1.0); ceilSpotDown.position.set(0, 7.4, 0); ceilSpotDown.target.position.set(0, 0, 0); scene.add(ceilSpotDown); scene.add(ceilSpotDown.target);
  ceilingBulbG.userData = { clickable: true, id: 'lamp', on: false, toggleLight: ceilingLight, toggleSpot: ceilSpotDown, mat: cBulb.material, emissiveOn: 0.9, baseLightInt: 2.3, baseSpotInt: 2.8 };

  // ── FLOOR LAMP LEFT ──
  const floorLampL = new THREE.Group(); floorLampL.position.set(-7, 0, 1); scene.add(floorLampL);
  const flBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.1, 8), new THREE.MeshLambertMaterial({ color: 0x2a2a2a })); flBase.position.y = 0.05; floorLampL.add(flBase);
  const flPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.5, 6), new THREE.MeshLambertMaterial({ color: 0x888888 })); flPole.position.y = 2.3; floorLampL.add(flPole);
  const flShade = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0xf5e8d0, emissive: 0xffcc88, emissiveIntensity: 0.4 })); flShade.position.y = 4.6; floorLampL.add(flShade);
  const flLightL = new THREE.PointLight(0xffcc88, 1.2, 11); flLightL.position.set(-7, 4.8, 1); scene.add(flLightL);
  const flSpotL = new THREE.SpotLight(0xffcc66, 1.4, 8, Math.PI * 0.38, 0.5, 1.4); flSpotL.position.set(-7, 4.75, 1); flSpotL.target.position.set(-7, 0, 1); scene.add(flSpotL); scene.add(flSpotL.target);
  floorLampL.userData = { clickable: true, id: 'lamp', on: true, toggleLight: flLightL, toggleSpot: flSpotL, mat: flShade.material, emissiveOn: 0.4, baseLightInt: 1.2, baseSpotInt: 1.4 };

  // ── FLOOR LAMP RIGHT ──
  const floorLampR = new THREE.Group(); floorLampR.position.set(7, 0, 2); scene.add(floorLampR);
  const frBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.1, 8), new THREE.MeshLambertMaterial({ color: 0x2a2a2a })); frBase.position.y = 0.05; floorLampR.add(frBase);
  const frPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.5, 6), new THREE.MeshLambertMaterial({ color: 0x888888 })); frPole.position.y = 2.3; floorLampR.add(frPole);
  const frShade = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0xf5e8d0, emissive: 0xffcc88, emissiveIntensity: 0.4 })); frShade.position.y = 4.6; floorLampR.add(frShade);
  const flLightR = new THREE.PointLight(0xffcc88, 1.2, 11); flLightR.position.set(7, 4.8, 2); scene.add(flLightR);
  const flSpotR = new THREE.SpotLight(0xffcc66, 1.4, 8, Math.PI * 0.38, 0.5, 1.4); flSpotR.position.set(7, 4.75, 2); flSpotR.target.position.set(7, 0, 2); scene.add(flSpotR); scene.add(flSpotR.target);
  floorLampR.userData = { clickable: true, id: 'lamp', on: true, toggleLight: flLightR, toggleSpot: flSpotR, mat: frShade.material, emissiveOn: 0.4, baseLightInt: 1.2, baseSpotInt: 1.4 };

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
  const lapLid = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.05), M.laptop); lapLid.position.set(0, 0.45, -0.5); lapLid.rotation.x = -0.4; lapLid.castShadow = true; laptopGroup.add(lapLid);
  const lapScreen = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 0.01), M.lapScreen); lapScreen.position.set(0, 0.46, -0.49); lapScreen.rotation.x = -0.4; laptopGroup.add(lapScreen);
  laptopGroup.userData = { clickable: true, id: 'laptop', label: `<svg class="pixel-icon" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="9" /><rect x="3" y="3" width="10" height="7" fill="#1a140e" /><rect x="0" y="12" width="16" height="2" /><rect x="7" y="12" width="2" height="1" fill="#1a140e" /></svg> OLAN'S PROJECTS &middot; Click to view` };

  // ── DESK LAMP ──
  const lampG = new THREE.Group(); lampG.position.set(-2.8, 2.58, 0.2); scene.add(lampG);
  lampG.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.08, 8), M.lamp));
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), M.lamp); lampPole.position.set(0, 0.64, 0); lampG.add(lampPole);
  const lampHead = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.18, 0.25, 8), M.lampShade); lampHead.position.set(0, 1.28, 0); lampG.add(lampHead);

  // ── MONITOR ──
  const tvGroup = new THREE.Group(); tvGroup.position.set(-1.5, 2.58, -0.1); scene.add(tvGroup);
  const tvBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.1), M.tv); tvBody.position.set(0, 0.7, 0); tvGroup.add(tvBody);
  const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.02), M.tvScreen); tvScreen.position.set(0, 0.7, 0.06); tvGroup.add(tvScreen);
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
    const pixel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.02),
      new THREE.MeshLambertMaterial({ color: [0x2255bb, 0x3366cc, 0x1144aa][col % 3], emissive: 0x1133aa, emissiveIntensity: 0.4 }));
    pixel.position.set(-0.42 + col * 0.42, 0.88 - row * 0.42, 0.08); tvGroup.add(pixel);
  }
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
      bk.position.set(x + w / 2, 0.85 + ri * 1.1 + h / 2, -0.1); shelfGroup.add(bk); x += w + 0.02; if (x > 1.1) return;
    });
  });
  shelfGroup.userData = { clickable: true, id: 'shelf', label: `<svg class="pixel-icon" viewBox="0 0 16 16"><rect x="2" y="1" width="12" height="14" /><rect x="3" y="2" width="10" height="3" fill="#1a140e" /><rect x="3" y="6" width="10" height="3" fill="#1a140e" /><rect x="3" y="10" width="10" height="4" fill="#1a140e" /><rect x="4" y="2" width="2" height="3" fill="#ff88aa" /><rect x="7" y="2" width="2" height="3" fill="#88ccff" /><rect x="10" y="2" width="2" height="3" fill="#ffd080" /><rect x="5" y="6" width="2" height="3" fill="#ffd080" /><rect x="8" y="6" width="3" height="3" fill="#ff88aa" /><rect x="4" y="11" width="8" height="3" fill="#88ccff" /><rect x="7" y="11" width="2" height="3" fill="#ffdd66" /></svg> EXPERIENCE &mdash; Click to view` };

  // ── PLANTS (CLICKABLE) ──
  const plantG = new THREE.Group(); plantG.position.set(-5.8, 0, -4); scene.add(plantG);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 0.8, 8), M.pot); pot.position.y = 0.4; plantG.add(pot);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 8), new THREE.MeshLambertMaterial({ color: 0x3a2a1a })); soil.position.y = 0.82; plantG.add(soil);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.0, 6), new THREE.MeshLambertMaterial({ color: 0x4a3520 })); trunk.position.y = 1.8; plantG.add(trunk);
  const greenShades = [0x1a6b2a, 0x228833, 0x2a9e3c, 0x1e7a2e, 0x33aa44, 0x267a30, 0x1f8832, 0x2d9940, 0x1a7028, 0x35b048];
  [[0, 3.2, 0, 0.55], [0.4, 2.8, 0.15, 0.45], [-0.4, 2.8, -0.15, 0.45], [0.15, 3.5, 0.2, 0.4], [-0.2, 3.4, -0.2, 0.4],
  [0.35, 3.6, 0, 0.35], [-0.3, 3.7, 0.1, 0.32], [0, 3.9, 0, 0.3], [0.25, 2.5, 0.2, 0.35], [-0.35, 2.6, -0.1, 0.38],
  [0, 4.1, 0, 0.22], [0.2, 4.0, -0.1, 0.25]].forEach(([x, y, z, r], i) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 6), new THREE.MeshLambertMaterial({ color: greenShades[i % greenShades.length] }));
    leaf.position.set(x, y, z); leaf.scale.set(1, 1.2, 1); plantG.add(leaf);
  });
  plantG.userData = { clickable: true, id: 'plant', label: `<svg class="pixel-icon" viewBox="0 0 16 16"><rect x="3" y="5" width="2" height="2" /><rect x="4" y="7" width="2" height="2" /><rect x="7" y="2" width="2" height="12" /><rect x="11" y="4" width="2" height="2" /><rect x="10" y="6" width="2" height="2" /><rect x="9" y="8" width="2" height="2" /><rect x="4" y="14" width="8" height="2" /></svg> SKILL TREE &mdash; Click to view` };

  const plant2 = new THREE.Group(); plant2.position.set(-5.5, 0, 3); scene.add(plant2);
  const pot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.5, 8), M.pot); pot2.position.y = 0.25; plant2.add(pot2);
  [[0, 0.8, 0, 0.3], [0.2, 0.65, 0.1, 0.25], [-0.2, 0.7, -0.1, 0.25], [0, 1.0, 0, 0.2]].forEach(([x, y, z, r], i) => {
    const lf = new THREE.Mesh(new THREE.SphereGeometry(r, 5, 5), new THREE.MeshLambertMaterial({ color: [0x1f7e30, 0x2a9940, 0x1a6a28, 0x33aa44][i] }));
    lf.position.set(x, y, z); plant2.add(lf);
  });

  // ── POSTER on back wall (CLICKABLE) ──
  const posterGroup = new THREE.Group(); posterGroup.position.set(1, 4.5, -6.75); scene.add(posterGroup);
  const posterBg = new THREE.Mesh(new THREE.BoxGeometry(2, 2.8, 0.05), M.poster); posterGroup.add(posterBg);
  const posterColors = [0xffd080, 0x88ccff, 0xff88aa, 0xffdd66, 0x88ffcc, 0xff88cc, 0x88aaff, 0xffd080];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.04),
      new THREE.MeshLambertMaterial({ color: posterColors[(r * 4 + c) % 8], emissive: posterColors[(r * 4 + c) % 8], emissiveIntensity: 0.3 }));
    dot.position.set(-0.6 + c * 0.4, 0.5 - r * 0.4 + 0.6, 0.04); posterGroup.add(dot);
  }
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3, 0.04), new THREE.MeshLambertMaterial({ color: 0x2a1a0a })); frame.position.z = -0.04; posterGroup.add(frame);
  posterGroup.userData = { clickable: true, id: 'poster', label: `<svg class="pixel-icon" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="2" /><rect x="4" y="5" width="2" height="2" fill="#ff88aa" /><rect x="7" y="5" width="2" height="2" fill="#88ccff" /><rect x="10" y="5" width="2" height="2" fill="#ffd080" /><rect x="5" y="9" width="2" height="2" fill="#88ffcc" /><rect x="9" y="9" width="2" height="2" fill="#1a140e" /></svg> CONTACT &mdash; Click to view` };

  // ── ONE PIECE POSTER on LEFT WALL ──
  const opTexture = new THREE.TextureLoader().load('onepiece.jpg');
  opTexture.colorSpace = THREE.SRGBColorSpace;
  const opPoster = new THREE.Group(); opPoster.position.set(-7.85, 3.8, -3); opPoster.rotation.y = Math.PI / 2; scene.add(opPoster);
  const opBg = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.05), new THREE.MeshLambertMaterial({ map: opTexture })); opPoster.add(opBg);
  const opFrame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 0.04), new THREE.MeshLambertMaterial({ color: 0x3a2a1a })); opFrame.position.z = -0.03; opPoster.add(opFrame);

  // ── CAT (Sleeping curled up) ──
  const catGroup = new THREE.Group(); catGroup.position.set(5.5, 0.1, 2); scene.add(catGroup);
  const bedGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16);
  const bedMat = new THREE.MeshLambertMaterial({ color: 0xaa4444 });
  const bed = new THREE.Mesh(bedGeo, bedMat); catGroup.add(bed);
  const bedInner = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.12, 16), new THREE.MeshLambertMaterial({ color: 0xcc6666 })); catGroup.add(bedInner);
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
  [[-0.5, 0.55, 0.5], [0.5, 0.55, 0.5], [-0.5, 0.55, -0.5], [0.5, 0.55, -0.5]].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), M.chair); leg.position.set(x, y, z); chairG.add(leg);
  });

  // ── SPARKLES FOR INTERACTIVE OBJECTS ──
  const interactiveSparkles = [];
  const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  function addSparkle(objGroup) {
    const b = new THREE.Box3().setFromObject(objGroup);
    const center = b.getCenter(new THREE.Vector3());
    const geo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(geo, sparkleMat);
      s.position.copy(center);
      s.position.x += (Math.random() - 0.5) * 1.5;
      s.position.y += (Math.random() - 0.5) * 1.5;
      s.position.z += (Math.random() - 0.5) * 1.5;
      s.userData = { baseY: s.position.y, phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 0.5 };
      scene.add(s);
      interactiveSparkles.push(s);
    }
  }

  [laptopGroup, tvGroup, posterGroup, shelfGroup, plantG, ceilingBulbG, floorLampL, floorLampR, catGroup].forEach(addSparkle);

  // ── DUST PARTICLES ──
  const particles = [];
  for (let i = 0; i < 60; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06),
      new THREE.MeshBasicMaterial({ color: [0xb8ff8c, 0x88ccff, 0xffdd66, 0xff88aa][Math.floor(Math.random() * 4)], transparent: true, opacity: 0.6 }));
    p.position.set((Math.random() - 0.5) * 14, Math.random() * 6 + 0.5, (Math.random() - 0.5) * 12);
    p.userData.phase = Math.random() * Math.PI * 2;
    scene.add(p);
    particles.push(p);
  }

  scene.updateMatrixWorld(true);

  return {
    laptopGroup,
    shelfGroup,
    posterGroup,
    plantG,
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
    clickables: [laptopGroup, tvGroup, shelfGroup, posterGroup, plantG, floorLampL, floorLampR, ceilingBulbG, catGroup]
  };
}
