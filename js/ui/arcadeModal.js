import { openModal, closeModal, modal, modalBody } from './modalManager.js?v=160';
import { pixelIcon } from './pixelIcons.js';
import { createGame, stepGame, WIDTH, HEIGHT } from '../game/spacePatrol.js';

export function openArcadeModal() {
  openModal('OLAN’S SPACE PATROL', `<div class="arcade-layout">
    <div class="arcade-console">
      <div class="arcade-scoreboard"><span>SCORE <strong id="arcade-score">00000</strong></span><span>BEST <strong id="arcade-best">00000</strong></span><span id="arcade-lives" aria-label="3 lives">♥ ♥ ♥</span></div>
      <div class="arcade-screen"><canvas id="arcade-canvas" width="320" height="400" tabindex="0" aria-label="Space Patrol. Move with left and right arrows or A and D. Shooting is automatic. P pauses."></canvas>
        <div class="arcade-overlay"><div class="arcade-badge">${pixelIcon('ship')}</div><p class="arcade-eyebrow">PLAYER ONE / READY</p><h3>SPACE<br>PATROL</h3><p class="arcade-message">A tiny mission among the stars.</p><button class="arcade-play">START MISSION</button></div>
      </div>
      <div class="arcade-controls"><button data-move="-1" aria-label="Move left">◀</button><button id="arcade-pause" disabled>PAUSE</button><button data-move="1" aria-label="Move right">▶</button></div>
    </div>
    <aside class="arcade-guide"><span class="arcade-eyebrow">A LITTLE BREAK BETWEEN BUILDS</span><h3>Clear skies,<br>space cadet.</h3><p>Steer your ship. Clear the invaders. Make every heart count.</p><ul><li><kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd> to move</li><li>Your ship fires automatically</li><li>On touch: hold the arrows or drag across the stars</li><li>Three hearts. Escaped invaders cost a heart.</li></ul><p class="arcade-tip">${pixelIcon('trophy')} Your best score stays on this device.</p><button class="arcade-exit">BACK TO ROOM</button><p id="arcade-status" role="status" class="arcade-status">Ready when you are.</p></aside>
  </div>`, 'arcade-modal', 'ship');
  const root = modalBody.querySelector('.arcade-layout');
  const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
  const overlay = root.querySelector('.arcade-overlay'), play = root.querySelector('.arcade-play');
  const pauseButton = root.querySelector('#arcade-pause'), status = root.querySelector('#arcade-status');
  const score = root.querySelector('#arcade-score'), bestLabel = root.querySelector('#arcade-best'), lives = root.querySelector('#arcade-lives');
  const controller = new AbortController(), options = { signal: controller.signal };
  let g = createGame(), state = 'ready', frame = 0, last = 0, accumulator = 0, target, dragging = false, best = 0;
  const keys = new Set(), held = new Map();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { best = Number(localStorage.getItem('olan-space-patrol-best')) || 0; } catch {}
  const updateHUD = () => {
    score.textContent = String(g.score).padStart(5, '0');
    if (g.score > best) {
      best = g.score;
      try { localStorage.setItem('olan-space-patrol-best', String(best)); } catch {}
    }
    bestLabel.textContent = String(best).padStart(5, '0');
    lives.textContent = '♥ '.repeat(g.lives) + '♡ '.repeat(3 - g.lives);
    lives.setAttribute('aria-label', `${g.lives} lives`);
  };
  const ship = ['000010000','000121000','000121000','001222100','012222210','122323221','111242111','000454000'];
  const enemy = ['010000010','001000100','011111110','112111211','111111111','101111101','100000001','010000010'];
  function sprite(rows, x, y, palette, scale = 3) {
    rows.forEach((row, j) => [...row].forEach((p, i) => {
      if (p === '0') return;
      ctx.fillStyle = palette[Number(p) - 1];
      ctx.fillRect(Math.round(x - row.length * scale / 2 + i * scale), Math.round(y - rows.length * scale / 2 + j * scale), scale, scale);
    }));
  }
  function draw() {
    ctx.fillStyle = '#172e38'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    for (let i = 0; i < 55; i++) {
      ctx.fillStyle = i % 4 ? '#577581' : '#d7e6cd';
      ctx.fillRect((i * 97 + 17) % WIDTH, ((i * 61) + (reduced ? 0 : g.time * (8 + i % 3 * 7))) % HEIGHT, i % 4 ? 1 : 2, 2);
    }
    ctx.fillStyle = '#ffe19b'; g.bullets.forEach(b => ctx.fillRect(Math.round(b.x - 1), Math.round(b.y - 4), 3, 9));
    ctx.fillStyle = '#edaaa0'; g.shots.forEach(s => ctx.fillRect(Math.round(s.x - 2), Math.round(s.y - 3), 4, 7));
    g.enemies.forEach(e => sprite(enemy, e.x, e.y, ['#c7c888', '#31424c'], 2));
    if (g.invincible > 0) { ctx.strokeStyle = '#a6ded5'; ctx.strokeRect(Math.round(g.x - 18), 348, 36, 34); }
    sprite(ship, g.x, 365, ['#e6efcc', '#95c6be', '#487b97', '#f3b462', '#ffde9c']);
  }
  function clearInput() { keys.clear(); held.clear(); target = undefined; dragging = false; }
  function showOverlay(next) {
    state = next; cancelAnimationFrame(frame); clearInput(); overlay.hidden = false;
    pauseButton.disabled = true;
    root.querySelector('.arcade-eyebrow').textContent = next === 'paused' ? 'TAKE A BREATHER' : 'MISSION COMPLETE';
    root.querySelector('.arcade-overlay h3').innerHTML = next === 'paused' ? 'MISSION<br>PAUSED' : 'NICE<br>FLYING!';
    root.querySelector('.arcade-message').textContent = next === 'paused' ? 'Your ship is safe. Ready to continue?' : `You scored ${g.score}. Next mission awaits.`;
    play.textContent = next === 'paused' ? 'RESUME MISSION' : 'PLAY AGAIN';
    status.textContent = next === 'paused' ? 'Game paused.' : `Game over. Score ${g.score}. Best ${best}.`;
    play.focus({ preventScroll: true });
  }
  function tick(now) {
    if (state !== 'running') return;
    accumulator += Math.min((now - last) / 1000, .1); last = now;
    const direction = Number(keys.has('arrowright') || keys.has('d') || [...held.values()].includes(1)) - Number(keys.has('arrowleft') || keys.has('a') || [...held.values()].includes(-1));
    while (accumulator >= 1 / 60) { stepGame(g, { direction, target }, 1 / 60); accumulator -= 1 / 60; }
    updateHUD(); draw();
    if (g.over) showOverlay('over'); else frame = requestAnimationFrame(tick);
  }
  function start() {
    if (state !== 'paused') g = createGame();
    clearInput(); state = 'running'; overlay.hidden = true; pauseButton.disabled = false;
    status.textContent = 'Mission started. Arrows or A and D to steer. P to pause.';
    last = performance.now(); accumulator = 0; canvas.focus({ preventScroll: true });
    frame = requestAnimationFrame(tick);
  }
  play.addEventListener('click', start, options);
  pauseButton.addEventListener('click', () => showOverlay('paused'), options);
  root.querySelector('.arcade-exit').addEventListener('click', closeModal, options);
  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'a', 'd'].includes(key) && state === 'running') { e.preventDefault(); keys.add(key); target = undefined; }
    if (key === 'p' && !e.repeat) { if (state === 'running') showOverlay('paused'); else if (state === 'paused') start(); }
  }, options);
  document.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()), options);
  for (const button of root.querySelectorAll('[data-move]')) {
    button.addEventListener('pointerdown', e => {
      if (state !== 'running') return;
      button.setPointerCapture(e.pointerId); held.set(e.pointerId, Number(button.dataset.move)); target = undefined;
    }, options);
    button.addEventListener('lostpointercapture', e => held.delete(e.pointerId), options);
    button.addEventListener('pointerup', e => held.delete(e.pointerId), options);
    button.addEventListener('pointercancel', e => held.delete(e.pointerId), options);
    button.addEventListener('click', e => { if (!e.detail && state === 'running') target = g.x + Number(button.dataset.move) * 25; }, options);
  }
  const drag = e => { const r = canvas.getBoundingClientRect(); target = (e.clientX - r.left) / r.width * WIDTH; };
  canvas.addEventListener('pointerdown', e => { if (state === 'running') { dragging = true; canvas.setPointerCapture(e.pointerId); drag(e); } }, options);
  canvas.addEventListener('pointermove', e => { if (dragging) drag(e); }, options);
  canvas.addEventListener('lostpointercapture', () => { dragging = false; target = undefined; }, options);
  window.addEventListener('blur', () => { if (state === 'running') showOverlay('paused'); }, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'running') showOverlay('paused'); }, options);
  document.addEventListener('modalchange', () => {
    if (!root.isConnected || !modal.classList.contains('open')) { state = 'closed'; cancelAnimationFrame(frame); clearInput(); controller.abort(); }
  }, options);
  updateHUD(); draw();
}
