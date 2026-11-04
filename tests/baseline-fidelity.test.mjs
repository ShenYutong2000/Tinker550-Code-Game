import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const read = relative => readFileSync(new URL(relative, import.meta.url), 'utf8');
const normalizeLines = text => text.replace(/\r\n/g, '\n');
const original = read('../baseline/source/Tinker 550.html');

test('the original prototype remains intact', () => {
  const hash = createHash('sha256').update(readFileSync(new URL('../baseline/source/Tinker 550.html', import.meta.url))).digest('hex');
  assert.equal(hash.toUpperCase(), 'C1B466C8785B11B2B401563119FBF156B6F782E9E14BC7A511BE071F83B286E8');
});

test('the redesigned shell keeps application anchors and adds the board and assessment areas', () => {
  const html = read('../index.html');
  for (const id of ['app', 'msgs', 'live', 'composer', 'boardColumn', 'boardBody', 'boardFoot', 'pane', 'cv', 'previewEmpty', 'layer']) {
    assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
  }
  assert.doesNotMatch(html, /<aside class="side"/);
  assert.match(html, /data-act="projects"/);
  assert.match(html, /data-act="toggle-journal"/);
  assert.match(html, /data-act="toggle-preview"/);
  assert.match(html, /data-tab="board"/);
  assert.doesNotMatch(html, /board-placeholder/);
  assert.match(html, /aria-label="Assessment"/);
});

test('the extracted base styles and game engine match the prototype', () => {
  const styles = [...original.matchAll(/<style>([\s\S]*?)<\/style>/g)];
  assert.ok(styles.length >= 2);
  assert.equal(normalizeLines(read('../src/styles/base.css')), normalizeLines(styles[0][1]));
  const engine = original.match(/<script id="engineSrc">([\s\S]*?)<\/script>/);
  assert.ok(engine);
  assert.equal(normalizeLines(read('../src/game/engine.js')), normalizeLines(engine[1]));
});
