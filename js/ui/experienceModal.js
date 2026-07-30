import { experienceData } from '../data/experienceData.js';
import { openModal } from './modalManager.js?v=130';

export function openExperienceModal() {
  const titleHTML = `
    <svg class="pixel-icon" viewBox="0 0 16 16">
      <rect x="2" y="4" width="12" height="10" />
      <rect x="5" y="1" width="6" height="3" fill="none" stroke="#ffd080" stroke-width="1" />
      <rect x="7" y="8" width="2" height="2" fill="#241c12" />
    </svg>
    OLAN'S EXPERIENCE & ORGANIZATIONS
  `;

  let cardsHTML = '';
  experienceData.forEach(item => {
    const tagStyle = item.tagStyle ? `style="${item.tagStyle}"` : '';
    cardsHTML += `
      <div class="exp-card">
        <div class="exp-card-img"><img src="${item.img}" alt="${item.title}"></div>
        <div class="exp-card-content">
          <div class="exp-card-tag" ${tagStyle}>${item.tag}</div>
          <div class="exp-card-title">${item.title}</div>
          <div class="exp-card-subtitle">${item.subtitle}</div>
          <div class="exp-card-desc">${item.desc}</div>
        </div>
      </div>
    `;
  });

  const bodyHTML = `<div class="exp-grid">${cardsHTML}</div>`;
  openModal(titleHTML, bodyHTML);
}
