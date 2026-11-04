import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createProject } from '../src/state/project.js';
import {
  ensureStickerNode,
  linkMechanisms,
  mechanismFlow,
  removeStickerNode,
  setStickerNodeStatus,
  syncStickerNodes,
  unlinkMechanisms,
} from '../src/state/design-map.js';

function projectWith(...stickers) {
  const project = createProject('Robo');
  for (const sticker of stickers) {
    project.stickers.push({ status: 'ok', ...sticker });
    ensureStickerNode(project, project.stickers.at(-1));
  }
  return project;
}

test('game notes stay linked when confirmed, built, renamed, and removed', () => {
  const project = createProject('Robo');
  const sticker = { id: 'step-1', col: 'rules', text: 'Touch star to score', status: 'new' };
  project.stickers.push(sticker);
  const node = ensureStickerNode(project, sticker);
  sticker.status = 'ok';
  setStickerNodeStatus(project, sticker.id, 'confirmed');
  sticker.id = 'step-2';
  sticker.text = 'Touch gem to score';
  ensureStickerNode(project, sticker, 'step-1');

  assert.equal(project.designMap.nodes.length, 1);
  assert.equal(project.designMap.nodes[0].id, node.id);
  assert.equal(project.designMap.nodes[0].stickerId, 'step-2');
  assert.equal(project.designMap.nodes[0].title, 'Touch gem to score');
  project.lastBuilt.push('step-2');
  syncStickerNodes(project);
  assert.equal(project.designMap.nodes[0].status, 'built');
  removeStickerNode(project, 'step-2');
  assert.equal(project.designMap.nodes.length, 0);
});

test('mechanisms link only inside one element, never to themselves, twice, or in a circle', () => {
  const project = projectWith(
    { id: 'bombs', col: 'conflict', text: 'bombs fall from the sky' },
    { id: 'faster', col: 'conflict', text: 'the stars come faster and faster' },
    { id: 'shake', col: 'conflict', text: 'the screen shakes' },
    { id: 'lives', col: 'resources', text: '3 lives' },
  );
  assert.equal(linkMechanisms(project, 'bombs', 'bombs'), 'self');
  assert.equal(linkMechanisms(project, 'bombs', 'lives'), 'other-element');
  assert.equal(linkMechanisms(project, 'bombs', 'ghost'), 'missing');
  assert.equal(linkMechanisms(project, 'bombs', 'faster'), 'linked');
  assert.equal(linkMechanisms(project, 'faster', 'bombs'), 'duplicate');
  assert.equal(linkMechanisms(project, 'faster', 'shake'), 'linked');
  assert.equal(linkMechanisms(project, 'shake', 'bombs'), 'loop');
  assert.equal(project.designMap.edges.length, 2);
});

test('an element lays out its chains left to right and keeps independent mechanisms apart', () => {
  const project = projectWith(
    { id: 'bombs', col: 'conflict', text: 'bombs fall from the sky' },
    { id: 'faster', col: 'conflict', text: 'the stars come faster and faster' },
    { id: 'shake', col: 'conflict', text: 'the screen shakes' },
    { id: 'wind', col: 'conflict', text: 'wind pushes the cat' },
  );
  linkMechanisms(project, 'bombs', 'faster');
  linkMechanisms(project, 'bombs', 'shake');
  const flow = mechanismFlow(project, 'conflict');

  assert.deepEqual(flow.mechanisms.map(sticker => sticker.id), ['bombs', 'faster', 'shake', 'wind']);
  assert.deepEqual(flow.solo.map(sticker => sticker.id), ['wind']);
  assert.equal(flow.chains.length, 1);
  const [chain] = flow.chains;
  assert.deepEqual(chain.nodes.map(({ sticker, column, row }) => [sticker.id, column, row]), [['bombs', 0, 0], ['faster', 1, 0], ['shake', 1, 1]]);
  assert.deepEqual({ columns: chain.columns, rows: chain.rows }, { columns: 2, rows: 2 });
  assert.deepEqual(chain.edges.map(({ from, to }) => [from, to]), [['bombs', 'faster'], ['bombs', 'shake']]);
  assert.deepEqual(mechanismFlow(project, 'rules'), { mechanisms: [], chains: [], solo: [] });
});

test('links follow a rewritten mechanism and disappear when it is removed or unlinked', () => {
  const project = projectWith(
    { id: 'bombs', col: 'conflict', text: 'bombs fall from the sky' },
    { id: 'faster', col: 'conflict', text: 'the stars come faster' },
  );
  linkMechanisms(project, 'bombs', 'faster');
  const rewritten = project.stickers[1];
  rewritten.id = 'faster-2';
  rewritten.text = 'the stars come much faster';
  ensureStickerNode(project, rewritten, 'faster');
  assert.deepEqual(mechanismFlow(project, 'conflict').chains[0].edges.map(({ from, to }) => [from, to]), [['bombs', 'faster-2']]);

  const snapshot = structuredClone(project.designMap);
  assert.equal(unlinkMechanisms(project, project.designMap.edges[0].id), true);
  assert.equal(mechanismFlow(project, 'conflict').chains.length, 0);
  project.designMap = snapshot;
  assert.equal(mechanismFlow(project, 'conflict').chains.length, 1);

  project.stickers.splice(0, 1);
  removeStickerNode(project, 'bombs');
  assert.equal(project.designMap.edges.length, 0);
  assert.deepEqual(mechanismFlow(project, 'conflict').solo.map(sticker => sticker.id), ['faster-2']);
});
