import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── SETUP ──
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x1a140e);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x1a140e, 18, 35);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 100);

const CAM_STATES = {
  MENU:   { pos: new THREE.Vector3(0, 3.5, 12), target: new THREE.Vector3(0, 3.5, -2) },
  ROOM:   { pos: new THREE.Vector3(0, 3.5, 12), target: new THREE.Vector3(0, 3.5, -2) },
  LAPTOP: { pos: new THREE.Vector3(2.5, 5.5, 4), target: new THREE.Vector3(0.8, 2.5, 0.3) },
};
camera.position.copy(CAM_STATES.MENU.pos);
const camTarget = new THREE.Vector3().copy(CAM_STATES.MENU.target);
camera.lookAt(camTarget);
let currentState = 'MENU';

// ── LIGHTS (realistic room lighting) ──
// Low ambient so room isn't uniformly lit
const ambient = new THREE.AmbientLight(0xccbbaa, 0.15);
scene.add(ambient);
// Subtle directional (simulates indirect bounce light)
const dirLight = new THREE.DirectionalLight(0xffeedd, 0.3);
dirLight.position.set(4, 12, 6);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.near = 0.1; dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -12; dirLight.shadow.camera.right = 12;
dirLight.shadow.camera.top = 12; dirLight.shadow.camera.bottom = -12;
scene.add(dirLight);
// TV/monitor glow (cool blue)
const tvLight = new THREE.PointLight(0x88bbff, 0.6, 5);
tvLight.position.set(-0.8, 3.5, 0.5); scene.add(tvLight);
// Desk lamp glow (warm)
const lampLight = new THREE.PointLight(0xffcc66, 1.2, 6);
lampLight.position.set(-2.8, 4.0, 0.5); scene.add(lampLight);
// Window light (daylight warmth)
const windowLightAmb = new THREE.PointLight(0xffeebb, 0.5, 12);
windowLightAmb.position.set(7, 4.5, -1); scene.add(windowLightAmb);

// ── MATERIALS (warm clean aesthetic) ──
const M = {
  floor: new THREE.MeshLambertMaterial({ color: 0x2a2018 }),
  floorLine: new THREE.MeshLambertMaterial({ color: 0x352a1e }),
  wall: new THREE.MeshLambertMaterial({ color: 0xe8e0d4 }),
  wallAcc: new THREE.MeshLambertMaterial({ color: 0xd4ccc0 }),
  desk: new THREE.MeshLambertMaterial({ color: 0xf0ece6 }),
  deskTop: new THREE.MeshLambertMaterial({ color: 0xfafafa }),
  tv: new THREE.MeshLambertMaterial({ color: 0x1a1a22 }),
  tvScreen: new THREE.MeshLambertMaterial({ color: 0x1155aa, emissive: 0x1144cc, emissiveIntensity: 0.8 }),
  bookA: new THREE.MeshLambertMaterial({ color: 0xaa3355 }),
  bookB: new THREE.MeshLambertMaterial({ color: 0x3355aa }),
  bookC: new THREE.MeshLambertMaterial({ color: 0x33aa55 }),
  bookD: new THREE.MeshLambertMaterial({ color: 0xaaaa33 }),
  plant: new THREE.MeshLambertMaterial({ color: 0x2d6e3a }),
  pot: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
  laptop: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9, metalness: 0.1 }),
  lapScreen: new THREE.MeshLambertMaterial({ color: 0x88ff88, emissive: 0x44ff44, emissiveIntensity: 0.5 }),
  chair: new THREE.MeshLambertMaterial({ color: 0x2a1a0a }),
  chairCushion: new THREE.MeshLambertMaterial({ color: 0x553311 }),
  rug: new THREE.MeshLambertMaterial({ color: 0x3d2050 }),
  rugAcc: new THREE.MeshLambertMaterial({ color: 0x5a3570 }),
  shelf: new THREE.MeshLambertMaterial({ color: 0x3a2a18 }),
  poster: new THREE.MeshLambertMaterial({ color: 0x0a1a1a, emissive: 0x003322, emissiveIntensity: 0.3 }),
  lamp: new THREE.MeshLambertMaterial({ color: 0xccccaa }),
  lampShade: new THREE.MeshLambertMaterial({ color: 0xffdd88, emissive: 0xffcc44, emissiveIntensity: 0.6 }),
  pixel: new THREE.MeshLambertMaterial({ color: 0xb8ff8c, emissive: 0x44aa22, emissiveIntensity: 0.4 }),
  white: new THREE.MeshLambertMaterial({ color: 0xfafafa }),
  skin: new THREE.MeshLambertMaterial({ color: 0xe8b87a }),
  hoodie: new THREE.MeshLambertMaterial({ color: 0x3a4050 }),
  pants: new THREE.MeshLambertMaterial({ color: 0x2a2a3a }),
  hair: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
  // new peripherals
  keyboard: new THREE.MeshLambertMaterial({ color: 0xf0f0f0 }),
  keycap: new THREE.MeshLambertMaterial({ color: 0xe0e0e0 }),
  mousepad: new THREE.MeshLambertMaterial({ color: 0x111111 }),
  mouseMat: new THREE.MeshLambertMaterial({ color: 0xf5f5f5 }),
  piano: new THREE.MeshLambertMaterial({ color: 0x111116 }),
  pianoKeyWhite: new THREE.MeshLambertMaterial({ color: 0xf4f1e8 }),
  pianoKeyBlack: new THREE.MeshLambertMaterial({ color: 0x050505 }),
  windowFrame: new THREE.MeshLambertMaterial({ color: 0xd0c8b8 }),
  windowGlass: new THREE.MeshLambertMaterial({ color: 0x73b7f2, transparent: true, opacity: 0.42, emissive: 0x1d5f9f, emissiveIntensity: 0.12 }),
};

function box(w,h,d, mat, x=0,y=0,z=0, castShadow=true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  m.position.set(x,y,z);
  if (castShadow) { m.castShadow=true; m.receiveShadow=true; }
  scene.add(m);
  return m;
}

const gltfLoader = new GLTFLoader();
const animationMixers = [];
const characterActions = { idle: null, walk: null };
let characterAnimState = 'idle';

function setCharacterMoving(isMoving) {
  const nextState = isMoving ? 'walk' : 'idle';
  if (characterAnimState === nextState) return;
  characterAnimState = nextState;

  const walk = characterActions.walk;
  const idle = characterActions.idle;
  if (isMoving) {
    if (idle) idle.fadeOut(0.18);
    if (walk) walk.reset().fadeIn(0.18).play();
  } else {
    if (walk) walk.fadeOut(0.18);
    if (idle) idle.reset().fadeIn(0.18).play();
  }
}

function prepModel(root) {
  root.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.material && 'fog' in obj.material) obj.material.fog = true;
    }
  });
}

