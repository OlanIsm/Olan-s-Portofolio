import { playKeypadSfx } from '../audio/audioManager.js';

// An easter egg, not authentication; intentionally checked in the browser.
const ACCESS_CODE = '190406';

export function createAcKeypad(onUnlock) {
  const dialog = document.getElementById('ac-keypad');
  const output = document.getElementById('ac-digits');
  const status = document.getElementById('ac-status');
  const submit = document.getElementById('ac-submit');
  let digits = '';
  let rejected = false;

  function render() {
    output.textContent = digits.padEnd(6, '_').split('').join(' ');
    output.setAttribute('aria-label', `${digits.length} of 6 digits entered`);
    submit.disabled = digits.length !== 6;
    dialog.classList.toggle('rejected', rejected);
    status.textContent = rejected ? 'Incorrect code. Try again.' : 'Enter 6-digit access code.';
  }

  function enter(key) {
    if (key === 'submit') {
      if (digits.length !== 6) return;
      if (digits === ACCESS_CODE) {
        dialog.close();
        onUnlock();
        return;
      }
      rejected = true;
      playKeypadSfx(false);
    } else {
      if (key === 'clear' || (rejected && /^\d$/.test(key))) digits = '';
      rejected = false;
      if (key === 'delete') digits = digits.slice(0, -1);
      else if (/^\d$/.test(key) && digits.length < 6) digits += key;
      playKeypadSfx(true);
    }
    render();
  }

  dialog.querySelector('.ac-keys').addEventListener('click', event => {
    const key = event.target.closest('[data-pin]');
    if (key) enter(key.dataset.pin);
  });
  submit.addEventListener('click', () => enter('submit'));
  dialog.addEventListener('keydown', event => {
    event.stopPropagation();
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      enter(event.key);
      dialog.focus({ preventScroll: true });
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      enter(event.key === 'Backspace' ? 'delete' : 'clear');
    } else if (event.key === 'Enter' && event.target === dialog) {
      event.preventDefault();
      enter('submit');
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });

  return {
    get isOpen() { return dialog.open; },
    open() {
      if (dialog.open) return;
      digits = '';
      rejected = false;
      render();
      dialog.showModal();
      dialog.querySelector('[data-pin="1"]').focus({ preventScroll: true });
    }
  };
}
