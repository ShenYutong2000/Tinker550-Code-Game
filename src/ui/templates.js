import { COLS, COLMAP } from "../design/catalog.js";
import { alignmentLabel } from "../state/journal.js";
import { MAP_HEIGHT, MAP_NOTE_WIDTH, MAP_WIDTH } from "../state/design-map.js";

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
  howto:{lab:"How the board works",ic:"👆",zh:"Confirm it, or edit it",tip:"Red notes are new ideas that don't count yet. If it looks right, tap it. It turns yellow, and only yellow notes go into your game. Want to say it differently? Tap \"✏️ Edit\" and rewrite it. Don't want it? Tap ×. You can still tap ✏️ after it turns yellow.",demo:true},
  gen:{lab:"Last step",ic:"▶️",zh:"All yellow? Make your game!",tip:"When every note is yellow, tap this button and your game shows up on the right."},
  predict:{lab:"Make a guess",ic:"🔮",zh:"What will the game do? You guess!",tip:"<b>Tap one</b> you think will happen, or <b>write</b> your own guess below.<br>Then tap \"I think so!\".<br>When you play, see if you were right!"},
  boardintro:{lab:"Design board",ic:"🗺️",zh:"This is your game's design map",tip:"Every idea you have becomes a sticky note here."},
  iterate:{lab:"A designer's secret",ic:"🔁",zh:"Different? That's totally normal!",tip:"Every game designer's first version looks different from what they imagined.<br>This is how they all make games: <b>play → spot what's different → change it → play again</b>.<br>We'll do it round by round too, until it's the game you want."},
  star:{lab:"What's next",ic:"🧭",zh:"Three ways to pick",tip:"<b>① Tap a card</b> to pick something to change.<br><b>② Tap ☆</b> to save an idea in \"My game ideas\" for later.<br><b>③ Write</b> your own idea below.<br>Then tap \"This one!\" to keep going."}
};
export function createTemplates({ getProject, UI, botName, directions, chars, built, editableText, allProjects, journalEntries, assessmentView }) {
function messageHTML(m){return m.who==="kid"?`<div class="body">${m.html}</div>`:`${ROBOT}<div class="body">${m.html}</div>`;}
function typingHTML(){return `<div class="msg" style="margin-left:-42px">${ROBOT}<div class="typing" aria-label="${esc(botName())} is typing"><i></i><i></i><i></i><span class="who">${esc(botName())} is typing…</span></div></div>`;}
const COMPOSER_PLACEHOLDER={naming:"Give your robot buddy a name…",opening:"Or just type: a cat catching stars",newchar:"Who is the new character?",choice:"Finish this sentence…",confirm:"First, confirm the red notes on the board…",generating:"Pick one above, or write your guess…",playtest:"What did you see?",directions:"Or write your own idea here…",concept:"Or write a different idea…"};
function composerPlaceholder(phase){return COMPOSER_PLACEHOLDER[phase]||"";}
function journalHTML(){
  const entries=journalEntries();
  if(!entries.length)return `<div class="journal-empty">Your design choices and playtest discoveries will be collected here.</div>`;
  return entries.map(entry=>{
    const inProgress=entry.version===null;
    const versionLabel=inProgress?"In progress":"v"+entry.version;
    const steps=entry.steps.map(step=>`<li>${esc(step.text)}${step.category?`<span class="journal-tag">${esc(step.category==="character"?"CHARACTER":COLMAP[step.category]?.en||step.category)}</span>`:""}</li>`).join("");
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
  const newCount=P.stickers.filter(s=>s.status==="new").length;
  switch(P.phase){
    case "naming":return chipRow(["Bolt","Sparky","Pixel","Gizmo","Beep"],"composer","Try a name");
    case "opening":return `<div class="card"><div class="blank"><span>I want to make a game about</span><input id="inWho" placeholder="who?" aria-label="Who" autocomplete="off"><input id="inDo" placeholder="doing what?" aria-label="Doing what" autocomplete="off"></div>
      ${chipRow(["a cat","a robot","a rocket","a fish","a dinosaur"],"inWho","Who")}${chipRow(["catching stars","dodging meteors","jumping over cacti","popping balloons","finding gems in the sea"],"inDo","Doing what")}
      <div class="row"><button class="btn" data-act="opening">Got it!</button></div></div>`;
    case "newchar":return `${chipRow(["a dog","a penguin","an alien","a panda","a fox"],"composer","Try")}<div class="row"><button class="link" data-act="cancel">Never mind</button></div>`;
    case "choice":{const c=UI.choice;return `<div class="chips"><span class="lab">You could say</span>${c.options.map((o,i)=>`<button class="chip opt" data-pick="${i}">${o.pic} ${esc(o.t)}${c.predicted===i?'<span class="tag">your guess</span>':""}</button>`).join("")}</div><div class="row"><button class="link" data-act="cancel">Try something else</button></div>`;}
    case "confirm":return newCount?`<div class="row"><button class="btn" data-act="board">🗺️ View my board</button><span class="hint">${newCount} red ${newCount>1?"notes":"note"} waiting for you</span></div>`
      :`<div class="row"><button class="btn" data-act="generate">Make my game!</button><button class="btn soft" data-act="board">Look at the board</button></div>`;
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
function stickerHTML(s){
  const nofx=s.status==="ok"&&!s.effect?`<span class="nofx">This prototype can't build this yet, so it stays here for now</span>`:"";
  if(UI.editing===s.id)return `<div class="sticky editing" style="--rot:0deg"><textarea class="ed-text" data-edit-text="${s.id}" rows="2" aria-label="Rewrite this note">${esc(editableText(s))}</textarea><div class="ed-row"><button class="ed-save" data-edit-save="${s.id}">Done</button><button class="ed-cancel" data-edit-cancel>Cancel</button></div></div>`;
  if(s.status==="new")return `<div class="sticky new ${s.pop?"pop":""}" style="--rot:${s.rot}" role="button" tabindex="0" data-confirm="${s.id}" aria-label="Confirm note: ${esc(s.text)}"><button class="x" data-del="${s.id}" aria-label="Tear off this note">×</button>${esc(s.text)}${s.sub?`<span class="sub">${esc(s.sub)}</span>`:""}<span class="cta">Tap to confirm</span><button class="ed" data-edit="${s.id}" aria-label="Rewrite this note">✏️ Edit</button></div>`;
  return `<div class="sticky ok ${s.pop?"pop":""}" style="--rot:${s.rot}">${esc(s.text)}${s.sub?`<span class="sub">${esc(s.sub)}</span>`:""}${nofx}<button class="ed ok-ed" data-edit="${s.id}" aria-label="Changed your mind? Rewrite this note" title="Changed your mind? Edit it">✏️</button></div>`;
}
function boardHTML(){
  const P=getProject(), nodes=P.designMap.nodes||[];
  const charsInGame=chars(), active=charsInGame.find(c=>c.id===P.activeChar)||charsInGame[0];
  const zoom=Math.max(.35,Math.min(1.2,Number(UI.mapZoom)||.8));
  const menu=UI.menuOpen?'<div class="menu" role="menu">'+charsInGame.map(c=>'<button role="menuitem" data-char="'+esc(c.id)+'"><span class="em">'+c.effect.char.e+'</span>'+esc(c.effect.char.n)+'<span class="st">'+(active&&c.id===active.id?"Main Character":c.status==="new"?"Not confirmed":"Side character")+'</span></button>').join("")+'<button role="menuitem" class="add" data-act="addchar"><span class="em">+</span>Add a new character</button></div>':"";
  const cards=nodes.map(node=>{
    const sticker=node.stickerId&&P.stickers.find(item=>item.id===node.stickerId);
    const body=sticker?stickerHTML(sticker):'<div class="sticky map-idea-card"><textarea data-map-title="'+esc(node.id)+'" rows="4" aria-label="Sticky note text">'+esc(node.title||"")+'</textarea><div class="idea-card-foot"><span>Planning note · not in the game yet</span><button data-map-delete="'+esc(node.id)+'" aria-label="Remove note" title="Remove note">×</button></div></div>';
    const state=sticker?(node.status==="built"?"IN GAME":node.status==="confirmed"?"CONFIRMED":"NEW IDEA"):"IDEA";
    const category=sticker?COLMAP[sticker.col]:null;
    return '<article class="map-node '+(sticker?"game-note":"idea-note")+(UI.connectFrom===node.id?" connecting":"")+'" data-map-color="'+esc(node.color||"sunshine")+'" data-map-node="'+esc(node.id)+'" style="left:'+Math.max(0,Number(node.x)||0)+'px;top:'+Math.max(0,Number(node.y)||0)+'px"><div class="map-node-head"><button class="map-drag-handle" data-map-drag="'+esc(node.id)+'" aria-label="Move note: '+esc(node.title||"Untitled idea")+'" title="Drag to move · use arrow keys to nudge">⠿</button><span>'+state+'</span>'+(category?'<span class="map-category">'+category.ic+' '+esc(category.en)+'</span>':"")+'</div>'+body+'</article>';
  }).join("");
  const edges=(P.designMap.edges||[]).map(edge=>{
    const from=nodes.find(node=>node.id===edge.from),to=nodes.find(node=>node.id===edge.to);
    if(!from||!to)return "";
    const sx=(Number(from.x)||0)+MAP_NOTE_WIDTH/2,sy=(Number(from.y)||0)+78,tx=(Number(to.x)||0)+MAP_NOTE_WIDTH/2,ty=(Number(to.y)||0)+78,bend=Math.max(46,Math.abs(tx-sx)*.38);
    return '<path class="map-edge" data-edge-id="'+esc(edge.id||edge.from+"-"+edge.to)+'" d="M '+sx+' '+sy+' C '+(sx+bend)+' '+sy+', '+(tx-bend)+' '+ty+', '+tx+' '+ty+'" marker-end="url(#mapArrow)"/>';
  }).join("");
  const picker='<div class="picker"><button class="pick-btn map-character" data-act="menu" aria-haspopup="menu" aria-expanded="'+UI.menuOpen+'"><span class="em">'+(active?active.effect.char.e:"❔")+'</span><span>'+(active?esc(active.effect.char.n):"Character")+'</span><span>▾</span></button>'+menu+'</div>';
  const empty='<div class="map-empty"><span>🗺️</span><h2>Your idea map starts here</h2><p>Add a sticky note, write an idea, then drag notes to connect your game plan.</p><button class="map-tool primary" data-map-act="add-note">＋ Add your first note</button></div>';
  const categories=COLS.map(category=>'<button class="map-lens '+(P.stickers.some(sticker=>sticker.col===category.key)?"used":"")+'" data-col="'+category.key+'" title="'+esc(category.tip)+'"><span>'+category.ic+'</span><span>'+esc(category.en)+'</span></button>').join("");
  return '<div class="map-toolbar"><div class="map-tool-group"><button class="map-tool primary" data-map-act="add-note">＋ <span>Sticky note</span></button><button class="map-tool '+(UI.connectMode?"active":"")+'" data-map-act="connect" aria-pressed="'+!!UI.connectMode+'">↗ <span>'+(UI.connectFrom?"Choose next note":UI.connectMode?"Choose first note":"Connect steps")+'</span></button><span class="map-hint">Drag notes to plan · connect ideas in order</span></div><div class="map-tool-group map-zoom-controls">'+picker+'<label class="map-tool map-color-picker" title="Choose a sticky note color"><span>🎨</span><select id="mapNoteColor" aria-label="Sticky note color"><option value="sunshine">Sunshine</option><option value="coral">Coral</option><option value="mint">Mint</option><option value="sky">Sky</option><option value="lavender">Lavender</option></select></label><button class="map-tool icon-tool" data-map-act="zoom-out" aria-label="Zoom out" title="Zoom out">−</button><span class="map-zoom-value">'+Math.round(zoom*100)+'%</span><button class="map-tool icon-tool" data-map-act="zoom-in" aria-label="Zoom in" title="Zoom in">+</button><button class="map-tool" data-map-act="fit">▣ <span>Fit all</span></button></div></div><div class="map-viewport" id="mapViewport" aria-label="Design map canvas. Drag notes or drag empty space to move around"><div class="map-world-wrap" style="width:'+MAP_WIDTH*zoom+'px;height:'+MAP_HEIGHT*zoom+'px"><div class="map-world" id="mapWorld" style="width:'+MAP_WIDTH+'px;height:'+MAP_HEIGHT+'px;transform:scale('+zoom+')"><svg class="map-edges" viewBox="0 0 '+MAP_WIDTH+' '+MAP_HEIGHT+'" aria-hidden="true"><defs><marker id="mapArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z"/></marker></defs>'+edges+'</svg>'+(cards||empty)+'</div></div></div><div class="map-category-tray" aria-label="Game design elements"><span class="map-category-title">DESIGN LENSES</span>'+categories+'</div>';
}
function boardFoot(){
  const P=getProject();
  const newCount=P.stickers.filter(s=>s.status==="new").length;
  const dirty=P.stickers.some(s=>s.status==="ok"&&!built(s.id));
  const can=!newCount&&dirty&&P.phase!=="generating";
  return `<button class="btn" data-act="generate" ${can?"":"disabled"}>Make my game!</button>`;
}
function guideCalloutHTML(info, more){
if(info.mini)return `<span>👈 ${info.zh}</span><button class="btn" data-ok>OK</button>`;
  return `<div class="lab">${info.lab||("New element unlocked · "+info.en)}</div><h3>${info.ic} ${info.zh}</h3>${info.demo?`<div class="demo"><span style="background:var(--red);color:var(--red-ink)">New idea</span>→ tap →<span style="background:var(--yellow)">Confirmed</span></div><div class="demo"><span style="background:var(--red);color:var(--red-ink)">New idea</span>→ tap ✏️ → <span style="background:#fff6d8;color:var(--yel-ink);outline:1.5px dashed var(--orange)">Rewrite</span></div>`:""}<p>${info.tip}</p><div class="row"><button class="btn" data-ok>${more?"Next":"Got it"}</button>${more?`<button class="link" data-skip>Skip tour</button>`:""}</div>`;
}
function askHTML(gs, compact){
return `${ROBOT}<div><b>${gs?"You guessed “"+esc(gs)+"”. Did that happen?":"Was it different from what you imagined?"}</b><span>${compact?"Tap here and write what you saw":"Write to "+esc(botName())+" on the left"}</span></div><button class="x" data-act="dismissask" aria-label="Keep playing">×</button>`;
}
function sheetHTML(title, sub, body){
return `<div class="sheet narrow" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-h"><span class="t">${title}</span><span class="s">${sub}</span><button class="ibtn" data-close aria-label="Close">${X_ICON}</button></div><div class="sheet-b">${body}</div></div>`;
}
return { messageHTML, typingHTML, composerPlaceholder, journalHTML, assessmentHTML, paneLegendHTML, widgetHTML, projectsHTML, boardHTML, boardFoot, guideCalloutHTML, askHTML, sheetHTML };
}
