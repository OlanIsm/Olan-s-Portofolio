import * as THREE from 'three';
import {
  renderer, scene, camera, CAM_STATES, camTarget, composer, outlinePass,
  tvLight, lampLight, dirLight, windowLightAmb, ambient, setSceneAtmosphere, reducedMotion, resizeRenderer
} from './js/scene/sceneSetup.js';
import {
  initAudio, catSound, clickSound, bushSound, bushRevSound, kbSound, screenUpSound, screenOffSound, playLampSfx, startBgMusic,
  playWhooshSfx, playDoorSfx, playLightPopSfx
} from './js/audio/audioManager.js';
import { createRoomObjects } from './js/objects/roomObjects.js';
import {
  createExteriorScene, updateExterior, openFrontDoor, resetFrontDoor, setExteriorActive
} from './js/scene/exteriorScene.js';
import { batchStatic } from './js/scene/sceneUtils.js';
import { characterGroup, loadCharacterModel, updateCharacterWaypoint, animationMixers, setCharacterMoving } from './js/objects/character.js';
import { openProjectModal } from './js/ui/projectModal.js?v=156';
import { openExperienceModal } from './js/ui/experienceModal.js?v=156';
import { openContactModal } from './js/ui/contactModal.js?v=135';
import { openSkillTreeModal } from './js/ui/skillTreeModal.js?v=130';
import { openAboutModal } from './js/ui/aboutModal.js?v=130';
import { openHelpModal } from './js/ui/helpModal.js?v=130';
import { modal, closeModal } from './js/ui/modalManager.js?v=135';

const assetsReady = new Promise(resolve => { THREE.DefaultLoadingManager.onLoad = resolve; });

// ── INITIALIZE AUDIO ──
initAudio(camera);

// ── CREATE 2 SEPARATE CONTAINERS (EXTERIOR & ROOM) ──
const preRoomChildren = new Set(scene.children);
const room = createRoomObjects();
const roomChildren = scene.children.filter(c => !preRoomChildren.has(c));

export const roomContainer = new THREE.Group();
roomContainer.name = 'RoomContainer';
roomChildren.forEach(child => roomContainer.add(child));
scene.add(roomContainer);
batchStatic(roomContainer, [...room.clickables, ...room.interactiveSparkles]);

loadCharacterModel();
roomContainer.add(characterGroup);

createExteriorScene(scene);
// Authored hex colors are sRGB. GLTFLoader already converts imported model colors.
const authoredMaterials = new Set();
scene.traverse(object => {
  if (object.material) {
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => authoredMaterials.add(material));
  }
});
authoredMaterials.forEach(material => {
  material.color?.convertSRGBToLinear();
  material.emissive?.convertSRGBToLinear();
});

export function setRoomActive(isActive) {
  roomContainer.visible = isActive;
  [tvLight, lampLight, windowLightAmb, dirLight, ambient].forEach(light => { light.visible = isActive; });
  tvLight.intensity = isActive ? 0.6 : 0;
  lampLight.intensity = isActive ? 1.2 : 0;
  windowLightAmb.intensity = isActive ? 0.5 : 0;
  dirLight.intensity = isActive ? 0.75 : 0;
}

// Initial state: Outside active, Room inactive
setExteriorActive(true);
setRoomActive(false);
setSceneAtmosphere(true);

// ── APP STATE ──
let currentState = 'OUTSIDE';
let charAtDesk = false;
const visitedInteractives = new Set();
let hoveredObj = null;
let enteringWorld = false;
let lastEnterTime = 0;

// ── UI ELEMENTS ──
const menuEl = document.getElementById('menu');
const hudEl = document.getElementById('hud');
const hud_loc = document.getElementById('loc-box');
const hud_hint = document.getElementById('hint-bar');
const backBtn = document.getElementById('back-btn');
const helpBtn = document.getElementById('help-btn');
const label = document.getElementById('obj-label');
const cur = document.getElementById('cur');
const roomNav = document.getElementById('room-nav');
document.body.dataset.scene = 'OUTSIDE';
menuEl.inert = true;
hudEl.inert = true;

