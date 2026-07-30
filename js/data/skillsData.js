export const skillsTreeData = [
  // ── CORE NODE ──
  {
    id: 'olan',
    name: 'OLAN',
    subtitle: 'Core Origin',
    category: 'core',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffd080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    x: 0,
    y: 0,
    desc: 'Computer Science Student @ BINUS. Explorer of 3D Web, Fullstack Systems, & Creative Dev.'
  },

  // ──────────────────────────────────────────
  // ── TOP BRANCH: SOFT SKILLS (y < 0) ──
  // ──────────────────────────────────────────
  {
    id: 'soft_skills',
    name: 'SOFT SKILLS',
    subtitle: 'Core Mindset',
    category: 'soft',
    parent: 'olan',
    x: 0,
    y: -190,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffaa33" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
    desc: 'Interpersonal, teamwork, and organizational capabilities.'
  },

  // Soft Skills Sub-branches
  {
    id: 'organization',
    name: 'ORGANIZATION',
    subtitle: 'Management',
    category: 'soft',
    parent: 'soft_skills',
    x: -180,
    y: -330,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffaa55" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>`,
    desc: 'Project organization, task management, and structured execution.'
  },
  {
    id: 'agile',
    name: 'Agile',
    category: 'soft',
    parent: 'organization',
    x: -350,
    y: -420,
    color: '#ffaa55',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffaa55" stroke-width="2"><path d="M4 12a8 8 0 0114.9-4M20 12a8 8 0 01-14.9 4"/><polyline points="18 4 19 8 15 7"/><polyline points="6 20 5 16 9 17"/></svg>`,
    desc: 'Adaptive planning, iterative development, and continuous improvement.'
  },
  {
    id: 'scrum',
    name: 'Scrum',
    category: 'soft',
    parent: 'agile',
    x: -480,
    y: -490,
    color: '#ffaa55',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffaa55" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    desc: 'Sprint cycles, daily standups, backlog grooming, and team velocity.'
  },
  {
    id: 'problem_solving',
    name: 'Problem Solving',
    category: 'soft',
    parent: 'organization',
    x: -180,
    y: -500,
    color: '#ffaa55',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffaa55" stroke-width="2"><path d="M9.66 16.27A5 5 0 1012 3a5 5 0 00-2.34 9.27M9 18h6M10 21h4"/></svg>`,
    desc: 'Root-cause analysis, debugging, and efficient algorithmic logic.'
  },
  {
    id: 'creative_thinking',
    name: 'Creative Thinking',
    category: 'soft',
    parent: 'organization',
    x: 0,
    y: -440,
    color: '#ffcc44',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffcc44" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="4"/></svg>`,
    desc: 'Out-of-the-box conceptualization, UI/UX innovation, and novel solution design.'
  },

  {
    id: 'communication',
    name: 'COMMUNICATION',
    subtitle: 'Articulation',
    category: 'soft',
    parent: 'soft_skills',
    x: 0,
    y: -360,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffdd66" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
    desc: 'Expressing ideas clearly, active listening, and technical presentation.'
  },
  {
    id: 'public_speaking',
    name: 'Public Speaking',
    category: 'soft',
    parent: 'communication',
    x: 100,
    y: -500,
    color: '#ffdd66',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffdd66" stroke-width="2"><path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3"/></svg>`,
    desc: 'Pitching projects, leading meetings, and presenting tech solutions.'
  },

  {
    id: 'teamwork',
    name: 'TEAMWORK',
    subtitle: 'Collaboration',
    category: 'soft',
    parent: 'soft_skills',
    x: 180,
    y: -330,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#66eeaa" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
    desc: 'Empathetic teamwork, cross-functional synergy, and peer support.'
  },
  {
    id: 'active_collaboration',
    name: 'Collaboration',
    category: 'soft',
    parent: 'teamwork',
    x: 260,
    y: -460,
    color: '#66eeaa',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#66eeaa" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`,
    desc: 'Working seamlessly with developers, designers, and project leads.'
  },

  // ──────────────────────────────────────────
  // ── LEFT BRANCH: TECH SKILLS (x < 0) ──
  // ──────────────────────────────────────────
  {
    id: 'tech_skills',
    name: 'TECH SKILLS',
    subtitle: 'Developer Arsenal',
    category: 'tech',
    parent: 'olan',
    x: -220,
    y: 40,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#4a90e2" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    desc: 'Programming languages, frameworks, web tech, and database systems.'
  },

  // Tech Sub-branch: Languages
  {
    id: 'languages',
    name: 'LANGUAGES',
    subtitle: 'Core Syntax',
    category: 'tech',
    parent: 'tech_skills',
    x: -400,
    y: 200,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffd080" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    desc: 'Programming & scripting languages mastered.'
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    category: 'tech',
    parent: 'languages',
    x: -560,
    y: 220,
    color: '#ffd080',
    icon: `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="#f7df1e"/><text x="14" y="18" font-family="sans-serif" font-weight="bold" font-size="11" fill="#000" text-anchor="middle">JS</text></svg>`,
    desc: 'ES6+ standards, asynchronous Promises/async-await, event loop, and DOM manipulation.'
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'tech',
    parent: 'javascript',
    x: -710,
    y: 250,
    color: '#3178c6',
    icon: `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="#3178c6"/><text x="14" y="18" font-family="sans-serif" font-weight="bold" font-size="11" fill="#fff" text-anchor="middle">TS</text></svg>`,
    desc: 'Strict static typing, interfaces, generics, type inference, and scalable enterprise code.'
  },
  {
    id: 'python',
    name: 'Python',
    category: 'tech',
    parent: 'languages',
    x: -560,
    y: 110,
    color: '#ff88aa',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ff88aa" stroke-width="1.5"><path d="M12 2v8c0 1.1-.9 2-2 2H2v2c0 3.3 2.7 6 6 6h4v-8c0-1.1.9-2 2-2h8v-2c0-3.3-2.7-6-6-6h-4z"/><circle cx="6" cy="6" r="1" fill="#ff88aa"/><circle cx="18" cy="18" r="1" fill="#ffd080"/></svg>`,
    desc: 'Data scripting, backend automation, Flask web servers, and AI integrations.'
  },
  {
    id: 'html5',
    name: 'HTML5',
    category: 'tech',
    parent: 'languages',
    x: -470,
    y: 330,
    color: '#e34f26',
    icon: `<svg viewBox="0 0 24 24" fill="#e34f26"><path d="M1.5 0h21l-1.9 21.2L12 24l-8.6-2.8L1.5 0zm15.8 5.7H6.7l.4 4.5h9.6l-.4 4.7-4.3 1.4-4.3-1.4-.3-3.1h2.5l.2 1.6 1.9.6 1.9-.6.2-2.2H7.5l-.8-9.1h10.9l-.3 3.6z"/></svg>`,
    desc: 'Semantic HTML markup, web accessibility (a11y), and web storage API.'
  },
  {
    id: 'css3',
    name: 'CSS3',
    category: 'tech',
    parent: 'html5',
    x: -600,
    y: 380,
    color: '#1572b6',
    icon: `<svg viewBox="0 0 24 24" fill="#1572b6"><path d="M1.5 0h21l-1.9 21.2L12 24l-8.6-2.8L1.5 0zm15.8 5.7H6.7l.4 4.5h9.6l-.4 4.7-4.3 1.4-4.3-1.4-.3-3.1h2.5l.2 1.6 1.9.6 1.9-.6.2-2.2H7.5l-.8-9.1h10.9l-.3 3.6z"/></svg>`,
    desc: 'Flexbox, CSS Grid, custom properties, keyframe animations, and responsive layouts.'
  },

  // Tech Sub-branch: Frameworks
  {
    id: 'frameworks',
    name: 'FRAMEWORKS',
    subtitle: 'Web Systems',
    category: 'tech',
    parent: 'tech_skills',
    x: -440,
    y: -40,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#88ccff" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    desc: 'Modern web & backend engineering frameworks.'
  },
  {
    id: 'react',
    name: 'React',
    category: 'tech',
    parent: 'frameworks',
    x: -600,
    y: -90,
    color: '#61dafb',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2" fill="#61dafb"/><ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke="#61dafb" stroke-width="1.2" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke="#61dafb" stroke-width="1.2" transform="rotate(90 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="3.5" fill="none" stroke="#61dafb" stroke-width="1.2" transform="rotate(150 12 12)"/></svg>`,
    desc: 'Component architecture, Virtual DOM, React Hooks, custom state management.'
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'tech',
    parent: 'react',
    x: -740,
    y: -130,
    color: '#ffffff',
    icon: `<svg viewBox="0 0 24 24" fill="#ffffff"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm4.5 17.5l-6-8.5v8.5H9V6.5h1.8l5.7 8.2V6.5h1.5v11h-1.5z"/></svg>`,
    desc: 'App Router, Server Side Rendering (SSR), Static Site Generation (SSG), API routes.'
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'tech',
    parent: 'frameworks',
    x: -590,
    y: 20,
    color: '#83cd29',
    icon: `<svg viewBox="0 0 24 24" fill="#83cd29"><path d="M12 1.25L3.25 6.3v10.1L12 21.5l8.75-5.1V6.3L12 1.25zM12 3.8l6.5 3.8v7.6l-6.5 3.8-6.5-3.8V7.6L12 3.8z"/></svg>`,
    desc: 'Event-driven asynchronous runtime, Express.js servers, npm ecosystem.'
  },
  {
    id: 'nestjs',
    name: 'NestJS',
    category: 'tech',
    parent: 'nodejs',
    x: -730,
    y: 60,
    color: '#ea2845',
    icon: `<svg viewBox="0 0 24 24" fill="#ea2845"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9L2 6v11l10 5 10-5V6l-10 5z"/></svg>`,
    desc: 'Progressive TypeScript Node.js framework, Dependency Injection, modular architecture.'
  },
  {
    id: 'threejs',
    name: 'Three.js',
    category: 'tech',
    parent: 'frameworks',
    x: -600,
    y: -190,
    color: '#aa88ff',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#aa88ff" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
    desc: '3D scene construction, lights, cameras, GLTF/GLB models, orbit controls.'
  },
  {
    id: 'webgl',
    name: 'WebGL',
    category: 'tech',
    parent: 'threejs',
    x: -740,
    y: -240,
    color: '#9966ff',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#9966ff" stroke-width="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="2" x2="12" y2="22"/></svg>`,
    desc: 'GPU-accelerated 2D and 3D web rendering, fragment & vertex shader logic.'
  },

  // Tech Sub-branch: Tools
  {
    id: 'tools',
    name: 'TOOLS & DB',
    subtitle: 'DevOps & Storage',
    category: 'tech',
    parent: 'tech_skills',
    x: -420,
    y: -190,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ff9966" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
    desc: 'Version control, cloud databases, and development tooling.'
  },
  {
    id: 'git_github',
    name: 'Git & GitHub',
    category: 'tech',
    parent: 'tools',
    x: -580,
    y: -310,
    color: '#ff9966',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ff9966" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M6 9v6M9 6h9M18 9v6"/></svg>`,
    desc: 'Branch management, pull request workflows, CI/CD pipeline basics.'
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'tech',
    parent: 'tools',
    x: -410,
    y: -350,
    color: '#3ecf8e',
    icon: `<svg viewBox="0 0 24 24" fill="#3ecf8e"><path d="M13.2 24.0l-1.4-8.8 8.4-1.2L7.2 0l1.4 8.8-8.4 1.2z"/></svg>`,
    desc: 'Backend-as-a-Service, Row Level Security (RLS), realtime database & Auth.'
  },
  {
    id: 'sql',
    name: 'SQL',
    category: 'tech',
    parent: 'supabase',
    x: -530,
    y: -420,
    color: '#336791',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#336791" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    desc: 'Relational database queries, PostgreSQL schema modeling, indexing, and joins.'
  },

  // ──────────────────────────────────────────
  // ── RIGHT BRANCH: HOBBIES (x > 0) ──
  // ──────────────────────────────────────────
  {
    id: 'hobbies',
    name: 'HOBBIES',
    subtitle: 'Life & Interests',
    category: 'hobby',
    parent: 'olan',
    x: 220,
    y: 80,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#e06699" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    desc: 'Personal passions, creative outlets, and leisure activities.'
  },

  // Hobby sub-nodes
  {
    id: 'piano',
    name: 'Piano',
    category: 'hobby',
    parent: 'hobbies',
    x: 400,
    y: -60,
    color: '#ff88cc',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ff88cc" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    desc: 'Playing piano melodies, acoustic arrangements, and musical ear training.'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    category: 'hobby',
    parent: 'hobbies',
    x: 440,
    y: 90,
    color: '#aaccff',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#aaccff" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/></svg>`,
    desc: 'Playing immersive RPGs, open-world games, and studying game mechanics.'
  },
  {
    id: 'tcg',
    name: 'TCG Cards',
    category: 'hobby',
    parent: 'hobbies',
    x: 390,
    y: 240,
    color: '#ffd080',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffd080" stroke-width="2"><rect x="4" y="2" width="12" height="16" rx="2"/><rect x="8" y="6" width="12" height="16" rx="2"/></svg>`,
    desc: 'Trading Card Games collecting, card deck strategies, and casual tournaments.'
  }
];
