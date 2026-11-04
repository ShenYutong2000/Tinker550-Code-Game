import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createProject } from '../src/state/project.js';
import {
  connectMapNodes,
  createIdeaNode,
  deleteIdeaNode,
  ensureStickerNode,
  MAP_HEIGHT,
  MAP_NOTE_WIDTH,
  MAP_WIDTH,
  moveMapNode,
  removeStickerNode,
  setStickerNodeStatus,
  syncStickerNodes,
  updateIdeaTitle,
} from '../src/state/design-map.js';

test('free sticky notes support editing, positioning, links, and removal', () => {
  const project = createProject('Robo');
  const first = createIdeaNode(project, 'Find the key', 120, 130, 'mint');
  const second = createIdeaNode(project, 'Unlock the gate', 420, 160);

  assert.equal(updateIdeaTitle(project, first.id, 'Find a shiny key'), true);
  assert.equal(project.designMap.nodes[0].title, 'Find a shiny key');
  assert.equal(moveMapNode(project, first.id, MAP_WIDTH + 100, MAP_HEIGHT + 100), true);
  assert.equal(project.designMap.nodes[0].x, MAP_WIDTH - MAP_NOTE_WIDTH);
  assert.equal(project.designMap.nodes[0].y, MAP_HEIGHT - 190);
  assert.equal(connectMapNodes(project, first.id, first.id), 'self');
  assert.equal(connectMapNodes(project, first.id, second.id), 'connected');
  assert.equal(connectMapNodes(project, second.id, first.id), 'duplicate');
  assert.equal(deleteIdeaNode(project, first.id), true);
  assert.equal(project.designMap.edges.length, 0);
  assert.equal(project.designMap.nodes.length, 1);
});

test('game notes stay linked when confirmed, built, renamed, and removed', () => {
  const project = createProject('Robo');
  const sticker = { id: 'step-1', col: 'rules', text: 'Touch star to score', status: 'new' };
  project.stickers.push(sticker);
  const node = ensureStickerNode(project, sticker);
  const position = { x: node.x, y: node.y };
  sticker.status = 'ok';
  setStickerNodeStatus(project, sticker.id, 'confirmed');
  sticker.id = 'step-2';
  sticker.text = 'Touch gem to score';
  ensureStickerNode(project, sticker, 'step-1');

  assert.equal(project.designMap.nodes.length, 1);
  assert.equal(project.designMap.nodes[0].stickerId, 'step-2');
  assert.equal(project.designMap.nodes[0].title, 'Touch gem to score');
  assert.deepEqual({ x: project.designMap.nodes[0].x, y: project.designMap.nodes[0].y }, position);
  project.lastBuilt.push('step-2');
  syncStickerNodes(project);
  assert.equal(project.designMap.nodes[0].status, 'built');
  removeStickerNode(project, 'step-2');
  assert.equal(project.designMap.nodes.length, 0);
});