// ── RAYCASTING ──
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getClickable(obj) {
  let o = obj;
  while (o) {
    if (o.userData && o.userData.clickable) return o;
    o = o.parent;
  }
  return null;
}

function updateOutlineSelection() {
  outlinePass.enabled = currentState === 'ROOM' && !camAnimating && !enteringWorld && !!hoveredObj;
  if (outlinePass.selectedObjects[0] !== (outlinePass.enabled ? hoveredObj : undefined)) {
    outlinePass.selectedObjects = outlinePass.enabled ? [hoveredObj] : [];
  }
  room.interactiveSparkles.forEach(s => { s.visible = !visitedInteractives.has(s.userData.object); });
}

// ── CAMERA ANIMATION ──
let camAnimating = false;
const camDestPos = new THREE.Vector3();
const camDestTarget = new THREE.Vector3();
const camStartPos = new THREE.Vector3();
const camStartTarget = new THREE.Vector3();
let camT = 0;
let camDuration = 2.2;
let camOnDone = null;
let camOnUpdate = null;

function flyTo(pos, target, duration = 1.0, onDone = null, onUpdate = null) {
  camStartPos.copy(camera.position);
  camStartTarget.copy(camTarget);
  camDestPos.copy(pos);
  camDestTarget.copy(target);
  camT = 0;
  camAnimating = true;
  camDuration = reducedMotion.matches ? 0.01 : duration;
  camOnDone = onDone;
  camOnUpdate = onUpdate;
  hoveredObj = null;
  label.style.opacity = '0';
  updateOutlineSelection();
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── LIGHT POP TRANSITION ──
const lightPopEl = document.getElementById('light-pop');

async function triggerLightPop(onPeak, onDone) {
  playLightPopSfx();
  const cover = lightPopEl.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: reducedMotion.matches ? 160 : 220, easing: 'ease-in', fill: 'forwards'
  });
  await cover.finished;
  lightPopEl.style.opacity = '1';
  cover.cancel();
  onPeak?.();
  // Draw the destination while fully covered, before starting the reveal.
  renderer.render(scene, camera);
  await new Promise(requestAnimationFrame);
  const reveal = lightPopEl.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: reducedMotion.matches ? 180 : 380, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards'
  });
  await reveal.finished;
  lightPopEl.style.opacity = '0';
  reveal.cancel();
  onDone?.();
}

// ── NAVIGATION & VIEWS ──
function showWorld() {
  currentState = 'ROOM';
  document.body.dataset.scene = 'ROOM';
  setExteriorActive(false);
  setRoomActive(true);
  setSceneAtmosphere(false);
  updateOutlineSelection();
  setCharacterMoving(false);
  menuEl.classList.remove('visible', 'pop-in');
  menuEl.style.opacity = '0';
  menuEl.style.transform = 'scale(0.95)';
  menuEl.style.pointerEvents = 'none';
  menuEl.inert = true;
  hudEl.inert = false;
  hudEl.style.opacity = '1';
  hud_loc.style.display = 'block';
  hud_hint.style.display = 'block';
  backBtn.style.display = 'block';
  backBtn.textContent = '◄ OUTSIDE';
  if (helpBtn) helpBtn.style.display = 'flex';
  roomNav.hidden = false;
}

