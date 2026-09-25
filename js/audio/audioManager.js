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
  if (abstractionAudio) { playAbstractionImpact(0.45); return; }
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
  if (abstractionAudio) { playAbstractionImpact(0.65); return; }
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
  if (abstractionAudio) { playAbstractionImpact(0.8); return; }
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

let abstractionAudio = null;
let abstractionMuted = false;

export function playKeypadSfx(accepted) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = accepted ? 'sine' : 'triangle';
  osc.frequency.setValueAtTime(accepted ? 720 : 145, ctx.currentTime);
  gain.gain.setValueAtTime(0.035, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (accepted ? 0.08 : 0.3));
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.32);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}

export function startAbstractionAudio() {
  if (abstractionAudio) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const master = ctx.createGain();
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.knee.value = 10;
  limiter.ratio.value = 8;
  master.gain.value = 0;
  master.connect(limiter).connect(ctx.destination);
  const sources = [];
  const nodes = [master, limiter];

  // Slowly beating detuned voices; dissonance stays audible on small speakers.
  [38, 56.7, 77.2, 113.4].forEach((frequency, i) => {
    const voice = ctx.createOscillator();
    const volume = ctx.createGain();
    voice.type = i % 2 ? 'triangle' : 'sine';
    voice.frequency.value = frequency * 1.7;
    voice.frequency.exponentialRampToValueAtTime(frequency, ctx.currentTime + 7);
    volume.gain.value = i < 2 ? 0.11 : 0.045;
    voice.connect(volume).connect(master);
    const breath = ctx.createOscillator();
    const depth = ctx.createGain();
    breath.frequency.value = 0.09 + i * 0.04;
    depth.gain.value = 0.02;
    breath.connect(depth).connect(volume.gain);
    voice.start(); breath.start();
    sources.push(voice, breath);
    nodes.push(volume, depth);
  });

  const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < data.length; i++) {
    brown = (brown + (Math.random() * 2 - 1) * 0.02) / 1.02;
    data[i] = brown * 3.5 + (Math.random() > 0.999 ? (Math.random() - 0.5) * 0.4 : 0);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 680;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.16;
  noise.connect(filter).connect(noiseGain).connect(master);
  noise.start();
  sources.push(noise);
  nodes.push(filter, noiseGain);
  abstractionAudio = { master, sources, nodes };

  [catSound, clickSound, bushSound, bushRevSound, kbSound, screenUpSound, screenOffSound].forEach(sound => sound?.setPlaybackRate(0.62));
  [lampOnSfx, lampOffSfx].forEach(sound => {
    if (!sound) return;
    sound.preservesPitch = false;
    sound.playbackRate = 0.65;
  });
  syncAbstractionVolume();
}

function syncAbstractionVolume() {
  if (!abstractionAudio) return;
  const silent = abstractionMuted || document.hidden;
  abstractionAudio.master.gain.setTargetAtTime(silent ? 0 : 0.7, audioCtx.currentTime, 0.35);
  [catSound, clickSound, bushSound, bushRevSound, kbSound, screenUpSound, screenOffSound].forEach(sound => {
    if (sound) sound.gain.gain.setTargetAtTime(silent ? 0 : 0.35, audioCtx.currentTime, 0.08);
  });
  [lampOnSfx, lampOffSfx].forEach(sound => { if (sound) sound.muted = silent; });
  if (silent) bgMusic?.pause();
}

export function setAbstractionMuted(muted) {
  abstractionMuted = muted;
  syncAbstractionVolume();
}

export function updateAbstractionAudio(progress) {
  if (!bgMusic || !abstractionAudio) return;
  bgMusic.volume = Math.max(0, 0.14 * (1 - progress * 2));
  bgMusic.preservesPitch = false;
  bgMusic.playbackRate = Math.max(0.45, 1 - progress);
  if (progress >= 0.5 && !bgMusic.paused) bgMusic.pause();
}

export function playAbstractionImpact(strength = 1) {
  if (!abstractionAudio || document.hidden) return;
  const ctx = getAudioCtx();
  const now = ctx.currentTime;
  [95, 143.7].forEach((frequency, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = i ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(i ? 47 : 23, now + 2.4);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(strength * (i ? 0.10 : 0.34), now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
    osc.connect(gain).connect(abstractionAudio.master);
    osc.start(); osc.stop(now + 3);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  });
}

document.addEventListener('visibilitychange', syncAbstractionVolume);
window.addEventListener('pagehide', () => {
  if (!abstractionAudio) return;
  abstractionAudio.sources.forEach(source => { source.stop(); source.disconnect(); });
  abstractionAudio.nodes.forEach(node => node.disconnect());
  abstractionAudio = null;
  bgMusic?.pause();
});