function fitModelToHeight(root, targetHeight) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  if (size.y > 0) {
    root.scale.multiplyScalar(targetHeight / size.y);
  }
  root.updateMatrixWorld(true);
  const fittedBox = new THREE.Box3().setFromObject(root);
  root.position.y += -fittedBox.min.y;
}
// ── ROOM GEOMETRY ──
const floor = box(16, 0.2, 14, M.floor, 0, -0.1, 0, false);
floor.receiveShadow = true;
for (let i=-7;i<=7;i++) {
  box(16, 0.01, 0.05, M.floorLine, 0, 0.01, i, false);
  box(0.05, 0.01, 14, M.floorLine, i, 0.01, 0, false);
}
// Full-floor rug (above grid lines)
box(15.6, 0.06, 13.6, M.rug, 0, 0.03, 0, false);
box(15.2, 0.06, 0.2, M.rugAcc, 0, 0.04, 6.6, false);
box(15.2, 0.06, 0.2, M.rugAcc, 0, 0.04, -6.6, false);
box(0.2, 0.06, 13.6, M.rugAcc, 7.6, 0.04, 0, false);
box(0.2, 0.06, 13.6, M.rugAcc, -7.6, 0.04, 0, false);
box(16, 10, 0.2, M.wall, 0, 4, -7, false);
box(0.2, 10, 14, M.wall, -8, 4, 0, false);
box(0.2, 10, 14, M.wall,  8, 4, 0, false);
box(16, 0.15, 0.1, M.wallAcc, 0, 3.5, -6.9, false);
box(16, 0.2, 14, M.wall, 0, 8, 0, false);

// ── WINDOW on RIGHT WALL ──
const windowGroup = new THREE.Group(); windowGroup.position.set(7.85, 4.0, -1); windowGroup.rotation.y = -Math.PI/2; scene.add(windowGroup);
// Window frame
const wFrame = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.5, 0.12), M.windowFrame); windowGroup.add(wFrame);
// Glass panes
const wGlass1 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.04), M.windowGlass); wGlass1.position.set(-0.7, 0.4, 0.05); windowGroup.add(wGlass1);
const wGlass2 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.04), M.windowGlass); wGlass2.position.set(0.7, 0.4, 0.05); windowGroup.add(wGlass2);
const wGlass3 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.04), M.windowGlass); wGlass3.position.set(-0.7, -1.1, 0.05); windowGroup.add(wGlass3);
const wGlass4 = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.04), M.windowGlass); wGlass4.position.set(0.7, -1.1, 0.05); windowGroup.add(wGlass4);
// Cross dividers
const wDivH = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 0.14), M.windowFrame); wDivH.position.set(0, -0.3, 0); windowGroup.add(wDivH);
const wDivV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.3, 0.14), M.windowFrame); wDivV.position.set(0, 0, 0); windowGroup.add(wDivV);
// Window sill
const wSill = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.4), M.windowFrame); wSill.position.set(0, -1.7, 0.15); windowGroup.add(wSill);

// ── AIR CONDITIONER (Above Window) ──
const acGroup = new THREE.Group();
acGroup.position.set(7.8, 6.5, -1);
scene.add(acGroup);
const acBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 2.4), new THREE.MeshLambertMaterial({color: 0xffffff}));
acGroup.add(acBody);
const acVent = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 2.2), new THREE.MeshLambertMaterial({color: 0x222222}));
acVent.position.set(-0.02, -0.25, 0);
acGroup.add(acVent);

// Warm ambient light from window
const windowLight = new THREE.PointLight(0xffeedd, 0.5, 12);
windowLight.position.set(6.5, 4.0, -1); scene.add(windowLight);

// ── SINGLE WINDOW BEAM ──
const paneBeamMat = new THREE.MeshBasicMaterial({
  color: 0xfffbf0, transparent: true, opacity: 0.04, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
});
// Create custom sheared volumetric beam so it fits the window perfectly without awkward rotations
const dir = new THREE.Vector3(-4.35, -3.55, 1.4); // directional vector from window to floor near right desk leg
const floorY = 0.1;
const wCorners = [
  new THREE.Vector3(7.85, 5.15, -2.35), // Top-Left
  new THREE.Vector3(7.85, 5.15, 0.35),  // Top-Right
  new THREE.Vector3(7.85, 2.15, -2.35), // Bottom-Left
  new THREE.Vector3(7.85, 2.15, 0.35),  // Bottom-Right
];
const vertices = [];
wCorners.forEach(v => vertices.push(v.x, v.y, v.z));
wCorners.forEach(v => {
  const t = (floorY - v.y) / dir.y;
  vertices.push(v.x + t * dir.x, floorY, v.z + t * dir.z);
});
const indices = [
  0, 2, 1,  2, 3, 1, // Front
  4, 5, 6,  6, 5, 7, // Back
  0, 4, 2,  2, 4, 6, // Left
  1, 3, 5,  3, 7, 5, // Right
  0, 1, 4,  1, 5, 4, // Top
  2, 6, 3,  3, 6, 7  // Bottom
];
const bGeo = new THREE.BufferGeometry();
bGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
bGeo.setIndex(indices);
const bMesh = new THREE.Mesh(bGeo, paneBeamMat);
scene.add(bMesh);

const beamTarget = new THREE.Vector3(3.5, 0.1, 0.4);
const sunSpot = new THREE.SpotLight(0xfff8ee, 1.5, 20, Math.PI/4, 0.8, 1.5);
sunSpot.position.set(7.5, 4.0, -1);
sunSpot.target.position.copy(beamTarget);
scene.add(sunSpot); scene.add(sunSpot.target);

// ── OUTSIDE SCENERY ──
const sceneryGroup = new THREE.Group();
sceneryGroup.position.set(12, 0, -1); // Outside the window, within fog range
scene.add(sceneryGroup);

// Set fog: false so they don't get covered by the dark room fog
const skyMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, fog: false });
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff4aa, fog: false });
const buildMat1 = new THREE.MeshBasicMaterial({ color: 0x77aacc, fog: false });
const buildMat2 = new THREE.MeshBasicMaterial({ color: 0x6699bb, fog: false });
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });

// Sky backdrop
const sky = new THREE.Mesh(new THREE.BoxGeometry(0.5, 40, 60), skyMat);
sky.position.set(2, 10, 0);
sceneryGroup.add(sky);

// Sun
const sun = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5, 5), sunMat);
sun.position.set(1, 16, -6);
sceneryGroup.add(sun);

// Distant Buildings
const b1 = new THREE.Mesh(new THREE.BoxGeometry(1, 20, 6), buildMat1);
b1.position.set(1, 0, -8);
sceneryGroup.add(b1);

const b2 = new THREE.Mesh(new THREE.BoxGeometry(1, 28, 5), buildMat2);
b2.position.set(1, 4, -1);
sceneryGroup.add(b2);

const b3 = new THREE.Mesh(new THREE.BoxGeometry(1, 16, 7), buildMat1);
b3.position.set(1, -2, 7);
sceneryGroup.add(b3);

// Clouds (pixelated style)
const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.5, 8), cloudMat);
c1.position.set(1.5, 16, -4);
sceneryGroup.add(c1);

const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3, 10), cloudMat);
c2.position.set(1.5, 14, 5);
sceneryGroup.add(c2);

// Merged convergence glow where all 4 beams land
const beamMergeGlow = new THREE.PointLight(0xfff8ee, 0.4, 6);
beamMergeGlow.position.set(3.5, 1.5, -1); scene.add(beamMergeGlow);

