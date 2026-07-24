export const modal = document.getElementById('modal');
export const modalTitle = document.getElementById('modal-title');
export const modalBody = document.getElementById('modal-body');

export function openModal(titleHTML, bodyHTML) {
  modalTitle.innerHTML = titleHTML;
  modalBody.innerHTML = bodyHTML;
  modal.classList.add('open');
}

export function closeModal() {
  modal.classList.remove('open');
}
