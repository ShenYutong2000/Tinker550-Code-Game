import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createProject, buildProjectSpec } from '../src/state/project.js';

test('the modular entry boots and binds its input handlers', async () => {
  const listeners = new Map();
  const element = () => ({
    value: '', innerHTML: '', scrollHeight: 0, style: {}, dataset: {},
    relList: { supports: () => true },
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(type, handler) { listeners.set(type, handler); },
    appendChild() {}, remove() {}, querySelectorAll: () => [],
    getContext: () => ({ setTransform() {} }),
  });
  const elements = new Map();
  for (const selector of [
    '#cv', '#sideBody', '#app', '#gameName', '#feed', '#msgs', '#live',
    '#composer', '#sendBtn', '#tabbar',
  ]) elements.set(selector, element());
  globalThis.window = globalThis;
  globalThis.innerWidth = 1440;
  globalThis.devicePixelRatio = 1;
  globalThis.matchMedia = () => ({ matches: true });
  globalThis.requestAnimationFrame = () => 0;
  globalThis.location = { search: '', hash: '' };
  const stored = new Map();
  globalThis.localStorage = {
    getItem: key => stored.get(key) || null,
    setItem: (key, value) => stored.set(key, value),
    removeItem: key => stored.delete(key),
  };
  globalThis.document = {
    activeElement: null,
    body: { appendChild() {} },
    querySelector: selector => elements.get(selector) || null,
    querySelectorAll: () => [],
    createElement: element,
    addEventListener(type, handler) { listeners.set(`document:${type}`, handler); },
  };

  const builtPage = new URL('../dist/index.html', import.meta.url);
  const builtHTML = readFileSync(builtPage, 'utf8');
  const script = builtHTML.match(/<script type="module"[^>]+src="([^"]+)"/)[1];
  await import(new URL(script, builtPage).href);
  assert.match(elements.get('#sideBody').innerHTML, /New project/);
  assert.match(elements.get('#live').innerHTML, /is typing/);
  assert.equal(elements.get('#composer').placeholder, 'Or just type: a cat catching stars');
  assert.equal(typeof listeners.get('document:click'), 'function');
  assert.equal(typeof listeners.get('document:keydown'), 'function');
  assert.equal(typeof listeners.get('document:input'), 'function');
  assert.equal(typeof listeners.get('input'), 'function');
  await new Promise(resolve => setTimeout(resolve, 900));
  assert.match(elements.get('#live').innerHTML, /Try a name/);

  const saved = createProject('Robo');
  saved.name = 'Cat Game';
  saved.phase = 'directions';
  saved.stickers = [
    { id: 'hero', col: 'character', status: 'ok', text: '🐱 cat', effect: { char: { e: '🐱', n: 'cat' } } },
    { id: 'goal', col: 'objectives', status: 'ok', text: 'catching stars', effect: { mode: 'catch', item: { e: '⭐', n: 'stars' } } },
  ];
  saved.activeChar = 'hero';
  saved.lastBuilt = ['hero', 'goal'];
  saved.versions = [{ n: 1, spec: buildProjectSpec(saved, false), items: [], summary: 'catching stars' }];
  stored.set('tinkercade.projects.v6', JSON.stringify([saved]));
  for (const selector of ['#paneTitle', '#paneVer', '#rbBtn', '#legend']) elements.set(selector, element());

  const click = (selector, dataset) => {
    const match = { dataset };
    listeners.get('document:click')({ target: { closest: query => query === selector ? match : null } });
  };
  click('[data-open]', { open: saved.id });
  assert.equal(elements.get('#paneVer').textContent, 'v1');

  let download;
  globalThis.claude = { use: async () => ({ save: async payload => { download = payload; } }) };
  click('[data-act]', { act: 'export' });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(download.filename, 'Cat Game.html');
  assert.match(download.data, /<canvas id="cv" tabindex="0"><\/canvas>/);
  assert.match(download.data, /window\.TinkerEngine\(document\.getElementById\("cv"\)\)\.load/);
  assert.doesNotMatch(download.data, /engine\.js\?raw/);
});