function enterWorldSequence(directAction = null) {
  if (enteringWorld || camAnimating) return;
  enteringWorld = true;
  currentState = 'TRANSITION';
  document.body.dataset.scene = 'TRANSITION';
  menuEl.inert = true;

  // 1. Hide Menu
  menuEl.classList.remove('visible', 'pop-in');
  menuEl.style.opacity = '0';
  menuEl.style.pointerEvents = 'none';
  menuEl.style.transform = 'scale(0.92)';

  // 2. Ensure exterior is active and door closed
  setExteriorActive(true);
  resetFrontDoor();

  // 3. Play Whoosh SFX & fly rapidly to front door
  playWhooshSfx();
  flyTo(CAM_STATES.FRONT_DOOR.pos, CAM_STATES.FRONT_DOOR.target, 1.05, () => {
    // 4. At Front Door: Play door open SFX & swing door open
    playDoorSfx(true);
    openFrontDoor(reducedMotion.matches ? 0.01 : 0.48);

    // 5. Dive into doorway and trigger LIGHT POP!
    let covered = false;
    flyTo(CAM_STATES.DOOR_INSIDE.pos, CAM_STATES.DOOR_INSIDE.target, 0.5, null, progress => {
      if (covered || progress < 0.23) return;
      covered = true;
      triggerLightPop(() => {
        // AT PEAK OF LIGHT POP:
        camAnimating = false;
        camOnDone = null;
        camOnUpdate = null;
        // Turn off exterior container and all outdoor lights completely!
        setExteriorActive(false);
        // Turn on room container and room lights!
        setRoomActive(true);
        // Reset atmosphere to original room fog & clear color
        setSceneAtmosphere(false);

        // Put camera in original room view
        camera.position.copy(CAM_STATES.ROOM.pos);
        camTarget.copy(CAM_STATES.ROOM.target);
        camera.lookAt(camTarget);

        // Show original room world
        showWorld();
        lastEnterTime = performance.now();
      }, () => {
        enteringWorld = false;
        if (directAction === 'projects') showLaptopView();
        else if (directAction === 'about') showAboutView();
        else if (directAction === 'contact') showPosterView();
        else roomNav.querySelector('button').focus({ preventScroll: true });
      });
    });
  });
}

function showOutside() {
  if (camAnimating || enteringWorld) return;
  enteringWorld = true;
  closeModal();
  hoveredObj = null;
  label.style.opacity = '0';
  cur.classList.remove('hovering');
  currentState = 'TRANSITION';
  document.body.dataset.scene = 'TRANSITION';
  hudEl.inert = true;
  hudEl.style.opacity = '0';
  roomNav.hidden = true;
  updateOutlineSelection();

  triggerLightPop(() => {
    // AT PEAK OF LIGHT POP:
    camAnimating = false;
    // 1. Turn off room container and room lights
    setRoomActive(false);
    // 2. Re-activate exterior container and outdoor lights
    setExteriorActive(true);
    // 3. Set atmosphere back to exterior sky
    setSceneAtmosphere(true);
    // 4. Reset front door
    resetFrontDoor();
    // 5. Place camera back in 3/4 aerial view
    camera.position.copy(CAM_STATES.OUTSIDE.pos);
    camTarget.copy(CAM_STATES.OUTSIDE.target);
    camera.lookAt(camTarget);
    // 6. Update state & UI
    currentState = 'OUTSIDE';
    document.body.dataset.scene = 'OUTSIDE';
    updateOutlineSelection();
    hudEl.style.opacity = '0';
    backBtn.style.display = 'none';
    if (helpBtn) helpBtn.style.display = 'none';
    menuEl.style.opacity = '';
    menuEl.style.transform = '';
    menuEl.classList.remove('pop-in');
    void menuEl.offsetWidth;
    menuEl.classList.add('visible', 'pop-in');
    menuEl.style.pointerEvents = 'auto';
    menuEl.inert = false;
  }, () => {
    enteringWorld = false;
    document.querySelector('[data-action="enter"]').focus({ preventScroll: true });
  });
}


function showLaptopView() {
  currentState = 'LAPTOP';
  charAtDesk = false;
  backBtn.textContent = '◄ BACK';
  flyTo(CAM_STATES.LAPTOP.pos, CAM_STATES.LAPTOP.target, 0.9, () => {
    if (kbSound && kbSound.isPlaying) kbSound.stop();
    if (kbSound?.buffer) kbSound.play();

    if (screenUpSound && screenUpSound.isPlaying) screenUpSound.stop();
    if (screenUpSound?.buffer) screenUpSound.play();
    openProjectModal();
  });
}

