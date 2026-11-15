import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

import { runProgram } from '../src/game/program.js';

/* plays the real engine for a while with a stand-in canvas and records the text it draws */
function play(spec, seconds) {
  const drawn = [], frames = [];
  const ctx = new Proxy({}, { get: (_, key) => key === 'fillText' ? text => drawn.push(text) : key === 'createLinearGradient' || key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
  const canvas = { getContext: () => ctx, addEventListener() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 320 }), focus() {} };
  let seed = 7;   // the same falling meteors every run
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const sandbox = { window: {}, devicePixelRatio: 1, performance: { now: () => 0 }, requestAnimationFrame: f => frames.push(f), Math: Object.assign(Object.create(Math), { random }) };
  runInNewContext(readFileSync(new URL('../src/game/engine.js', import.meta.url), 'utf8'), sandbox);
  sandbox.window.TinkerEngine(canvas).load(spec);
  for (let t = 1; t <= seconds * 30; t++) frames.shift()(t * 33);
  return drawn;
}
const dodge = rules => runProgram(`game.hero("🐱", "cat");\ngame.play("dodge", "☄️", "meteors");\ngame.lives(9);\n${rules}`);

test('an if → then rule written from the map changes how the game plays', () => {
  const plain = play(dodge(''), 40), ruled = play(dodge('when("hero is hit", then.goFaster());'), 40);
  assert.ok(plain.includes('-❤️') || ruled.includes('-❤️'), 'the hero was hit at least once');
  assert.equal(plain.includes('FASTER!'), false);
  assert.equal(ruled.includes('FASTER!'), true);
});

test('older versions without rules still play', () => {
  assert.ok(play({ speed: 1, mode: 'catch', item: { e: '⭐', n: 'stars' }, hero: { e: '🐱', n: 'cat' }, others: [] }, 3).length > 0);
});
