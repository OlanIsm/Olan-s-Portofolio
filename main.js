import * as THREE from 'three';
import {
  renderer, scene, camera, CAM_STATES, camTarget, composer, outlinePass, visitedOutlinePass,
  tvLight, lampLight
} from './js/scene/sceneSetup.js';
import {
  initAudio, catSound, clickSound, bushSound, bushRevSound, kbSound, screenUpSound, screenOffSound, playLampSfx, startBgMusic
} from './js/audio/audioManager.js';
import { createRoomObjects } from './js/objects/roomObjects.js';
import { loadCharacterModel, updateCharacterWaypoint, animationMixers, setCharacterMoving } from './js/objects/character.js';
import { openProjectModal } from './js/ui/projectModal.js?v=130';
import { openExperienceModal } from './js/ui/experienceModal.js?v=120';
import { openContactModal } from './js/ui/contactModal.js?v=135';
import { openSkillTreeModal } from './js/ui/skillTreeModal.js?v=130';
import { openAboutModal } from './js/ui/aboutModal.js?v=130';
import { openHelpModal } from './js/ui/helpModal.js?v=130';
import { modal, closeModal } from './js/ui/modalManager.js?v=135';

// ── INITIALIZE AUDIO ──
initAudio(camera);

// ── CREATE ENVIRONMENT & CHARACTER ──
const room = createRoomObjects();
loadCharacterModel();

// ── APP STATE ──
let currentState = 'MENU';
let charAtDesk = false;
const visitedInteractives = new Set();
let hoveredObj = null;

// ── UI ELEMENTS ──
const menuEl = document.getElementById('menu');
const hudEl = document.getElementById('hud');
const hud_loc = document.getElementById('loc-box');
const hud_hint = document.getElementById('hint-bar');
const backBtn = document.getElementById('back-btn');
const helpBtn = document.getElementById('help-btn');
const label = document.getElementById('obj-label');
const cur = document.getElementById('cur');

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
  if (currentState !== 'ROOM') {
    outlinePass.selectedObjects = [];
    visitedOutlinePass.selectedObjects = [];
    return;
  }
  outlinePass.selectedObjects = room.clickables.filter(obj => !visitedInteractives.has(obj));
  visitedOutlinePass.selectedObjects = room.clickables.filter(obj => visitedInteractives.has(obj));
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

function flyTo(pos, target, duration = 2.2, onDone = null) {
  camStartPos.copy(camera.position);
  camStartTarget.copy(camTarget);
  camDestPos.copy(pos);
  camDestTarget.copy(target);
  camT = 0;
  camAnimating = true;
  camDuration = duration;
  camOnDone = onDone;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── NAVIGATION & VIEWS ──
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
  if (helpBtn) helpBtn.style.display = 'flex';
}

function showMenu() {
  currentState = 'MENU';
  updateOutlineSelection();
  hudEl.style.opacity = '0';
  backBtn.style.display = 'none';
  if (helpBtn) helpBtn.style.display = 'none';
  charAtDesk = false;
  closeModal();
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
    if (kbSound && kbSound.isPlaying) kbSound.stop();
    if (kbSound) kbSound.play();

    setTimeout(() => {
      if (screenUpSound && screenUpSound.isPlaying) screenUpSound.stop();
      if (screenUpSound) screenUpSound.play();
      openProjectModal();
    }, 600);
  });
}

function showPlantView() {
  currentState = 'PLANT';
  charAtDesk = false;
  flyTo(CAM_STATES.PLANT.pos, CAM_STATES.PLANT.target, 2.0, () => {
    openSkillTreeModal();
  });
}

function showPosterView() {
  currentState = 'POSTER';
  charAtDesk = false;
  flyTo(CAM_STATES.POSTER.pos, CAM_STATES.POSTER.target, 2.0, () => {
    openContactModal();
  });
}

function showShelfView() {
  currentState = 'SHELF';
  charAtDesk = false;
  flyTo(CAM_STATES.SHELF.pos, CAM_STATES.SHELF.target, 2.0, () => {
    openExperienceModal();
  });
}

function showAboutView() {
  currentState = 'ABOUT';
  charAtDesk = false;
  flyTo(CAM_STATES.ABOUT.pos, CAM_STATES.ABOUT.target, 2.0, () => {
    openAboutModal();
  });
}

function backFromView() {
  if (currentState === 'LAPTOP') {
    if (screenOffSound && screenOffSound.isPlaying) screenOffSound.stop();
    if (screenOffSound) screenOffSound.play();
  }
  if (currentState === 'PLANT') {
    if (bushRevSound && bushRevSound.isPlaying) bushRevSound.stop();
    if (bushRevSound) bushRevSound.play();
  }

  closeModal();
  currentState = 'ROOM';
  charAtDesk = false;
  hoveredObj = null;
  label.style.opacity = '0';
  cur.classList.remove('hovering');
  flyTo(CAM_STATES.ROOM.pos, CAM_STATES.ROOM.target, 1.8);
}

// ── EVENT LISTENERS ──
document.addEventListener('mousemove', e => {
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
    if (item.classList.contains('disabled')) return;
    if (clickSound && clickSound.isPlaying) clickSound.stop();
    if (clickSound) clickSound.play();
    const action = item.dataset.action;
    if (action === 'enter') { showWorld(); return; }
    if (action === 'projects') { showWorld(); setTimeout(showLaptopView, 800); return; }
    if (action === 'about') { showWorld(); setTimeout(showAboutView, 800); return; }
    if (action === 'contact') { showWorld(); setTimeout(showPosterView, 800); return; }
  });
  item.addEventListener('mouseenter', () => {
    if (!item.classList.contains('disabled')) cur.classList.add('hovering');
  });
  item.addEventListener('mouseleave', () => cur.classList.remove('hovering'));
});