function showPlantView() {
  currentState = 'PLANT';
  charAtDesk = false;
  backBtn.textContent = '◄ BACK';
  flyTo(CAM_STATES.PLANT.pos, CAM_STATES.PLANT.target, 0.9, () => {
    openSkillTreeModal();
  });
}

function showPosterView() {
  currentState = 'POSTER';
  charAtDesk = false;
  backBtn.textContent = '◄ BACK';
  flyTo(CAM_STATES.POSTER.pos, CAM_STATES.POSTER.target, 0.9, () => {
    openContactModal();
  });
}

function showShelfView() {
  currentState = 'SHELF';
  charAtDesk = false;
  backBtn.textContent = '◄ BACK';
  flyTo(CAM_STATES.SHELF.pos, CAM_STATES.SHELF.target, 0.9, () => {
    openExperienceModal();
  });
}

function showAboutView() {
  currentState = 'ABOUT';
  charAtDesk = false;
  backBtn.textContent = '◄ BACK';
  flyTo(CAM_STATES.ABOUT.pos, CAM_STATES.ABOUT.target, 0.9, () => {
    openAboutModal();
  });
}

function backFromView() {
  if (currentState === 'LAPTOP') {
    if (screenOffSound && screenOffSound.isPlaying) screenOffSound.stop();
    if (screenOffSound?.buffer) screenOffSound.play();
  }
  if (currentState === 'PLANT') {
    if (bushRevSound && bushRevSound.isPlaying) bushRevSound.stop();
    if (bushRevSound?.buffer) bushRevSound.play();
  }

  closeModal();
  currentState = 'ROOM';
  charAtDesk = false;
  hoveredObj = null;
  label.style.opacity = '0';
  cur.classList.remove('hovering');
  backBtn.textContent = '◄ OUTSIDE';
  flyTo(CAM_STATES.ROOM.pos, CAM_STATES.ROOM.target, 0.85);
}

// ── EVENT LISTENERS ──
document.addEventListener('pointermove', e => {
  cur.style.left = e.clientX - 7 + 'px';
  cur.style.top = e.clientY - 7 + 'px';
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  label.style.left = e.clientX + 18 + 'px';
  label.style.top = e.clientY - 10 + 'px';
});

// Menu item clicks
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    if (item.classList.contains('disabled') || enteringWorld || camAnimating) return;
    if (clickSound && clickSound.isPlaying) clickSound.stop();
    if (clickSound?.buffer) clickSound.play();
    const action = item.dataset.action;
    if (action === 'enter') { enterWorldSequence(null); return; }
    if (action === 'projects') { enterWorldSequence('projects'); return; }
    if (action === 'about') { enterWorldSequence('about'); return; }
    if (action === 'contact') { enterWorldSequence('contact'); return; }
  });
  item.addEventListener('mouseenter', () => {
    if (!item.classList.contains('disabled')) cur.classList.add('hovering');
  });
  item.addEventListener('mouseleave', () => cur.classList.remove('hovering'));
});

backBtn.addEventListener('click', () => {
  if (enteringWorld) return;
  if (clickSound && clickSound.isPlaying) clickSound.stop();
  if (clickSound?.buffer) clickSound.play();
  if (['LAPTOP', 'ABOUT', 'PLANT', 'POSTER', 'SHELF'].includes(currentState)) {
    backFromView();
  } else {
    showOutside();
  }
});

backBtn.addEventListener('mouseenter', () => cur.classList.add('hovering'));
backBtn.addEventListener('mouseleave', () => cur.classList.remove('hovering'));

