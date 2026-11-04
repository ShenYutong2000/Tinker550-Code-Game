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

/* a stand-in page: just enough DOM for the conversation to run without a browser */
async function withConversation(run) {
  const state = { project: createProject('Robo') };
  const UI = createUIState(1440);
  const elements = new Map();
  for (const selector of ['#inWho', '#inDo', '#composer', '#msgs', '.composer']) {
    elements.set(selector, {
      value: '', style: {}, scrollHeight: 20,
      classList: { add() {}, remove() {} },
      appendChild() {}, focus() {}, setSelectionRange() {},
    });
  }
  const originalDocument = globalThis.document;
  const originalInnerWidth = globalThis.innerWidth;
  globalThis.innerWidth = 1440;
  globalThis.document = {
    querySelector: selector => elements.get(selector) || null,
    querySelectorAll: () => [],
  };
  const renderer = {
    msgNode: message => message,
    scrollDown() {}, showTyping() {}, renderLive() {}, showAsk() {},
  };
  const loadedSpecs = [];
  const game = { load(spec) { loadedSpecs.push(spec); }, clear() {} };
  const noop = () => {};
  try {
    const flow = createConversation({
      getProject: () => state.project, UI, renderer, render: noop, renderBoard: noop,
      renderPane: noop, renderTabs: noop, getBoardEl: () => null,
      autosave: noop, game, botName: () => state.project.botName, sheet: noop, reduced: true,
    });
    await run({ flow, UI, elements, loadedSpecs, state });
  } finally {
    globalThis.document = originalDocument;
    if(originalInnerWidth===undefined)delete globalThis.innerWidth;else globalThis.innerWidth=originalInnerWidth;
  }
}

test('a child can create and revise a game through two versions', () => withConversation(async ({ flow, UI, elements, loadedSpecs, state }) => {
    let project = state.project;
    elements.get('#inWho').value = 'a cat';
    elements.get('#inDo').value = 'catching stars';
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
    assert.equal(loadedSpecs.length, 1);
    assert.equal(project.versions[0].journal.steps.length, 2);

    await waitFor(() => !flow.isPumping());
    project.seen.push('iterate', 'star');
    elements.get('#composer').value = 'nothing happened';
    flow.send();
    await waitFor(() => !flow.isPumping());
    assert.equal(project.versions[0].assessment.response, 'nothing happened');
    assert.equal(project.versions[0].assessment.alignment, 'different');
    assert.equal(project.phase, 'directions');

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
    assert.equal(loadedSpecs.length, 2);
    assert.equal(project.phase, 'playtest');

    await waitFor(() => !flow.isPumping());
    flow.say('old project message');
    const nextProject = createProject('Robo');
    state.project = nextProject;
    flow.resetProject(nextProject);
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.deepEqual(nextProject.chat, []);
    assert.equal(flow.isPumping(), false);
}));

test('a description is broken into notes across elements, asking only for what is missing', () => withConversation(async ({ flow, UI, elements, state }) => {
  const project = state.project;
  flow.describe('My hero is a penguin. When bombs fall, the fish come faster. You have 3 lives. The sky is purple.');
  assert.equal(project.stickers.length, 0);
  assert.equal(UI.idea.who, 'penguin');
  assert.equal(UI.idea.act, null);

  elements.get('#inWho').value = UI.idea.who;
  elements.get('#inDo').value = 'catching fish';
  flow.doOpening();
  assert.equal(UI.idea, null);
  assert.deepEqual(project.stickers.map(sticker => [sticker.col, sticker.status]), [
    ['character', 'new'], ['objectives', 'new'], ['conflict', 'new'], ['conflict', 'new'], ['resources', 'new'],
  ]);
  assert.deepEqual(project.stickers[0].effect, { char: { e: '🐧', n: 'penguin' } });
  assert.deepEqual(project.stickers[4].effect, { lives: 3 });
  assert.equal(project.designMap.edges.length, 1);
  assert.equal(project.phase, 'confirm');

  await waitFor(() => !flow.isPumping());
  const said = project.chat.map(message => message.html).join('\n');
  assert.match(said, /5 mechanisms<\/b> across 4 elements: <b>CHARACTERS<\/b>, <b>OBJECTIVES<\/b>, <b>RESOURCES<\/b>, <b>CONFLICT<\/b>/);
  assert.match(said, /linked 1 “when → then” pair/);
  assert.match(said, /“The sky is purple”/);

  project.stickers.forEach(sticker => flow.confirmSticker(sticker.id));
  flow.generate();
  UI.gen.done = true;
  UI.gen.guess = 'the penguin catches fish';
  flow.finishGen();
  assert.equal(project.versions[0].spec.lives, 3);
  assert.equal(project.versions[0].spec.hazard, '💣');
  await waitFor(() => !flow.isPumping());
  state.project = createProject('Robo');
  flow.resetProject(state.project);
  await new Promise(resolve => setTimeout(resolve, 300));
}));
