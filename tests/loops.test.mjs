import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildDraft } from '../src/design/draft.js';
import { runProgram, writeProgram } from '../src/game/program.js';
import { connectNotes, ensureStickerNode, LINK_LABELS, LOGIC_STICKERS, removeStickerNode } from '../src/state/design-map.js';
import { addLoop, addToLoop, ensureLoops, loopLinks, projectLoops, removeFromLoop, removeLoop, renameLoop, setLoops, suggestLoops } from '../src/state/loops.js';
import { createProject, pendingChanges, restoreProject } from '../src/state/project.js';

function draftProject(act = 'collecting stars', feel = 'challenged') {
  const project = createProject('Robo'), draft = buildDraft({ who: 'a cat', act, feel });
  const made = draft.notes.map((note, i) => { const s = { id: 'n' + i, status: 'ok', ...note }; project.stickers.push(s); ensureStickerNode(project, s); return s; });
  project.activeChar = 'n0';
  for (const [from, to, label] of draft.links) connectNotes(project, made[from].id, made[to].id, label);
  setLoops(project, draft.loops.map(loop => ({ name: loop.name, notes: loop.notes.map(i => made[i].id) })));
  return project;
}
const text = (project, id) => project.stickers.find(s => s.id === id).text;

test('the first draft groups its notes into action loops, in the order a player goes around them', () => {
  const project = draftProject();
  const loops = projectLoops(project);
  assert.deepEqual(loops.map(loop => loop.name), ['Core loop: play and score', 'Challenge loop: danger and lives', 'Ending loop: how it ends']);
  const challenge = loops[1].notes.map(id => text(project, id));
  assert.deepEqual(challenge, ['bombs fall from the sky', '🐱 cat', 'if the cat touches a bomb, it loses 1 life', '3 lives, lose 1 when hit']);
  assert.ok(loopLinks(project, loops[1]).some(link => link.label === 'then'), 'the loop shows the logic between its notes');
  for (const feel of ['excited', 'relaxed', 'curious', 'surprised', null])
    for (const act of ['collecting stars', 'dodging meteors', 'jumping over obstacles', 'popping balloons', 'exploring a mysterious world']) {
      const draft = buildDraft({ who: 'a cat', act, feel });
      assert.ok(draft.loops.length >= 2, `${feel} / ${act}`);
      assert.ok(draft.loops.every(loop => loop.notes.length >= 2 && new Set(loop.notes).size === loop.notes.length));
    }
  /* a dodging game has no bombs, but the meteors themselves are the danger */
  assert.ok(buildDraft({ who: 'a cat', act: 'dodging meteors', feel: 'challenged' }).loops.some(loop => loop.name.startsWith('Challenge')));
  assert.equal(suggestLoops([]).length, 0);
});

test('kids add, rename and remove loops, and add or take out notes without touching the map', () => {
  const project = draftProject(), before = project.stickers.length;
  const loop = addLoop(project);
  assert.equal(loop.name, 'New loop');
  assert.equal(renameLoop(project, loop.id, '  Power-up loop '), true);
  assert.equal(renameLoop(project, loop.id, '   '), false);
  assert.equal(loop.name, 'Power-up loop');
  assert.equal(addToLoop(project, loop.id, 'n1'), true);
  assert.equal(addToLoop(project, loop.id, 'n1'), false, 'a note is in a loop once');
  assert.equal(addToLoop(project, loop.id, 'ghost'), false);
  assert.equal(removeFromLoop(project, loop.id, 'n1'), true);
  assert.equal(project.stickers.length, before, 'taking a note out of a loop keeps it on the map');
  assert.equal(removeLoop(project, loop.id), true);
  assert.equal(projectLoops(project).length, 3);
  assert.equal(pendingChanges({ ...project, lastBuilt: project.stickers.map(s => s.id) }), 0, 'loops alone never change the game');
});

test('loops follow the map: rewritten notes keep their place, removed notes leave every loop', () => {
  const project = draftProject(), core = projectLoops(project)[0], id = core.notes[1];
  const sticker = project.stickers.find(s => s.id === id);
  sticker.id = 'rewritten';
  ensureStickerNode(project, sticker, id);
  assert.equal(core.notes[1], 'rewritten');
  removeStickerNode(project, 'n0');
  assert.ok(projectLoops(project).every(loop => !loop.notes.includes('n0')));
});

test('older saves get suggested loops when they load', () => {
  const project = draftProject();
  delete project.designMap.loops;
  const restored = restoreProject(JSON.parse(JSON.stringify(project)), 'Robo');
  assert.equal(projectLoops(restored).length, 3);
  assert.equal(ensureLoops(restored), restored.designMap.loops, 'loops already there stay as they are');
});

test('the logic sticker library: "if → then", "ends when" and "every" run; the others stay design ideas', () => {
  assert.deepEqual(LOGIC_STICKERS.filter(s => s.runs).map(s => s.k), ['then', 'ends', 'every']);
  assert.equal(Object.keys(LINK_LABELS).length, LOGIC_STICKERS.length);
  const project = draftProject();
  const find = test => project.stickers.find(test).id;
  project.stickers.push({ id: 'fast', col: 'conflict', text: 'the stars come faster and faster', effect: { speedUp: true }, status: 'ok' });
  ensureStickerNode(project, project.stickers.at(-1));
  connectNotes(project, find(s => s.col === 'character'), 'fast', 'every');
  connectNotes(project, find(s => s.col === 'boundaries'), find(s => s.col === 'players'), 'unless');
  const program = writeProgram(project);
  assert.ok(program.lines.includes('when("every 5 seconds", then.goFaster());'));
  assert.ok(program.lines.some(line => line.includes('a design idea (“unless”)')));
  assert.deepEqual(runProgram(program.source).rules, [{ when: 'tick', do: [{ act: 'goFaster' }] }]);
  /* each kind can be used again and again: the library never runs out */
  connectNotes(project, find(s => s.col === 'outcome'), find(s => s.col === 'players'), 'unless');
  assert.equal(writeProgram(project).rules.filter(r => r.kind === 'design').length, 2);
});
