import assert from 'node:assert/strict';
import { createGame, stepGame } from '../js/game/spacePatrol.js';
const step = (g, dt = 1 / 60, direction = 0) => stepGame(g, { direction }, dt, () => .5);
const g = createGame();
for (let i = 0; i < 120; i++) step(g, 1 / 60, -1);
assert.equal(g.x, 14, 'Left boundary');
for (let i = 0; i < 120; i++) step(g, 1 / 60, 1);
assert.equal(g.x, 306, 'Right boundary');
const collision = createGame();
collision.bullets.push({ x: 70, y: 100 });
collision.enemies.push({ x: 70, y: 96, fire: 2 });
step(collision);
assert.equal(collision.score, 100);
assert.equal(collision.enemies.length, 0);
for (let life = 2; life >= 0; life--) {
  collision.invincible = 0;
  collision.shots.push({ x: collision.x, y: 362 }, { x: collision.x, y: 362 });
  step(collision);
  assert.equal(collision.lives, life, 'One hit per invulnerability window');
}
assert.equal(collision.over, true);
const snapshot = JSON.stringify(collision); step(collision);
assert.equal(JSON.stringify(collision), snapshot, 'Game over freezes simulation');
const escaped = createGame(); escaped.enemies.push({ x: 10, y: 415, fire: 2 }); step(escaped);
assert.equal(escaped.lives, 2, 'Escaped enemy costs a heart');
assert.equal(escaped.enemies.length, 0);
const old = createGame(), late = createGame();
late.time = 80;
for (const state of [old, late]) { state.enemies.push({ x: 10, y: 0, fire: 2 }); step(state); }
assert.ok(late.enemies[0].y > old.enemies[0].y, 'Difficulty increases');
console.log('Space Patrol simulation passed.');