if (helpBtn) {
  helpBtn.addEventListener('click', () => {
    if (clickSound && clickSound.isPlaying) clickSound.stop();
    if (clickSound?.buffer) clickSound.play();
    openHelpModal();
  });
  helpBtn.addEventListener('mouseenter', () => cur.classList.add('hovering'));
  helpBtn.addEventListener('mouseleave', () => cur.classList.remove('hovering'));
}

document.getElementById('modal-close').addEventListener('click', () => {
  if (clickSound && clickSound.isPlaying) clickSound.stop();
  if (clickSound?.buffer) clickSound.play();
  closeModal();
  if (['LAPTOP', 'ABOUT', 'PLANT', 'POSTER', 'SHELF'].includes(currentState)) backFromView();
});

modal.addEventListener('click', e => {
  if (e.target === modal) {
    if (clickSound && clickSound.isPlaying) clickSound.stop();
    if (clickSound?.buffer) clickSound.play();
    closeModal();
    if (['LAPTOP', 'ABOUT', 'PLANT', 'POSTER', 'SHELF'].includes(currentState)) backFromView();
  }
});

// World clicks
renderer.domElement.addEventListener('click', e => {
  mouse.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  if (modal.classList.contains('open') || currentState !== 'ROOM' || camAnimating || enteringWorld || (performance.now() - lastEnterTime < 500)) return;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(room.clickables, true);
  if (hits.length > 0) {
    const obj = getClickable(hits[0].object);
    if (obj) {
      visitedInteractives.add(obj);
      updateOutlineSelection();

      if (obj.userData.id === 'laptop') { showLaptopView(); }
      else if (obj.userData.id === 'plant') {
        showPlantView();
        setTimeout(() => {
          if (bushSound && bushSound.isPlaying) bushSound.stop();
          if (bushSound?.buffer) bushSound.play();
        }, 200);
      }
      else if (obj.userData.id === 'lamp') {
        obj.userData.on = !obj.userData.on;
        playLampSfx(obj.userData.on);

        label.textContent = obj.userData.on ? '\uD83D\uDCA1 TURN OFF LAMP' : '\uD83D\uDCA1 TURN ON LAMP';

        if (obj.userData.toggleLight) obj.userData.toggleLight.intensity = obj.userData.on ? obj.userData.baseLightInt : 0;
        if (obj.userData.toggleSpot) obj.userData.toggleSpot.intensity = obj.userData.on ? obj.userData.baseSpotInt : 0;
        if (obj.userData.mat) obj.userData.mat.emissiveIntensity = obj.userData.on ? (obj.userData.emissiveOn || 0.4) : 0.0;
      }
      else if (obj.userData.id === 'cat') {
        if (catSound && catSound.isPlaying) catSound.stop();
        if (catSound?.buffer) catSound.play();
      }
      else if (obj.userData.id === 'poster') {
        showPosterView();
      }
      else if (obj.userData.id === 'shelf') {
        showShelfView();
      }
      else if (obj.userData.id === 'about') {
        showAboutView();
      }
    }
  }
});

const roomActions = { laptop: showLaptopView, about: showAboutView, plant: showPlantView, shelf: showShelfView, poster: showPosterView };
roomNav.addEventListener('click', e => {
  const button = e.target.closest('[data-view]');
  if (!button || enteringWorld || camAnimating || currentState !== 'ROOM') return;
  const object = room.clickables.find(obj => obj.userData.id === button.dataset.view);
  visitedInteractives.add(object);
  roomActions[button.dataset.view]();
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || enteringWorld) return;
  if (modal.classList.contains('open') && currentState === 'ROOM') closeModal();
  else if (currentState !== 'OUTSIDE' && currentState !== 'ROOM') backFromView();
});

let needsFrame = true;
window.addEventListener('resize', () => {
  renderScale = 1;
  resizeRenderer();
  if (!camAnimating && CAM_STATES[currentState]) {
    camera.position.copy(CAM_STATES[currentState].pos);
    camTarget.copy(CAM_STATES[currentState].target);
    camera.lookAt(camTarget);
  }
  needsFrame = true;
});