// ── CEILING BULB (white light, main room illumination) ──
const ceilingBulbG = new THREE.Group(); ceilingBulbG.position.set(0, 7.6, 0); scene.add(ceilingBulbG);
// Wire
const cWire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4), new THREE.MeshLambertMaterial({color:0x333333}));
cWire.position.y = -0.1; ceilingBulbG.add(cWire);
// Bulb (glowing)
const cBulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshLambertMaterial({color:0xffffee, emissive:0xffffdd, emissiveIntensity:0.0}));
cBulb.position.y = -0.45; ceilingBulbG.add(cBulb);
// Shade/fixture
const cShade = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.1, 0.12, 8), new THREE.MeshLambertMaterial({color:0x222222}));
cShade.position.y = -0.35; ceilingBulbG.add(cShade);
// White ceiling light (main fill)
const ceilingLight = new THREE.PointLight(0xffffff, 0, 18);
ceilingLight.position.set(0, 5.8, 0); ceilingLight.castShadow = false; scene.add(ceilingLight);
// Ceiling lamp wall projections — cone of light spreading down
const ceilSpotDown = new THREE.SpotLight(0xffffff, 0, 12, Math.PI * 0.42, 0.5, 1.0);
ceilSpotDown.position.set(0, 7.4, 0);
ceilSpotDown.target.position.set(0, 0, 0);
ceilSpotDown.castShadow = false;
scene.add(ceilSpotDown); scene.add(ceilSpotDown.target);
ceilingBulbG.userData = { clickable: true, id: 'lamp', on: false, toggleLight: ceilingLight, toggleSpot: ceilSpotDown, mat: cBulb.material, emissiveOn: 0.9, baseLightInt: 2.3, baseSpotInt: 2.8 };

// ── FLOOR LAMP LEFT (standing lamp near left wall) ──
const floorLampL = new THREE.Group(); floorLampL.position.set(-7, 0, 1); scene.add(floorLampL);
// Base
const flBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.1, 8), new THREE.MeshLambertMaterial({color:0x2a2a2a}));
flBase.position.y = 0.05; floorLampL.add(flBase);
// Pole
const flPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.5, 6), new THREE.MeshLambertMaterial({color:0x888888}));
flPole.position.y = 2.3; floorLampL.add(flPole);
// Shade
const flShade = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.6, 8), new THREE.MeshLambertMaterial({color:0xf5e8d0, emissive:0xffcc88, emissiveIntensity:0.4}));
flShade.position.y = 4.6; floorLampL.add(flShade);
// Left floor lamp light (warm point)
const flLightL = new THREE.PointLight(0xffcc88, 1.2, 11);
flLightL.position.set(-7, 4.8, 1); scene.add(flLightL);
// Left lamp wall projection (spreads down + onto nearby wall)
const flSpotL = new THREE.SpotLight(0xffcc66, 1.4, 8, Math.PI * 0.38, 0.5, 1.4);
flSpotL.position.set(-7, 4.75, 1);
flSpotL.target.position.set(-7, 0, 1);
flSpotL.castShadow = false;
scene.add(flSpotL); scene.add(flSpotL.target);
floorLampL.userData = { clickable: true, id: 'lamp', on: true, toggleLight: flLightL, toggleSpot: flSpotL, mat: flShade.material, emissiveOn: 0.4, baseLightInt: 1.2, baseSpotInt: 1.4 };

// ── FLOOR LAMP RIGHT (standing lamp near right wall) ──
const floorLampR = new THREE.Group(); floorLampR.position.set(7, 0, 2); scene.add(floorLampR);
// Base
const frBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.1, 8), new THREE.MeshLambertMaterial({color:0x2a2a2a}));
frBase.position.y = 0.05; floorLampR.add(frBase);
// Pole
const frPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.5, 6), new THREE.MeshLambertMaterial({color:0x888888}));
frPole.position.y = 2.3; floorLampR.add(frPole);
// Shade
const frShade = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.6, 8), new THREE.MeshLambertMaterial({color:0xf5e8d0, emissive:0xffcc88, emissiveIntensity:0.4}));
frShade.position.y = 4.6; floorLampR.add(frShade);
// Right floor lamp light (warm point)
const flLightR = new THREE.PointLight(0xffcc88, 1.2, 11);
flLightR.position.set(7, 4.8, 2); scene.add(flLightR);
// Right lamp wall projection (spreads down + onto nearby wall)
const flSpotR = new THREE.SpotLight(0xffcc66, 1.4, 8, Math.PI * 0.38, 0.5, 1.4);
flSpotR.position.set(7, 4.75, 2);
flSpotR.target.position.set(7, 0, 2);
flSpotR.castShadow = false;
scene.add(flSpotR); scene.add(flSpotR.target);
floorLampR.userData = { clickable: true, id: 'lamp', on: true, toggleLight: flLightR, toggleSpot: flSpotR, mat: frShade.material, emissiveOn: 0.4, baseLightInt: 1.2, baseSpotInt: 1.4 };

// ── MUSIC KEYBOARD (fills the quiet left side) ──
const musicKeyboardG = new THREE.Group();
musicKeyboardG.position.set(-7.35, 0, -2.0);
musicKeyboardG.rotation.y = Math.PI / 2;
musicKeyboardG.scale.setScalar(1.2);
scene.add(musicKeyboardG);

const pianoBody = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.22, 0.62), M.piano);
pianoBody.position.set(0, 1.36, 0);
pianoBody.castShadow = true;
pianoBody.receiveShadow = true;
musicKeyboardG.add(pianoBody);

const pianoTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.7), new THREE.MeshLambertMaterial({ color: 0x20202a }));
pianoTop.position.set(0, 1.52, -0.02);
pianoTop.castShadow = true;
musicKeyboardG.add(pianoTop);

const pianoKeyBed = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.04, 0.34), new THREE.MeshLambertMaterial({ color: 0xd8d2c7 }));
pianoKeyBed.position.set(0, 1.51, 0.2);
musicKeyboardG.add(pianoKeyBed);

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

const musicRest = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.72, 0.06), new THREE.MeshLambertMaterial({ color: 0x191923 }));
musicRest.position.set(0, 2.0, -0.22);
musicRest.rotation.x = -0.25;
musicRest.castShadow = true;
musicKeyboardG.add(musicRest);

const restLip = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.06, 0.08), M.piano);
restLip.position.set(0, 1.63, -0.08);
musicKeyboardG.add(restLip);

[[-1.3, -0.22], [1.3, -0.22], [-1.3, 0.25], [1.3, 0.25]].forEach(([x, z]) => {
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.3, 6), M.piano);
  leg.position.set(x, 0.68, z);
  leg.castShadow = true;
  musicKeyboardG.add(leg);
});

const pedalBar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.08), new THREE.MeshLambertMaterial({ color: 0x333333 }));
pedalBar.position.set(0, 0.16, 0.33);
musicKeyboardG.add(pedalBar);
[-0.18, 0, 0.18].forEach(x => {
  const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.18), new THREE.MeshLambertMaterial({ color: 0xaaaa88 }));
  pedal.position.set(x, 0.11, 0.42);
  musicKeyboardG.add(pedal);
});

