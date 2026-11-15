import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createProject, pendingChanges } from '../src/state/project.js';
import {
  connectNotes,
  ensureStickerNode,
  focusSets,
  HEAD_H,
  mapLayout,
  moveCluster,
  noteLinks,
  removeStickerNode,
  reorderNote,
  setLinkLabel,
  setStickerNodeStatus,
  syncStickerNodes,
  toggleCluster,
  unlinkNotes,
} from '../src/state/design-map.js';

function projectWith(...stickers) {
  const project = createProject('Robo');
  for (const sticker of stickers) {
    project.stickers.push({ status: 'ok', ...sticker });
    ensureStickerNode(project, project.stickers.at(-1));
  }
  return project;
}
/* the example from the design brief: bombs → lose a life → 3 lives → game over */
const bombGame = () => projectWith(
  { id: 'cat', col: 'character', text: '🐱 cat' },
  { id: 'bombs', col: 'conflict', text: 'bombs fall from the sky' },
  { id: 'hit', col: 'rules', text: 'if the cat touches a bomb, it loses 1 life' },
  { id: 'lives', col: 'resources', text: '3 lives' },
  { id: 'over', col: 'outcome', text: 'the game ends when all lives are lost' },
  { id: 'keys', col: 'procedures', text: 'arrow keys to move' },
);

test('game notes stay linked when confirmed, built, renamed, and removed', () => {
  const project = createProject('Robo');
  const sticker = { id: 'step-1', col: 'rules', text: 'Touch star to score', status: 'ok' };
  project.stickers.push(sticker);
  const node = ensureStickerNode(project, sticker);
  setStickerNodeStatus(project, sticker.id, 'confirmed');
  sticker.id = 'step-2';
  sticker.text = 'Touch gem to score';
  ensureStickerNode(project, sticker, 'step-1');

  assert.equal(project.designMap.nodes.length, 1);
  assert.equal(project.designMap.nodes[0].id, node.id);
  assert.equal(project.designMap.nodes[0].title, 'Touch gem to score');
  project.lastBuilt.push('step-2');
  syncStickerNodes(project);
  assert.equal(project.designMap.nodes[0].status, 'built');
  removeStickerNode(project, 'step-2');
  assert.equal(project.designMap.nodes.length, 0);
});

test('notes connect across elements with a label, never to themselves or twice', () => {
  const project = bombGame();
  assert.equal(connectNotes(project, 'bombs', 'bombs').result, 'self');
  assert.equal(connectNotes(project, 'bombs', 'ghost').result, 'missing');
  assert.equal(connectNotes(project, 'bombs', 'hit').edge.label, 'then');
  assert.equal(connectNotes(project, 'hit', 'lives').edge.label, 'uses');
  assert.equal(connectNotes(project, 'lives', 'over').edge.label, 'ends');
  assert.equal(connectNotes(project, 'keys', 'cat').edge.label, 'controls');
  assert.equal(connectNotes(project, 'over', 'lives').result, 'duplicate');
  const { edge } = connectNotes(project, 'over', 'bombs', 'uses');
  assert.equal(edge.label, 'uses');
  assert.equal(setLinkLabel(project, edge.id, 'then'), true);
  assert.equal(setLinkLabel(project, edge.id, 'teleports'), false);
  assert.equal(noteLinks(project).find(link => link.id === edge.id).label, 'then');
  assert.equal(unlinkNotes(project, edge.id), true);
  assert.equal(noteLinks(project).length, 4);
});

test('links saved before labels existed read as "if → then"', () => {
  const project = bombGame();
  project.designMap.edges.push({ id: 'old', from: 'card-bombs', to: 'card-hit' });
  assert.deepEqual(noteLinks(project), [{ id: 'old', from: 'bombs', to: 'hit', label: 'then' }]);
});

test('focusing a note lights its direct links and the chain of notes it affects', () => {
  const project = bombGame();
  for (const [from, to] of [['bombs', 'hit'], ['hit', 'lives'], ['lives', 'over'], ['keys', 'cat']]) connectNotes(project, from, to);
  const sets = focusSets(project, { note: 'bombs' });
  assert.deepEqual([...sets.self], ['bombs']);
  assert.deepEqual([...sets.direct], ['hit']);
  assert.deepEqual([...sets.affected].sort(), ['hit', 'lives', 'over']);
  assert.equal(sets.edges.size, 1);
  assert.equal(sets.ripple.size, 2);
  assert.equal(['cat', 'keys'].some(id => sets.direct.has(id) || sets.affected.has(id)), false);
  const element = focusSets(project, { col: 'resources' });
  assert.deepEqual([...element.self], ['lives']);
  assert.deepEqual([...element.direct].sort(), ['hit', 'over']);
});

test('the canvas lays out nine clusters with notes stacked inside, and remembers moves', () => {
  const project = bombGame();
  project.stickers.push({ id: 'hit2', col: 'rules', text: 'touch a star: +1 point', status: 'ok' });
  const layout = mapLayout(project);
  assert.equal(Object.keys(layout.clusters).length, 9);
  assert.deepEqual(Object.keys(layout.clusters).slice(0, 3), ['character', 'players', 'objectives']);
  const rules = layout.clusters.rules;
  assert.equal(layout.notes.hit.y, rules.y + HEAD_H);
  assert.ok(layout.notes.hit2.y > layout.notes.hit.y);
  assert.ok(layout.notes.hit.x > rules.x && layout.notes.hit.x + layout.notes.hit.w < rules.x + rules.w);

  moveCluster(project, 'rules', 900.4, -20);
  assert.deepEqual({ x: mapLayout(project).clusters.rules.x, y: mapLayout(project).clusters.rules.y }, { x: 900, y: 0 });
  toggleCluster(project, 'rules');
  const folded = mapLayout(project);
  assert.equal(folded.clusters.rules.h, HEAD_H);
  assert.equal(folded.notes.hit.hidden, true);
  assert.deepEqual(project.designMap.clusters.rules, { x: 900, y: 0, collapsed: true });
});

test('notes reorder inside their own element only', () => {
  const project = bombGame();
  project.stickers.push({ id: 'hit2', col: 'rules', text: 'touch a star: +1 point', status: 'ok' });
  reorderNote(project, 'hit2', 0);
  assert.deepEqual(project.stickers.filter(s => s.col === 'rules').map(s => s.id), ['hit2', 'hit']);
  assert.deepEqual(project.stickers.filter(s => s.col !== 'rules').map(s => s.id), ['cat', 'bombs', 'lives', 'over', 'keys']);
});

test('pending changes count new, rewritten and removed notes once each', () => {
  const project = bombGame();
  project.lastBuilt = project.stickers.map(s => s.id);
  assert.equal(pendingChanges(project), 0);
  project.stickers.find(s => s.id === 'bombs').id = 'bombs-2';
  project.stickers.find(s => s.id === 'bombs-2').replaces = 'bombs';
  assert.equal(pendingChanges(project), 1);
  project.stickers = project.stickers.filter(s => s.id !== 'keys');
  project.stickers.push({ id: 'ghost', col: 'conflict', text: 'a ghost chases you', status: 'ok' });
  assert.equal(pendingChanges(project), 3);
});
