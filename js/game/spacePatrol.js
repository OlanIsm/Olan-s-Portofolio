export const WIDTH = 320, HEIGHT = 400;
export function createGame() {
  return { x: 160, time: 0, score: 0, lives: 3, invincible: 0, fire: 0, spawn: .6, bullets: [], enemies: [], shots: [], over: false };
}
export function stepGame(g, input, dt, random = Math.random) {
  if (g.over) return;
  g.time += dt;
  g.invincible = Math.max(0, g.invincible - dt);
  g.x = Math.max(14, Math.min(WIDTH - 14, input.target ?? g.x + input.direction * 210 * dt));
  g.fire -= dt; g.spawn -= dt;
  const level = Math.floor(g.time / 20);
  if (g.fire <= 0) { g.bullets.push({ x: g.x, y: 351 }); g.fire = .18; }
  if (g.spawn <= 0) {
    g.enemies.push({ x: 20 + random() * 280, y: -16, fire: 1 + random() * 2 });
    g.spawn = Math.max(.35, 1 - level * .1);
  }
  const hit = () => {
    if (g.invincible > 0 || g.over) return;
    g.lives--; g.invincible = 1.5; g.over = g.lives === 0;
  };
  for (const b of g.bullets) b.y -= 300 * dt;
  for (const e of g.enemies) {
    e.y += Math.min(115, 36 + level * 8) * dt;
    e.fire -= dt;
    if (e.fire <= 0 && e.y < 300) { g.shots.push({ x: e.x, y: e.y + 10 }); e.fire = 2.3; }
    for (const b of g.bullets) {
      if (!e.dead && !b.dead && Math.abs(b.x - e.x) < 13 && Math.abs(b.y - e.y) < 12) {
        e.dead = b.dead = true; g.score += 100;
      }
    }
    if (!e.dead && Math.abs(e.x - g.x) < 21 && Math.abs(e.y - 365) < 19) { e.dead = true; hit(); }
    if (!e.dead && e.y > HEIGHT + 14) { e.dead = true; hit(); }
  }
  for (const s of g.shots) {
    s.y += Math.min(210, 105 + level * 10) * dt;
    if (Math.abs(s.x - g.x) < 12 && Math.abs(s.y - 365) < 16) { s.dead = true; hit(); }
  }
  g.bullets = g.bullets.filter(b => !b.dead && b.y > -10);
  g.enemies = g.enemies.filter(e => !e.dead);
  g.shots = g.shots.filter(s => !s.dead && s.y < HEIGHT + 10);
}