// ── DESK (white, open knee space) ──
const deskGroup = new THREE.Group(); scene.add(deskGroup);
// Desktop surface
const deskTopM = new THREE.Mesh(new THREE.BoxGeometry(7, 0.15, 2.2), M.deskTop);
deskTopM.position.set(0, 2.5, 0.4); deskTopM.castShadow=true; deskTopM.receiveShadow=true; deskGroup.add(deskTopM);
// Left panel (side wall)
const deskSideL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 2.0), M.desk);
deskSideL.position.set(-3.44, 1.25, 0.4); deskSideL.castShadow=true; deskGroup.add(deskSideL);
// Right panel (side wall)
const deskSideR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 2.0), M.desk);
deskSideR.position.set(3.44, 1.25, 0.4); deskSideR.castShadow=true; deskGroup.add(deskSideR);
// Back panel (behind knee space)
const deskBackP = new THREE.Mesh(new THREE.BoxGeometry(6.8, 2.3, 0.1), M.desk);
deskBackP.position.set(0, 1.25, -0.55); deskGroup.add(deskBackP);
// Right cabinet (drawer section)
const deskCab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.3, 1.9), M.desk);
deskCab.position.set(2.4, 1.25, 0.45); deskCab.castShadow=true; deskGroup.add(deskCab);
// Drawer face
const drawer = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.05), M.deskTop);
drawer.position.set(2.4, 1.6, 1.41); deskGroup.add(drawer);
const drawerKnob = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.1), M.lamp);
drawerKnob.position.set(2.4, 1.6, 1.47); deskGroup.add(drawerKnob);
// Second drawer
const drawer2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.05), M.deskTop);
drawer2.position.set(2.4, 0.9, 1.41); deskGroup.add(drawer2);
const drawerKnob2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.1), M.lamp);
drawerKnob2.position.set(2.4, 0.9, 1.47); deskGroup.add(drawerKnob2);
// Bottom support bar
const deskBar = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 0.1), M.desk);
deskBar.position.set(-0.5, 0.15, 0.4); deskGroup.add(deskBar);

// ── MOUSEPAD (black, long) ──
const mousepad = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.02, 1.4), M.mousepad);
mousepad.position.set(0, 2.59, 0.3); deskGroup.add(mousepad);
// mousepad edge stitching
const mpEdge = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.025, 0.05), new THREE.MeshLambertMaterial({color:0x333333}));
mpEdge.position.set(0, 2.59, 1.0); deskGroup.add(mpEdge);
const mpEdge2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.025, 0.05), new THREE.MeshLambertMaterial({color:0x333333}));
mpEdge2.position.set(0, 2.59, -0.4); deskGroup.add(mpEdge2);

// ── KEYBOARD (white, in front of monitor, not overlapping laptop) ──
const kbGroup = new THREE.Group(); kbGroup.position.set(-1.5, 2.6, 0.9); deskGroup.add(kbGroup);
const kbBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.6), M.keyboard);
kbGroup.add(kbBase);
// Keycap rows
for(let row=0; row<4; row++) for(let col=0; col<14; col++) {
  const key = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.1), M.keycap);
  key.position.set(-0.78+col*0.12, 0.05, -0.2+row*0.14);
  kbGroup.add(key);
}
// Space bar
const spaceBar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.1), M.keycap);
spaceBar.position.set(0, 0.05, 0.22); kbGroup.add(spaceBar);

// ── MOUSE (white) ──
const mouseGroup = new THREE.Group(); mouseGroup.position.set(1.8, 2.6, 0.6); deskGroup.add(mouseGroup);
const mouseBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.3), M.mouseMat);
mouseGroup.add(mouseBody);
const mouseWheel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.08), new THREE.MeshLambertMaterial({color:0xcccccc}));
mouseWheel.position.set(0, 0.05, -0.05); mouseGroup.add(mouseWheel);

// ── LAPTOP (CLICKABLE, matte black so white glow pops) ──
const laptopGroup = new THREE.Group();
laptopGroup.position.set(0.8, 2.58, 0.3); scene.add(laptopGroup);
const lapBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1), M.laptop);
lapBase.castShadow=true; laptopGroup.add(lapBase);
const lapLid = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.05), M.laptop);
lapLid.position.set(0, 0.45, -0.5); lapLid.rotation.x=-0.4; lapLid.castShadow=true; laptopGroup.add(lapLid);
const lapScreen = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 0.01), M.lapScreen);
lapScreen.position.set(0, 0.46, -0.49); lapScreen.rotation.x=-0.4; laptopGroup.add(lapScreen);
laptopGroup.userData = { clickable: true, id: 'laptop', label: "\uD83D\uDCBB OLAN'S PROJECTS \u00B7 Click to view" };

// ── DESK LAMP (far left of wider desk) ──
const lampG = new THREE.Group(); lampG.position.set(-2.8, 2.58, 0.2); scene.add(lampG);
lampG.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,0.08,8), M.lamp));
const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,1.2,6), M.lamp);
lampPole.position.set(0, 0.64, 0); lampG.add(lampPole);
const lampHead = new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.18,0.25,8), M.lampShade);
lampHead.position.set(0, 1.28, 0); lampG.add(lampHead);

// ── MONITOR on desk (next to laptop) ──
const tvGroup = new THREE.Group(); tvGroup.position.set(-1.5, 2.58, -0.1); scene.add(tvGroup);
// Monitor screen
const tvBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.1), M.tv);
tvBody.position.set(0, 0.7, 0); tvBody.castShadow=true; tvGroup.add(tvBody);
const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.02), M.tvScreen);
tvScreen.position.set(0, 0.7, 0.06); tvGroup.add(tvScreen);
// pixel detail on screen
for(let row=0;row<2;row++) for(let col=0;col<3;col++) {
  const pixel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.02),
    new THREE.MeshLambertMaterial({ color: [0x2255bb,0x3366cc,0x1144aa][col%3], emissive:0x1133aa, emissiveIntensity:0.4 }));
  pixel.position.set(-0.42+col*0.42, 0.88-row*0.42, 0.08); tvGroup.add(pixel);
}
// Monitor stand
const tvStand = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.15), M.tv);
tvStand.position.set(0, 0.18, 0); tvGroup.add(tvStand);
const tvBase2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.4), M.tv);
tvBase2.position.set(0, 0.0, 0); tvGroup.add(tvBase2);
tvGroup.userData = { clickable: false, id: 'monitor', label: '' };

// ── BOOKSHELF (CLICKABLE) — shifted left ──
const shelfGroup = new THREE.Group(); shelfGroup.position.set(5, 0, -4); scene.add(shelfGroup);
const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(2.8, 5, 0.1), M.shelf);
shelfBack.position.set(0, 2.5, -0.5); shelfBack.castShadow=true; shelfGroup.add(shelfBack);
const shelfSideL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5, 1), M.shelf);
shelfSideL.position.set(-1.4, 2.5, 0); shelfGroup.add(shelfSideL);
const shelfSideR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5, 1), M.shelf);
shelfSideR.position.set(1.4, 2.5, 0); shelfGroup.add(shelfSideR);
[0.8,1.9,3.0,4.1].forEach(y => { const s=new THREE.Mesh(new THREE.BoxGeometry(2.8,0.1,1),M.shelf); s.position.set(0,y,0); shelfGroup.add(s); });
const bookColors=[M.bookA,M.bookB,M.bookC,M.bookD], bookW=[0.2,0.25,0.18,0.22,0.2,0.24,0.19,0.23];
[1.05,2.15,3.25].forEach((y,ri) => { let x=-1.1; bookW.forEach((w,bi) => {
  const h = 0.7+Math.random()*0.3;
  const bk=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.7),bookColors[(ri+bi)%4]);
  bk.position.set(x+w/2, 0.85 + ri*1.1 + h/2, -0.1); bk.castShadow=true; shelfGroup.add(bk); x+=w+0.02; if(x>1.1) return;
}); });
shelfGroup.userData = { clickable: true, id: 'shelf', label: '\uD83D\uDCDA BOOKSHELF \u2014 HOBBY' };

