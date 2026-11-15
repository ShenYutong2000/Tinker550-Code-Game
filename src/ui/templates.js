import { COLS, COLMAP, FEELINGS } from "../design/catalog.js";
import { alignmentLabel } from "../state/journal.js";
import { focusSets, HEAD_H, LINK_LABELS, mapLayout, noteLinks } from "../state/design-map.js";
import { pendingChanges, ruleLines } from "../state/project.js";
import { codeFor, writeProgram } from "../game/program.js";

export const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export const ROBOT=`<svg class="avatar" viewBox="0 0 120 120" aria-hidden="true"><rect x="34" y="12" width="18" height="14" rx="4" fill="#FFD166"/><rect x="68" y="12" width="18" height="14" rx="4" fill="#FFD166"/><rect x="18" y="22" width="84" height="80" rx="14" fill="#FFD166"/><rect x="18" y="90" width="84" height="12" rx="6" fill="#D9A13A"/><rect x="26" y="30" width="22" height="8" rx="4" fill="#FFE6A6"/><g class="eye"><rect x="35" y="48" width="15" height="18" rx="3" fill="#15102A"/><rect x="70" y="48" width="15" height="18" rx="3" fill="#15102A"/><rect x="39" y="51" width="5" height="5" fill="#fff"/><rect x="74" y="51" width="5" height="5" fill="#fff"/></g><ellipse cx="30" cy="75" rx="7" ry="4.5" fill="#FF8A5C" opacity=".8"/><ellipse cx="90" cy="75" rx="7" ry="4.5" fill="#FF8A5C" opacity=".8"/><path d="M49 74 Q60 85 71 74" stroke="#15102A" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;
/* brand logo: arcade token stamped with a toy brick; hops and now and then flips */
export const LOGO=`<svg viewBox="0 0 100 100" width="36" height="36" aria-hidden="true"><g class="pz">
<circle cx="50" cy="54" r="42" fill="#D9A13A"/><circle cx="50" cy="50" r="42" fill="#FFD166"/><circle cx="50" cy="50" r="33" fill="none" stroke="#D9A13A" stroke-width="3" stroke-dasharray="4 5"/>
<rect x="35" y="30" width="11" height="9" rx="3" fill="#FF6B35"/><rect x="54" y="30" width="11" height="9" rx="3" fill="#FF6B35"/>
<rect x="28" y="36" width="44" height="32" rx="9" fill="#C9441A"/><rect x="28" y="36" width="44" height="25" rx="9" fill="#FF6B35"/><rect x="34" y="42" width="12" height="4.5" rx="2.25" fill="#FFB08F"/>
<path d="M24 26 Q30 18 40 14" stroke="#FFF1C9" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/></g></svg>`;
export const X_ICON=`<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13" stroke="currentColor" stroke-width="1.8"/></svg>`;
export const GUIDE={
  howto:{lab:"How the map works",ic:"👆",zh:"Tap a note to see what it connects to",tip:"Notes linked to it light up, and arrows show what causes what. In the panel you can ✏️ edit the note, 🔗 connect it to another note, or 🗑 remove it. Tap ＋ on any element to add your own idea. Notes marked ✨ are your buddy's guesses: change anything!"},
  gen:{lab:"Try your changes",ic:"▶️",zh:"Changed the map? Update your game!",tip:"Notes marked <b>new</b> aren't in the game yet. Tap this button and your changes show up in the game on the right."},
  predict:{lab:"Make a guess",ic:"🔮",zh:"What will the game do? You guess!",tip:"<b>Tap one</b> you think will happen, or <b>write</b> your own guess below.<br>Then tap \"I think so!\".<br>When you play, see if you were right!"},
  boardintro:{lab:"Design map",ic:"🗺️",zh:"This is your game's design map",tip:"Your whole game is on one map. Each colored box is one of the nine game elements, and each note inside is one idea. The arrows show how ideas affect each other, like <b>if → then</b>."},
  iterate:{lab:"A designer's secret",ic:"🔁",zh:"Different? That's totally normal!",tip:"Every game designer's first version looks different from what they imagined.<br>This is how they all make games: <b>play → spot what's different → change it → play again</b>.<br>We'll do it round by round too, until it's the game you want."},
  star:{lab:"What's next",ic:"🧭",zh:"Three ways to pick",tip:"<b>① Tap a card</b> to pick something to change.<br><b>② Tap ☆</b> to save an idea in \"My game ideas\" for later.<br><b>③ Write</b> your own idea below.<br>Then tap \"This one!\" to keep going."}
};
export function createTemplates({ getProject, UI, botName, directions, chars, built, editableText, allProjects, journalEntries, assessmentView, engineSource }) {
function messageHTML(m){return m.who==="kid"?`<div class="body">${m.html}</div>`:`${ROBOT}<div class="body">${m.html}</div>`;}
function typingHTML(){return `<div class="msg" style="margin-left:-42px">${ROBOT}<div class="typing" aria-label="${esc(botName())} is typing"><i></i><i></i><i></i><span class="who">${esc(botName())} is typing…</span></div></div>`;}
const COMPOSER_PLACEHOLDER={naming:"Give your robot buddy a name…",opening:"Or just type your game idea here…",choice:"Finish this sentence…",confirm:"Or write another idea…",generating:"Pick one above, or write your guess…",playtest:"What did you see?",directions:"Or write your own idea here…",concept:"Or write a different idea…"};
function composerPlaceholder(phase){return COMPOSER_PLACEHOLDER[phase]||"";}
function journalHTML(){
  const entries=journalEntries();
  if(!entries.length)return `<div class="journal-empty">Your design choices and playtest discoveries will be collected here.</div>`;
  return entries.map(entry=>{
    const inProgress=entry.version===null;
    const versionLabel=inProgress?"In progress":"v"+entry.version;
    const steps=entry.steps.map(step=>`<li>${esc(step.text)}${step.category?`<span class="journal-tag">${esc(COLMAP[step.category]?.en||step.category)}</span>`:""}</li>`).join("");
    const check=entry.assessment;
    return `<article class="journal-entry ${inProgress?"in-progress":""}"><div class="journal-entry-head"><strong>${esc(versionLabel)}</strong><span>${inProgress?"Planning":"Built"}${check?" · Played":""}</span></div><ul>${steps}</ul>${entry.expected?`<p class="journal-detail"><b>I expected</b> ${esc(entry.expected)}</p>`:""}${check?`<p class="journal-detail"><b>I noticed</b> ${esc(check.response)}</p><span class="journal-result ${esc(check.alignment)}">${esc(alignmentLabel(check.alignment))}</span>`:""}</article>`;
  }).join("");
}
function assessmentHTML(){
  const view=assessmentView();
  if(view.state==="empty")return `<h2>How did this step go?</h2><p>After you make a version, you and your buddy can compare what you expected with what happened.</p>`;
  if(view.state==="complete"){
    const a=view.assessment;
    const focus=a.discovery?COLMAP[a.discovery]?.zh||a.discovery:null;
    return `<div class="assessment-state"><span class="assessment-kicker">PLAYTEST NOTES · v${esc(getProject().versions.at(-1).n)}</span><h2>${esc(alignmentLabel(a.alignment))}</h2>${view.expected?`<p class="assessment-line"><b>I expected</b>${esc(view.expected)}</p>`:""}<p class="assessment-line"><b>I noticed</b>${esc(a.response)}</p>${focus?`<span class="journal-tag">Next to explore: ${esc(focus)}</span>`:""}</div>`;
  }
  const expectation=view.expected?`<p class="assessment-line"><b>I expected</b>${esc(view.expected)}</p>`:"";
  const versionLabel=esc(getProject().versions.at(-1).n);
  if(view.state==="question")return `<div class="assessment-state"><span class="assessment-kicker">YOUR TURN · v${versionLabel}</span><h2>Did it happen the way you expected?</h2>${expectation}<p>Tell your buddy what you noticed in the Design Journal chat.</p><button class="tbtn assessment-chat" data-act="assessment-chat">💬 Tell my buddy</button></div>`;
  if(view.state==="playing")return `<div class="assessment-state"><span class="assessment-kicker">PLAYING · v${versionLabel}</span><h2>Try your game!</h2>${expectation}<p>Your buddy will ask what happened after you start playing.</p></div>`;
  return `<div class="assessment-state"><span class="assessment-kicker">READY TO TEST · v${versionLabel}</span><h2>Check your idea in the game</h2>${expectation}<p>Play this version, then tell your buddy what you noticed.</p><button class="btn" data-act="openpane">▶ Play this version</button></div>`;
}
function paneLegendHTML(sp){
  const m=sp.mode,c=sp.control,two=sp.players===2,keys=[];
  if(c!=="mouse")keys.push(m==="roam"?`<span class="key">←↑↓→</span> move`:m==="jump"?`<span class="key">SPACE</span> jump`:`<span class="key">← →</span> move`);
  if(c!=="keys")keys.push(m==="jump"?"🖱️ click to jump":m==="shoot"?"🖱️ move + click to shoot":"🖱️ follow the mouse");
  if(m==="shoot"&&c!=="mouse")keys.push(`<span class="key">SPACE</span> shoot`);
  if(two)keys.push(`P2 <span class="key">WASD</span>${m==="shoot"?` <span class="key">F</span>`:""}`);
  return keys.join(" · ");
}
function chipRow(list,target,label){return `<div class="chips">${label?`<span class="lab">${label}</span>`:""}${list.map(x=>`<button class="chip" data-fill="${target}" data-val="${esc(x)}">${esc(x)}</button>`).join("")}</div>`;}
function widgetHTML(){
  const P=getProject();
  switch(P.phase){
    case "naming":return chipRow(["Bolt","Sparky","Pixel","Gizmo","Beep"],"composer","Try a name");
    case "opening":{const idea=UI.idea,question=(n,title,body)=>`<div class="onboard-q"><div class="onboard-h"><span class="onboard-n">${n}</span>${title}</div>${body}</div>`;
      return `<div class="card onboard">
      ${question(1,"Who is in your game?",`<input class="onboard-in" id="inWho" value="${esc(idea&&idea.who||"")}" placeholder="a cat, an astronaut, or someone you invent" aria-label="Who is in your game" autocomplete="off">${chipRow(["a cat","an astronaut","a superhero","a robot","a dinosaur"],"inWho")}`)}
      ${question(2,"What does the character do?",`<input class="onboard-in" id="inDo" value="${esc(idea&&idea.act||"")}" placeholder="collect stars, jump over obstacles…" aria-label="What does the character do" autocomplete="off">${chipRow(["collecting stars","jumping over obstacles","exploring a mysterious world","escaping from monsters","popping balloons"],"inDo")}`)}
      ${question(3,"How do you want players to feel?",`<div class="chips" role="group" aria-label="How players should feel">${FEELINGS.map(f=>`<button class="chip feel ${UI.feel===f.k?"on":""}" data-feel="${f.k}" aria-pressed="${UI.feel===f.k}">${f.ic} ${f.t}</button>`).join("")}</div>`)}
      <details class="idea-box" ${UI.ideaText?"open":""}><summary>✍️ Already have a game idea? Tell us about it!</summary><textarea id="inIdea" rows="3" placeholder="e.g. A cat catches stars. Bombs fall from the sky and it gets faster and faster. You have 3 lives." autocomplete="off">${esc(UI.ideaText||"")}</textarea></details>
      <div class="row"><button class="btn" data-act="opening">✨ Make my first draft!</button><span class="hint">You can change everything after.</span></div></div>`;}
    case "choice":{const c=UI.choice;return `<div class="chips"><span class="lab">You could say</span>${c.options.map((o,i)=>`<button class="chip opt" data-pick="${i}">${o.pic} ${esc(o.t)}${c.predicted===i?'<span class="tag">your guess</span>':""}</button>`).join("")}</div><div class="row"><button class="link" data-act="cancel">Try something else</button></div>`;}
    case "confirm":return pendingChanges(P)?`<div class="row"><button class="btn" data-act="generate">▶ Update my game</button><button class="btn soft" data-act="board">🗺️ Look at the map</button></div>`:"";
    case "generating":{const g=UI.gen;if(!g)return "";const locked=g.guess!==undefined;
      return `<div class="card"><div class="shimmer ${g.done?"done":""}" aria-hidden="true"></div><div class="gen-status">${esc(g.status)}</div>
      ${locked?`<div class="hint">Guess saved! When you play, see if you were right.</div>`:`<div class="gen-pick">
      <div class="pchoices">${g.P.a.map((a,i)=>`<button class="pchoice ${g.sel===i?"picked":""}" data-p="${i}" aria-pressed="${g.sel===i}"><span class="pic">${a.pic}</span><span>${esc(a.t)}</span></button>`).join("")}</div>
      <div class="own"><input id="guessIn" value="${esc(g.typed||"")}" placeholder="or write your own guess…" aria-label="Write your own guess" autocomplete="off"><button class="btn" data-act="guess" ${g.sel!=null||(g.typed||"").trim()?"":"disabled"}>I think so!</button></div>
      </div>`}</div>`;}
    case "playtest":{const v=P.versions[P.versions.length-1];if(!v)return "";
      if(!UI.paneOpen)return `<button class="art play" data-act="openpane"><span class="ic">🎮</span><span><span class="t">${esc(P.name||"My game")}</span><br><span class="s">Click to play</span></span><span class="go">▶</span></button>`;
      return UI.asked?"":`<div class="hint" style="padding:2px 0">🎮 Playing…</div>`;}
    case "directions":{const v=P.versions[P.versions.length-1],typed=UI.ownText||"";
      return `${!UI.paneOpen&&v?`<button class="art" data-act="openpane"><span class="ic">🎮</span><span><span class="t">${esc(P.name||"My game")}</span><br><span class="s">Click to open the game</span></span></button>`:""}
      <div class="pick">
      <div class="dirs">${directions().map(x=>{const key=x.sel||x.col,on=P.saved.some(s=>s.col===x.col&&s.q===x.q),sel=UI.sel===key;return `<div class="dir ${sel?"sel":""}"><button class="dir-go" data-sel="${key}" aria-pressed="${sel}"><span class="q">${esc(x.q)}</span></button><button class="star ${on?"on":""}" data-star="${x.col}" data-q="${esc(x.q)}" aria-pressed="${on}" aria-label="${on?"Remove from My game ideas":"Save to My game ideas for later"}" title="${on?"Remove from My game ideas":"Save to My game ideas for later"}">${on?"★":"☆"}</button></div>`;}).join("")}</div>
      ${P.saved.length?`<div class="chips"><span class="lab">⭐ My game ideas</span>${P.saved.map(s=>`<button class="chip ${UI.sel===s.col?"on":""}" data-sel="${s.col}">${esc(s.q)}</button>`).join("")}</div>`:""}
      <div class="own"><input id="ownIdea" value="${esc(typed)}" placeholder="or write your own idea…" aria-label="Write your own idea" autocomplete="off"><button class="btn" data-act="pickgo" ${UI.sel||typed.trim()?"":"disabled"}>This one!</button></div>
      </div>`;}
    case "concept":return `<div class="row"><button class="btn" data-act="cdesign">${UI.concept&&UI.concept.text?"Put it in my game":"Keep designing it"}</button><button class="btn soft" data-act="cother">Look at something else</button></div>`;
  }
  return "";
}
function projectsHTML(){
  const P=getProject();
  const list=allProjects();
  return `
    <div class="project-actions"><button class="sbtn new" data-act="new"><span class="plus">+</span>New project</button>
    <button class="sbtn" data-act="restart">↺ Start over</button></div>
    <div class="bot-row">${ROBOT.replace('class="avatar"','class="avatar" style="width:22px;height:22px"')}<span>Buddy: <span class="nm">${esc(botName())}</span></span><button data-act="rename">Rename</button></div>
    <div class="project-list">
      <div class="sec">My projects</div>
      ${list.length?list.map(p=>{const cur=p.id===P.id,src=cur?P:p,h=(src.stickers||[]).find(s=>s.col==="character"),sv=src.saved||[],open=UI.expanded.has(p.id);
        return `<div class="proj-wrap ${cur?"on":""}"><div class="proj ${cur?"on":""}"><button class="tw" data-expand="${p.id}" aria-expanded="${open}" aria-label="${open?"Hide":"Show"} My game ideas">${open?"▾":"▸"}</button><button class="pn" data-open="${p.id}"><span class="em">${h?h.effect.char.e:"🧩"}</span><span class="n">${esc(src.name||"New game")}</span></button>${sv.length?`<span class="fav-ct" title="My game ideas">⭐${sv.length}</span>`:""}</div>
        ${open?`<div class="favs"><div class="favs-h">⭐ My game ideas</div>${sv.length?sv.map(s=>`<div class="saved-item"><button class="go" ${cur?`data-dir="${s.col}"`:`data-open="${p.id}"`}><span class="s">☆</span>${esc(s.q)}</button>${cur?`<button class="x" data-unstar="${s.col}" aria-label="Remove this idea">×</button>`:""}</div>`).join(""):`<div class="empty-note">Tap ☆ on one of ${esc(botName())}'s ideas to save it here for later.</div>`}</div>`:""}</div>`;}).join(""):`<div class="empty-note">No projects yet. Share your first idea and it will show up here.</div>`}
    </div>
    `;
}
/* ---------- design map: nine clusters on one canvas ---------- */
const HUES={character:"#FFD166",players:"#8EC5FF",objectives:"#FF9F6B",procedures:"#B79CFF",rules:"#5EE6B8",resources:"#FF7B9C",conflict:"#FF6B6B",boundaries:"#A9B4C6",outcome:"#7CE38B"};
const plural=(n,word)=>n+" "+word+(n===1?"":"s");
const mapZoom=()=>Math.max(.35,Math.min(1.4,Number(UI.mapZoom)||.8));
const noteText=s=>s.text.replace(/^“(.*)”$/,"$1");
function highlight(id,sets){
  if(!sets)return "";
  return sets.self.has(id)?"focus":sets.direct.has(id)?"linked":sets.affected.has(id)?"affected":"dim";
}
function noteHTML(s,box,cluster,sets){
  const P=getProject(),main=s.col==="character"&&(P.activeChar===s.id||!P.activeChar&&chars()[0]===s);
  const tags=[main?`<span title="Main character">⭐</span>`:"",s.by==="ai"?`<span title="Drafted by your buddy">✨</span>`:"",!s.effect?`<span title="An idea the game can't build yet">💭</span>`:"",!built(s.id)?`<span class="note-new" title="Not in the game yet">new</span>`:""].join("");
  return `<div class="map-note ${s.by==="ai"?"ai":""} ${!s.effect?"nofx":""} ${highlight(s.id,sets)} ${UI.connectFrom===s.id?"connect-from":""} ${s.pop?"pop":""}" data-note="${s.id}" role="button" tabindex="0" aria-label="${esc(COLMAP[s.col].en+": "+noteText(s))}" style="left:${box.x-cluster.x}px;top:${box.y-cluster.y}px;width:${box.w}px;height:${box.h}px"><span class="note-text">${esc(noteText(s))}</span>${tags?`<span class="note-tags">${tags}</span>`:""}</div>`;
}
function clusterHTML(category,layout,sets){
  const P=getProject(),box=layout.clusters[category.key],notes=P.stickers.filter(s=>s.col===category.key);
  const lit=sets?(UI.focus.col===category.key?"focus":notes.some(s=>sets.self.has(s.id)||sets.direct.has(s.id)||sets.affected.has(s.id))?"":"dim"):"";
  const body=box.collapsed?"":notes.length?notes.map(s=>noteHTML(s,layout.notes[s.id],box,sets)).join(""):`<div class="cluster-empty" style="top:${HEAD_H}px">Nothing yet. ${esc(category.eg)}</div>`;
  return `<section class="cluster ${lit} ${box.collapsed?"collapsed":""}" data-col="${category.key}" data-cluster="${category.key}" style="left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px;--hue:${HUES[category.key]}" aria-label="${esc(category.en)}">
    <header class="cluster-head" data-cluster-drag="${category.key}" title="${esc(category.tip)}"><span class="cluster-ic" aria-hidden="true">${category.ic}</span><button class="cluster-name" data-cluster-focus="${category.key}">${esc(category.en)}</button><span class="cluster-count">${notes.length||""}</span><button class="cluster-btn" data-cluster-add="${category.key}" aria-label="Add a note to ${esc(category.en)}" title="Add a note">＋</button><button class="cluster-btn" data-cluster-toggle="${category.key}" aria-expanded="${!box.collapsed}" aria-label="${box.collapsed?"Show":"Hide"} notes" title="${box.collapsed?"Show":"Hide"} notes">${box.collapsed?"▸":"▾"}</button></header>
    ${body}${box.collapsed?"":`<button class="cluster-add" data-cluster-add="${category.key}">＋ add</button>`}
  </section>`;
}
/* arrows leave the side facing their target; notes stacked in one column curve out to the right */
function arrowPath(a,b){
  const sy=a.y+a.h/2,ty=b.y+b.h/2;let sx,tx,c1,c2;
  if(b.x>=a.x+a.w+16){sx=a.x+a.w;tx=b.x;const d=Math.max(40,(tx-sx)*.5);c1=sx+d;c2=tx-d;}
  else if(b.x+b.w<=a.x-16){sx=a.x;tx=b.x+b.w;const d=Math.max(40,(sx-tx)*.5);c1=sx-d;c2=tx+d;}
  else{sx=a.x+a.w;tx=b.x+b.w;c1=c2=Math.max(sx,tx)+48+Math.abs(ty-sy)*.12;}
  return {d:`M ${sx} ${sy} C ${c1} ${sy}, ${c2} ${ty}, ${tx} ${ty}`,mx:(sx+3*c1+3*c2+tx)/8,my:(sy+ty)/2};
}
function edgesHTML(layout){
  const P=getProject(),sets=UI.focus?focusSets(P,UI.focus):null;
  const links=noteLinks(P).map(link=>{
    const a=layout.notes[link.from],b=layout.notes[link.to];if(!a||!b)return null;
    const state=sets?(sets.edges.has(link.id)?"lit":sets.ripple.has(link.id)?"ripple":"dim"):"";
    return {link,state,...arrowPath(a,b)};
  }).filter(Boolean);
  const marker=state=>state==="lit"||state==="ripple"?state:"base";
  return `<svg class="map-edges" viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width}" height="${layout.height}" aria-hidden="true"><defs>${["base","lit","ripple"].map(k=>`<marker id="mapArrow-${k}" class="arrow-${k}" viewBox="0 0 10 10" markerWidth="5" markerHeight="5" refX="8" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z"/></marker>`).join("")}</defs>${links.map(l=>`<path class="map-edge ${l.state}" d="${l.d}" marker-end="url(#mapArrow-${marker(l.state)})"/>`).join("")}</svg>${links.map(l=>`<button class="map-link ${l.state}" data-note="${l.link.from}" style="left:${l.mx}px;top:${l.my}px">${esc(LINK_LABELS[l.link.label])}</button>`).join("")}`;
}
function inspectorHTML(sets){
  const P=getProject();
  if(UI.adding){const c=COLMAP[UI.adding];
    return `<aside class="map-inspector" style="--hue:${HUES[c.key]}" aria-label="Add a note"><div class="insp-head"><span class="insp-el">${c.ic} ${esc(c.en)}</span><span class="insp-by">New note</span><button class="ibtn" data-map-act="close" aria-label="Close">${X_ICON}</button></div><p class="insp-sub">${esc(c.tip)}</p><textarea class="insp-edit" data-add-text="${c.key}" rows="2" placeholder="${esc(c.eg)}" aria-label="Your new idea"></textarea><div class="insp-actions"><button class="btn" data-map-act="add-save">Add to map</button><button class="btn soft" data-map-act="close">Cancel</button></div></aside>`;}
  if(!UI.focus)return "";
  const links=noteLinks(P),byId=id=>P.stickers.find(x=>x.id===id),label=s=>`${COLMAP[s.col].ic} ${esc(noteText(s))}`;
  if(UI.focus.col){const c=COLMAP[UI.focus.col],inside=new Set(P.stickers.filter(s=>s.col===c.key).map(s=>s.id));
    const across=links.filter(l=>inside.has(l.from)!==inside.has(l.to)).length;
    return `<aside class="map-inspector" style="--hue:${HUES[c.key]}" aria-label="${esc(c.en)}"><div class="insp-head"><span class="insp-el">${c.ic} ${esc(c.en)}</span><span class="insp-by">${plural(inside.size,"note")} · ${plural(across,"link")} to other elements</span><button class="ibtn" data-map-act="close" aria-label="Close">${X_ICON}</button></div><p class="insp-sub">${esc(c.tip)}</p><div class="insp-actions"><button class="btn" data-cluster-add="${c.key}">＋ Add a note</button></div></aside>`;}
  const s=byId(UI.focus.note);if(!s)return "";
  const c=COLMAP[s.col],hero=chars().find(x=>x.id===P.activeChar)||chars()[0];
  const choose=link=>`<select data-link-label="${link.id}" aria-label="How they are linked">${Object.entries(LINK_LABELS).map(([k,v])=>`<option value="${k}" ${link.label===k?"selected":""}>${esc(v)}</option>`).join("")}</select>`;
  const row=link=>{const out=link.from===s.id,o=byId(out?link.to:link.from);if(!o)return "";const other=`<button class="insp-note" data-note="${o.id}">${label(o)}</button>`,me=`<span class="insp-me">this</span>`;
    return `<li>${out?me:other}${choose(link)}${out?other:me}<button class="insp-x" data-unlink="${link.id}" aria-label="Remove this link" title="Remove this link">×</button></li>`;};
  const mine=links.filter(l=>l.from===s.id||l.to===s.id),affects=[...sets.affected].map(byId).filter(Boolean);
  const status=!s.effect?"💭 The game can't build this one yet, but it stays in your design.":built(s.id)?"✅ In the game":"🟠 Not in the game yet. Tap “Update my game” to try it.";
  return `<aside class="map-inspector" style="--hue:${HUES[s.col]}" aria-label="Selected note">
    <div class="insp-head"><span class="insp-el">${c.ic} ${esc(c.en)}</span><span class="insp-by">${s.by==="ai"?"✨ Buddy's draft":"✏️ My idea"}</span><button class="ibtn" data-map-act="close" aria-label="Close">${X_ICON}</button></div>
    ${UI.editing===s.id?`<textarea class="insp-edit" data-edit-text="${s.id}" rows="2" aria-label="Rewrite this note">${esc(editableText(s))}</textarea><div class="insp-actions"><button class="btn" data-edit-save="${s.id}">Done</button><button class="btn soft" data-edit-cancel>Cancel</button></div>`
      :`<p class="insp-text">${esc(noteText(s))}</p>${s.sub?`<p class="insp-sub">${esc(s.sub)}</p>`:""}<p class="insp-status">${status}</p>`}
    ${mine.length?`<div class="insp-sec"><b>Connections</b><ul class="insp-links">${mine.map(row).join("")}</ul></div>`:`<p class="insp-sub">Not connected yet. Use 🔗 to show what this causes.</p>`}
    ${affects.length?`<div class="insp-sec"><b>A change here also affects</b><div class="insp-affects">${affects.map(o=>`<button class="insp-note affected" data-note="${o.id}">${label(o)}</button>`).join("")}</div></div>`:""}
    ${UI.editing===s.id?"":`<div class="insp-actions"><button class="btn soft" data-map-act="edit">✏️ Edit</button><button class="btn soft" data-map-act="connect">🔗 Connect to…</button><button class="btn soft" data-act="show-code">&lt;/&gt; See the code</button>${s.col==="character"&&hero&&hero.id!==s.id?`<button class="btn soft" data-char="${s.id}">⭐ Make main</button>`:""}<button class="btn soft danger" data-map-act="delete">🗑 Remove</button></div>`}
  </aside>`;
}
function boardHTML(){
  const P=getProject(),layout=mapLayout(P),zoom=mapZoom(),sets=UI.focus?focusSets(P,UI.focus):null;
  const from=UI.connectFrom&&P.stickers.find(s=>s.id===UI.connectFrom);
  const tools=from?`<div class="map-banner">🔗 Tap the note that <b>${esc(noteText(from))}</b> leads to <button class="link" data-map-act="connect-cancel">Cancel</button></div>`
    :`<span class="map-hint">Tap a note to see its links · drag a box by its title to move it</span>`;
  return `<div class="map-toolbar">${tools}<div class="map-tool-group"><button class="map-tool icon-tool" data-map-act="zoom-out" aria-label="Zoom out" title="Zoom out">−</button><span class="map-zoom-value">${Math.round(zoom*100)}%</span><button class="map-tool icon-tool" data-map-act="zoom-in" aria-label="Zoom in" title="Zoom in">+</button><button class="map-tool" data-map-act="fit">▣ <span>Fit</span></button></div></div>
  <div class="map-viewport ${sets?"has-focus":""}" id="mapViewport" aria-label="Design map. Drag empty space to move around"><div class="map-world-wrap" style="width:${layout.width*zoom}px;height:${layout.height*zoom}px"><div class="map-world" id="mapWorld" style="width:${layout.width}px;height:${layout.height}px;transform:scale(${zoom})">
    <div class="map-edges-layer" id="mapEdges">${edgesHTML(layout)}</div>
    ${COLS.map(c=>clusterHTML(c,layout,sets)).join("")}
  </div></div></div>${inspectorHTML(sets)}`;
}
function boardFoot(){
  const P=getProject(),n=pendingChanges(P);
  if(!P.versions.length)return `<span class="map-build-hint">Answer the questions on the left to get a first draft</span><button class="btn" disabled>Make my game!</button>`;
  return `<span class="map-build-hint">${n?plural(n,"change")+" not in the game yet":"The game matches your map"}</span><button class="btn" data-act="generate" ${n&&P.phase!=="generating"?"":"disabled"}>▶ Update my game</button>`;
}
/* ---------- computation view: the program made from the map, and the engine lines that run it ---------- */
function codeHTML(line){
  const html=esc(line),cut=html.startsWith("//")?0:html.indexOf("  //");
  const code=cut===0?"":cut>0?html.slice(0,cut):html,note=cut===0?html:cut>0?html.slice(cut):"";
  return code.replace(/(&quot;.*?&quot;)/g,'<span class="cs">$1</span>').replace(/\b(game|when|then)\b/g,'<span class="ck">$1</span>')+(note?`<span class="cc">${note}</span>`:"");
}
function linesHTML(lines,show,lit,pending){
  let out="",last=-2;
  for(const i of show){
    if(i>last+1&&last>=0)out+=`<div class="code-gap">⋯</div>`;
    out+=`<div class="code-line ${lit.has(i)?"lit":""} ${pending.has(i)?"pending":""}"><span class="ln">${i+1}</span><code>${codeHTML(lines[i])}</code></div>`;last=i;
  }
  return `<div class="code-block">${out}</div>`;
}
function codeViewHTML(){
  const P=getProject();
  if(!P.versions.length)return `<div class="code-empty"><span aria-hidden="true">&lt;/&gt;</span><h2>Your game's code will appear here</h2><p>Answer the questions to get a first draft. Every note on your map becomes a few lines of code.</p></div>`;
  const program=writeProgram(P),all=program.lines.map((_,i)=>i),builtRules=ruleLines(P.versions.at(-1).program);
  const pending=new Set();
  for(const s of P.stickers)if(!built(s.id))(program.notes[s.id]||[]).forEach(i=>{if(i<program.ruleStart)pending.add(i);});
  program.lines.forEach((line,i)=>{if(line.startsWith("when(")&&!builtRules.has(line))pending.add(i);});
  const whole=(lit)=>`<details class="code-all"><summary>See the whole program (${program.lines.length} lines)</summary>${linesHTML(program.lines,all,lit,pending)}</details>`;
  const legend=pending.size?`<p class="code-note"><span class="code-pending-key"></span>Lines with an orange edge aren't running yet. Tap “Update my game” to run them.</p>`:"";
  const focus=UI.focus;
  if(focus&&focus.note){
    const c=codeFor(program,P,focus.note,engineSource);if(!c)return "";
    const lit=new Set(c.lines),show=[...lit].sort((a,b)=>a-b);
    const engine=c.engine.length?`<details class="code-engine" open><summary>Inside the game engine</summary><p class="code-note">These lines of <code>engine.js</code> do the work every frame.</p><div class="code-block">${c.engine.map(l=>`<div class="code-line lit"><span class="ln">${l.n}</span><code>${esc(l.text)}</code></div>`).join("")}</div></details>`:"";
    return `<div class="code-head"><span>${COLMAP[c.sticker.col].ic}</span><div><b>Code for “${esc(c.sticker.text.replace(/^“(.*)”$/,"$1"))}”</b><span>${esc(COLMAP[c.sticker.col].en)} · ${built(c.sticker.id)?"running in your game":"not running yet"}</span></div></div>
      ${show.length?linesHTML(program.lines,show,lit,pending):""}${legend}
      ${c.explain.length?`<div class="code-explain"><b>What it does</b>${c.explain.map(t=>`<p>${esc(t)}</p>`).join("")}</div>`:""}
      ${engine}${whole(lit)}`;
  }
  if(focus&&focus.col){
    const c=COLMAP[focus.col],lit=new Set(P.stickers.filter(s=>s.col===c.key).flatMap(s=>program.notes[s.id]||[])),show=[...lit].sort((a,b)=>a-b);
    return `<div class="code-head"><span>${c.ic}</span><div><b>Code for ${esc(c.en)}</b><span>Tap one note to see what each line does</span></div></div>${show.length?linesHTML(program.lines,show,lit,pending):`<p class="code-note">No notes here yet, so no code either.</p>`}${legend}${whole(lit)}`;
  }
  return `<div class="code-head"><span>&lt;/&gt;</span><div><b>Your game's program</b><span>Made from your design map. Tap a note on the map to see the lines that make it work.</span></div></div>${linesHTML(program.lines,all,new Set(),pending)}${legend}`;
}
function guideCalloutHTML(info, more){
if(info.mini)return `<span>👈 ${info.zh}</span><button class="btn" data-ok>OK</button>`;
  return `<div class="lab">${info.lab||("Game element · "+info.en)}</div><h3>${info.ic} ${info.zh}</h3><p>${info.tip}</p><div class="row"><button class="btn" data-ok>${more?"Next":"Got it"}</button>${more?`<button class="link" data-skip>Skip tour</button>`:""}</div>`;
}
function askHTML(gs, compact){
return `${ROBOT}<div><b>${gs?"You guessed “"+esc(gs)+"”. Did that happen?":"Was it different from what you imagined?"}</b><span>${compact?"Tap here and write what you saw":"Write to "+esc(botName())+" on the left"}</span></div><button class="x" data-act="dismissask" aria-label="Keep playing">×</button>`;
}
function sheetHTML(title, sub, body){
return `<div class="sheet narrow" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-h"><span class="t">${title}</span><span class="s">${sub}</span><button class="ibtn" data-close aria-label="Close">${X_ICON}</button></div><div class="sheet-b">${body}</div></div>`;
}
return { codeViewHTML, messageHTML, typingHTML, composerPlaceholder, journalHTML, assessmentHTML, paneLegendHTML, widgetHTML, projectsHTML, boardHTML, boardFoot, edgesHTML:()=>edgesHTML(mapLayout(getProject())), guideCalloutHTML, askHTML, sheetHTML };
}
