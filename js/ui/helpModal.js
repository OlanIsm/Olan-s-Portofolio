import { openModal } from './modalManager.js?v=130';

export function openHelpModal() {
  const titleHTML = `
    <svg class="pixel-icon" viewBox="0 0 16 16">
      <rect x="5" y="2" width="6" height="2" />
      <rect x="9" y="4" width="3" height="3" />
      <rect x="7" y="7" width="3" height="3" />
      <rect x="7" y="11" width="3" height="3" />
    </svg>
    HOW TO NAVIGATE OLAN.DEV
  `;

  const bodyHTML = `
    <div class="help-modal-content" style="padding: 10px 5px; font-family: 'VT323', monospace; color: #e8e0d4; font-size: 18px; line-height: 1.6;">
      <div style="display: flex; align-items: flex-start; margin-bottom: 16px; gap: 12px; background: rgba(255,208,128,0.06); padding: 12px; border: 2px dashed #4a3a20;">
        <svg class="pixel-icon" viewBox="0 0 16 16" style="fill:#ffd080; width:22px; height:22px; flex-shrink:0; margin-top:2px;">
          <rect x="7" y="1" width="2" height="14" />
          <rect x="1" y="7" width="14" height="2" />
          <rect x="4" y="4" width="2" height="2" />
          <rect x="10" y="4" width="2" height="2" />
          <rect x="4" y="10" width="2" height="2" />
          <rect x="10" y="10" width="2" height="2" />
        </svg>
        <div>
          <strong style="color: #ffd080; font-family: 'Press Start 2P', monospace; font-size: 10px; display: block; margin-bottom: 6px;">INTERACTIVE 3D OBJECTS</strong>
          Click on any highlighted object in the room to interact:
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-bottom: 16px;">
        <!-- LAPTOP -->
        <div style="background: rgba(0,0,0,0.3); border: 2px solid #3a2a18; padding: 10px;">
          <div style="color: #88ccff; font-family: 'Press Start 2P', monospace; font-size: 9px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <svg class="pixel-icon" viewBox="0 0 16 16" style="fill:#88ccff; width:16px; height:16px;">
              <rect x="2" y="2" width="12" height="9" />
              <rect x="3" y="3" width="10" height="7" fill="#241c12" />
              <rect x="0" y="12" width="16" height="2" />
              <rect x="7" y="12" width="2" height="1" fill="#241c12" />
            </svg>
            LAPTOP
          </div>
          View Olan's featured web & mobile projects, hackathon entries, and GitHub repos.
        </div>

        <!-- PC MONITOR -->
        <div style="background: rgba(0,0,0,0.3); border: 2px solid #3a2a18; padding: 10px;">
          <div style="color: #ffaa66; font-family: 'Press Start 2P', monospace; font-size: 9px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <svg class="pixel-icon" viewBox="0 0 16 16" style="fill:#ffaa66; width:16px; height:16px;">
              <rect x="1" y="2" width="14" height="10" />
              <rect x="2" y="3" width="12" height="8" fill="#241c12" />
              <rect x="6" y="12" width="4" height="2" />
              <rect x="4" y="14" width="8" height="1" />
            </svg>
            PC MONITOR
          </div>
          Read Olan's full biography, CS background, and download the official CV.
        </div>

        <!-- BOOKSHELF -->
        <div style="background: rgba(0,0,0,0.3); border: 2px solid #3a2a18; padding: 10px;">
          <div style="color: #ffd080; font-family: 'Press Start 2P', monospace; font-size: 9px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <svg class="pixel-icon" viewBox="0 0 16 16" style="fill:#ffd080; width:16px; height:16px;">
              <rect x="2" y="4" width="12" height="10" />
              <rect x="5" y="1" width="6" height="3" fill="none" stroke="#ffd080" stroke-width="1" />
              <rect x="7" y="8" width="2" height="2" fill="#241c12" />
            </svg>
            BOOKSHELF
          </div>
          Explore Olan's organization roles at HIMTI & BNCC, plus competition experience.
        </div>

        <!-- PLANT -->
        <div style="background: rgba(0,0,0,0.3); border: 2px solid #3a2a18; padding: 10px;">
          <div style="color: #88ffcc; font-family: 'Press Start 2P', monospace; font-size: 9px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <svg class="pixel-icon" viewBox="0 0 16 16" style="fill:#88ffcc; width:16px; height:16px;">
              <rect x="3" y="5" width="2" height="2" />
              <rect x="4" y="7" width="2" height="2" />
              <rect x="7" y="2" width="2" height="12" />
              <rect x="11" y="4" width="2" height="2" />
              <rect x="10" y="6" width="2" height="2" />
              <rect x="9" y="8" width="2" height="2" />
              <rect x="4" y="14" width="8" height="2" />
            </svg>
            PLANT
          </div>
          Open Olan's tech stack & interactive skill tree (JavaScript, React, Python, etc.).
        </div>

        <!-- POSTER -->
        <div style="background: rgba(0,0,0,0.3); border: 2px solid #3a2a18; padding: 10px;">
          <div style="color: #ff88aa; font-family: 'Press Start 2P', monospace; font-size: 9px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <svg class="pixel-icon" viewBox="0 0 16 16" style="fill:#ff88aa; width:16px; height:16px;">
              <rect x="1" y="2" width="14" height="3" />
              <rect x="1" y="5" width="3" height="3" />
              <rect x="12" y="5" width="3" height="3" />
              <rect x="4" y="8" width="8" height="2" />
              <rect x="3" y="10" width="10" height="4" />
              <rect x="6" y="11" width="4" height="2" fill="#241c12" />
            </svg>
            POSTER
          </div>
          Connect with Olan via Instagram, GitHub, LinkedIn, YouTube, or Email.
        </div>

        <!-- LAMPS -->
        <div style="background: rgba(0,0,0,0.3); border: 2px solid #3a2a18; padding: 10px;">
          <div style="color: #ffdd66; font-family: 'Press Start 2P', monospace; font-size: 9px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <svg class="pixel-icon" viewBox="0 0 16 16" style="fill:#ffdd66; width:16px; height:16px;">
              <rect x="5" y="2" width="6" height="7" />
              <rect x="4" y="3" width="8" height="5" />
              <rect x="6" y="4" width="4" height="3" fill="#1a140e" />
              <rect x="6" y="9" width="4" height="3" fill="#8a8a8a" />
              <rect x="7" y="12" width="2" height="1" fill="#555555" />
            </svg>
            LAMPS
          </div>
          Click ceiling or floor lamps to toggle lights on & off.
        </div>

        <!-- SLEEPING CAT -->
        <div style="background: rgba(0,0,0,0.3); border: 2px solid #3a2a18; padding: 10px;">
          <div style="color: #ff88cc; font-family: 'Press Start 2P', monospace; font-size: 9px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <svg class="pixel-icon" viewBox="0 0 16 16" style="fill:#ff88cc; width:16px; height:16px;">
              <rect x="2" y="8" width="12" height="6" />
              <rect x="1" y="5" width="3" height="3" />
              <rect x="12" y="5" width="3" height="3" />
              <rect x="4" y="10" width="2" height="1" fill="#1a140e" />
              <rect x="10" y="10" width="2" height="1" fill="#1a140e" />
            </svg>
            SLEEPING CAT
          </div>
          Click the sleeping cat on the cushion to hear a cozy meow sfx!
        </div>
      </div>

      <div style="text-align: center; color: #a08050; font-size: 16px;">
        Click <strong>[ ◄ BACK ]</strong> or press <strong>[ ESC ]</strong> anytime to return to the room view.
      </div>
    </div>
  `;

  openModal(titleHTML, bodyHTML);
}