// Only the visible world advances. Shadows update at 10 Hz; the camera stays smooth.
const clock = new THREE.Clock();
let lastShadowUpdate = 0;
let lastHoverCheck = 0;
let renderScale = 1;
let frameTotal = 0, frameCount = 0;
const hoverDevice = window.matchMedia('(hover: hover)');
function animate() {
  const rawDelta = clock.getDelta();
  const dt = Math.min(rawDelta, 0.05);
  const t = clock.elapsedTime;
  if (modal.classList.contains('open') && !camAnimating && !needsFrame) return;
  needsFrame = false;

  updateExterior(dt, t);
  if (roomContainer.visible && !reducedMotion.matches) {
    animationMixers.forEach(mixer => mixer.update(dt));
    updateCharacterWaypoint(dt, t, charAtDesk);
    room.particles.rotation.y = Math.sin(t * 0.08) * 0.06;
    room.particles.position.y = Math.sin(t * 0.3) * 0.1;
    room.plantCrown.rotation.z = Math.sin(t * 0.65) * 0.025;
    room.interactiveSparkles.forEach(s => {
      s.position.y = s.userData.baseY + Math.sin(t * s.userData.speed + s.userData.phase) * 0.1;
      s.rotation.y += dt * 0.7;
    });
    tvLight.intensity = 0.6 + Math.sin(t * 1.7) * 0.035;
  }

  // Camera fly animation
  if (camAnimating) {
    camT += Math.min(rawDelta, 0.1) / camDuration;
    const et = easeInOutCubic(Math.min(camT, 1));
    camera.position.lerpVectors(camStartPos, camDestPos, et);
    camTarget.lerpVectors(camStartTarget, camDestTarget, et);
    camera.lookAt(camTarget);
    camOnUpdate?.(Math.min(camT, 1));
    if (camT >= 1) {
      camOnUpdate = null;
      camAnimating = false;
      if (camOnDone) {
        const cb = camOnDone;
        camOnDone = null;
        cb();
      }
    }
  }

  // Gentle camera float
  if (!camAnimating && !enteringWorld && !reducedMotion.matches) {
    if (currentState === 'OUTSIDE') {
      const basePos = CAM_STATES.OUTSIDE.pos;
      camera.position.x = basePos.x + Math.sin(t * 0.3) * 0.5;
      camera.position.y = basePos.y + Math.sin(t * 0.2) * 0.3;
      camera.position.z = basePos.z;
      camTarget.copy(CAM_STATES.OUTSIDE.target);
      camera.lookAt(camTarget);
    } else if (currentState === 'ROOM') {
      const basePos = CAM_STATES.ROOM.pos;
      camera.position.x = basePos.x + Math.sin(t * 0.4) * 0.3;
      camera.position.y = basePos.y + Math.sin(t * 0.3) * 0.2;
      camera.position.z = basePos.z;
      camTarget.copy(CAM_STATES.ROOM.target);
      camera.lookAt(camTarget);
    }
  }



  // Hover detection in ROOM state
  if (currentState === 'ROOM' && !camAnimating && !enteringWorld && hoverDevice.matches && t - lastHoverCheck > 1 / 30) {
    lastHoverCheck = t;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(room.clickables, true);
    if (hits.length > 0) {
      const obj = getClickable(hits[0].object);
      if (obj && obj !== hoveredObj) {
        hoveredObj = obj;
        let lbl = obj.userData.label;
        if (obj.userData.id === 'lamp') {
          const isOn = obj.userData.on;
          const bulbFill = isOn ? '#ffd080' : '#5a4a30';
          const textStr = isOn ? 'TURN OFF LAMP' : 'TURN ON LAMP';
          lbl = `<svg class="pixel-icon" style="fill: ${bulbFill}; margin-right: 6px;" viewBox="0 0 16 16"><rect x="5" y="2" width="6" height="7" /><rect x="4" y="3" width="8" height="5" /><rect x="6" y="4" width="4" height="3" fill="#1a140e" /><rect x="6" y="9" width="4" height="3" fill="#8a8a8a" /><rect x="7" y="12" width="2" height="1" fill="#555555" /></svg> ${textStr}`;
        }
        label.innerHTML = lbl;
        label.style.opacity = '1';
        cur.classList.add('hovering');
      }
    } else if (hoveredObj) {
      hoveredObj = null;
      label.style.opacity = '0';
      cur.classList.remove('hovering');
    }
  }

  updateOutlineSelection();
  if (t - lastShadowUpdate > 0.1 && (!reducedMotion.matches || enteringWorld)) {
    renderer.shadowMap.needsUpdate = true;
    lastShadowUpdate = t;
  }
  if (outlinePass.enabled) composer.render();
  else renderer.render(scene, camera);

  if (!enteringWorld && rawDelta < 0.12) {
    frameTotal += rawDelta;
    if (++frameCount >= 120) {
      // ponytail: lower resolution only; reset on resize to avoid quality oscillation.
      if (frameTotal / frameCount > 0.025 && renderScale > 0.7) {
        renderScale = Math.max(0.7, renderScale - 0.15);
        resizeRenderer(renderScale);
      }
      frameTotal = 0; frameCount = 0;
    }
  }
}
renderer.setAnimationLoop(animate);
document.addEventListener('visibilitychange', () => {
  clock.getDelta();
  renderer.setAnimationLoop(document.hidden ? null : animate);
});