// ── PLANTS (pure green, taller) ──
const plantG = new THREE.Group(); plantG.position.set(-5.8, 0, -4); scene.add(plantG);
const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.4,0.8,8), M.pot); pot.position.y=0.4; plantG.add(pot);
const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.08,8), new THREE.MeshLambertMaterial({color:0x3a2a1a})); soil.position.y=0.82; plantG.add(soil);
// trunk (taller)
const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,2.0,6), new THREE.MeshLambertMaterial({color:0x4a3520}));
trunk.position.y=1.8; plantG.add(trunk);
// big foliage cluster (pure green gradients, higher)
const greenShades = [0x1a6b2a, 0x228833, 0x2a9e3c, 0x1e7a2e, 0x33aa44, 0x267a30, 0x1f8832, 0x2d9940, 0x1a7028, 0x35b048];
[[0,3.2,0,0.55],[0.4,2.8,0.15,0.45],[-0.4,2.8,-0.15,0.45],[0.15,3.5,0.2,0.4],[-0.2,3.4,-0.2,0.4],
 [0.35,3.6,0,0.35],[-0.3,3.7,0.1,0.32],[0,3.9,0,0.3],[0.25,2.5,0.2,0.35],[-0.35,2.6,-0.1,0.38],
 [0,4.1,0,0.22],[0.2,4.0,-0.1,0.25]].forEach(([x,y,z,r],i) => {
  const leaf=new THREE.Mesh(new THREE.SphereGeometry(r,6,6),
    new THREE.MeshLambertMaterial({color:greenShades[i % greenShades.length]}));
  leaf.position.set(x,y,z); leaf.scale.set(1,1.2,1); leaf.castShadow=true; plantG.add(leaf);
});
plantG.userData = { clickable: true, id: 'plant', label: '\uD83C\uDF31 SKILL TREE \u2014 Click to view' };
// Second smaller plant (pure green)
const plant2 = new THREE.Group(); plant2.position.set(-5.5, 0, 3); scene.add(plant2);
const pot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.25,0.5,8), M.pot); pot2.position.y=0.25; plant2.add(pot2);
[[0,0.8,0,0.3],[0.2,0.65,0.1,0.25],[-0.2,0.7,-0.1,0.25],[0,1.0,0,0.2]].forEach(([x,y,z,r],i) => {
  const lf=new THREE.Mesh(new THREE.SphereGeometry(r,5,5),
    new THREE.MeshLambertMaterial({color:[0x1f7e30, 0x2a9940, 0x1a6a28, 0x33aa44][i]}));
  lf.position.set(x,y,z); lf.castShadow=true; plant2.add(lf);
});

// ── POSTER on back wall (CLICKABLE) — pushed forward to clear wall trim ──
const posterGroup = new THREE.Group(); posterGroup.position.set(1, 4.5, -6.75); scene.add(posterGroup);
const posterBg = new THREE.Mesh(new THREE.BoxGeometry(2, 2.8, 0.05), M.poster); posterGroup.add(posterBg);
const posterColors=[0xffd080,0x88ccff,0xff88aa,0xffdd66,0x88ffcc,0xff88cc,0x88aaff,0xffd080];
for(let r=0;r<4;r++) for(let c=0;c<4;c++) {
  const dot=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.04),
    new THREE.MeshLambertMaterial({color:posterColors[(r*4+c)%8],emissive:posterColors[(r*4+c)%8],emissiveIntensity:0.3}));
  dot.position.set(-0.6+c*0.4,0.5-r*0.4+0.6,0.04); posterGroup.add(dot);
}
const frame=new THREE.Mesh(new THREE.BoxGeometry(2.2,3,0.04),new THREE.MeshLambertMaterial({color:0x2a1a0a}));
frame.position.z=-0.04; posterGroup.add(frame);
posterGroup.userData = { clickable: true, id: 'poster', label: '\uD83C\uDFA8 POSTER \u2014 CONTACT' };

// ── ONE PIECE POSTER on LEFT WALL (using actual image) ──
const opTexture = new THREE.TextureLoader().load('onepiece.jpg');
opTexture.colorSpace = THREE.SRGBColorSpace;
const opPoster = new THREE.Group(); opPoster.position.set(-7.85, 3.8, -3); opPoster.rotation.y = Math.PI/2; scene.add(opPoster);
// Image poster
const opBg = new THREE.Mesh(
  new THREE.BoxGeometry(2.4, 3.2, 0.05),
  new THREE.MeshLambertMaterial({ map: opTexture })
);
opPoster.add(opBg);
// Frame
const opFrame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 0.04), new THREE.MeshLambertMaterial({color:0x3a2a1a}));
opFrame.position.z=-0.03; opPoster.add(opFrame);

// ── INTERACTIVE OBJECT GLOW + OUTLINES ──
const interactGlows = [];
const interactOutlines = [];

function addInteractGlow(x, y, z, objGroup, distance=3) {
  const gl = new THREE.PointLight(0xffffff, 0, distance);
  gl.position.set(x, y, z);
  scene.add(gl);
  interactGlows.push(gl);
  
  if (objGroup) {
    const box = new THREE.Box3().setFromObject(objGroup);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    const geo = new THREE.BoxGeometry(size.x + 0.2, size.y + 0.2, size.z + 0.2);
    const edges = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const line = new THREE.LineSegments(edges, mat);
    line.position.copy(center);
    scene.add(line);
    interactOutlines.push(line);
  }
  return gl;
}

// ── CAT (Sleeping curled up) ──
const catGroup = new THREE.Group();
catGroup.position.set(5.5, 0.1, 2); // front right corner near lamp
scene.add(catGroup);
const bedGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16);
const bedMat = new THREE.MeshLambertMaterial({color: 0xaa4444});
const bed = new THREE.Mesh(bedGeo, bedMat);
catGroup.add(bed);
const bedInner = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.12, 16), new THREE.MeshLambertMaterial({color: 0xcc6666}));
catGroup.add(bedInner);
gltfLoader.load('model/sleeping_cat.glb', gltf => {
  const catModel = gltf.scene;
  prepModel(catModel);
  fitModelToHeight(catModel, 0.37);
  catModel.position.set(0, 0.18, 0);
  catModel.rotation.y = -Math.PI / 2;
  catGroup.add(catModel);
});

catGroup.userData = { clickable: true, id: 'cat', label: '\uD83D\uDC31 SLEEPING CAT \u2014 Meow' };

const catAudioListener = new THREE.AudioListener();
camera.add(catAudioListener);
const catSound = new THREE.Audio(catAudioListener);
new THREE.AudioLoader().load('sound/CatMeow.mp3', function(buffer) {
  catSound.setBuffer(buffer);
  catSound.setVolume(1.0);
});

