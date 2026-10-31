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

test('the static page shell is unchanged', () => {
  const shell = source => {
    const start = source.indexOf('<div class="app side-open"');
    const end = source.indexOf('<div id="layer"></div>', start);
    assert.ok(start >= 0 && end > start, 'page shell exists');
    return source.slice(start, end + '<div id="layer"></div>'.length);
  };
  assert.equal(shell(read('../index.html')), shell(original));
});

test('the extracted styles and game engine match the prototype', () => {
  const styles = [...original.matchAll(/<style>([\s\S]*?)<\/style>/g)];
  assert.ok(styles.length >= 2);
  assert.equal(normalizeLines(read('../src/styles/base.css')), normalizeLines(styles[0][1]));
  assert.equal(normalizeLines(read('../src/styles/app.css')), normalizeLines(styles[1][1]));
  const engine = original.match(/<script id="engineSrc">([\s\S]*?)<\/script>/);
  assert.ok(engine);
  assert.equal(normalizeLines(read('../src/game/engine.js')), normalizeLines(engine[1]));
});
