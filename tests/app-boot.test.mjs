import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the modular entry boots and binds its input handlers', async () => {
  const listeners = new Map();
  const element = () => ({
    value: '', innerHTML: '', scrollHeight: 0, style: {}, dataset: {},
    relList: { supports: () => true },
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(type, handler) { listeners.set(type, handler); },
    appendChild() {}, querySelectorAll: () => [],
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
  globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  globalThis.document = {
    activeElement: null,
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
});
