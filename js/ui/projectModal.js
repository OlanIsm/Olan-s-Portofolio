import { projectsData } from '../data/projectsData.js';
import { openModal } from './modalManager.js?v=130';

export function openProjectModal() {
  const titleHTML = `
    <svg class="pixel-icon" viewBox="0 0 16 16">
      <rect x="2" y="2" width="12" height="9" />
      <rect x="3" y="3" width="10" height="7" fill="#241c12" />
      <rect x="0" y="12" width="16" height="2" />
      <rect x="7" y="12" width="2" height="1" fill="#241c12" />
    </svg>
    OLAN'S PROJECTS
  `;

  let bodyHTML = '';
  projectsData.forEach(p => {
    const techChips = p.tech.map(t => `<span class="tech-chip">${t}</span>`).join('');
    const tagStyleAttr = p.tagStyle ? `style="${p.tagStyle}"` : '';
    bodyHTML += `
      <div class="proj-card-row" onclick="window.open('${p.url}', '_blank')">
        <div class="proj-card-info">
          <div class="proj-tag" ${tagStyleAttr}>${p.tag}</div>
          <div class="proj-name">${p.name}</div>
          <div class="proj-desc">${p.desc}</div>
          <div class="proj-tech">${techChips}</div>
        </div>
        <div class="proj-card-img" style="background: #120e0a;">
          <img src="${p.img}" alt="${p.name}" style="object-fit: contain;">
        </div>
      </div>
    `;
  });

  openModal(titleHTML, bodyHTML, 'proj-modal-wide');
}
