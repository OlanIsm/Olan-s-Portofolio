import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

export const canvas = document.getElementById('c');

export const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x1a140e);

export const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x1a140e, 18, 35);

export const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);

export const CAM_STATES = {
  MENU: { pos: new THREE.Vector3(0, 3.5, 12), target: new THREE.Vector3(0, 3.5, -2) },
  ROOM: { pos: new THREE.Vector3(0, 3.5, 12), target: new THREE.Vector3(0, 3.5, -2) },
  LAPTOP: { pos: new THREE.Vector3(2.5, 5.5, 4), target: new THREE.Vector3(0.8, 2.5, 0.3) },
  ABOUT: { pos: new THREE.Vector3(-0.3, 4.2, 3.2), target: new THREE.Vector3(-1.5, 2.8, -0.1) },
  PLANT: { pos: new THREE.Vector3(-3.5, 4.5, 0), target: new THREE.Vector3(-5.8, 3.0, -4) },
  POSTER: { pos: new THREE.Vector3(1, 4.5, -3.0), target: new THREE.Vector3(1, 4.5, -6.75) },
  SHELF: { pos: new THREE.Vector3(1.5, 4.5, -1.0), target: new THREE.Vector3(5.0, 2.5, -4.0) },
};

camera.position.copy(CAM_STATES.MENU.pos);
export const camTarget = new THREE.Vector3().copy(CAM_STATES.MENU.target);
camera.lookAt(camTarget);

// ── LIGHTS ──
export const ambient = new THREE.AmbientLight(0xccbbaa, 0.15);
scene.add(ambient);

export const dirLight = new THREE.DirectionalLight(0xffeedd, 0.3);
dirLight.position.set(4, 12, 6);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.near = 0.1; dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -12; dirLight.shadow.camera.right = 12;
dirLight.shadow.camera.top = 12; dirLight.shadow.camera.bottom = -12;
scene.add(dirLight);

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

export const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 4.0;
outlinePass.edgeGlow = 1.0;
outlinePass.edgeThickness = 1.5;
outlinePass.pulsePeriod = 5.5;
outlinePass.visibleEdgeColor.set('#ffffff');
outlinePass.hiddenEdgeColor.set('#000000');
composer.addPass(outlinePass);

export const visitedOutlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
visitedOutlinePass.edgeStrength = 1.4;
visitedOutlinePass.edgeGlow = 0.35;
visitedOutlinePass.edgeThickness = 1.0;
visitedOutlinePass.pulsePeriod = 5.5;
visitedOutlinePass.visibleEdgeColor.set('#8a8a8a');
visitedOutlinePass.hiddenEdgeColor.set('#000000');
composer.addPass(visitedOutlinePass);
