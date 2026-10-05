// Authored on a 32px grid. Every contour and highlight stays on whole pixels.
const ink = '#34433e';
const rect = (x, y, w, h, color) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
const path = (d, color) => `<path d="${d}" fill="${color}"/>`;
const sparkle = (x, y, color = '#f2c55e') => rect(x + 1, y, 1, 3, color) + rect(x, y + 1, 3, 1, color);
const art = {
  laptop: () => rect(4, 3, 24, 19, ink) + rect(5, 4, 22, 17, '#d1e6dd') + rect(7, 6, 18, 13, '#28788e') + rect(8, 7, 16, 2, '#439cb2') + rect(8, 9, 2, 8, '#398da1') + rect(10, 11, 2, 2, '#cff0dc') + rect(13, 13, 6, 1, '#95d8c8') + rect(20, 8, 3, 3, '#73bfd3') + rect(22, 12, 1, 2, '#73bfd3') + path('M4 22H28V24H30V27H32V30H0V27H2V24H4Z', ink) + path('M5 22H27V24H29V27H3V25H5Z', '#e7eee0') + rect(6, 23, 20, 3, '#789b9b') + [7, 11, 15, 19, 23].map(x => rect(x, 23, 2, 1, '#f9f4dc') + rect(x + 1, 25, 2, 1, '#f9f4dc')).join('') + rect(11, 27, 10, 2, '#acc7bd') + rect(2, 28, 7, 1, '#fffbed') + rect(24, 28, 4, 1, '#e4b958'),
  tree: () => path('M13 2H20V4H25V7H28V12H30V18H27V22H22V24H19V27H24V29H27V31H5V29H8V27H13V23H8V21H4V17H2V11H5V7H9V4H13Z', ink) + path('M13 5H20V7H24V10H27V17H24V20H19V23H12V20H7V17H5V12H8V8H13Z', '#4e9c64') + path('M13 5H19V8H13V10H9V14H6V11H9V8H13Z', '#94ca78') + path('M24 10H27V17H24V20H20V22H18V18H23Z', '#33765b') + path('M14 15H17V26H21V28H24V29H8V28H12V25H14V20H11V18H14Z', '#a4754e') + rect(15, 17, 1, 10, '#dfb07a') + rect(9, 13, 3, 3, '#ee9b6b') + rect(20, 10, 3, 3, '#f0b475') + rect(20, 17, 3, 3, '#d4775e') + rect(10, 12, 1, 1, '#fff0aa') + sparkle(1, 2),
  portrait: () => rect(4, 2, 24, 28, ink) + rect(5, 3, 22, 25, '#f2d18d') + rect(7, 5, 18, 20, '#fdf3d6') + path('M12 7H20V9H22V15H20V18H12V16H10V10H12Z', '#805e48') + rect(12, 10, 8, 7, '#ecc098') + rect(12, 10, 3, 2, '#805e48') + rect(13, 13, 1, 1, ink) + rect(18, 13, 1, 1, ink) + rect(15, 16, 3, 1, '#be8068') + path('M12 18H20V20H23V25H9V20H12Z', '#6e9e95') + rect(13, 18, 6, 2, '#e6b38c') + rect(10, 21, 2, 4, '#a6c8ad') + rect(8, 27, 9, 1, '#b28a55') + rect(22, 26, 3, 3, '#d78978') + sparkle(27, 1),
  trophy: () => rect(9, 4, 14, 3, ink) + path('M3 7H29V15H26V18H22V21H18V25H23V28H26V31H6V28H9V25H14V21H10V18H6V15H3Z', ink) + rect(5, 9, 4, 5, '#e6af45') + rect(23, 9, 4, 5, '#e6af45') + rect(7, 10, 2, 3, '#fff7e7') + rect(23, 10, 2, 3, '#fff7e7') + path('M10 6H22V16H20V19H17V26H21V28H24V29H8V28H11V26H15V19H12V16H10Z', '#edbd54') + rect(11, 7, 3, 8, '#ffe494') + rect(19, 7, 2, 9, '#cf9141') + rect(13, 28, 8, 1, '#ffe9a3') + rect(14, 10, 4, 4, '#e28270') + rect(15, 10, 2, 2, '#ffc5a3') + sparkle(26, 2) + sparkle(2, 1, '#8cae90'),
  envelope: () => path('M2 8H30V27H2Z', ink) + rect(3, 9, 26, 16, '#edcda3') + path('M4 10H28V12H26V14H23V16H20V18H12V16H9V14H6V12H4Z', '#fff7dc') + path('M4 24V21H7V18H10V17H12V19H20V17H22V18H25V21H28V24Z', '#f8e7c5') + rect(13, 16, 6, 6, '#b75c64') + rect(14, 16, 4, 4, '#e59591') + rect(15, 17, 2, 2, '#ffcab0') + rect(4, 10, 2, 2, '#fffdf3') + sparkle(24, 2, '#d194aa') + sparkle(5, 3),
  book: () => path('M6 3H26V28H23V30H4V6H6Z', ink) + rect(6, 5, 18, 20, '#79aeb2') + rect(6, 5, 3, 20, '#427b83') + rect(10, 6, 13, 2, '#a7d3cc') + rect(6, 26, 18, 2, '#fff0cb') + rect(8, 28, 15, 1, '#ddc291') + path('M13 11H19V13H21V16H18V18H15V16H17V14H18V13H14V14H12V12H13Z', '#fff0cb') + rect(15, 20, 3, 2, '#fff0cb') + rect(21, 26, 2, 5, '#dc8f78') + sparkle(27, 1),
  door: () => rect(9, 2, 18, 28, ink) + rect(11, 4, 14, 24, '#c5a37b') + rect(13, 5, 10, 21, '#edd3a2') + rect(14, 7, 7, 8, '#f8e7bf') + rect(21, 17, 2, 2, '#8b7956') + path('M6 15H13V18H6V21H3V18H0V15H3V12H6Z', '#4e8779') + rect(8, 29, 21, 2, '#acbd9b'),
  heart: () => path('M4 5H12V7H14V9H18V7H20V5H28V7H30V17H28V20H25V23H22V26H19V29H13V26H10V23H7V20H4V17H2V7H4Z', ink) + path('M5 7H11V9H13V11H19V9H21V7H27V9H28V16H26V19H23V22H20V25H17V27H15V25H12V22H9V19H6V16H4V9H5Z', '#e87883') + rect(6, 9, 3, 5, '#ffbbc0') + rect(9, 8, 3, 2, '#ffe3d1') + path('M26 14H28V16H26V19H23V22H20V25H17V27H15V24H18V21H21V18H24V14Z', '#be566d'),
  star: () => path('M14 2H18V8H21V11H29V15H26V18H23V22H25V29H20V26H17V24H15V26H12V29H7V22H9V18H6V15H3V11H11V8H14Z', ink) + path('M15 5H17V11H20V13H26V14H24V17H21V22H22V25H20V23H17V22H15V23H12V25H10V22H11V17H8V14H6V13H13V11H15Z', '#f2c65c') + rect(14, 12, 3, 7, '#ffe8a0') + rect(11, 14, 3, 3, '#ffe8a0') + rect(18, 18, 3, 3, '#d59a43'),
  gamepad: () => path('M6 8H12V10H20V8H26V10H28V14H30V24H28V27H23V24H9V27H4V24H2V14H4V10H6Z', ink) + path('M6 11H11V13H21V11H26V15H28V23H26V25H24V22H8V25H6V23H4V15H6Z', '#b2b6d7') + rect(6, 13, 6, 2, '#dedbf0') + rect(8, 15, 2, 7, ink) + rect(6, 17, 6, 2, ink) + rect(22, 15, 3, 3, '#d57587') + rect(19, 19, 3, 3, '#e6b957') + rect(14, 20, 3, 1, '#666e89') + sparkle(14, 3, '#a9bd80'),
  music: () => path('M13 5H27V24H25V27H19V24H21V10H16V25H14V28H7V26H5V22H7V20H12V5Z', ink) + rect(14, 6, 11, 3, '#d79bbb') + rect(13, 9, 2, 15, '#f1c2d3') + rect(22, 9, 3, 14, '#dda0bd') + rect(7, 22, 6, 3, '#e9bf57') + rect(20, 23, 5, 2, '#c575a0') + sparkle(3, 7) + sparkle(24, 1, '#c87caa'),
  cards: () => rect(4, 3, 17, 24, ink) + rect(6, 5, 13, 20, '#88b8b2') + rect(10, 7, 18, 24, ink) + rect(12, 9, 14, 20, '#e8be68') + rect(14, 11, 10, 16, '#fff0cd') + path('M18 14H20V17H23V20H20V23H18V20H15V17H18Z', '#cc857c') + rect(7, 6, 2, 17, '#c6e0c7'),
  code: () => rect(3, 5, 26, 22, ink) + rect(5, 7, 22, 18, '#739da4') + rect(5, 7, 22, 4, '#b8d5cd') + rect(7, 8, 2, 2, '#e8a08a') + rect(11, 8, 2, 2, '#f2d386') + path('M11 13H14V15H12V17H10V19H12V21H14V23H11V21H8V19H6V17H8V15H11Z', '#f7edcf') + path('M20 13H17V15H19V17H21V19H19V21H17V23H20V21H23V19H25V17H23V15H20Z', '#d5eac5'),
  check: () => path('M5 14H9V18H13V14H17V10H21V6H25V12H21V16H17V20H13V24H9V20H5Z', '#4e8261') + rect(5, 14, 3, 2, '#9cca85'),
  sparkle: () => path('M14 2H18V10H22V14H30V18H22V22H18V30H14V22H10V18H2V14H10V10H14Z', ink) + path('M15 6H17V12H20V15H26V17H20V20H17V26H15V20H12V17H6V15H12V12H15Z', '#7cbebd') + rect(14, 13, 4, 4, '#d5f1db') + sparkle(26, 2, '#d5a34f') + sparkle(1, 25, '#d5a34f'),
};

