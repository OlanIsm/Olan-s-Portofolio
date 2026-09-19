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
  bgMusic.preload = 'none';
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
  const play = () => {
    bgMusic.play().catch(() => {});
    window.removeEventListener('pointerdown', play);
    window.removeEventListener('keydown', play);
  };
  if (navigator.userActivation?.hasBeenActive) play();
  else {
    window.addEventListener('pointerdown', play, { once: true });
    window.addEventListener('keydown', play, { once: true });
  }
}

// ── PROCEDURAL SYNTHESIZED SFX (Web Audio API) ──
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = THREE.AudioContext.getContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playWhooshSfx() {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const dur = 1.3;
  const bufferSize = ctx.sampleRate * dur;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // White noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  // Bandpass filter with sweep
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 2.5;
  filter.frequency.setValueAtTime(300, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.5);
  filter.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + dur);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.35);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
  noise.stop(ctx.currentTime + dur);
}

export function playDoorSfx(isOpen = true) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Wood click / latch
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(isOpen ? 180 : 120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(isOpen ? 75 : 60, ctx.currentTime + 0.18);

  oscGain.gain.setValueAtTime(0.35, ctx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.22);

  // Subtle door swing resonance
  if (isOpen) {
    const swingOsc = ctx.createOscillator();
    const swingGain = ctx.createGain();
    swingOsc.type = 'sine';
    swingOsc.frequency.setValueAtTime(95, ctx.currentTime + 0.05);
    swingOsc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.35);
    swingGain.gain.setValueAtTime(0.001, ctx.currentTime);
    swingGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.15);
    swingGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    swingOsc.connect(swingGain);
    swingGain.connect(ctx.destination);
    swingOsc.start(ctx.currentTime + 0.05);
    swingOsc.stop(ctx.currentTime + 0.6);
  }
}

export function playLightPopSfx() {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Shimmering chime frequencies (C major 7th chord)
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.03);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.35);

    gain.gain.setValueAtTime(0.001, now + i * 0.03);
    gain.gain.linearRampToValueAtTime(0.12, now + i * 0.03 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.03);
    osc.stop(now + 0.65);
  });
}