backBtn.addEventListener('click', () => {
  if (clickSound && clickSound.isPlaying) clickSound.stop();
  if (clickSound) clickSound.play();
  if (['LAPTOP', 'ABOUT', 'PLANT', 'POSTER', 'SHELF'].includes(currentState)) backFromView();
  else showMenu();
});
backBtn.addEventListener('mouseenter', () => cur.classList.add('hovering'));
backBtn.addEventListener('mouseleave', () => cur.classList.remove('hovering'));

if (helpBtn) {
  helpBtn.addEventListener('click', () => {
    if (clickSound && clickSound.isPlaying) clickSound.stop();
    if (clickSound) clickSound.play();
    openHelpModal();
  });
  helpBtn.addEventListener('mouseenter', () => cur.classList.add('hovering'));
  helpBtn.addEventListener('mouseleave', () => cur.classList.remove('hovering'));
}

document.getElementById('modal-close').addEventListener('click', () => {
  if (clickSound && clickSound.isPlaying) clickSound.stop();
  if (clickSound) clickSound.play();
  closeModal();
  if (['LAPTOP', 'ABOUT', 'PLANT', 'POSTER', 'SHELF'].includes(currentState)) backFromView();
});

modal.addEventListener('click', e => {
  if (e.target === modal) {
    if (clickSound && clickSound.isPlaying) clickSound.stop();
    if (clickSound) clickSound.play();
    closeModal();
    if (['LAPTOP', 'ABOUT', 'PLANT', 'POSTER', 'SHELF'].includes(currentState)) backFromView();
  }
});

// World clicks
renderer.domElement.addEventListener('click', () => {
  if (currentState !== 'ROOM' || camAnimating) return;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(
    room.clickables.flatMap(g => { const arr = [g]; g.traverse(c => { if (c !== g) arr.push(c); }); return arr; })
  );
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
          if (bushSound) bushSound.play();
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
        if (catSound) catSound.play();
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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  outlinePass.setSize(window.innerWidth, window.innerHeight);
  visitedOutlinePass.setSize(window.innerWidth, window.innerHeight);
});

// ── ANIMATION LOOP ──
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.getElapsedTime();

  animationMixers.forEach(mixer => mixer.update(dt));

  // Particle float
  room.particles.forEach(p => {
    p.position.y += Math.sin(t * 0.8 + p.userData.phase) * 0.003;
    p.position.x += Math.sin(t * 0.5 + p.userData.phase) * 0.001;
    if (p.position.y > 7) p.position.y = 0.3;
    if (p.position.y < 0.1) p.position.y = 6.8;
    p.rotation.x += 0.01; p.rotation.y += 0.015;
  });

  // Light flickers
  tvLight.intensity = 0.6 + Math.sin(t * 7.3) * 0.1 + Math.sin(t * 13.1) * 0.03;
  lampLight.intensity = 1.2 + Math.sin(t * 2.1) * 0.1;
  if (room.ceilingBulbG.userData.on) {
    room.ceilingLight.intensity = room.ceilingBulbG.userData.baseLightInt + Math.sin(t * 2.2) * 0.06;
  }
  if (room.floorLampL.userData.on) {
    room.flLightL.intensity = 1.2 + Math.sin(t * 1.8) * 0.08;
  }
  if (room.floorLampR.userData.on) {
    room.flLightR.intensity = 1.2 + Math.sin(t * 1.8 + 1.5) * 0.08;
  }

  // Sparkles
  room.interactiveSparkles.forEach(s => {
    s.position.y = s.userData.baseY + Math.sin(t * s.userData.speed + s.userData.phase) * 0.2;
    s.rotation.x += 0.02;
    s.rotation.y += 0.02;
  });

  // Character movement
  updateCharacterWaypoint(dt, t, charAtDesk);

  // Camera fly animation
  if (camAnimating) {
    camT += dt / camDuration;
    const et = easeInOutCubic(Math.min(camT, 1));
    camera.position.lerpVectors(camStartPos, camDestPos, et);
    camTarget.lerpVectors(camStartTarget, camDestTarget, et);
    camera.lookAt(camTarget);
    if (camT >= 1) {
      camAnimating = false;
      if (camOnDone) { camOnDone(); camOnDone = null; }
    }
  }

  // Gentle camera float
  if (!camAnimating && (currentState === 'MENU' || currentState === 'ROOM')) {
    const basePos = CAM_STATES.MENU.pos;
    camera.position.x = basePos.x + Math.sin(t * 0.4) * 0.3;
    camera.position.y = basePos.y + Math.sin(t * 0.3) * 0.2;
    camera.lookAt(camTarget);
  }

  // Hover detection in ROOM state
  if (currentState === 'ROOM' && !camAnimating) {
    raycaster.setFromCamera(mouse, camera);
    const allObjs = room.clickables.flatMap(g => { const arr = [g]; g.traverse(c => { if (c !== g) arr.push(c); }); return arr; });
    const hits = raycaster.intersectObjects(allObjs);
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

  composer.render();
}

animate();

// ── LOADER REMOVAL ──
const loaderEl = document.getElementById('loader');
if (loaderEl) {
  setTimeout(() => {
    loaderEl.style.opacity = '0';
    loaderEl.style.visibility = 'hidden';
    setTimeout(() => {
      loaderEl.remove();
      startBgMusic();
    }, 800);
  }, 100);
}
