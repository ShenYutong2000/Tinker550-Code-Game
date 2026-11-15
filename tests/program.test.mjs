import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { buildDraft } from '../src/design/draft.js';
import { codeFor, ENGINE_ANCHORS, runProgram, writeProgram } from '../src/game/program.js';
import { connectNotes, ensureStickerNode } from '../src/state/design-map.js';
import { buildProjectSpec, createProject, pendingChanges } from '../src/state/project.js';

const engineSource = readFileSync(new URL('../src/game/engine.js', import.meta.url), 'utf8');
function draftProject(act, feel) {
  const project = createProject('Robo'), draft = buildDraft({ who: 'a cat', act, feel });
  const made = draft.notes.map((note, i) => { const s = { id: 'n' + i, status: 'ok', ...note }; project.stickers.push(s); ensureStickerNode(project, s); return s; });
  project.activeChar = 'n0';
  for (const [from, to, label] of draft.links) connectNotes(project, made[from].id, made[to].id, label);
  return project;
}
const find = (project, test) => project.stickers.find(test).id;

test('every first draft runs as a program that makes exactly the same game as before', () => {
  for (const feel of ['excited', 'challenged', 'curious', 'relaxed', 'surprised', null]) {
    for (const act of ['collecting stars', 'dodging meteors', 'jumping over obstacles', 'popping balloons', 'exploring a mysterious world']) {
      const project = draftProject(act, feel), { hero, ...expected } = buildProjectSpec(project, false);
      const { hero: ran, ...spec } = runProgram(writeProgram(project).source);
      assert.deepEqual(spec, expected, `${feel} / ${act}`);
      assert.deepEqual(ran, { e: hero.e, n: hero.n });
    }
  }
});

test('an if → then arrow becomes a when(...) rule, and the note it switches on waits for it', () => {
  const project = draftProject('collecting stars', 'challenged');
  project.stickers.push({ id: 'fast', col: 'conflict', text: 'the stars come faster and faster', effect: { speedUp: true }, status: 'ok' });
  ensureStickerNode(project, project.stickers.at(-1));
  connectNotes(project, find(project, s => s.effect && s.effect.hazard), 'fast');
  const program = writeProgram(project);
  assert.ok(program.lines.includes('when("hero is hit", then.goFaster());'));
  assert.ok(program.lines.includes('// waits for a rule below: game.speedUpOverTime();'));
  const spec = runProgram(program.source);
  assert.deepEqual(spec.rules, [{ when: 'hit', do: [{ act: 'goFaster' }] }]);
  assert.equal(spec.speedUp, undefined);
  assert.equal(spec.hazard, '💣');
});

test('arrows the engine already follows add no rule, and arrows it cannot follow say so', () => {
  const project = draftProject('collecting stars', 'challenged');
  const kinds = writeProgram(project).rules.map(rule => rule.kind);
  assert.deepEqual(kinds, ['builtin', 'builtin', 'builtin']);
  connectNotes(project, find(project, s => s.col === 'boundaries'), find(project, s => s.col === 'players'), 'then');
  const program = writeProgram(project);
  assert.equal(program.rules.at(-1).kind, 'missing');
  assert.ok(program.lines.includes("//   not in the code yet: the game can't tell when this happens"));
  assert.equal(runProgram(program.source).rules, undefined);
});

test('a note shows its own lines, the engine lines behind it, and a plain explanation', () => {
  const project = draftProject('collecting stars', 'challenged');
  const program = writeProgram(project);
  const bombs = codeFor(program, project, find(project, s => s.effect && s.effect.hazard), engineSource);
  assert.equal(program.lines[bombs.lines[0]], 'game.drop("💣");  // bombs fall from the sky');
  assert.match(bombs.explain[0], /drops a 💣 from the top/);
  assert.deepEqual(bombs.engine.map(line => line.text.slice(0, 20)), ['if(drop&&st.sb<=0){', 'for(const o of st.hz']);
  const hit = codeFor(program, project, find(project, s => /loses 1 life/.test(s.text)), engineSource);
  assert.match(hit.explain[0], /takes away 1 life/);
  assert.ok(hit.engine.some(line => line.text.startsWith('if(sp.lives){st.lives--')));
  assert.deepEqual(ENGINE_ANCHORS.filter(anchor => !engineSource.includes(anchor)), []);
});

test('adding or removing a rule counts as a change the game does not have yet', () => {
  const project = draftProject('collecting stars', 'challenged');
  project.lastBuilt = project.stickers.map(s => s.id);
  project.versions = [{ n: 1, program: writeProgram(project).source }];
  assert.equal(pendingChanges(project), 0);
  const { edge } = connectNotes(project, find(project, s => /loses 1 life/.test(s.text)), find(project, s => s.col === 'outcome'), 'then');
  assert.ok(writeProgram(project).lines.includes('when("hero loses a life", then.gameOver());'));
  assert.equal(pendingChanges(project), 1);
  project.designMap.edges = project.designMap.edges.filter(e => e !== edge);
  assert.equal(pendingChanges(project), 0);
});
