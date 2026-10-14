import { openModal } from './modalManager.js?v=160';
import { pixelIcon } from './pixelIcons.js';

export function openContactModal() {
  const links = [
    ['Instagram', '@olan.ism', 'https://instagram.com/olan.ism', 'heart'],
    ['GitHub', 'OlanIsm', 'https://github.com/OlanIsm', 'code'],
    ['LinkedIn', 'Insan Maulana', 'https://www.linkedin.com/in/insan-maulana-104a04263', 'portrait'],
    ['YouTube', '@olanwalaweh', 'https://youtube.com/@olanwalaweh', 'gamepad'],
  ];
  const body = `<p class="menu-intro">Have something in mind? There’s always room for a conversation.</p>
    <div class="social-grid">${links.map(([name, handle, url, icon]) => `
      <a class="social-card" href="${url}" target="_blank" rel="noopener noreferrer">
        ${pixelIcon(icon)}<span><strong>${name}</strong><span>${handle}</span></span><span class="social-arrow" aria-hidden="true">&#8599;</span>
      </a>`).join('')}</div>
    <div class="letter-card">${pixelIcon('envelope')}<div><span class="letter-label">Send a little hello</span>
      <a href="mailto:insan.maulana.ism@gmail.com">insan.maulana.ism@gmail.com</a></div>
      <button type="button" id="copy-email">Copy email</button>
    </div><p id="copy-status" class="copy-status" role="status"></p>`;
  openModal("LET’S KEEP IN TOUCH", body, 'contact-modal-wide', 'envelope');
  document.getElementById('copy-email').addEventListener('click', async () => {
    const status = document.getElementById('copy-status');
    try {
      await navigator.clipboard.writeText('insan.maulana.ism@gmail.com');
      status.textContent = 'Email copied. Say hello anytime!';
    } catch {
      status.textContent = 'Select the email address above to copy it, or click it to open your mail app.';
    }
  });
}