const bgMusic = new Audio('sound/BGMusic.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.14;

const lampOnSfx = new Audio('sound/LampTurningOn.mp3');
const lampOffSfx = new Audio('sound/LampTurningOff.mp3');
lampOnSfx.volume = 0.28;
lampOffSfx.volume = 0.28;

function playLampSfx(isOn) {
  const sfx = isOn ? lampOnSfx : lampOffSfx;
  sfx.currentTime = 0;
  sfx.play().catch(() => {});
}

function startBgMusic() {
  bgMusic.play().catch(() => {
    const retryBgMusic = () => {
      bgMusic.play().catch(() => {});
      window.removeEventListener('pointerdown', retryBgMusic);
      window.removeEventListener('keydown', retryBgMusic);
    };
    window.addEventListener('pointerdown', retryBgMusic, { once: true });
    window.addEventListener('keydown', retryBgMusic, { once: true });
  });
}

// Update world matrices so bounding boxes are accurate
scene.updateMatrixWorld(true);

// ── SPARKLES FOR INTERACTIVE OBJECTS ──
const interactiveSparkles = [];
const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
function addSparkle(objGroup) {
  const box = new THREE.Box3().setFromObject(objGroup);
  const center = box.getCenter(new THREE.Vector3());
  const geo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
  for(let i=0; i<3; i++) {
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

// Add sparkles to items
[laptopGroup, posterGroup, shelfGroup, plantG, ceilingBulbG, floorLampL, floorLampR, catGroup].forEach(addSparkle);

// ── CHAIR — centered with desk ──
const chairG = new THREE.Group(); chairG.position.set(0, 0, 3); scene.add(chairG);
const seat=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.12,1.2),M.chairCushion); seat.position.y=1.1; seat.castShadow=true; chairG.add(seat);
const chairBack=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,0.12),M.chair); chairBack.position.set(0,1.76,0.54); chairBack.castShadow=true; chairG.add(chairBack);
[[-0.5,0.55,0.5],[0.5,0.55,0.5],[-0.5,0.55,-0.5],[0.5,0.55,-0.5]].forEach(([x,y,z]) => {
  const leg=new THREE.Mesh(new THREE.BoxGeometry(0.1,1.1,0.1),M.chair); leg.position.set(x,y,z); chairG.add(leg);
});

// ── HUMAN CHARACTER (detailed, faceless, lo-fi) ──
const characterGroup = new THREE.Group();
characterGroup.position.set(-5, 0, 3);
characterGroup.visible = true;
scene.add(characterGroup);

const head = new THREE.Object3D();
const armLUpper = new THREE.Object3D();
const armRUpper = new THREE.Object3D();
const armLLower = new THREE.Object3D();
const armRLower = new THREE.Object3D();
const legLUpper = new THREE.Object3D();
const legRUpper = new THREE.Object3D();
const legLLower = new THREE.Object3D();
const legRLower = new THREE.Object3D();

gltfLoader.load('model/Character.glb', gltf => {
  const characterModel = gltf.scene;
  prepModel(characterModel);
  fitModelToHeight(characterModel, 0.57);
  characterGroup.add(characterModel);

  const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'Walk');
  const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'Idle') || THREE.AnimationClip.findByName(gltf.animations, 'Idle2');
  if (walkClip || idleClip) {
    const mixer = new THREE.AnimationMixer(characterModel);
    characterActions.walk = walkClip ? mixer.clipAction(walkClip) : null;
    characterActions.idle = idleClip ? mixer.clipAction(idleClip) : null;
    if (characterActions.idle) characterActions.idle.play();
    else if (characterActions.walk) {
      characterActions.walk.play();
      characterActions.walk.paused = true;
    }
    animationMixers.push(mixer);
  }
});

// ── WAYPOINT WALK SYSTEM ──
// Walk path: start(front-left) -> poster(left wall) -> bookshelf(right) -> back
const WAYPOINTS = [
  { x: -5, z: 3, pause: 1 },         // start
  { x: -5.5, z: 1, pause: 0 },       // pass inside the left floor lamp
  { x: -6.5, z: -2, pause: 3.5 },    // stop at One Piece poster
  { x: -4, z: -2.5, pause: 0 },      // walk behind desk
  { x: 4, z: -2.5, pause: 0 },       // cross behind desk
  { x: 5, z: -3.5, pause: 0 },       // toward bookshelf
  { x: 5, z: -3.5, pause: 4 },       // bookshelf
  { x: 4, z: -2.5, pause: 0 },       // walk back
  { x: -4, z: -2.5, pause: 0 },      // cross behind desk
  { x: -6.5, z: -2, pause: 0 },      // past plant
  { x: -5.5, z: 1, pause: 0 },       // pass inside lamp
  { x: -5, z: 3, pause: 2 },         // back to start
];
let wpIndex = 0;
let wpPauseTimer = 0;
let charAtDesk = false;
const CHAR_WALK_SPEED = 1.5;

// ── PARTICLES ──
const particles = [];
for(let i=0;i<60;i++){
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.06),
    new THREE.MeshBasicMaterial({ color:[0xb8ff8c,0x88ccff,0xffdd66,0xff88aa][Math.floor(Math.random()*4)], transparent:true, opacity:0.6 }));
  p.position.set((Math.random()-0.5)*14, Math.random()*6+0.5, (Math.random()-0.5)*12);
  p.userData.phase = Math.random()*Math.PI*2;
  scene.add(p); particles.push(p);
}

// ── POST-PROCESSING (AURA OUTLINES) ──
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 4.0;
outlinePass.edgeGlow = 1.0;
outlinePass.edgeThickness = 1.5;
outlinePass.pulsePeriod = 5.5; // Slower breathing effect
outlinePass.visibleEdgeColor.set('#ffffff');
outlinePass.hiddenEdgeColor.set('#000000');
composer.addPass(outlinePass);

const visitedOutlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
visitedOutlinePass.edgeStrength = 1.4;
visitedOutlinePass.edgeGlow = 0.35;
visitedOutlinePass.edgeThickness = 1.0;
visitedOutlinePass.pulsePeriod = 5.5;
visitedOutlinePass.visibleEdgeColor.set('#8a8a8a');
visitedOutlinePass.hiddenEdgeColor.set('#000000');
composer.addPass(visitedOutlinePass);

// ── RAYCASTING ──
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clickables = [laptopGroup, shelfGroup, posterGroup, plantG, floorLampL, floorLampR, ceilingBulbG, catGroup];
const visitedInteractives = new Set();
outlinePass.selectedObjects = [];
visitedOutlinePass.selectedObjects = [];

function updateOutlineSelection() {
  if (currentState !== 'ROOM') {
    outlinePass.selectedObjects = [];
    visitedOutlinePass.selectedObjects = [];
    return;
  }
  outlinePass.selectedObjects = clickables.filter(obj => !visitedInteractives.has(obj));
  visitedOutlinePass.selectedObjects = clickables.filter(obj => visitedInteractives.has(obj));
}

let hoveredObj = null;
const label = document.getElementById('obj-label');

function getClickable(obj) {
  let o = obj;
  while(o) { if(o.userData && o.userData.clickable) return o; o = o.parent; }
  return null;
}

// ── CAMERA ANIMATION ──
let camAnimating = false;
let camDestPos = new THREE.Vector3();
let camDestTarget = new THREE.Vector3();
let camT = 0, camDuration = 2.2, camOnDone = null;
let camStartPos = new THREE.Vector3();
let camStartTarget = new THREE.Vector3();

