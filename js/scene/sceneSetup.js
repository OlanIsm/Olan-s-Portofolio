import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

export const canvas = document.getElementById('c');

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.setClearColor(0xc5d8ce);

export const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xc5d8ce, 52, 155);

export const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 250);

export const CAM_STATES = {
  OUTSIDE: { pos: new THREE.Vector3(24, 18, 44), target: new THREE.Vector3(-5, 4, 8) },
  FRONT_DOOR: { pos: new THREE.Vector3(0, 2.3, 11.2), target: new THREE.Vector3(0, 2.2, 7.2) },
  DOOR_INSIDE: { pos: new THREE.Vector3(0, 2.25, 7.95), target: new THREE.Vector3(0, 2.25, 6) },

  ROOM: { pos: new THREE.Vector3(0, 5.1, 14.3), target: new THREE.Vector3(0, 3.1, -1.5) },
  LAPTOP: { pos: new THREE.Vector3(2.5, 5.5, 4), target: new THREE.Vector3(0.8, 2.5, 0.3) },
  ABOUT: { pos: new THREE.Vector3(-0.3, 4.2, 3.2), target: new THREE.Vector3(-1.5, 2.8, -0.1) },
  PLANT: { pos: new THREE.Vector3(-3.5, 4.5, 0), target: new THREE.Vector3(-5.8, 3.0, -4) },
  POSTER: { pos: new THREE.Vector3(1, 4.5, -3.0), target: new THREE.Vector3(1, 4.5, -6.75) },
  SHELF: { pos: new THREE.Vector3(1.5, 4.5, -1.0), target: new THREE.Vector3(5.0, 2.5, -4.0) },
};

camera.position.copy(CAM_STATES.OUTSIDE.pos);
export const camTarget = new THREE.Vector3().copy(CAM_STATES.OUTSIDE.target);
camera.lookAt(camTarget);

export function setSceneAtmosphere(isOutside) {
  if (isOutside) {
    renderer.setClearColor(0xc5d8ce);
    scene.fog.color.setHex(0xc5d8ce).convertSRGBToLinear();
    scene.fog.near = 52;
    scene.fog.far = 155;
  } else {
    renderer.setClearColor(0x191d1a);
    scene.fog.color.setHex(0x191d1a).convertSRGBToLinear();
    scene.fog.near = 48;
    scene.fog.far = 85;
  }
  renderer.shadowMap.needsUpdate = true;
}


// ── LIGHTS ──
export const ambient = new THREE.HemisphereLight(0xffe9cf, 0x697567, 0.55);
scene.add(ambient);

export const dirLight = new THREE.DirectionalLight(0xffd6a0, 0.75);
dirLight.position.set(7, 9, 4);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.near = 0.1; dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -12; dirLight.shadow.camera.right = 12;
dirLight.shadow.camera.top = 12; dirLight.shadow.camera.bottom = -12;
scene.add(dirLight);
dirLight.shadow.bias = -0.0005;
dirLight.shadow.normalBias = 0.035;

export const tvLight = new THREE.PointLight(0x88bbff, 0.6, 5);
tvLight.position.set(-0.8, 3.5, 0.5);
scene.add(tvLight);

export const lampLight = new THREE.PointLight(0xffcc66, 1.2, 6);
lampLight.position.set(-2.8, 4.0, 0.5);
scene.add(lampLight);

export const windowLightAmb = new THREE.PointLight(0xffeebb, 0.5, 12);
windowLightAmb.position.set(7, 4.5, -1);
scene.add(windowLightAmb);

// ── POST-PROCESSING ──
export const composer = new EffectComposer(renderer);
export const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
// r128's OutlinePass composites in display space.
composer.renderTarget1.texture.encoding = THREE.sRGBEncoding;
composer.renderTarget2.texture.encoding = THREE.sRGBEncoding;

export const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 2.5;
outlinePass.edgeGlow = 0.2;
outlinePass.edgeThickness = 1;
outlinePass.pulsePeriod = 0;
outlinePass.visibleEdgeColor.set('#ffe2a8');
outlinePass.hiddenEdgeColor.set('#000000');
outlinePass.enabled = false;
composer.addPass(outlinePass);

export function resizeRenderer(scale = 1) {
  const w = window.innerWidth, h = window.innerHeight;
  const cap = window.matchMedia('(pointer: coarse)').matches ? 1.25 : 1.5;
  const ratio = Math.min(window.devicePixelRatio, cap, Math.sqrt(2200000 / (w * h))) * scale;
  renderer.setPixelRatio(ratio);
  renderer.setSize(w, h);
  composer.setPixelRatio(ratio);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const portrait = w < h;
  CAM_STATES.OUTSIDE.pos.set(portrait ? 21 : 24, portrait ? 24 : 18, portrait ? 64 : 44);
  CAM_STATES.OUTSIDE.target.set(portrait ? 1 : -5, portrait ? 1 : 4, 8);
  // Portrait stays inside the room; the destination buttons reach objects outside the crop.
  CAM_STATES.ROOM.pos.set(0, portrait ? 4.6 : 5.1, portrait ? 13.2 : 14.3);
}
resizeRenderer();
camera.position.copy(CAM_STATES.OUTSIDE.pos);
camTarget.copy(CAM_STATES.OUTSIDE.target);
camera.lookAt(camTarget);
