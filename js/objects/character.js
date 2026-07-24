import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { scene } from '../scene/sceneSetup.js';
import { prepModel, fitModelToHeight } from './roomObjects.js';

export const characterGroup = new THREE.Group();
characterGroup.position.set(-5, 0, 3);
characterGroup.visible = true;
scene.add(characterGroup);

export const characterActions = { walk: null, idle: null };
export const animationMixers = [];

let isCharacterMoving = false;
export function setCharacterMoving(moving) {
  if (isCharacterMoving === moving) return;
  isCharacterMoving = moving;
  if (moving) {
    if (characterActions.idle) {
      characterActions.idle.stop();
    }
    if (characterActions.walk) {
      characterActions.walk.reset();
      characterActions.walk.paused = false;
      characterActions.walk.play();
    }
  } else {
    if (characterActions.walk) {
      characterActions.walk.stop();
    }
    if (characterActions.idle) {
      characterActions.idle.reset();
      characterActions.idle.play();
    }
  }
}

export function loadCharacterModel() {
  const gltfLoader = new GLTFLoader();
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
      animationMixers.push(mixer);

      if (isCharacterMoving) {
        if (characterActions.walk) characterActions.walk.play();
      } else {
        if (characterActions.idle) characterActions.idle.play();
        else if (characterActions.walk) characterActions.walk.stop();
      }
    }
  });
}

// ── WAYPOINT WALK SYSTEM ──
export const WAYPOINTS = [
  { x: -5, z: 3, pause: 1, lookAt: 0 },
  { x: -5.5, z: 1, pause: 0 },
  { x: -6.5, z: -2, pause: 4, lookAt: -Math.PI / 2 },
  { x: -4, z: -2.5, pause: 0 },
  { x: 4, z: -2.5, pause: 0 },
  { x: 5, z: -3.5, pause: 4, lookAt: Math.PI },
  { x: 5.5, z: -0.5, pause: 4, lookAt: Math.PI / 2 },
  { x: 5.5, z: 3.5, pause: 0 },
  { x: 0, z: 3.5, pause: 0 }
];

let wpIndex = 0;
let wpPauseTimer = 0;
export const CHAR_WALK_SPEED = 1.5;

export function updateCharacterWaypoint(dt, t, charAtDesk) {
  if (charAtDesk) {
    setCharacterMoving(false);
    return;
  }

  const wp = WAYPOINTS[wpIndex];
  const dx = wp.x - characterGroup.position.x;
  const dz = wp.z - characterGroup.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < 0.15) {
    setCharacterMoving(false);
    if (wp.pause > 0 && wpPauseTimer < wp.pause) {
      wpPauseTimer += dt;
      if (wp.lookAt !== undefined) {
        let diff = wp.lookAt - characterGroup.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        characterGroup.rotation.y += diff * (dt * 5);
      }
    } else {
      wpPauseTimer = 0;
      wpIndex = (wpIndex + 1) % WAYPOINTS.length;
    }
  } else {
    setCharacterMoving(true);
    const angle = Math.atan2(dx, dz);
    characterGroup.rotation.y = angle;
    const speed = CHAR_WALK_SPEED * dt;
    characterGroup.position.x += (dx / dist) * speed;
    characterGroup.position.z += (dz / dist) * speed;
  }
}
