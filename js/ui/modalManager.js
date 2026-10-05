import { pixelIcon } from './pixelIcons.js';

export const modal = document.getElementById('modal');
export const modalTitle = document.getElementById('modal-title');
export const modalBody = document.getElementById('modal-body');
export const modalBox = modal.querySelector('#modal-box');

const ALL_BOX_CLASSES = ['st-modal-wide', 'about-modal-wide', 'contact-modal-compact', 'contact-modal-wide', 'proj-modal-wide', 'arcade-modal'];
let returnFocus = null;

function resetModalWidthClasses() {
  if (modalBox) {
    modalBox.classList.remove(...ALL_BOX_CLASSES);
  }
}

// boxClass is optional — applied BEFORE modal becomes visible, preventing layout shift
export function openModal(titleHTML, bodyHTML, boxClass = null, icon = 'book') {
  if (!modal.classList.contains('open')) returnFocus = document.activeElement;
  resetModalWidthClasses();
  if (boxClass && modalBox) {
    modalBox.classList.add(boxClass);
  }
  modalTitle.innerHTML = `<span class="modal-emblem">${pixelIcon(icon)}</span><span class="modal-heading-text">${titleHTML}</span>`;
  modalBox.dataset.icon = icon;
  modalBody.innerHTML = bodyHTML;
  modal.inert = false;
  modal.classList.add('open');
  modalBody.scrollTop = 0;
  document.getElementById('menu').inert = true;
  document.getElementById('hud').inert = true;
  document.getElementById('modal-close').focus({ preventScroll: true });
  document.dispatchEvent(new Event('modalchange'));
}

export function closeModal() {
  modal.inert = true;
  modal.classList.remove('open');
  document.getElementById('menu').inert = document.body.dataset.scene !== 'OUTSIDE';
  document.getElementById('hud').inert = document.body.dataset.scene === 'OUTSIDE';
  if (returnFocus?.isConnected && !returnFocus.closest('[inert]')) returnFocus.focus({ preventScroll: true });
  document.dispatchEvent(new Event('modalchange'));
}

modal.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const controls = [...modal.querySelectorAll('button, a[href], [tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
  const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
});
