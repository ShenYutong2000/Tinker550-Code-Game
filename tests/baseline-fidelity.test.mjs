import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const read = relative => readFileSync(new URL(relative, import.meta.url), 'utf8');
const normalizeLines = text => text.replace(/\r\n/g, '\n');
const original = read('../baseline/source/Tinker 550.html');

test('the original prototype remains intact', () => {
  const hash = createHash('sha256').update(readFileSync(new URL('../baseline/source/Tinker 550.html', import.meta.url))).digest('hex');
  assert.equal(hash.toUpperCase(), 'C1B466C8785B11B2B401563119FBF156B6F782E9E14BC7A511BE071F83B286E8');
});

test('the redesigned shell keeps application anchors and adds the board and assessment areas', () => {
  const html = read('../index.html');
  for (const id of ['app', 'msgs', 'live', 'composer', 'boardColumn', 'boardBody', 'boardFoot', 'pane', 'cv', 'previewEmpty', 'layer']) {
    assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
  }
  assert.doesNotMatch(html, /<aside class="side"/);
  assert.match(html, /data-act="projects"/);
  assert.match(html, /data-act="toggle-journal"/);
  assert.match(html, /data-act="toggle-preview"/);
  assert.match(html, /data-tab="board"/);
  assert.doesNotMatch(html, /board-placeholder/);
  assert.match(html, /aria-label="Assessment"/);
});

test('the extracted base styles and game engine match the prototype', () => {
  const styles = [...original.matchAll(/<style>([\s\S]*?)<\/style>/g)];
  assert.ok(styles.length >= 2);
  assert.equal(normalizeLines(read('../src/styles/base.css')), normalizeLines(styles[0][1]));
  const engine = original.match(/<script id="engineSrc">([\s\S]*?)<\/script>/);
  assert.ok(engine);
  /* the engine is the prototype's, plus the rule system that runs the design map's arrows.
     Only these original lines may change; every other original line must still be there. */
  const now = new Set(normalizeLines(read('../src/game/engine.js')).split('\n'));
  const changed = normalizeLines(engine[1]).split('\n').filter(line => !now.has(line)).map(line => line.trim());
  const allowed = [
    'st={t:0,heroes:',                       // two new counters: boost and drop
    'const hasScore=',                       // a rule can give points too
    'function addScore(',                    // fires "score goes up"
    'if(sp.lives){st.lives--;',              // fires "hero loses a life"
    'poof(o.x,o.y,"#FFD166");',              // fires "hero catches something"
    'const m=sp.mode,sm=sp.speedUp',         // speed includes the goFaster boost
    /* the rest read the numbers the Code view can tune; each stays the prototype's value until a child changes it */
    'if(c.jump&&h.onGround){h.vy=-430;',
    'if(m==="catch"&&st.sg<=0)',
    'if(m==="shoot"&&st.goods.length<5',
    'if(m==="dodge"&&st.sh<=0)',
    'if(m==="jump"&&st.sh<=0)',
    'if(sp.hazard&&st.sb<=0){',              // things can start falling because of a rule
    'if(m==="jump")st.hz.push({x:W+20,y:GROUND-85',
    'else st.hz.push({x:rand(16,W-16),y:-16,vy:rand(100,140)*sm,r:13,e:sp.hazard',
    'st.sb=1.9/sm;',
    'if(st.enemy){const h=st.heroes[0];',
  ];
  assert.deepEqual(changed.map(line => allowed.find(start => line.startsWith(start)) || line), allowed);
});