function flyTo(pos, target, duration=2.2, onDone=null) {
  camStartPos.copy(camera.position);
  camStartTarget.copy(camTarget);
  camDestPos.copy(pos);
  camDestTarget.copy(target);
  camT = 0; camAnimating = true;
  camDuration = duration; camOnDone = onDone;
}

function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }

// ── UI STATE ──
const menuEl = document.getElementById('menu');
const hudEl = document.getElementById('hud');
const hud_loc = document.getElementById('loc-box');
const hud_hint = document.getElementById('hint-bar');
const backBtn = document.getElementById('back-btn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

function showWorld() {
  currentState = 'ROOM';
  updateOutlineSelection();
  setCharacterMoving(false);
  menuEl.style.opacity = '0';
  menuEl.style.transform = 'scale(0.95)';
  setTimeout(() => { menuEl.style.pointerEvents = 'none'; }, 700);
  hudEl.style.opacity = '1';
  hud_loc.style.display = 'block';
  hud_hint.style.display = 'block';
  backBtn.style.display = 'block';
}

function showMenu() {
  currentState = 'MENU';
  updateOutlineSelection();
  setCharacterMoving(false);
  hudEl.style.opacity = '0';
  backBtn.style.display = 'none';
  charAtDesk = false;
  wpIndex = 0;
  characterGroup.position.set(-5, 0, 3);
  characterGroup.rotation.y = 0;
  armLUpper.rotation.x = 0; armRUpper.rotation.x = 0;
  legLUpper.rotation.x = 0; legRUpper.rotation.x = 0;
  legLLower.rotation.x = 0; legRLower.rotation.x = 0;
  modal.classList.remove('open');
  hoveredObj = null;
  label.style.opacity = '0';
  cur.classList.remove('hovering');
  flyTo(CAM_STATES.MENU.pos, CAM_STATES.MENU.target, 1.8, () => {
    menuEl.style.opacity = '1';
    menuEl.style.transform = '';
    menuEl.style.pointerEvents = '';
  });
}

function showLaptopView() {
  currentState = 'LAPTOP';
  charAtDesk = false;
  flyTo(CAM_STATES.LAPTOP.pos, CAM_STATES.LAPTOP.target, 2.0, () => {
    openProjectModal();
  });
}

function backFromLaptop() {
  modal.classList.remove('open');
  currentState = 'ROOM';
  charAtDesk = false;
  setCharacterMoving(false);
  // Reset to walk start
  wpIndex = 0;
  characterGroup.position.set(-5, 0, 3);
  characterGroup.rotation.y = 0;
  // Reset limb rotations
  armLUpper.rotation.x = 0; armRUpper.rotation.x = 0;
  legLUpper.rotation.x = 0; legRUpper.rotation.x = 0;
  legLLower.rotation.x = 0; legRLower.rotation.x = 0;
  hoveredObj = null;
  label.style.opacity = '0';
  cur.classList.remove('hovering');
  flyTo(CAM_STATES.ROOM.pos, CAM_STATES.ROOM.target, 1.8);
}

function openProjectModal() {
  modalTitle.textContent = '\uD83D\uDCBB OLAN\'S PROJECTS';
  modalBody.innerHTML = `
    <div class="proj-card-row">
      <div class="proj-card-info">
        <div class="proj-tag">COMPLETED</div>
        <div class="proj-name">YT DOWNLOADER</div>
        <div class="proj-desc">Flask web app untuk download YouTube videos via WiFi. Accessible dari semua device di network yang sama. Built with yt-dlp backend.</div>
        <div class="proj-tech">
          <span class="tech-chip">PYTHON</span><span class="tech-chip">FLASK</span><span class="tech-chip">YT-DLP</span><span class="tech-chip">HTML/CSS</span>
        </div>
      </div>
      <div class="proj-card-img"><img src="img/proj_ytdownloader.png" alt="YT Downloader"></div>
    </div>
    <div class="proj-card-row">
      <div class="proj-card-info">
        <div class="proj-tag" style="border-color:#88ccff;color:#88ccff;background:rgba(136,204,255,0.1)">IN PROGRESS</div>
        <div class="proj-name">ATS + AI CV SUMMARIZER</div>
        <div class="proj-desc">Applicant Tracking System dengan AI-powered CV summarization menggunakan Claude API. Full stack: React frontend, FastAPI backend, SQLite DB.</div>
        <div class="proj-tech">
          <span class="tech-chip">REACT</span><span class="tech-chip">FASTAPI</span><span class="tech-chip">SQLITE</span><span class="tech-chip">CLAUDE API</span>
        </div>
      </div>
      <div class="proj-card-img"><img src="img/proj_ats.png" alt="ATS"></div>
    </div>
    <div class="proj-card-row">
      <div class="proj-card-info">
        <div class="proj-tag" style="border-color:#aa88ff;color:#aa88ff;background:rgba(170,136,255,0.1)">LEARNING</div>
        <div class="proj-name">NESTJS REST API</div>
        <div class="proj-desc">Exploring TypeScript + NestJS untuk project requirement. Belajar REST API patterns, controllers, services, dan dependency injection.</div>
        <div class="proj-tech">
          <span class="tech-chip">TYPESCRIPT</span><span class="tech-chip">NESTJS</span><span class="tech-chip">REST API</span>
        </div>
      </div>
      <div class="proj-card-img"><img src="img/proj_nestjs.png" alt="NestJS"></div>
    </div>`;
  modal.classList.add('open');
}

// ── EVENTS ──
const cur = document.getElementById('cur');
document.addEventListener('mousemove', e => {
  cur.style.left = e.clientX - 7 + 'px';
  cur.style.top  = e.clientY - 7 + 'px';
  mouse.x = (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  label.style.left = e.clientX + 18 + 'px';
  label.style.top  = e.clientY - 10 + 'px';
});

// Menu item clicks
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    if(item.classList.contains('disabled')) return;
    const action = item.dataset.action;
    if(action === 'enter') { showWorld(); return; }
    if(action === 'projects') { showWorld(); setTimeout(showLaptopView, 800); return; }
  });
  item.addEventListener('mouseenter', () => {
    if(!item.classList.contains('disabled')) cur.classList.add('hovering');
  });
  item.addEventListener('mouseleave', () => cur.classList.remove('hovering'));
});

backBtn.addEventListener('click', () => {
  if(currentState === 'LAPTOP') backFromLaptop();
  else showMenu();
});
backBtn.addEventListener('mouseenter', () => cur.classList.add('hovering'));
backBtn.addEventListener('mouseleave', () => cur.classList.remove('hovering'));

document.getElementById('modal-close').addEventListener('click', () => {
  modal.classList.remove('open');
  if(currentState === 'LAPTOP') backFromLaptop();
});
modal.addEventListener('click', e => {
  if(e.target === modal) {
    modal.classList.remove('open');
    if(currentState === 'LAPTOP') backFromLaptop();
  }
});

