import { COLS, COLMAP, MODES, FEELINGS } from "../design/catalog.js";
import { sing, bestMatch, parseHero, parseAction } from "../design/parse.js";
import { optionsFor, questionFor, STEMS, COL_WORDS } from "../design/options.js";
import { analyzeDescription, readMechanism } from "../design/analyze.js";
import { buildDraft } from "../design/draft.js";
import { projectCharacters, isBuilt, buildProjectSpec, projectContext, updateAutomaticName, pendingChanges } from "../state/project.js";
import { saveBotName } from "../state/storage.js";
import { createVersionJournal, savePlaytestAssessment } from "../state/journal.js";
import { connectNotes, ensureStickerNode, removeStickerNode, setStickerNodeStatus } from "../state/design-map.js";
import { esc, GUIDE } from "../ui/templates.js";
import { writeProgram, runProgram } from "../game/program.js";

export function createConversation({ getProject, UI, renderer, render, renderBoard, renderPane, renderTabs, getBoardEl, autosave, game, botName, sheet, reduced }) {
const $=(s,r=document)=>r.querySelector(s);
let P=getProject();
let _id=Date.now()%100000; const uid=()=>"s"+(++_id);
const rot=()=>(Math.random()*5-2.5).toFixed(1)+"deg";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chars=()=>projectCharacters(P);
const built=id=>isBuilt(P,id);
const buildSpec=includeNew=>buildProjectSpec(P,includeNew);
const ctx=()=>projectContext(P);
const autoName=()=>updateAutomaticName(P);
const {msgNode,scrollDown,showTyping}=renderer;

/* ---------- conversation: one message at a time ---------- */
const Q=[];let pumping=false;let projectEpoch=0;let generationTimer=null;
function say(html,who="sprout"){Q.push({who,html});pump();}
async function pump(){
  if(pumping)return;pumping=true;const epoch=projectEpoch;renderLive();
  while(Q.length){
    const m=Q.shift();
    if(m.who==="sprout"){
      showTyping(true);
      const len=m.html.replace(/<[^>]+>/g,"").length;
      await sleep(reduced?250:Math.min(1700,520+len*16));
      if(epoch!==projectEpoch)return;
      showTyping(false);
    } else {await sleep(120);if(epoch!==projectEpoch)return;}
    P.chat.push(m);$("#msgs").appendChild(msgNode(m,true));scrollDown();
    if(Q.length&&Q[0].who==="sprout"){await sleep(260);if(epoch!==projectEpoch)return;}
  }
  if(epoch!==projectEpoch)return;
  pumping=false;renderLive(true);runOnboarding();
}

function renderLive(animate){
  if(pumping)return;
  renderer.renderLive(animate);
  if(P.phase==="generating"&&UI.gen&&UI.gen.guess===undefined&&!P.seen.includes("predict")&&!UI.onboardQ.includes("predict")){UI.onboardQ.push("predict");setTimeout(runOnboarding,400);}
  if(P.phase==="directions"&&!P.seen.includes("star")&&!UI.onboardQ.includes("star")){UI.onboardQ.push("star");setTimeout(runOnboarding,500);}
}


let onboardingOpen=false;
function guideTarget(key){
  if(key==="star")return document.querySelector(".pick");
  if(key==="predict")return document.querySelector(".gen-pick");
  if(key==="iterate"){const m=[...document.querySelectorAll("#msgs .msg.sprout")];return m[m.length-1]||null;}
  if(key==="boardintro")return document.querySelector("#boardColumn .column-head");
  if(!getBoardEl())return null;
  if(key==="howto")return getBoardEl().querySelector(".map-note");
  if(key==="gen")return getBoardEl().querySelector("#boardFoot .btn");
  return getBoardEl().querySelector(`[data-col="${key}"]`);
}
function startTour(){
  const lit=new Set(P.stickers.map(s=>s.col));
  UI.onboardQ=[...(P.stickers.length?["howto"]:[]),...COLS.map(c=>c.key).filter(k=>lit.has(k)),"gen"];UI.touring=true;runOnboarding();
}
function runOnboarding(){
  if(onboardingOpen||!UI.onboardQ.length||pumping)return;
  const key=UI.onboardQ[0];
  const el=guideTarget(key);
  if(!el){if(key==="star"||key==="predict"||!getBoardEl())return;UI.onboardQ.shift();return runOnboarding();}
  onboardingOpen=true;
  const info=GUIDE[key]||COLMAP[key];
  const inSheet=el.closest(".board-column");
  let block,spot;
  const par=inSheet?el.parentElement.closest(".board-foot"):null;
  if(inSheet){inSheet.classList.add("focusing");el.classList.add("focused");if(par)par.classList.add("focus-parent");}
  else{block=document.createElement("div");block.className="spot-block";spot=document.createElement("div");spot.className="spot";document.body.append(block,spot);}
  el.scrollIntoView({block:"center",behavior:"smooth"});
  const epoch=projectEpoch;
  setTimeout(()=>{
    if(epoch!==projectEpoch)return;
    const r=el.getBoundingClientRect();
    if(spot){const pad=8;Object.assign(spot.style,{left:r.left-pad+"px",top:r.top-pad+"px",width:r.width+pad*2+"px",height:r.height+pad*2+"px"});}
    const more=UI.touring&&UI.onboardQ.length>1;
    const co=renderer.makeCallout(info,more);
    document.body.appendChild(co);
    const w=co.offsetWidth,hh=co.offsetHeight,vw=innerWidth,vh=innerHeight;
    let x=r.right+18,y=r.top;
    if(x+w>vw-16){x=r.left;y=r.bottom+18;}
    if(y+hh>vh-16)y=Math.max(16,r.top-hh-18);
    co.style.left=Math.max(16,Math.min(x,vw-w-16))+"px";co.style.top=Math.max(16,Math.min(y,vh-hh-16))+"px";
    co.querySelector("[data-ok]").focus({preventScroll:true});
    const close=all=>{if(epoch!==projectEpoch)return;co.remove();if(block){block.remove();spot.remove();}if(inSheet){inSheet.classList.remove("focusing");el.classList.remove("focused");if(par)par.classList.remove("focus-parent");}
      if(!P.seen.includes(key))P.seen.push(key);UI.onboardQ.shift();if(all){UI.onboardQ=[];}if(!UI.onboardQ.length)UI.touring=false;onboardingOpen=false;
      if(key==="iterate"&&UI.afterIterate){const f=UI.afterIterate;UI.afterIterate=null;f();}
      runOnboarding();};
    co.querySelector("[data-ok]").onclick=()=>close(false);
    const sk=co.querySelector("[data-skip]");if(sk)sk.onclick=()=>close(true);
  },380);
}


/* ---------- actions ---------- */
/* notes count as soon as they are on the map; "by" tells the child's own notes ("mine") from the buddy's draft */
function addSticker(col,text,sub,effect,by="kid"){
  const s={id:uid(),col,text,sub,effect,status:"ok",by,rot:rot(),pop:true};
  P.stickers.push(s);
  ensureStickerNode(P,s);
  return s;
}
function noteAdded(msg){say(msg);P.phase="confirm";
  if(innerWidth<=767)UI.tab="board";
  render();}
/* onboarding: the answers become a first draft on all nine elements, and a first version you can play right away */
function startDraft(who,act,feel,idea,told){
  const h=parseHero(who),mood=FEELINGS.find(f=>f.k===feel);
  if(!told)say(`<b>${esc(who)}</b> · <b>${esc(act)}</b>${mood?` · feels ${mood.ic} <b>${mood.t}</b>`:""}`,"kid");
  const draft=buildDraft({who,act,feel,idea});
  const made=draft.notes.map(n=>addSticker(n.col,n.text,n.sub,n.effect,n.by));
  P.activeChar=made[0].id;
  let linked=0;
  for(const [from,to,label] of draft.links)if(connectNotes(P,made[from].id,made[to].id,label).result==="linked")linked++;
  autoName();
  const yours=made.filter(n=>n.by==="kid").length;
  say(`✨ Here's a first draft of <b>${esc(P.name||"your game")}</b>! I put <b>${made.length} notes</b> on all nine elements and drew <b>${linked} arrows</b> to show what causes what.`);
  if(draft.unsorted.length)say(`I wasn't sure where ${draft.unsorted.length>1?"these go":"this goes"}, so I left ${draft.unsorted.length>1?"them":"it"} out for now: ${draft.unsorted.map(u=>"“"+esc(u)+"”").join(", ")}. You can add ${draft.unsorted.length>1?"them":"it"} on the map.`);
  say(`It's only a draft. <b>You're the designer!</b> ${yours} ${yours>1?"notes are":"note is"} your own words; the ones marked ✨ are my guesses. Play it, then change anything on the map.`);
  buildVersion({news:[...P.stickers],guess:null,round:1,P:{}});
  for(const key of ["boardintro","howto"])if(!P.seen.includes(key)&&!UI.onboardQ.includes(key))UI.onboardQ.push(key);
  UI.fitMap=true;UI.feel=null;UI.idea=null;UI.ideaText="";
  if(innerWidth<=767)UI.tab="board";
  render();
}
/* the three onboarding answers, plus the optional description when there is one */
function doOpening(){
  const who=$("#inWho").value.trim(),act=$("#inDo").value.trim(),text=($("#inIdea")&&$("#inIdea").value||UI.ideaText||"").trim();
  const idea=text?analyzeDescription(text):UI.idea;
  const hero=who||idea&&idea.who,action=act||idea&&idea.act;
  if(text)say(esc(text),"kid");
  if(!hero||!action){
    UI.idea=idea;UI.ideaText="";
    say(hero?`What does the ${esc(parseHero(hero).n)} do? Pick one or write it in question 2.`:action?"Who is in your game? Pick one or write it in question 1.":"First, tell me who is in your game and what they do.");
    render();return;}
  startDraft(hero,action,UI.feel,idea,!!text);
}
/* a description typed into the chat box: fill in what it says, then ask only for what is missing */
function describe(t){
  t=t.trim();
  if(!t){say("Answer the three questions, or tell me your game idea in a few sentences.");render();return;}
  const idea=analyzeDescription(t);UI.ideaText="";
  say(esc(t),"kid");
  if(idea.who&&idea.act){startDraft(idea.who,idea.act,UI.feel,idea,true);return;}
  UI.idea=idea;
  say((!idea.who&&!idea.act?"Sounds fun! Now answer questions 1 and 2 below: who is in your game, and what do they do?"
    :idea.who?`I love it! What does the ${esc(parseHero(idea.who).n)} do? Answer question 2 below.`
    :"I love it! Who is in your game? Answer question 1 below.")+(idea.mechanisms.length?" Then I'll add the rest of your idea.":""));
  render();
}
/* "＋" on an element's cluster: the child's note goes straight onto the map */
function addNote(col,text){
  text=String(text||"").trim().replace(/\s+/g," ");if(!text)return null;
  let s;
  if(col==="character"){const h=parseHero(text);s=addSticker(col,h.e+" "+h.n,"New character",{char:{e:h.e,n:h.n}});}
  else{const r=readMechanism({col,text},ctx());s=addSticker(col,r.text,r.sub,r.effect);}
  autoName();render();autosave();
  return s;
}
/* rewriting a note makes it the child's own; the game picks it up on the next update */
function editableText(s){return s.col==="character"?s.text.replace(/^\S+\s/,""):s.text.replace(/^“(.*)”$/,"$1");}
function reinterpret(s,t){
  if(s.col==="character"){const h=parseHero(t);s.text=h.e+" "+h.n;s.effect={char:{e:h.e,n:h.n}};return;}
  if(s.col==="objectives"&&s.effect&&s.effect.mode){const a=parseAction(t);s.text="“"+t+"”";s.sub=MODES[a.mode].obj(a.item.n);s.effect={mode:a.mode,item:a.item};return;}
  s.text=t;const context=ctx(),opts=optionsFor(s.col,context);
  const {best,score}=bestMatch(t,opts,context);
  const exact=opts.find(o=>o.t===t);
  if(exact){s.sub=null;s.effect=exact.e;}
  else if(score>=1){s.sub="I read it as: "+opts[best].t;s.effect=opts[best].e;}
  else{s.sub="This prototype can't build this one yet";s.effect=null;}
}
function saveEdit(id){
  const s=P.stickers.find(x=>x.id===id),ta=getBoardEl()&&getBoardEl().querySelector(`[data-edit-text="${id}"]`);UI.editing=null;
  if(!s||!ta)return render();
  const t=ta.value.trim().replace(/\s+/g," ");
  if(!t){delSticker(id);return;}
  if(t!==editableText(s)){
    const previousId=s.id;
    reinterpret(s,t);
    const old=s.id;s.id=uid();if(P.activeChar===old)P.activeChar=s.id;   // new id so the board treats it as a change to rebuild
    s.status="ok";s.by="kid";s.pop=true;if(built(old))s.replaces=old;
    ensureStickerNode(P,s,previousId);
    if(UI.focus&&UI.focus.note===previousId)UI.focus={note:s.id};
    autoName();
  }
  render();autosave();
}
function delSticker(id){
  const i=P.stickers.findIndex(x=>x.id===id);if(i<0)return;
  const s=P.stickers[i];
  if(s.col==="character"&&chars().length===1&&!P.versions.length){say("Your game needs a hero, so let's keep this one.");render();return;}
  P.stickers.splice(i,1);
  removeStickerNode(P,id);
  if(P.activeChar===id){const c=chars()[0];P.activeChar=c?c.id:null;}
  if(UI.focus&&UI.focus.note===id)UI.focus=null;
  render();autosave();
}
function setComposer(v){const ta=$("#composer");ta.value=v;autosize();}
function pickDirection(col,silent){
  const c=ctx(),options=optionsFor(col,c);
  const predicted=P.prediction&&P.prediction.gap===col&&P.prediction.idx!==null?P.prediction.idx:null;
  UI.choice={col,q:questionFor(col,c),options,predicted,stem:STEMS[col](c)};
  P.phase="choice";
  if(!silent){say(esc(UI.choice.q),"kid");say(`OK! I started the sentence for you. Finish it below, or tap an idea:<br>“${esc(UI.choice.stem)}…”`);}
  render();
  if(!silent){setComposer(UI.choice.stem);const ta=$("#composer");ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);}
}
function pickOption(i){
  const c=UI.choice,o=c.options[i];
  setComposer("");
  say(esc(c.stem)+esc(o.t.replace(/^.*?: /,"")),"kid");
  addSticker(c.col,o.t,null,o.e);
  noteAdded(`I added a note to <b>${COLMAP[c.col].en}</b> on the map. Tap “Update my game” to try it.`);
}
function matchFree(t,quiet){
  const c=UI.choice,body=t.startsWith(c.stem)?t.slice(c.stem.length):t;
  let best=-1,score=0;
  {const m=bestMatch(body,c.options,ctx());best=m.best;score=m.score;}
  if(!quiet)say(esc(t),"kid");
  if(score>=1){const o=c.options[best];addSticker(c.col,t,"I read it as: "+o.t,o.e);
    noteAdded(`I read it as “${esc(o.t)}” and added a note to <b>${COLMAP[c.col].en}</b>. If that's not right, tap the note and ✏️ edit it.`);}
  else{addSticker(c.col,t,"This prototype can't build this one yet",null);
    noteAdded("Cool idea! I can't build that one yet, though. I put it on the map so it stays in your design, but the game won't change for now.");}
}
function promptText(t){
  const col=Object.keys(COL_WORDS).find(k=>COL_WORDS[k].some(w=>t.toLowerCase().includes(w)));
  if(!col){say(esc(t),"kid");say("Hmm, I'm not sure which part of the board that goes in. Want to tap one of the ideas first, so we can work it out together?");render();return;}
  pickDirection(col,true);
  matchFree(t);
}
function nameBot(t){
  let n=t.replace(/^(叫|你叫|就叫|call you|your name is|you're|you are|name:?)\s*/i,"").replace(/[。！!，,.]/g,"").trim().slice(0,14);n=n.charAt(0).toUpperCase()+n.slice(1);
  if(!n)return;
  say(esc(n),"kid");P.botName=n;saveBotName(n);
  say(`${esc(n)}! I love that name. From now on, I'm <b>${esc(n)}</b>.`);
  say("Today we'll make a game you can really play. Answer three quick questions below, and I'll sketch a first draft for you to change.");
  P.phase="opening";render();
}
function send(){
  const ta=$("#composer"),t=ta.value.trim();if(!t||ta.disabled)return;
  if(P.phase==="naming"){setComposer("");nameBot(t);}
  else if(P.phase==="opening"){setComposer("");describe(t);}
  else if(P.phase==="choice"){if(t===UI.choice.stem.trim())return;setComposer("");matchFree(t);}
  else if(P.phase==="playtest"){setComposer("");feelReply(t);}
  else if(["directions","concept","confirm"].includes(P.phase)){setComposer("");UI.ownText=t;UI.sel=null;pickGo();}
}
function autosize(){const ta=$("#composer");ta.style.height="auto";ta.style.height=Math.min(140,ta.scrollHeight)+"px";}


/* ---------- generation, with the gap-revealing prediction ---------- */
/* The prediction question always targets a GAP: something closely tied to what the kid just added,
   but deliberately NOT in the generated code because no sticker says it yet. Playing then reveals the gap. */
const RELATED={character:["rules"],objectives:["rules","outcome"],rules:["outcome","conflict","resources"],procedures:["boundaries","rules"],
  conflict:["resources","rules","outcome"],resources:["outcome","rules"],boundaries:["conflict","outcome"],outcome:["objectives","conflict"],
  players:["rules","outcome"],objectives2:["outcome"]};
function gapQuestion(col,c,t){
  const hero=c.hero.n,it=c.item.n,it1=sing(it);
  return ({
    rules:c.mode==="dodge"?`When a ${it1} hits the ${hero}, what will the game do?`:c.mode==="jump"?`When the ${hero} bumps into a ${it1}, what will the game do?`:c.mode==="shoot"?`When a bubble hits a ${it1}, what will the game do?`:`When the ${hero} catches a ${it1}, what will the game do?`,
    outcome:`With ${/^(this|the new)/.test(t)?t:"“"+t+"”"}, how will the game end?`,
    conflict:`With “${t}”, will anything show up to cause trouble?`,
    resources:`With “${t}”, can the ${hero} run out of lives or time?`,
    boundaries:`If the ${hero} keeps running right, what happens at the edge of the screen?`,
    procedures:`When you play “${t}”, how will you control the ${hero}?`,
    players:`Can you play “${t}” with a friend?`,
    objectives:`With “${t}”, what do you need to do to win?`
  })[col];
}
function submitGuess(){const g=UI.gen;if(!g||g.guess!==undefined||pumping)return;
  const t=(g.typed||"").trim();
  if(t){g.picked=null;g.guess=t;}else if(g.sel!=null){g.picked=g.sel;g.guess=g.P.a[g.sel].t;}else return;
  say(esc(g.guess),"kid");   // the guess stays in the chat history
  if(!g.done)g.status="Just a moment…";
  render();if(g.done){const epoch=projectEpoch;setTimeout(()=>{if(epoch===projectEpoch)finishGen();},600);}}
/* a guess is phrased as what the kid expects to SEE; none of these are in the game yet */
function guessLabel(o,c){const e=o.e||{},h="the "+c.hero.n,it="the "+sing(c.item.n);
  if(e.onCatch==="score"||e.dodgeScore||e.jumpScore)return "you get 1 point";
  return ({grow:h+" grows and glows",bounce:it+" bounces away",split:it+" splits in two",stun:h+" gets dizzy",shrink:h+" shrinks",reset:"start over"})[e.onCatch||e.onHit]||o.t.replace(/^.*?: /,"");}
function predictionFor(news,c){
  const lit=new Set(P.stickers.filter(s=>s.status==="ok").map(s=>s.col));
  const last=news[news.length-1];
  if(!last)return {q:`You took something off the map. What will be different when you play?`,a:CHANGE_GUESSES};
  const src=last.col==="objectives"&&last.effect&&!last.effect.mode?"objectives2":last.col;
  let col=(RELATED[src]||[]).find(k=>!lit.has(k));
  if(!col)col=["rules","outcome","conflict","resources","boundaries","procedures","objectives","players"].find(k=>!lit.has(k));
  if(!col)return {q:`You changed “${last.text.replace(/[“”]/g,"")}”. What will be different when you play?`,a:CHANGE_GUESSES};
  const raw=last.text.replace(/[“”]/g,"");
  const t=raw.length>24?({rules:"this new rule",conflict:"the new challenge",resources:"the new resource",procedures:"the new controls",boundaries:"the new edges",outcome:"the new ending",players:"the new way to play",character:"the new character",objectives:"the new goal"})[last.col]||"this new idea":raw;
  return {gap:col,q:gapQuestion(col,c,t),a:optionsFor(col,c).map((o,i)=>({pic:o.pic,t:guessLabel(o,c),idx:i})).slice(0,3)};
}


const CHANGE_GUESSES=[{pic:"😬",t:"it gets harder"},{pic:"😌",t:"it gets easier"},{pic:"✨",t:"something new shows up"}];

function generate(){
  if(P.phase==="generating"||!pendingChanges(P))return;
  const news=P.stickers.filter(s=>!built(s.id));
  const c=ctx(),Pq=predictionFor(news,c),round=P.versions.length+1;
  const lines=["Turning your map into rules…",`Putting the ${c.hero.n} on the canvas…`,"Adding a breathing animation…","Hooking up the keyboard and mouse…","Checking edges and bumps…"];
  UI.gen={P:Pq,round,news,picked:null,done:false,status:lines[0]};
  P.phase="generating";UI.tab="create";
  say(P.versions.length?"Let's change your game! Quick quiz:":"Let's make your game! Quick quiz:");
  say(esc(Pq.q));
  render();
  let k=0;const generationState=UI.gen;
  const tick=setInterval(()=>{k++;
    if(UI.gen!==generationState){clearInterval(tick);return;}
    if(k<lines.length)UI.gen.status=lines[k];
    else{clearInterval(tick);UI.gen.done=true;UI.gen.status="Your game is ready!";if(UI.gen.guess!==undefined){finishGen();return;}UI.gen.status="Your game is ready! Make your guess first, then go play.";}
    // update the status in place so a guess being typed isn't wiped
    const st=document.querySelector(".gen-status"),sh=document.querySelector(".shimmer");
    if(st){st.textContent=UI.gen.status;if(sh)sh.classList.toggle("done",UI.gen.done);}else renderLive();
  },900);generationTimer=tick;
}
function finishGen(){
  const g=UI.gen;if(!g||!g.done)return;UI.gen=null;
  if(generationTimer){clearInterval(generationTimer);generationTimer=null;}
  buildVersion(g);
  render();autosave();
}
/* everything on the map goes into the new version, including the first draft, which skips the guessing quiz */
function buildVersion(g){
  const first=g.round===1;
  P.lastBuilt=P.stickers.map(s=>s.id);
  P.stickers.forEach(s=>{delete s.replaces;});
  P.stickers.forEach(s=>setStickerNodeStatus(P,s.id,"built"));
  /* the program written from the map is the code that runs: the game plays exactly what it produces */
  const program=writeProgram(P).source,spec=runProgram(program);
  const items=P.stickers.filter(s=>s.status==="ok"&&s.effect&&s.col!=="character").map(s=>s.text);
  P.versions.push({n:g.round,spec,program,items,summary:g.news.map(s=>s.text).join(" · "),journal:createVersionJournal(g.news,g.guess),snapshot:JSON.parse(JSON.stringify({stickers:P.stickers,activeChar:P.activeChar,lastBuilt:P.lastBuilt,designMap:P.designMap}))});
  const guess=g.guess!==undefined?g.guess:null;
  P.prediction=g.P.gap?{round:g.round,gap:g.P.gap,idx:g.picked!==null?g.P.a[g.picked].idx:null,guess}:guess?{round:g.round,gap:null,idx:null,guess}:null;
  P.phase="playtest";P.feel=null;P.found=null;UI.explained=null;UI.paneOpen=false;UI.tab="create";UI.firstOpen=first;UI.pendingSpec=null;UI.asked=false;clearTimeout(UI.askTimer);
  game.load(spec);
  say(guess?`Got it! ${first?"Your game is ready":"Your game is updated"}. Go play and see if you guessed right.`:(first?"Your first draft is playable 🎉 Tap the card below to try it.":"Updated! Tap the card below to play the new version."));
}
/* picking an idea: a card only gets highlighted; "This one!" (or a typed idea) moves on */
const CONCEPT={
  rules:["The “if… then…” of your game: when something happens, what happens next.","Rules make the game react to everything you do."],
  outcome:["How the game ends: how you win, and how you lose.","It shows players what they're working toward."],
  conflict:["Things that get in your way, so the goal isn't too easy.","It makes the game more exciting."],
  resources:["Things that can run out, like lives, time or coins.","They make players careful, so every move matters."],
  procedures:["What players use to control the game, and how.","When the controls feel right, the game feels great to play."],
  boundaries:["Where the edges of the game world are, and what happens there.","They tell players where they can and can't go."],
  players:["Who plays: just you, or you and friends.","With two players, you can team up or compete."],
  objectives:["What players need to do.","A clear goal tells players what to do."]
};
function pickGo(){
  if(pumping)return;
  const typed=(UI.ownText||"").trim(),pr=P.prediction;let col,text=null;
  if(!typed&&UI.sel==="guess"&&pr&&pr.guess){
    UI.sel=null;say(`Put “${esc(pr.guess)}” into the game!`,"kid");
    pickDirection(pr.gap,true);
    if(pr.idx!==null){const o=UI.choice.options[pr.idx];addSticker(pr.gap,o.t,null,o.e);noteAdded("Done! It's on the map. Tap “Update my game”, and the next version will work like this.");}
    else matchFree(pr.guess,true);
    return;}
  if(typed){col=Object.keys(COL_WORDS).find(k=>COL_WORDS[k].some(w=>typed.toLowerCase().includes(w)));text=typed;say(esc(typed),"kid");
    if(!col){UI.ownText="";say("Interesting idea! Can you say a bit more? Like: when something touches something, what happens?");render();return;}}
  else if(UI.sel){col=UI.sel;const d=directions().find(x=>x.col===col&&!x.sel)||P.saved.find(x=>x.col===col);say(esc(d?d.q:questionFor(col,ctx())),"kid");}
  else return;
  UI.concept={col,text};UI.sel=null;UI.ownText="";
  if(UI.explained!==col)say(`This one is about <b>${COLMAP[col].zh}</b>. ${CONCEPT[col][0]}`);
  conceptDesign();
}
function conceptDesign(){
  const c=UI.concept;if(!c)return;UI.concept=null;
  P.saved=P.saved.filter(v=>v.col!==c.col);
  if(c.text){pickDirection(c.col,true);matchFree(c.text,true);return;}
  pickDirection(c.col,true);
  say(`OK! I started the sentence for you. Finish it, or tap an idea:<br>“${esc(UI.choice.stem)}…”`);render();
  setComposer(UI.choice.stem);const ta=$("#composer");ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);
}
function conceptOther(){if(pumping)return;UI.concept=null;P.phase="directions";say("OK, let's look at something else:");render();}

/* the play pane opens only when the kid taps the game card */
function openPane(){
  UI.paneOpen=true;UI.previewOpen=true;UI.tab="preview";if(UI.firstOpen){UI.reveal=true;UI.firstOpen=false;}
  renderPane();renderTabs();renderLive();
  if(UI.pendingSpec){game.load(UI.pendingSpec);UI.pendingSpec=null;}
  setTimeout(()=>$("#cv").focus({preventScroll:true}),60);
  if(P.phase==="playtest"&&!UI.asked){clearTimeout(UI.askTimer);UI.askTimer=setTimeout(askFeel,ASK_AFTER);}
}
/* no "done" button: after a while, the game itself asks how it went and points to the chat box */
const ASK_AFTER=5000;
function askFeel(){
  if(P.phase!=="playtest"||UI.asked)return;UI.asked=true;
  const gs=P.prediction&&P.prediction.guess;
  say(gs?`You guessed “${esc(gs)}”. Did that really happen?`:"How was it? Was it different from what you imagined? What was different?");
  renderer.showAsk(gs);
  $(".composer").classList.add("nudge");
  renderPane();
}
function clearAsk(){const a=document.querySelector("#pane .ask");if(a)a.remove();$(".composer").classList.remove("nudge");}
/* the kid's answer: respond to the feeling first, then reveal the gap, then the directions */
const FEELS=[
  {k:"hard",re:/hard|die|died|dead|lose|lost|too fast|can'?t|annoying|tired|difficult|难|死|输|太快/i,say:"A bit hard, right?"},
  {k:"easy",re:/easy|boring|bored|too slow|simple|no challenge|简单|无聊/i,say:"Too easy, huh?"},
  {k:"fun",re:/fun|cool|awesome|love|like|great|haha|lol|nice|好玩|喜欢/i,say:"Glad it's fun!"}
];
const NOTHING=/nothing|didn'?t|doesn'?t|\bno\b|\bnot\b|never|just|only|disappear|same|没有|没反应|只是|就消失/i;
const MISSING={rules:"what happens when things touch",outcome:"when the game ends",conflict:"what gets in the way",resources:"what can run out",boundaries:"what happens at the edge",procedures:"how to control it",players:"who plays",objectives:"how to win"};
function feelReply(t){
  if(UI.askTimer)clearTimeout(UI.askTimer);UI.asked=true;clearAsk();
  say(esc(t),"kid");
  const lit=new Set(P.stickers.filter(s=>s.status==="ok").map(s=>s.col)),pr=P.prediction;
  const f=FEELS.find(x=>x.re.test(t));P.feel=f?f.k:null;
  let col=null,why;
  if(pr&&pr.guess&&pr.gap&&!lit.has(pr.gap)){
    // the guess didn't happen: say why, then name the concept
    col=pr.gap;
    const o=P.stickers.find(s=>s.col==="objectives"&&s.effect&&s.effect.mode),act=o?o.text.replace(/[“”]/g,""):"this game";
    say(NOTHING.test(t)?"Right!":"Look closer. It doesn't actually happen.");
    why=`That's because you only said “${esc(act)}”. You didn't say ${MISSING[col]} yet. A computer only does what you tell it clearly.`;
  }else{
    col=Object.keys(COL_WORDS).find(k=>!lit.has(k)&&COL_WORDS[k].some(w=>t.toLowerCase().includes(w)))||(pr&&pr.gap&&!lit.has(pr.gap)&&NOTHING.test(t)?pr.gap:null);
    say(col?"You spotted it!":f?f.say:"Got it!");
  }
  P.found=col;
  savePlaytestAssessment(P,{response:t,feeling:P.feel,discovery:col});
  renderPane();autosave();
  const rest=()=>{
  if(why)say(why);
  if(col){const [what,impact]=CONCEPT[col];say(`In games, this is called <b>${COLMAP[col].zh}</b>. ${what} ${impact}`);UI.explained=col;}
  say(pr&&pr.guess&&pr.gap&&col===pr.gap?`Want to really put your guess, “${esc(pr.guess)}”, into the game? Or check out other ideas:`:"I've got a few ideas. Want to try one?");
  UI.sel=null;UI.ownText="";P.phase="directions";render();autosave();};
  // first round only: right after the reaction, the "iterating is normal" callout; the robot carries on once it's closed
  if(!P.seen.includes("iterate")&&!UI.onboardQ.includes("iterate")){UI.afterIterate=rest;UI.onboardQ.push("iterate");P.phase="reacting";render();}
  else rest();
}
function directions(){
  const c=ctx(),lit=new Set(P.stickers.filter(s=>s.status==="ok").map(s=>s.col));
  const FEEL_ORDER={hard:["resources","boundaries","procedures"],easy:["conflict","resources","outcome"],fun:["outcome","players","conflict"]};
  const TAG={hard:"make it easier",easy:"add a challenge",fun:"more fun"};
  const base=["rules","outcome","conflict","resources","procedures","boundaries","objectives","players"];
  const card=(k,tag,kind)=>({col:k,ic:COLMAP[k].ic,en:COLMAP[k].en,zh:COLMAP[k].zh,q:questionFor(k,c),why:tag||"",isGap:kind==="gap"||kind==="found"});
  const out=[];const add=(k,tag,kind)=>{if(k&&!lit.has(k)&&!out.some(o=>o.col===k)&&out.length<3)out.push(card(k,tag,kind));};
  const pr=P.prediction;
  if(pr&&pr.guess&&pr.gap&&!lit.has(pr.gap))out.push({col:pr.gap,sel:"guess",q:`Put “${pr.guess}” into the game`,why:""});
  add(P.found,"you found it","found");
  add(pr&&pr.gap,"","gap");
  (FEEL_ORDER[P.feel]||[]).forEach(k=>add(k,TAG[P.feel]));
  base.forEach(k=>add(k));
  for(const k of ["procedures","conflict","rules"]){if(out.length>=3)break;if(out.some(o=>o.col===k))continue;
    out.push({col:k,ic:COLMAP[k].ic,en:COLMAP[k].en,zh:COLMAP[k].zh,q:k==="procedures"?"Do the controls feel good? How would you change them?":k==="conflict"?"What else could make it more challenging?":"What else do you want to happen?",why:""});}
  return out;
}

function greet(){
  if(!P.botName){P.phase="naming";say("Hi! I'm your game design robot buddy.");say("But I don't have a name yet. What do you want to call me? Type a name below!");return;}
  say(`Hi! I'm <b>${esc(P.botName)}</b>, your game design buddy.`);
  say("Today we'll make a game you can really play. Answer three quick questions below, and I'll sketch a first draft for you to change.");
}
function renameBot(){
  const m=sheet("Rename your buddy","The new name works right away",`<input class="name-in" id="botIn" maxlength="14" value="${esc(botName())}" aria-label="Robot's name"><div class="row"><button class="btn" id="botOk">That's it!</button></div>`);
  const i=m.querySelector("#botIn");i.focus();i.select();
  const ok=()=>{const n=i.value.trim().slice(0,14);if(!n)return;P.botName=n;saveBotName(n);m.remove();say(`Sure! From now on, I'm <b>${esc(n)}</b>!`);render();};
  m.querySelector("#botOk").onclick=ok;i.addEventListener("keydown",e=>{if(e.key==="Enter")ok();});
}

function cancelChoice(){
  setComposer("");
  P.phase=P.versions.length?(pendingChanges(P)?"confirm":"directions"):"opening";
  render();
}
function resetProject(project){
  projectEpoch++;
  Q.length=0;
  pumping=false;
  if(generationTimer){clearInterval(generationTimer);generationTimer=null;}
  document.querySelectorAll(".callout,.spot,.spot-block").forEach(el=>el.remove());
  document.querySelectorAll(".focusing,.focused,.focus-parent").forEach(el=>el.classList.remove("focusing","focused","focus-parent"));
  onboardingOpen=false;UI.afterIterate=null;UI.touring=false;
  P=project;
  showTyping(false);
}
return {
  say, renderLive, runOnboarding, startTour, doOpening, describe, send, autosize,
  saveEdit, delSticker, pickOption, submitGuess,
  generate, finishGen, pickGo, conceptDesign, conceptOther, openPane,
  clearAsk, directions, editableText, setComposer, greet, renameBot,
  addNote, cancelChoice, resetProject,
  isPumping:()=>pumping, isOnboardingOpen:()=>onboardingOpen
};
}
