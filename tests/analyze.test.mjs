import assert from 'node:assert/strict';
import { test } from 'node:test';

import { analyzeDescription, readMechanism } from '../src/design/analyze.js';

const context = { hero: { n: 'cat', e: '🐱' }, item: { n: 'stars', e: '⭐' }, mode: 'catch' };

test('a full description becomes a hero, an action, and mechanisms sorted by element', () => {
  const idea = analyzeDescription('A cat catches stars. Bombs fall from the sky and it gets faster and faster. You have 3 lives. Collect 10 stars to win!');
  assert.equal(idea.who, 'A cat');
  assert.equal(idea.act, 'catches stars');
  assert.deepEqual(idea.mechanisms.map(m => [m.col, m.text]), [
    ['conflict', 'Bombs fall from the sky'],
    ['conflict', 'it gets faster and faster'],
    ['resources', 'You have 3 lives'],
    ['objectives', 'Collect 10 stars to win'],
  ]);
  assert.deepEqual(idea.mechanisms.map(m => readMechanism(m, context).effect), [{ hazard: '💣' }, { speedUp: true }, { lives: 3 }, { target: 10 }]);
  assert.deepEqual(idea.links, []);
  assert.deepEqual(idea.unsorted, []);
});

test('the short opening sentence still reads as just who and what', () => {
  assert.deepEqual(analyzeDescription('a cat catching stars'), { who: 'a cat', act: 'catching stars', mechanisms: [], links: [], unsorted: [] });
});

test('a "when… then…" sentence links two mechanisms of the same element', () => {
  const idea = analyzeDescription('In my game, you catch stars as a cat. When bombs fall, the stars come faster. If you reach the edge you come back on the other side.');
  assert.equal(idea.who, 'cat');
  assert.equal(idea.act, 'catch stars');
  assert.deepEqual(idea.mechanisms.map(m => m.col), ['conflict', 'conflict', 'boundaries']);
  assert.deepEqual(idea.links, [[0, 1]]);
  assert.deepEqual(readMechanism(idea.mechanisms[2], context).effect, { bound: 'wrap' });
});

test('missing parts stay empty, extra characters are found, and unsorted ideas are reported', () => {
  const idea = analyzeDescription('My hero is a penguin. Every time you touch a fish you get a point. A dog helps you. The sky is purple.');
  assert.equal(idea.who, 'penguin');
  assert.equal(idea.act, null);
  assert.deepEqual(idea.mechanisms.map(m => m.col), ['rules', 'character']);
  assert.deepEqual(readMechanism(idea.mechanisms[1], context), { text: '🐶 dog', sub: 'New character', effect: { char: { e: '🐶', n: 'dog' } } });
  assert.deepEqual(idea.unsorted, ['The sky is purple']);
  const nobody = analyzeDescription('Bombs fall from the sky.');
  assert.equal(nobody.who, null);
  assert.equal(nobody.act, null);
  assert.deepEqual(readMechanism({ col: 'rules', text: 'the moon sings' }, context), { text: 'the moon sings', sub: "This prototype can't build this one yet", effect: null });
});
