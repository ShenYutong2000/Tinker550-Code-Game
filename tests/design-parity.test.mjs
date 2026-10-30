import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

import { COLS, COLMAP, CHAR_COL, HEROES, ITEMS, MODES } from '../src/design/catalog.js';
import { bestMatch, cap, parseAction, parseHero, sing } from '../src/design/parse.js';
import { COL_WORDS, optionsFor, questionFor, STEMS, WHY } from '../src/design/options.js';

const source = readFileSync(new URL('../baseline/source/Tinker 550.html', import.meta.url), 'utf8');
const start = source.indexOf('/* ---------- design vocabulary ---------- */');
const end = source.indexOf('/* robot avatar:', start);
assert.ok(start >= 0 && end > start, 'original design vocabulary is available');

let currentContext;
const sandbox = { ctx: () => currentContext };
runInNewContext(`${source.slice(start, end)}\nglobalThis.reference = { COLS, COLMAP, CHAR_COL, HEROES, ITEMS, MODES, bestMatch, parseHero, parseAction, sing, cap, optionsFor, questionFor, WHY, STEMS, COL_WORDS };`, sandbox);
const original = sandbox.reference;
const same = (actual, expected) => assert.equal(JSON.stringify(actual), JSON.stringify(expected));

test('design catalog retains every label, keyword, and suggestion', () => {
  for (const key of ['COLS', 'COLMAP', 'CHAR_COL', 'HEROES', 'ITEMS', 'WHY', 'COL_WORDS']) {
    same({ COLS, COLMAP, CHAR_COL, HEROES, ITEMS, WHY, COL_WORDS }[key], original[key]);
  }
  for (const mode of Object.keys(MODES)) {
    same(MODES[mode].k, original.MODES[mode].k);
    same(MODES[mode].def, original.MODES[mode].def);
    for (const item of ['stars', 'cacti', 'fish']) {
      assert.equal(MODES[mode].obj(item), original.MODES[mode].obj(item));
    }
  }
});

test('character and action inputs parse exactly as in the original', () => {
  for (const input of ['a cat', 'my robot', '鱼', 'scatter', 'a 兔子', 'an octopus', 'mystery creature', 'a cat robot', '']) {
    same(parseHero(input), original.parseHero(input));
  }
  for (const input of ['catching stars', 'dodging meteors', 'jumping over cacti', 'popping balloons', 'finding gems in the sea', '吃苹果', 'swimming fish', 'shoot balloons', '']) {
    same(parseAction(input), original.parseAction(input));
  }
  for (const input of ['cacti', 'fish', 'boxes', 'stars']) assert.equal(sing(input), original.sing(input));
  for (const input of ['a cat', 'finding gems']) assert.equal(cap(input), original.cap(input));
});

test('all mode and design-column choices match the original', () => {
  const columns = COLS.map(({ key }) => key);
  for (const [mode, action] of Object.entries({ catch: 'catching stars', dodge: 'dodging meteors', jump: 'jumping over cacti', shoot: 'popping balloons', roam: 'finding gems' })) {
    const context = { hero: parseHero('a cat'), ...parseAction(action) };
    assert.equal(context.mode, mode);
    currentContext = context;
    for (const column of columns) {
      const choices = optionsFor(column, context);
      same(choices, original.optionsFor(column, context));
      assert.equal(questionFor(column, context), original.questionFor(column, context));
      assert.equal(STEMS[column](context), original.STEMS[column](context));
      for (const choice of choices) {
        same(bestMatch(choice.t, choices, context), original.bestMatch(choice.t, choices));
      }
      same(bestMatch('an idea the prototype cannot build', choices, context), original.bestMatch('an idea the prototype cannot build', choices));
    }
  }
});
