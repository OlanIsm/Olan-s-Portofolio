import { openModal } from './modalManager.js?v=115';

export function openContactModal() {
  const titleHTML = `
    <svg class="pixel-icon" viewBox="0 0 16 16">
      <rect x="1" y="2" width="14" height="3" />
      <rect x="1" y="5" width="3" height="3" />
      <rect x="12" y="5" width="3" height="3" />
      <rect x="4" y="8" width="8" height="2" />
      <rect x="3" y="10" width="10" height="4" />
      <rect x="6" y="11" width="4" height="2" fill="#241c12" />
    </svg>
    OLAN'S CONTACT & SOCIALS
  `;

  const bodyHTML = `
    <div class="contact-grid">
      <!-- ROW 1 -->
      <div class="contact-grid-card instagram" onclick="window.open('https://instagram.com/olan.ism', '_blank')">
        <div class="contact-box">
          <img src="img/instagram.jpg" alt="Instagram">
        </div>
        <div class="contact-handle">@olan.ism</div>
      </div>

      <div class="contact-grid-card github" onclick="window.open('https://github.com/OlanIsm', '_blank')">
        <div class="contact-box">
          <img src="img/github.png" alt="GitHub">
        </div>
        <div class="contact-handle">github/OlanIsm</div>
      </div>

      <div class="contact-grid-card linkedin" onclick="window.open('https://www.linkedin.com/in/insan-maulana-104a04263', '_blank')">
        <div class="contact-box">
          <img src="img/linkedin.png" alt="LinkedIn">
        </div>
        <div class="contact-handle">Insan Maulana</div>
      </div>

      <!-- ROW 2 -->
      <div class="contact-grid-card youtube" onclick="window.open('https://youtube.com/@olanwalaweh', '_blank')">
        <div class="contact-box">
          <img src="img/youtube.png" alt="YouTube">
        </div>
        <div class="contact-handle">@olanwalaweh</div>
      </div>

      <div class="contact-email-wrapper" onclick="window.open('mailto:insan.maulana.ism@gmail.com', '_blank')">
        <div class="contact-email-card">
          <div class="contact-box email-box">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          <div class="contact-email-text">insan.maulana.ism@gmail.com</div>
        </div>
      </div>
    </div>
  `;

  openModal(titleHTML, bodyHTML, 'contact-modal-compact');
}
