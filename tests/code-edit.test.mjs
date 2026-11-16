import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildDraft } from '../src/design/draft.js';
import { runProgram, writeProgram } from '../src/game/program.js';
import { setCodeValue } from '../src/state/code-edit.js';
import { connectNotes, ensureStickerNode } from '../src/state/design-map.js';
import { createProject, pendingChanges } from '../src/state/project.js';
import { blockParts } from '../src/ui/blocks.js';

/* a first draft that is already playing, as it is right after onboarding */
function builtGame(act = 'collecting stars', feel = 'challenged') {
  const project = createProject('Robo'), draft = buildDraft({ who: 'a cat', act, feel });
  const made = draft.notes.map((note, i) => { const s = { id: 'n' + i, status: 'ok', ...note }; project.stickers.push(s); ensureStickerNode(project, s); return s; });
  project.activeChar = 'n0';
  for (const [from, to, label] of draft.links) connectNotes(project, made[from].id, made[to].id, label);
  project.lastBuilt = project.stickers.map(s => s.id);
  const program = writeProgram(project).source;
  project.versions = [{ n: 1, program, spec: runProgram(program), items: [], summary: 'first draft', journal: { steps: [] }, snapshot: JSON.parse(JSON.stringify({ stickers: project.stickers, activeChar: project.activeChar, lastBuilt: project.lastBuilt, designMap: project.designMap })) }];
  return project;
}
const find = (project, test) => project.stickers.find(test);
const ctx = { hero: { e: '🐱', n: 'cat' }, item: { e: '⭐', n: 'stars' }, mode: 'catch' };

test('the program shows the engine numbers a child can tune, as blocks with slots', () => {
  const project = builtGame();
  const program = writeProgram(project);
  assert.ok(program.lines.includes('game.itemSpeed(90);'));
  assert.ok(program.lines.includes('game.itemEvery(0.95);'));
  assert.ok(program.lines.includes('game.heroSpeed(1);'), 'hero speed sits with the controls');
  const speed = program.blocks.find(b => b.call === 'itemSpeed');
  assert.equal(speed.col, 'objectives');
  assert.equal(program.lines[speed.line], 'game.itemSpeed(90);');
  const parts = blockParts(speed, ctx, () => true);
  assert.deepEqual(parts.map(p => p.t || p.v || p.slot.key), ['⭐ stars', ' fall at speed ', 'itemSpeed']);
  const bombs = program.blocks.filter(b => b.kind === 'call' && b.note === find(project, s => s.effect && s.effect.hazard).id).map(b => b.call);
  assert.deepEqual(bombs, ['drop', 'dropSpeed', 'dropEvery']);
  const lives = program.blocks.find(b => b.call === 'lives');
  assert.deepEqual(blockParts(lives, ctx, () => false).map(p => p.t || p.v), ['start with ', '3', ' lives ❤️']);
});

test('changing the star speed in a block plays right away, without a new build', () => {
  const project = builtGame();
  const action = find(project, s => s.effect && s.effect.mode);
  const r = setCodeValue(project, action.id, 'itemSpeed', '150');
  assert.equal(r.ok, true);
  assert.equal(r.live, true);
  assert.equal(r.spec.itemSpeed, 150);
  assert.equal(action.effect.itemSpeed, 150);
  assert.equal(action.by, 'kid');
  assert.equal(project.versions.length, 2, 'code changes get their own version, so Undo can take them back');
  assert.match(project.versions[1].program, /game\.itemSpeed\(150\);/);
  assert.equal(pendingChanges(project), 0);
  setCodeValue(project, action.id, 'itemEvery', '0.5');
  assert.equal(project.versions.length, 2, 'more code changes join the same version');
  assert.equal(project.versions[1].spec.itemEvery, 0.5);
  assert.equal(project.versions[1].journal.steps.length, 2);
});

test('a number in the words of a note changes with it, and limits keep it playable', () => {
  const project = builtGame();
  const lives = find(project, s => s.effect && s.effect.lives);
  assert.equal(setCodeValue(project, lives.id, 'lives', '5').ok, true);
  assert.match(lives.text, /^5 lives/);
  assert.equal(project.designMap.nodes.find(n => n.stickerId === lives.id).title, lives.text);
  setCodeValue(project, lives.id, 'lives', '500');
  assert.equal(lives.effect.lives, 20);
  assert.equal(setCodeValue(project, lives.id, 'lives', 'lots').ok, false);
  assert.equal(setCodeValue(project, lives.id, 'lives', '20').same, true);
  assert.equal(setCodeValue(project, lives.id, 'mode', 'dodge').ok, false, 'only slots a block shows can change');
});

test('a choice becomes the matching suggestion, keeping the numbers already tuned', () => {
  const project = builtGame();
  const rule = find(project, s => s.effect && s.effect.onCatch);
  assert.equal(setCodeValue(project, rule.id, 'onCatch', 'grow').ok, true);
  assert.deepEqual(rule.effect, { onCatch: 'grow' });
  assert.match(rule.text, /grows and glows/);
  assert.equal(setCodeValue(project, rule.id, 'onCatch', 'teleport').ok, false);
  const controls = find(project, s => s.col === 'procedures');
  setCodeValue(project, controls.id, 'speed', '2');
  setCodeValue(project, controls.id, 'control', 'mouse');
  assert.deepEqual(controls.effect, { speed: 2, control: 'mouse' });
});

test('a note not in the game yet keeps the change for the next build', () => {
  const project = builtGame();
  project.stickers.push({ id: 'ghost', col: 'conflict', text: 'a little ghost chases the cat', effect: { enemy: '👻' }, status: 'ok' });
  ensureStickerNode(project, project.stickers.at(-1));
  const r = setCodeValue(project, 'ghost', 'chaserSpeed', '100');
  assert.deepEqual([r.ok, r.live], [true, false]);
  assert.equal(project.versions.length, 1);
  assert.ok(writeProgram(project).lines.includes('game.chaserSpeed(100);'));
});