export function pixelIcon(name, className = '') {
  return `<svg class="pixel-art ${className}" viewBox="0 0 32 32" aria-hidden="true" focusable="false" shape-rendering="crispEdges">${(art[name] || art.star)()}</svg>`;
}

export function skillIcon(node) {
  const names = { olan: 'portrait', soft_skills: 'trophy', organization: 'book', communication: 'envelope', teamwork: 'heart', tech_skills: 'code', languages: 'code', frameworks: 'laptop', tools: 'book', hobbies: 'star', piano: 'music', gaming: 'gamepad', tcg: 'cards', problem_solving: 'sparkle', creative_thinking: 'sparkle', public_speaking: 'music', active_collaboration: 'heart', agile: 'star', scrum: 'trophy' };
  if (names[node.id]) return pixelIcon(names[node.id]);
  // Technology badges use tiny bitmap lettering, keeping the entire tree pixel art.
  const labels = { javascript: 'JS', typescript: 'TS', python: 'PY', html5: 'H5', css3: 'C3', react: 'RE', nextjs: 'NX', nodejs: 'ND', nestjs: 'NS', threejs: '3D', webgl: 'GL', git_github: 'GT', supabase: 'SB', sql: 'DB' };
  const glyphs = { J:'001001001101111', S:'111100111001111', T:'111010010010010', P:'110101110100100', Y:'101101010010010', H:'101101111101101', 5:'111100111001111', C:'111100100100111', 3:'111001111001111', R:'110101110101101', E:'111100110100111', N:'101111111111101', X:'101101010101101', D:'110101101101110', G:'111100101101111', L:'100100100100111', B:'110101110101110' };
  const word = labels[node.id] || 'JS';
  const color = { javascript:'#f0cd68', typescript:'#a4c9e0', python:'#afd1b5', react:'#b0d9dd', nestjs:'#e4b0b9' }[node.id] || '#c5d8b4';
  let pixels = rect(4, 3, 24, 27, ink) + rect(6, 5, 20, 23, color) + rect(7, 6, 17, 2, '#fff1cc') + rect(8, 24, 14, 2, '#fff1cc');
  [...word].forEach((letter, i) => [...(glyphs[letter] || glyphs.J)].forEach((p, j) => {
    if (p === '1') pixels += rect(9 + i * 8 + j % 3 * 2, 11 + Math.floor(j / 3) * 2, 2, 2, ink);
  }));
  return `<svg class="pixel-art" viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges">${pixels}</svg>`;
}