// World clicks
canvas.addEventListener('click', () => {
  if(currentState !== 'ROOM' || camAnimating) return;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(
    clickables.flatMap(g => { const arr=[g]; g.traverse(c => { if(c!==g) arr.push(c); }); return arr; })
  );
  if(hits.length > 0) {
    const obj = getClickable(hits[0].object);
    if (obj) {
      visitedInteractives.add(obj);
      updateOutlineSelection();
    }
    if(obj && obj.userData.id === 'laptop') { showLaptopView(); }
    else if(obj && obj.userData.id === 'lamp') {
      obj.userData.on = !obj.userData.on;
      playLampSfx(obj.userData.on);
      
      // Update label immediately
      label.textContent = obj.userData.on ? '\uD83D\uDCA1 TURN OFF LAMP' : '\uD83D\uDCA1 TURN ON LAMP';

      // Set intensity to 0 instead of visibility = false to prevent shader recompilation freezes
      if (obj.userData.toggleLight) obj.userData.toggleLight.intensity = obj.userData.on ? obj.userData.baseLightInt : 0;
      if (obj.userData.toggleSpot) obj.userData.toggleSpot.intensity = obj.userData.on ? obj.userData.baseSpotInt : 0;
      if (obj.userData.mat) obj.userData.mat.emissiveIntensity = obj.userData.on ? (obj.userData.emissiveOn || 0.4) : 0.0;
    }
    else if(obj && obj.userData.id === 'cat') {
      if(catSound.isPlaying) catSound.stop();
      catSound.play();
    }
  }
});

// ── ANIMATE ──
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t  = clock.getElapsedTime();

  animationMixers.forEach(mixer => mixer.update(dt));

  // particle float
  particles.forEach(p => {
    p.position.y += Math.sin(t*0.8 + p.userData.phase) * 0.003;
    p.position.x += Math.sin(t*0.5 + p.userData.phase) * 0.001;
    if(p.position.y > 7) p.position.y = 0.3;
    if(p.position.y < 0.1) p.position.y = 6.8;
    p.rotation.x += 0.01; p.rotation.y += 0.015;
  });

  // TV light flicker
  tvLight.intensity = 0.6 + Math.sin(t * 7.3) * 0.1 + Math.sin(t * 13.1) * 0.03;
  // Desk lamp pulse
  lampLight.intensity = 1.2 + Math.sin(t * 2.1) * 0.1;
  // Ceiling bulb (steady white with very subtle flicker)
  if (ceilingBulbG.userData.on) {
    ceilingLight.intensity = ceilingBulbG.userData.baseLightInt + Math.sin(t * 2.2) * 0.06;
  }
  // Floor lamps  // animate flickering lights
  if (floorLampL.userData.on) {
    flLightL.intensity = 1.2 + Math.sin(t * 1.8) * 0.08;
  }
  if (floorLampR.userData.on) {
    flLightR.intensity = 1.2 + Math.sin(t * 1.8 + 1.5) * 0.08;
  }

  // Sparkle particles update
  interactiveSparkles.forEach(s => {
    s.position.y = s.userData.baseY + Math.sin(t * s.userData.speed + s.userData.phase) * 0.2;
    s.rotation.x += 0.02;
    s.rotation.y += 0.02;
  });

  // Character waypoint walking
  if(!charAtDesk) {
    const wp = WAYPOINTS[wpIndex];
    const dx = wp.x - characterGroup.position.x;
    const dz = wp.z - characterGroup.position.z;
    const dist = Math.sqrt(dx*dx + dz*dz);

    if(dist < 0.15) {
      setCharacterMoving(false);
      // Arrived at waypoint
      if(wp.pause > 0 && wpPauseTimer < wp.pause) {
        // Pausing (looking at poster/bookshelf)
        wpPauseTimer += dt;
        // Idle animation - slight body sway
        legLUpper.rotation.x = 0; legRUpper.rotation.x = 0;
        legLLower.rotation.x = 0; legRLower.rotation.x = 0;
        armLUpper.rotation.x = Math.sin(t*1.5)*0.08;
        armRUpper.rotation.x = -Math.sin(t*1.5)*0.08;
        // Head look around
        head.rotation.y = Math.sin(t*0.8)*0.2;
      } else {
        // Move to next waypoint
        wpPauseTimer = 0;
        wpIndex = (wpIndex + 1) % WAYPOINTS.length;
      }
    } else {
      setCharacterMoving(true);
      // Walking toward waypoint
      const angle = Math.atan2(dx, dz);
      characterGroup.rotation.y = angle;
      const speed = CHAR_WALK_SPEED * dt;
      characterGroup.position.x += (dx / dist) * speed;
      characterGroup.position.z += (dz / dist) * speed;
      // Walk cycle - leg swing
      const swing = Math.sin(t * 5) * 0.5;
      legLUpper.rotation.x = swing;
      legRUpper.rotation.x = -swing;
      legLLower.rotation.x = Math.max(0, -swing*0.3);
      legRLower.rotation.x = Math.max(0, swing*0.3);
      // Arm swing
      armLUpper.rotation.x = -swing * 0.4;
      armRUpper.rotation.x = swing * 0.4;
      // Head reset
      head.rotation.y = 0;
    }
  } else {
    setCharacterMoving(false);
  }

  // camera animation (fly-through)
  if(camAnimating) {
    camT += dt / camDuration;
    const et = easeInOutCubic(Math.min(camT, 1));
    camera.position.lerpVectors(camStartPos, camDestPos, et);
    camTarget.lerpVectors(camStartTarget, camDestTarget, et);
    camera.lookAt(camTarget);
    if(camT >= 1) {
      camAnimating = false;
      if(camOnDone) { camOnDone(); camOnDone = null; }
    }
  }

  // gentle camera float (menu & room states)
  if(!camAnimating && (currentState === 'MENU' || currentState === 'ROOM')) {
    const basePos = CAM_STATES.MENU.pos;
    camera.position.x = basePos.x + Math.sin(t*0.4)*0.3;
    camera.position.y = basePos.y + Math.sin(t*0.3)*0.2;
    camera.lookAt(camTarget);
  }

  // hover detection in ROOM state
  if(currentState === 'ROOM' && !camAnimating) {
    raycaster.setFromCamera(mouse, camera);
    const allObjs = clickables.flatMap(g => { const arr=[g]; g.traverse(c => { if(c!==g) arr.push(c); }); return arr; });
    const hits = raycaster.intersectObjects(allObjs);
    if(hits.length > 0) {
      const obj = getClickable(hits[0].object);
      if(obj && obj !== hoveredObj) {
        hoveredObj = obj;
        let lbl = obj.userData.label;
        if (obj.userData.id === 'lamp') {
          lbl = obj.userData.on ? '\uD83D\uDCA1 TURN OFF LAMP' : '\uD83D\uDCA1 TURN ON LAMP';
        }
        label.textContent = lbl;
        label.style.opacity = '1';
        cur.classList.add('hovering');
      }
    } else if(hoveredObj) {
      hoveredObj = null;
      label.style.opacity = '0';
      cur.classList.remove('hovering');
    }
  }

  composer.render();
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  outlinePass.setSize(window.innerWidth, window.innerHeight);
  visitedOutlinePass.setSize(window.innerWidth, window.innerHeight);
});

// Remove loader once everything is initialized and rendering starts
const loaderEl = document.getElementById('loader');
if(loaderEl) {
  // Give it a tiny delay to ensure the first frame is painted
  setTimeout(() => {
    loaderEl.style.opacity = '0';
    loaderEl.style.visibility = 'hidden';
    setTimeout(() => {
      loaderEl.remove();
      startBgMusic();
    }, 800);
  }, 100);
}
