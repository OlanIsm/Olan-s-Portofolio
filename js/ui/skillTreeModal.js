import { skillsTreeData } from '../data/skillsData.js?v=12';
import { modal, modalBody, openModal } from './modalManager.js?v=115';
import { clickSound } from '../audio/audioManager.js';

let activeNodeId = 'olan';

export function openSkillTreeModal() {
  const titleHTML = `
    <svg class="pixel-icon" viewBox="0 0 16 16">
      <rect x="3" y="5" width="2" height="2" />
      <rect x="4" y="7" width="2" height="2" />
      <rect x="7" y="2" width="2" height="12" />
      <rect x="11" y="4" width="2" height="2" />
      <rect x="10" y="6" width="2" height="2" />
      <rect x="9" y="8" width="2" height="2" />
      <rect x="4" y="14" width="8" height="2" />
    </svg>
    OLAN'S RPG SKILL TREE
  `;

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

      let strokeColor = '#8a7048';
      let glowColor = 'rgba(138, 112, 72, 0.4)';
      if (node.category === 'tech') { strokeColor = '#4a90e2'; glowColor = 'rgba(74, 144, 226, 0.5)'; }
      else if (node.category === 'soft') { strokeColor = '#ffaa33'; glowColor = 'rgba(255, 170, 51, 0.5)'; }
      else if (node.category === 'hobby') { strokeColor = '#e06699'; glowColor = 'rgba(224, 102, 153, 0.5)'; }

      svgPathsHTML += `
        <!-- Glow Line -->
        <path d="${pathD}" fill="none" stroke="${glowColor}" stroke-width="6" stroke-linecap="round" />
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
      <div class="${nodeClass}" data-id="${node.id}" style="left: ${left}px; top: ${top}px;">
        <div class="st-node-inner">
          <div class="st-node-icon">${node.icon}</div>
        </div>
        <div class="st-node-label">${node.name}</div>
      </div>
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
          <button id="st-reset-btn" class="st-hud-btn">CENTER OLAN</button>
          <button id="st-zoom-in" class="st-hud-btn">+</button>
          <button id="st-zoom-out" class="st-hud-btn">-</button>
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

  openModal(titleHTML, bodyHTML, 'st-modal-wide');

  // ──────────────────────────────────────────
  // VIEWPORT PAN & ZOOM ENGINE
  // ──────────────────────────────────────────
  const viewport = document.getElementById('st-viewport-window');
  const world = document.getElementById('st-canvas-world');
  if (!viewport || !world) return;

  let scale = 0.85;
  let panX = 0;
  let panY = 0;

  function updateTransform() {
    world.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }

  function centerOnNode(x = 0, y = 0) {
    const rect = viewport.getBoundingClientRect();
    const vw = rect.width || 900;
    const vh = rect.height || 650;
    const targetX = WORLD_CENTER + x;
    const targetY = WORLD_CENTER + y;

    panX = (vw / 2) - (targetX * scale);
    panY = (vh / 2) - (targetY * scale);
    updateTransform();
  }

  // Initial center on Olan node
  setTimeout(() => {
    centerOnNode(0, 0);
  }, 50);

  // Mouse Pan State
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  viewport.addEventListener('mousedown', e => {
    if (e.target.closest('.st-hud-bottom-bar') || e.target.closest('.st-detail-panel')) return;
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    viewport.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateTransform();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      viewport.style.cursor = 'grab';
    }
  });

  // Touch pan support
  let lastTouchX = 0;
  let lastTouchY = 0;
  viewport.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    }
  }, { passive: true });

  viewport.addEventListener('touchmove', e => {
    if (isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouchX;
      const dy = e.touches[0].clientY - lastTouchY;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      panX += dx;
      panY += dy;
      updateTransform();
    }
  }, { passive: true });

  viewport.addEventListener('touchend', () => { isDragging = false; });

  // Scroll Zoom
  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newScale = Math.max(0.45, Math.min(1.8, scale * zoomFactor));

    const rect = viewport.getBoundingClientRect();
    const mouseX = (rect.width / 2) - panX;
    const mouseY = (rect.height / 2) - panY;

    panX -= mouseX * (newScale / scale - 1);
    panY -= mouseY * (newScale / scale - 1);
    scale = newScale;
    updateTransform();
  }, { passive: false });

  // HUD Controls
  document.getElementById('st-reset-btn')?.addEventListener('click', () => {
    if (clickSound && clickSound.isPlaying) clickSound.stop();
    if (clickSound) clickSound.play();
    scale = 0.85;
    centerOnNode(0, 0);
  });

  document.getElementById('st-zoom-in')?.addEventListener('click', () => {
    scale = Math.min(1.8, scale * 1.25);
    centerOnNode(0, 0);
  });

  document.getElementById('st-zoom-out')?.addEventListener('click', () => {
    scale = Math.max(0.45, scale * 0.8);
    centerOnNode(0, 0);
  });

  // ──────────────────────────────────────────
  // NODE SELECTION & DETAIL PANEL UPDATE
  // ──────────────────────────────────────────
  const dpIcon = document.getElementById('st-dp-icon');
  const dpTitle = document.getElementById('st-dp-title');
  const dpSub = document.getElementById('st-dp-sub');
  const dpDesc = document.getElementById('st-dp-desc');

  function updateDetailPanel(node) {
    if (!node) return;
    if (dpIcon) dpIcon.innerHTML = node.icon;
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
      if (clickSound) clickSound.play();

      const nodeId = nodeEl.dataset.id;
      activeNodeId = nodeId;

      world.querySelectorAll('.st-node').forEach(n => n.classList.remove('active'));
      nodeEl.classList.add('active');

      const data = nodeMap.get(nodeId);
      if (data) updateDetailPanel(data);
    });

    nodeEl.addEventListener('mouseenter', () => {
      const nodeId = nodeEl.dataset.id;
      const data = nodeMap.get(nodeId);
      if (data) updateDetailPanel(data);
    });
  });
}
