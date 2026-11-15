import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COLS } from '../src/design/catalog.js';
import { analyzeDescription } from '../src/design/analyze.js';
import { buildDraft } from '../src/design/draft.js';

const cols = draft => new Set(draft.notes.map(note => note.col));
const linked = (draft, from, to) => draft.links.some(([a, b]) => draft.notes[a].text.includes(from) && draft.notes[b].text.includes(to));

test('every feeling fills all nine elements with notes the game can build', () => {
  for (const feel of ['excited', 'challenged', 'curious', 'relaxed', 'surprised', null]) {
    for (const act of ['collecting stars', 'dodging meteors', 'jumping over obstacles', 'popping balloons', 'exploring a mysterious world']) {
      const draft = buildDraft({ who: 'a cat', act, feel });
      assert.equal(cols(draft).size, COLS.length, `${feel} / ${act}`);
      assert.ok(draft.notes.every(note => note.effect), `${feel} / ${act} has an unbuildable default`);
      /* two notes may not set the same game setting, or one would silently override the other */
      const keys = draft.notes.flatMap(note => Object.keys(note.effect).filter(key => key !== 'char'));
      assert.equal(keys.length, new Set(keys).size, `${feel} / ${act} sets ${keys} twice`);
    }
  }
});

test('a challenging draft shows the chain from danger to game over', () => {
  const draft = buildDraft({ who: 'a cat', act: 'catching stars', feel: 'challenged' });
  assert.deepEqual(draft.notes.slice(0, 2).map(note => [note.col, note.by]), [['character', 'kid'], ['objectives', 'kid']]);
  assert.ok(draft.notes.slice(2).every(note => note.by === 'ai'));
  const hit = draft.notes.find(note => note.col === 'rules' && /loses 1 life/.test(note.text));
  assert.equal(hit.text, 'if the cat touches a bomb, it loses 1 life');
  assert.ok(linked(draft, 'bombs fall', 'loses 1 life'));
  assert.ok(linked(draft, 'loses 1 life', '3 lives'));
  assert.ok(linked(draft, '3 lives', 'show the score'));
  assert.ok(linked(draft, 'arrow keys', 'cat'));
  assert.deepEqual(draft.links.map(link => link[2]).sort(), ['controls', 'ends', 'then', 'then', 'uses', 'uses']);
});

test("the child's own description wins over the defaults for the same element", () => {
  const idea = analyzeDescription('When bombs fall, the stars come faster. You have 3 lives. The sky is purple.');
  const draft = buildDraft({ who: 'a cat', act: 'catching stars', feel: 'relaxed', idea });
  const own = draft.notes.filter(note => note.by === 'kid').map(note => note.text);
  assert.deepEqual(own, ['🐱 cat', '“catching stars”', 'When bombs fall', 'the stars come faster', 'You have 3 lives']);
  assert.equal(draft.notes.filter(note => note.col === 'conflict').length, 2);
  assert.equal(draft.notes.filter(note => note.col === 'resources').length, 1);
  assert.ok(linked(draft, 'When bombs fall', 'the stars come faster'));
  assert.deepEqual(draft.unsorted, ['The sky is purple']);
});
