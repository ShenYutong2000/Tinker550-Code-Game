import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, createUIState } from '../src/state/project.js';
import { createConversation } from '../src/conversation/flow.js';

function waitFor(predicate, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const poll = () => {
      if (predicate()) return resolve();
      if (Date.now() - start > timeout) return reject(new Error('Conversation did not settle'));
      setTimeout(poll, 20);
    };
    poll();
  });
}

test('a child can create and revise a game through two versions', async () => {
  let project = createProject('Robo');
  const UI = createUIState(1440);
  const elements = new Map();
  for (const selector of ['#inWho', '#inDo', '#composer', '#msgs', '.composer']) {
    elements.set(selector, {
      value: '', style: {}, scrollHeight: 20,
      classList: { add() {}, remove() {} },
      appendChild() {}, focus() {}, setSelectionRange() {},
    });
  }
  elements.get('#inWho').value = 'a cat';
  elements.get('#inDo').value = 'catching stars';
  const originalDocument = globalThis.document;
  globalThis.document = {
    querySelector: selector => elements.get(selector) || null,
    querySelectorAll: () => [],
  };
  const renderer = {
    msgNode: message => message,
    scrollDown() {}, showTyping() {}, renderLive() {}, showAsk() {},
  };
  const game = { load() {}, clear() {} };
  const noop = () => {};
  try {
    const flow = createConversation({
      getProject: () => project, UI, renderer, render: noop, renderBoard: noop,
      renderSide: noop, renderPane: noop, renderTabs: noop, getBoardEl: () => null,
      autosave: noop, game, botName: () => project.botName, sheet: noop, reduced: true,
    });

    flow.doOpening();
    assert.equal(project.stickers.length, 2);
    project.stickers.forEach(sticker => flow.confirmSticker(sticker.id));
    flow.generate();
    assert.ok(UI.gen);
    UI.gen.done = true;
    UI.gen.guess = 'the cat gets a point';
    flow.finishGen();
    assert.equal(project.versions.length, 1);
    assert.equal(project.phase, 'playtest');

    await waitFor(() => !flow.isPumping());
    project.seen.push('iterate', 'star');
    elements.get('#composer').value = 'nothing happened';
    flow.send();
    assert.equal(project.phase, 'directions');
    await waitFor(() => !flow.isPumping());

    UI.sel = flow.directions()[0].col;
    flow.pickGo();
    assert.equal(project.phase, 'choice');
    flow.pickOption(0);
    const newSticker = project.stickers.find(sticker => sticker.status === 'new');
    assert.ok(newSticker);
    flow.confirmSticker(newSticker.id);
    flow.generate();
    UI.gen.done = true;
    UI.gen.guess = 'the game changes';
    flow.finishGen();
    assert.equal(project.versions.length, 2);
    assert.equal(project.versions[1].n, 2);
    assert.equal(project.phase, 'playtest');

    await waitFor(() => !flow.isPumping());
    flow.say('old project message');
    const nextProject = createProject('Robo');
    project = nextProject;
    flow.resetProject(nextProject);
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.deepEqual(nextProject.chat, []);
    assert.equal(flow.isPumping(), false);
  } finally {
    globalThis.document = originalDocument;
  }
});
