import { pixelIcon } from './pixelIcons.js';
import { experienceData } from '../data/experienceData.js';
import { openModal } from './modalManager.js?v=160';

export function openExperienceModal() {
  const titleHTML = "OLAN'S EXPERIENCE";

  let cardsHTML = '';
  experienceData.forEach(item => {
    cardsHTML += `
      <div class="exp-card">
        <span class="exp-marker">${pixelIcon('star')}</span>
        <div class="exp-card-img"><img src="${item.img}" alt="${item.title}" loading="lazy" decoding="async"></div>
        <div class="exp-card-content">
          <div class="exp-card-tag" >${item.tag}</div>
          <div class="exp-card-title">${item.title}</div>
          <div class="exp-card-subtitle">${item.subtitle}</div>
          <div class="exp-card-desc">${item.desc}</div>
        </div>
      </div>
    `;
  });

  const bodyHTML = `<p class="menu-intro">The teams, challenges, and little milestones along the way.</p><div class="exp-grid">${cardsHTML}</div>`;
  openModal(titleHTML, bodyHTML, null, 'trophy');
}
