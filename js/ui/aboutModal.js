import { openModal } from './modalManager.js?v=130';

export function openAboutModal() {
  const titleHTML = `
    <svg class="pixel-icon" viewBox="0 0 16 16">
      <rect x="3" y="2" width="10" height="12" fill="none" stroke="#ffd080" stroke-width="1.5" />
      <circle cx="8" cy="6" r="2.5" fill="#ffd080" />
      <path d="M4 12v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" fill="#ffd080" />
    </svg>
    ABOUT OLAN &mdash; FULLSTACK & 3D WEB DEVELOPER
  `;

  const bodyHTML = `
    <div class="about-container">
      <!-- Left Column: Hero & Quick Stats -->
      <div class="about-hero-col">
        <div class="about-avatar-box">
          <img class="about-avatar-photo" src="img/profilepicture.jpeg" alt="Olan - Insan Maulana">
          <div class="about-name">OLAN</div>
          <div class="about-role">CS Student &amp; Fullstack Dev</div>
        </div>

        <div class="about-stats-card">
          <div class="about-stat-item">
            <span class="stat-key">EDUCATION</span>
            <span class="stat-val">CS @ BINUS Univ.</span>
          </div>
          <div class="about-stat-item">
            <span class="stat-key">FOCUS</span>
            <span class="stat-val">Fullstack & 3D Web</span>
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          DOWNLOAD CV
        </a>
      </div>

      <!-- Right Column: Bio & Core Competencies -->
      <div class="about-details-col">
        <div class="about-section">
          <h3 class="about-sec-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffd080" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            BIOGRAPHY
          </h3>
          <p class="about-bio">
            Ever since I started programming, I have been deeply passionate about building software and crafting interactive digital experiences. 
            As a Computer Science student at <span class="hl">BINUS University</span>, I specialize in fullstack web architecture, 
            modern frontend frameworks, and 3D web applications powered by <span class="hl">Three.js & WebGL</span>.
          </p>
          <p class="about-bio">
            I thrive at the intersection of creative design and technical engineering—transforming complex ideas into sleek, 
            high-performance web systems with immersive user interfaces.
          </p>
        </div>

        <div class="about-section">
          <h3 class="about-sec-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffd080" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            TECHNICAL SPECIALIZATION
          </h3>
          <div class="about-tags-group">
            <span class="about-tag">React & Next.js</span>
            <span class="about-tag">Three.js & WebGL</span>
            <span class="about-tag">TypeScript & JS</span>
            <span class="about-tag">Node.js & NestJS</span>
            <span class="about-tag">Supabase & PostgreSQL</span>
            <span class="about-tag">Python & Flask</span>
            <span class="about-tag">Git & CI/CD</span>
            <span class="about-tag">UI/UX & Pixel Art</span>
          </div>
        </div>

        <div class="about-section">
          <h3 class="about-sec-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ffd080" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            CONNECT & SOCIALS
          </h3>
          <div class="about-socials">
            <a href="https://github.com/OlanIsm" target="_blank" rel="noopener noreferrer" class="about-social-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/insan-maulana-104a04263" target="_blank" rel="noopener noreferrer" class="about-social-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2 2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              LinkedIn
            </a>
            <a href="mailto:insan.maulana.ism@gmail.com" class="about-social-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  openModal(titleHTML, bodyHTML, 'about-modal-wide');
}
