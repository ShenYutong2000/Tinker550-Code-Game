import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, createUIState, pendingChanges } from '../src/state/project.js';
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

test('the three answers become a playable first draft that the child then changes on the map', () => withConversation(async ({ flow, UI, elements, loadedSpecs, state }) => {
    const project = state.project;
    elements.get('#inWho').value = 'a cat';
    elements.get('#inDo').value = 'catching stars';
    UI.feel = 'challenged';
    flow.doOpening();
    assert.equal(new Set(project.stickers.map(sticker => sticker.col)).size, 9);
    assert.ok(project.stickers.every(sticker => sticker.status === 'ok'));
    assert.equal(project.designMap.edges.length, 6);
    /* the first draft is built straight away, without the guessing quiz */
    assert.equal(project.versions.length, 1);
    assert.equal(loadedSpecs.length, 1);
    assert.equal(project.phase, 'playtest');
    assert.equal(project.prediction, null);
    assert.equal(pendingChanges(project), 0);
    assert.equal(project.versions[0].spec.lives, 3);
    assert.equal(project.versions[0].spec.hazard, '💣');
    assert.equal(project.name, 'Cat: Catching Stars');

    await waitFor(() => !flow.isPumping());
    assert.match(project.chat.map(message => message.html).join('\n'), /first draft[\s\S]*You're the designer!/);
    project.seen.push('iterate', 'star');
    elements.get('#composer').value = 'it was too hard';
    flow.send();
    await waitFor(() => !flow.isPumping());
    assert.equal(project.versions[0].assessment.response, 'it was too hard');
    assert.equal(project.phase, 'directions');

    /* direct edits on the map: add one note, remove a draft note */
    const ghost = flow.addNote('conflict', 'a little ghost chases the cat');
    assert.deepEqual(ghost.effect, { enemy: '👻' });
    assert.equal(ghost.by, 'kid');
    flow.delSticker(project.stickers.find(sticker => sticker.effect && sticker.effect.hazard).id);
    assert.equal(pendingChanges(project), 2);
    /* and one through the chat suggestions */
    UI.sel = flow.directions()[0].col;
    flow.pickGo();
    assert.equal(project.phase, 'choice');
    flow.pickOption(0);
    assert.equal(project.phase, 'confirm');
    assert.equal(pendingChanges(project), 3);

    flow.generate();
    assert.ok(UI.gen);
    UI.gen.done = true;
    UI.gen.guess = 'it gets harder';
    flow.finishGen();
    assert.equal(project.versions.length, 2);
    assert.equal(project.versions[1].spec.enemy, '👻');
    assert.equal(project.versions[1].spec.hazard, undefined);
    assert.equal(pendingChanges(project), 0);
    assert.equal(project.prediction.guess, 'it gets harder');
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

test('a description fills the draft in the child\'s own words, asking only for what is missing', () => withConversation(async ({ flow, UI, elements, state }) => {
  const project = state.project;
  flow.describe('My hero is a penguin. When bombs fall, the fish come faster. You have 3 lives. The sky is purple.');
  assert.equal(project.stickers.length, 0);
  assert.equal(UI.idea.who, 'penguin');
  assert.equal(UI.idea.act, null);

  elements.get('#inWho').value = UI.idea.who;
  elements.get('#inDo').value = 'catching fish';
  flow.doOpening();
  assert.equal(UI.idea, null);
  const own = project.stickers.filter(sticker => sticker.by === 'kid');
  assert.deepEqual(own.map(sticker => sticker.col), ['character', 'objectives', 'conflict', 'conflict', 'resources']);
  assert.deepEqual(own[0].effect, { char: { e: '🐧', n: 'penguin' } });
  assert.equal(new Set(project.stickers.map(sticker => sticker.col)).size, 9);
  assert.equal(project.versions[0].spec.lives, 3);
  assert.equal(project.versions[0].spec.hazard, '💣');

  await waitFor(() => !flow.isPumping());
  const said = project.chat.map(message => message.html).join('\n');
  assert.match(said, /on all nine elements/);
  assert.match(said, /“The sky is purple”/);
  state.project = createProject('Robo');
  flow.resetProject(state.project);
  await new Promise(resolve => setTimeout(resolve, 300));
}));
