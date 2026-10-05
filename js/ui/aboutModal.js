import { pixelIcon } from './pixelIcons.js';
import { openModal } from './modalManager.js?v=160';

export function openAboutModal() {
  const titleHTML = "ABOUT OLAN";

  const bodyHTML = `
    <div class="about-container">
      <!-- Left Column: Hero & Quick Stats -->
      <div class="about-hero-col">
        <div class="about-avatar-box">
          <img class="about-avatar-photo" src="img/profilepicture.jpeg" alt="Olan - Insan Maulana">
          <div class="about-name">Insan Maulana (Olan)</div>
          <div class="about-role">Software Engineer</div>
        </div>

        <div class="about-stats-card">
          <div class="about-stat-item">
            <span class="stat-key">EDUCATION</span>
            <span class="stat-val">CS @ BINUS Univ.</span>
          </div>
          <div class="about-stat-item">
            <span class="stat-key">FOCUS</span>
            <span class="stat-val">Software & AI Engineering</span>
          </div>
          <div class="about-stat-item">
            <span class="stat-key">LOCATION</span>
            <span class="stat-val">Jakarta, ID</span>
          </div>
          <div class="about-stat-item">
            <span class="stat-key">STATUS</span>
            <span class="stat-val status-active">Available for Hire</span>
          </div>
        </div>

        <!-- Download CV Button -->
        <a href="assets/Insan Maulana_CV.pdf" download="Insan Maulana_CV.pdf" class="about-cv-btn" id="about-download-cv">
          ${pixelIcon('book')}
          DOWNLOAD CV
        </a>
      </div>

      <!-- Right Column: Bio & Core Competencies -->
      <div class="about-details-col">
        <div class="about-section">
          <h3 class="about-sec-title">
            ${pixelIcon('portrait')}
            BIOGRAPHY
          </h3>
          <p class="about-bio">
            I'm a CS student at <span class="hl">BINUS University</span> with a strong passion for <span class="hl">Software Engineering</span> and <span class="hl">AI Engineering</span>. I focus on developing scalable <span class="hl">Web & Mobile Applications</span>, spanning from modern frontend architectures and intelligent backend integrations to performant cross-platform mobile solutions. Believes in writing clean, scalable code with exceptional developer and user experience. Currently exploring <span class="hl">Applied AI and creative coding</span>.
          </p>
          
          <div class="about-quote">
            <p class="about-quote-text">
              "Simple is better than complex. But readable is better than simple."
            </p>
            <p class="about-quote-author">
              — David Heinemeier Hansson
            </p>
          </div>
        </div>

        <div class="about-section">
          <h3 class="about-sec-title">
            ${pixelIcon('code')}
            TECHNICAL SPECIALIZATION
          </h3>
          <div class="about-tags-group">
            <span class="about-tag">React & Next.js</span>
            <span class="about-tag">TypeScript & JS</span>
            <span class="about-tag">Node.js & NestJS</span>
            <span class="about-tag">Supabase & PostgreSQL</span>
            <span class="about-tag">Git & CI/CD</span>
            <span class="about-tag">UI/UX & Pixel Art</span>
            <span class="about-tag">Figma & Framer</span>
          </div>
        </div>

        <div class="about-section">
          <h3 class="about-sec-title">
            ${pixelIcon('envelope')}
            CONNECT & SOCIALS
          </h3>
          <div class="about-socials">
            <a href="https://github.com/OlanIsm" target="_blank" rel="noopener noreferrer" class="about-social-link">
              ${pixelIcon('code')}
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/insan-maulana-104a04263" target="_blank" rel="noopener noreferrer" class="about-social-link">
              ${pixelIcon('portrait')}
              LinkedIn
            </a>
            <a href="mailto:insan.maulana.ism@gmail.com" class="about-social-link">
              ${pixelIcon('envelope')}
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  openModal(titleHTML, bodyHTML, 'about-modal-wide', 'portrait');
}