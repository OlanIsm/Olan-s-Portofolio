import * as THREE from 'three';

export let catSound;
export let clickSound;
export let bushSound;
export let bushRevSound;
export let kbSound;
export let screenUpSound;
export let screenOffSound;
export let bgMusic;
export let lampOnSfx;
export let lampOffSfx;

export function initAudio(camera) {
  const listener = new THREE.AudioListener();
  camera.add(listener);

  catSound = new THREE.Audio(listener);
  clickSound = new THREE.Audio(listener);
  bushSound = new THREE.Audio(listener);
  bushRevSound = new THREE.Audio(listener);
  kbSound = new THREE.Audio(listener);
  screenUpSound = new THREE.Audio(listener);
  screenOffSound = new THREE.Audio(listener);

  const audioLoader = new THREE.AudioLoader();

  audioLoader.load('sound/CatMeow.mp3', buffer => {
    catSound.setBuffer(buffer);
    catSound.setVolume(1.0);
  });

  audioLoader.load('sound/click.mp3', buffer => {
    clickSound.setBuffer(buffer);
    clickSound.setVolume(0.5);
  });

  audioLoader.load('sound/BushSound.mp3', buffer => {
    bushSound.setBuffer(buffer);
    bushSound.setVolume(0.6);

    const ctx = THREE.AudioContext.getContext();
    const revBuffer = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      revBuffer.getChannelData(i).set(buffer.getChannelData(i).slice().reverse());
    }
    bushRevSound.setBuffer(revBuffer);
    bushRevSound.setVolume(0.6);
  });

  audioLoader.load('sound/keyboardClicking.mp3', buffer => {
    kbSound.setBuffer(buffer);
    kbSound.setVolume(1.0);
  });

  audioLoader.load('sound/ScreenShowingUp.mp3', buffer => {
    screenUpSound.setBuffer(buffer);
    screenUpSound.setVolume(1.0);
  });

  audioLoader.load('sound/ScreenShowingOff.mp3', buffer => {
    screenOffSound.setBuffer(buffer);
    screenOffSound.setVolume(1.0);
  });

  bgMusic = new Audio('sound/BGMusic.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.14;

  lampOnSfx = new Audio('sound/LampTurningOn.mp3');
  lampOffSfx = new Audio('sound/LampTurningOff.mp3');
  lampOnSfx.volume = 0.28;
  lampOffSfx.volume = 0.28;
}

export function playLampSfx(isOn) {
  const sfx = isOn ? lampOnSfx : lampOffSfx;
  if (!sfx) return;
  sfx.currentTime = 0;
  sfx.play().catch(() => {});
}

export function startBgMusic() {
  if (!bgMusic) return;
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
