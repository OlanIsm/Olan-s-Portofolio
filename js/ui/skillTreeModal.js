import { skillIcon } from './pixelIcons.js';
import { skillsTreeData } from '../data/skillsData.js?v=12';
import { modal, modalBody, openModal } from './modalManager.js?v=160';
import { clickSound } from '../audio/audioManager.js';

let activeNodeId = 'olan';

export function openSkillTreeModal() {
  const titleHTML = "OLAN'S SKILL TREE";

  activeNodeId = 'olan';
  const WORLD_CENTER = 1200;

  // Build Node Map for easy parent lookup
  const nodeMap = new Map();
  skillsTreeData.forEach(node => nodeMap.set(node.id, node));

  // Generate SVG connection lines
  let svgPathsHTML = '';
  skillsTreeData.forEach(node => {
    if (node.parent && nodeMap.has(node.parent)) {
      const parent = nodeMap.get(node.parent);
      const px = WORLD_CENTER + parent.x;
      const py = WORLD_CENTER + parent.y;
      const cx = WORLD_CENTER + node.x;
      const cy = WORLD_CENTER + node.y;

      // Curved organic path (Bezier branch)
      const dx = Math.abs(cx - px);
      const dy = Math.abs(cy - py);

      let pathD;
      if (dy > dx) {
        // Vertical orientation (Soft skills / top-bottom)
        const my = (py + cy) / 2;
        pathD = `M ${px} ${py} C ${px} ${my}, ${cx} ${my}, ${cx} ${cy}`;
      } else {
        // Horizontal orientation (Tech / Hobbies / left-right)
        const mx = (px + cx) / 2;
        pathD = `M ${px} ${py} C ${mx} ${py}, ${mx} ${cy}, ${cx} ${cy}`;
      }

      let strokeColor = '#9eaf86';
      let glowColor = 'rgba(138, 112, 72, 0.4)';
      if (node.category === 'tech') { strokeColor = '#86aebd'; glowColor = 'rgba(74, 144, 226, 0.5)'; }
      else if (node.category === 'soft') { strokeColor = '#c3aa6f'; glowColor = 'rgba(255, 170, 51, 0.5)'; }
      else if (node.category === 'hobby') { strokeColor = '#c89eb5'; glowColor = 'rgba(224, 102, 153, 0.5)'; }

      svgPathsHTML += `
        <!-- Glow Line -->
        <path d="${pathD}" fill="none" stroke="${glowColor}" stroke-width="7" opacity="0.16" stroke-linecap="round" />
        <!-- Core Line -->
        <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" />
        <!-- Node Joint Dot -->
        <circle cx="${cx}" cy="${cy}" r="3" fill="${strokeColor}" />
      `;
    }
  });

  // Generate HTML Nodes
  let nodesHTML = '';
  skillsTreeData.forEach(node => {
    const left = WORLD_CENTER + node.x;
    const top = WORLD_CENTER + node.y;
    const isCore = node.id === 'olan';
    const isCategoryRoot = ['soft_skills', 'tech_skills', 'hobbies'].includes(node.id);
    
    let nodeClass = `st-node category-${node.category}`;
    if (isCore) nodeClass += ' st-node-core';
    else if (isCategoryRoot) nodeClass += ' st-node-root';
    if (node.id === activeNodeId) nodeClass += ' active';

    nodesHTML += `
      <button type="button" aria-label="${node.name}" aria-pressed="${node.id === activeNodeId}" class="${nodeClass}" data-id="${node.id}" style="left: ${left}px; top: ${top}px;">
        <div class="st-node-inner">
          <div class="st-node-icon">${skillIcon(node)}</div>
        </div>
        <div class="st-node-label">${node.name}</div>
      </button>
    `;
  });

  const bodyHTML = `
    <div id="st-viewport-window" class="st-viewport">
      <!-- Background Star/Pixel Grid Pattern -->
      <div class="st-bg-grid"></div>

      <!-- Floating Detail Panel (Top-Left HUD) -->
      <div id="st-detail-panel" class="st-detail-panel">
        <div class="st-dp-header">
          <span id="st-dp-icon" class="st-dp-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffd080" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </span>
          <div>
            <div id="st-dp-title" class="st-dp-title">OLAN</div>
            <div id="st-dp-sub" class="st-dp-sub">Core Origin</div>
          </div>
        </div>
        <div class="st-dp-body">
          <p id="st-dp-desc" class="st-dp-desc">Computer Science Student @ BINUS. Explorer of 3D Web, Fullstack Systems, & Creative Dev.</p>
        </div>
      </div>

      <!-- Bottom Controls & Hints HUD -->
      <div class="st-hud-bottom-bar">
        <div class="st-hud-hint">[ DRAG ] Pan &nbsp;·&nbsp; [ SCROLL ] Zoom &nbsp;·&nbsp; [ CLICK ] Select</div>
        <div class="st-hud-btn-group">
          <button id="st-reset-btn" class="st-hud-btn">CENTER</button>
          <button aria-label="Zoom in" id="st-zoom-in" class="st-hud-btn">+</button>
          <button aria-label="Zoom out" id="st-zoom-out" class="st-hud-btn">-</button>
        </div>
      </div>

      <!-- Transformable World Canvas -->
      <div id="st-canvas-world" class="st-canvas-world">
        <svg class="st-svg-connections" width="2400" height="2400" viewBox="0 0 2400 2400">
          ${svgPathsHTML}
        </svg>
        <div class="st-nodes-layer">
          ${nodesHTML}
        </div>
      </div>
    </div>
  `;

  openModal(titleHTML, bodyHTML, 'st-modal-wide', 'tree');

  // ──────────────────────────────────────────
  // VIEWPORT PAN & ZOOM ENGINE
  // ──────────────────────────────────────────
  const viewport = document.getElementById('st-viewport-window');
  const world = document.getElementById('st-canvas-world');
  if (!viewport || !world) return;

  let scale = 0.7;
  let panX = 0, panY = 0;
  function updateTransform() {
    world.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }
  function centerOnNode(x = 0, y = 0) {
    const rect = viewport.getBoundingClientRect();
    panX = rect.width / 2 - (WORLD_CENTER + x) * scale;
    panY = rect.height * (rect.width < 600 ? 0.62 : 0.52) - (WORLD_CENTER + y) * scale;
    updateTransform();
  }
  function fitTree() {
    const xs = skillsTreeData.map(n => n.x), ys = skillsTreeData.map(n => n.y);
    const width = viewport.clientWidth, height = viewport.clientHeight;
    const minX = Math.min(...xs) - 75, maxX = Math.max(...xs) + 75;
    const minY = Math.min(...ys) - 50, maxY = Math.max(...ys) + 70;
    if (width < 600) { scale = 0.58; centerOnNode(); return; }
    scale = Math.max(0.4, Math.min(0.85, (width - 50) / (maxX - minX), (height - 80) / (maxY - minY)));
    panX = width / 2 - (WORLD_CENTER + (minX + maxX) / 2) * scale;
    panY = height / 2 - (WORLD_CENTER + (minY + maxY) / 2) * scale;
    updateTransform();
  }
  requestAnimationFrame(fitTree);
  let dragging = false, moved = false, lastX = 0, lastY = 0;
  viewport.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('.st-hud-bottom-bar, .st-detail-panel')) return;
    dragging = true; moved = false; lastX = e.clientX; lastY = e.clientY;
  });
  viewport.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;
    moved = true;
    viewport.setPointerCapture(e.pointerId);
    panX += dx; panY += dy; lastX = e.clientX; lastY = e.clientY;
    updateTransform();
  });
  viewport.addEventListener('pointerup', () => { dragging = false; });
  viewport.addEventListener('pointercancel', () => { dragging = false; });
  viewport.addEventListener('click', e => { if (moved) { e.stopPropagation(); moved = false; } }, true);
  function zoom(factor, x = viewport.clientWidth / 2, y = viewport.clientHeight / 2) {
    const next = Math.max(0.3, Math.min(1.8, scale * factor));
    panX = x - (x - panX) * next / scale;
    panY = y - (y - panY) * next / scale;
    scale = next; updateTransform();
  }
  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top);
  }, { passive: false });
  document.getElementById('st-reset-btn').addEventListener('click', fitTree);
  document.getElementById('st-zoom-in').addEventListener('click', () => zoom(1.2));
  document.getElementById('st-zoom-out').addEventListener('click', () => zoom(1 / 1.2));

  const dpIcon = document.getElementById('st-dp-icon');
  const dpTitle = document.getElementById('st-dp-title');
  const dpSub = document.getElementById('st-dp-sub');
  const dpDesc = document.getElementById('st-dp-desc');

  function updateDetailPanel(node) {
    if (!node) return;
    if (dpIcon) dpIcon.innerHTML = skillIcon(node);
    if (dpTitle) dpTitle.textContent = node.name;
    if (dpSub) dpSub.textContent = node.subtitle || (node.category ? `${node.category.toUpperCase()} SKILL` : 'SKILL NODE');
    if (dpDesc) dpDesc.textContent = node.desc || 'No additional description.';
  }

  // Set initial detail panel to Olan core node
  const initialNode = nodeMap.get('olan');
  if (initialNode) updateDetailPanel(initialNode);

  // Click & hover listeners for nodes
  world.querySelectorAll('.st-node').forEach(nodeEl => {
    nodeEl.addEventListener('click', e => {
      e.stopPropagation();
      if (clickSound && clickSound.isPlaying) clickSound.stop();
      if (clickSound?.buffer) clickSound.play();

      const nodeId = nodeEl.dataset.id;
      activeNodeId = nodeId;

      world.querySelectorAll('.st-node').forEach(n => { n.classList.remove('active'); n.setAttribute('aria-pressed', 'false'); });
      nodeEl.classList.add('active');
      nodeEl.setAttribute('aria-pressed', 'true');

      const data = nodeMap.get(nodeId);
      if (data) updateDetailPanel(data);
    });

    nodeEl.addEventListener('focus', () => {
      const node = nodeMap.get(nodeEl.dataset.id);
      updateDetailPanel(node);
      if (nodeEl.matches(':focus-visible')) {
        viewport.scrollTop = 0; viewport.scrollLeft = 0;
        centerOnNode(node.x, node.y);
      }
    });
    nodeEl.addEventListener('mouseenter', () => {
      const nodeId = nodeEl.dataset.id;
      const data = nodeMap.get(nodeId);
      if (data) updateDetailPanel(data);
    });
  });
}
