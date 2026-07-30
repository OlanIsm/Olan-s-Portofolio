export const modal = document.getElementById('modal');
export const modalTitle = document.getElementById('modal-title');
export const modalBody = document.getElementById('modal-body');
export const modalBox = modal.querySelector('#modal-box');

const ALL_BOX_CLASSES = ['st-modal-wide', 'about-modal-wide', 'contact-modal-compact', 'proj-modal-wide'];

function resetModalWidthClasses() {
  if (modalBox) {
    modalBox.classList.remove(...ALL_BOX_CLASSES);
  }
}

// boxClass is optional — applied BEFORE modal becomes visible, preventing layout shift
export function openModal(titleHTML, bodyHTML, boxClass = null) {
  resetModalWidthClasses();
  if (boxClass && modalBox) {
    modalBox.classList.add(boxClass);
  }
  modalTitle.innerHTML = titleHTML;
  modalBody.innerHTML = bodyHTML;
  modal.classList.add('open');
}

export function closeModal() {
  modal.classList.remove('open');
  resetModalWidthClasses();
}
