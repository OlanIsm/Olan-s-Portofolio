import { skillsData } from '../data/skillsData.js';
import { modalBody, openModal } from './modalManager.js';

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
    OLAN'S SKILL TREE
  `;

  let branchesHTML = '';
  skillsData.forEach(skill => {
    branchesHTML += `
      <div class="st-branch">
        <div class="st-skill">
          <div class="st-skill-header">
            <span class="st-skill-icon">${skill.icon}</span>
            <span class="st-skill-name">${skill.name}</span>
          </div>
          <div class="st-skill-body">
            <div class="st-skill-info">
              <span class="st-skill-pct">${skill.pct}%</span>
            </div>
            <div class="st-bar-bg"><div class="st-bar-fill" style="width:${skill.pct}%; background:${skill.color};"></div></div>
          </div>
        </div>
      </div>
    `;
  });

  const bodyHTML = `
    <div class="skill-tree-container">
      <div class="skill-tree-horizontal">
        <div class="st-root">CORE ROOT</div>
        <div class="st-branches">
          ${branchesHTML}
        </div>
      </div>
    </div>
  `;

  openModal(titleHTML, bodyHTML);

  // Add scroll event handlers
  const stContainer = modalBody.querySelector('.skill-tree-container');
  if (stContainer) {
    // Mouse wheel horizontal scrolling
    stContainer.addEventListener('wheel', e => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        stContainer.scrollLeft += e.deltaY * 1.5;
      }
    }, { passive: false });

    // Click-and-drag (grab-to-scroll)
    let isDown = false;
    let startX;
    let scrollLeft;

    stContainer.addEventListener('mousedown', e => {
      isDown = true;
      startX = e.pageX - stContainer.offsetLeft;
      scrollLeft = stContainer.scrollLeft;
    });
    stContainer.addEventListener('mouseleave', () => { isDown = false; });
    stContainer.addEventListener('mouseup', () => { isDown = false; });
    stContainer.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - stContainer.offsetLeft;
      const walk = (x - startX) * 2;
      stContainer.scrollLeft = scrollLeft - walk;
    });
  }
}