// Show actual asset progress, then warm both scenes before the first entrance.
const loaderEl = document.getElementById('loader');
const loaderStatusText = document.getElementById('loader-status-text');
const loaderBarFill = document.getElementById('loader-bar-fill');
const loaderPercent = document.getElementById('loader-percent');
const loaderFileInfo = document.getElementById('loader-file-info');
THREE.DefaultLoadingManager.onProgress = (_url, loaded, total) => {
  const pct = Math.round(loaded / total * 90);
  if (loaderBarFill) loaderBarFill.style.transform = `scaleX(${pct / 100})`;
  if (loaderPercent) loaderPercent.textContent = `${pct}%`;
  if (loaderStatusText) loaderStatusText.textContent = 'MAKING YOURSELF AT HOME...';
  if (loaderFileInfo) loaderFileInfo.textContent = `${loaded} / ${total} ASSETS READY`;
};
THREE.DefaultLoadingManager.onError = () => {
  if (loaderFileInfo) loaderFileInfo.textContent = 'A DETAIL COULD NOT LOAD. THE WORLD IS STILL OPEN.';
};
assetsReady.then(() => {
  setExteriorActive(false);
  setRoomActive(true);
  setSceneAtmosphere(false);
  camera.position.copy(CAM_STATES.ROOM.pos);
  camera.lookAt(CAM_STATES.ROOM.target);
  renderer.compile(scene, camera);
  renderer.render(scene, camera);
  setRoomActive(false);
  setExteriorActive(true);
  setSceneAtmosphere(true);
  camera.position.copy(CAM_STATES.OUTSIDE.pos);
  camTarget.copy(CAM_STATES.OUTSIDE.target);
  camera.lookAt(camTarget);
  renderer.compile(scene, camera);
  renderer.render(scene, camera);
  if (loaderBarFill) loaderBarFill.style.transform = 'scaleX(1)';
  if (loaderPercent) loaderPercent.textContent = '100%';
  if (loaderStatusText) loaderStatusText.textContent = 'WELCOME TO MY LITTLE WORLD.';
  loaderEl?.classList.add('slide-up');
  menuEl.classList.add('visible', 'pop-in');
  menuEl.inert = false;
  document.body.dataset.ready = 'true';
  setTimeout(() => loaderEl?.remove(), reducedMotion.matches ? 200 : 500);
  startBgMusic();
});
