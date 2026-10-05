import { projectsData } from '../data/projectsData.js';
import { openModal } from './modalManager.js?v=160';

export function openProjectModal() {
  const titleHTML = "OLAN'S PROJECTS";

  let bodyHTML = '';
  projectsData.forEach(p => {
    const techChips = p.tech.map(t => `<span class="tech-chip">${t}</span>`).join('');

    bodyHTML += `
      <article class="proj-card-row">
        <div class="proj-card-info">
          <div class="proj-tag" >${p.tag}</div>
          <div class="proj-name">${p.name}</div>
          <div class="proj-desc">${p.desc}</div>
          <div class="proj-tech">${techChips}</div>
          <a class="project-open" href="${p.url}" target="_blank" rel="noopener noreferrer">Explore project <span aria-hidden="true">&#8599;</span></a>
        </div>
        <div class="proj-card-img">
          <img src="${p.img}" alt="${p.name}" loading="lazy" decoding="async" style="object-fit: contain;">
        </div>
      </article>
    `;
  });

  openModal(titleHTML, bodyHTML, 'proj-modal-wide', 'laptop');
}
