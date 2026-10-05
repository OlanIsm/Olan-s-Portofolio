import { openModal } from './modalManager.js?v=160';
import { pixelIcon } from './pixelIcons.js';

export function openHelpModal(onArcade) {
  const entries = [
    ['laptop', 'Laptop', 'Explore projects and the things I’m building.'],
    ['portrait', 'Monitor', 'Meet Olan, read my story, and download my CV.'],
    ['tree', 'Plant', 'Explore skills. Drag to pan, scroll to zoom, or use the + and - buttons.'],
    ['trophy', 'Bookshelf', 'Find experiences, organizations, and milestones.'],
    ['envelope', 'Poster', 'Find my socials or send a hello.'],
    ['sparkle', 'Little discoveries', 'Toggle the lamps, greet the cat, and try the arcade or figurine cabinet.'],
  ];
  const body = `<div class="guide-welcome">${pixelIcon('sparkle')}<p>Follow the glow.<br><span>Unexplored objects glow until you click them. You can also use the destination buttons below the room.</span></p></div>
    <div class="guide-grid">${entries.map(([icon, title, copy]) => `<div class="guide-item">${pixelIcon(icon)}<div><h3>${title}</h3><p>${copy}</p></div></div>`).join('')}</div>
    <p class="guide-footer"><kbd>Click / Tap</kbd> Explore <kbd>Tab</kbd> Next control <kbd>Esc</kbd> Back to room</p>`;
  openModal('A LITTLE GUIDE', body + '<button id="guide-arcade" class="arcade-launch">PLAY SPACE PATROL</button>', null, 'book');
  document.getElementById('guide-arcade').addEventListener('click', onArcade);
}
