import "./game/engine.js";
import { exportStandaloneGame } from "./game/export.js";
import { createProject, restoreProject, createUIState, projectCharacters, isBuilt } from "./state/project.js";
import { readBotName, readProjects, saveProject, clearSavedData, resetFromLocation } from "./state/storage.js";
import { esc } from "./ui/templates.js";
import { createRenderer } from "./ui/render.js";
import { createConversation } from "./conversation/flow.js";
import { bindEvents } from "./events/bind.js";
const $=(s,r=document)=>r.querySelector(s);
/* ?reset or #reset in the address wipes saved projects before anything loads */
resetFromLocation();
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- state ---------- */
const botName=()=>P.botName||readBotName()||"Robo";
function fresh(){return createProject(readBotName()||"");}
let P=fresh();
const UI=createUIState(innerWidth);
function renderLive(animate){flow.renderLive(animate);}

/* ---------- header / project menu / pane ---------- */
const allProjects=()=>readProjects();
const renderer=createRenderer({getProject:()=>P,UI,botName,directions:()=>flow.directions(),chars:()=>projectCharacters(P),built:id=>isBuilt(P,id),editableText:s=>flow.editableText(s),allProjects});
const {renderMsgs,renderJournal,renderProjects,renderBar,renderPane,renderTabs}=renderer;
function render(){P.updated=Date.now();renderProjects();renderBar();renderPane();renderTabs();renderJournal();renderLive();renderBoard();}

/* ---------- central design map ---------- */
let boardEl=null;
function renderBoard(){
  boardEl=renderer.renderBoard(boardEl);
  P.stickers.forEach(s=>s.pop=false);
  flow.runOnboarding();
}
function rollback(){
  if(P.versions.length<2||flow.isPumping())return;
  const gone=P.versions.pop(),prev=P.versions[P.versions.length-1],snap=JSON.parse(JSON.stringify(prev.snapshot));
  clearTimeout(UI.askTimer);flow.clearAsk();UI.pendingSpec=null;UI.paneOpen=true;UI.asked=false;
  P.stickers=snap.stickers;P.activeChar=snap.activeChar;P.lastBuilt=snap.lastBuilt;P.designMap=snap.designMap||P.designMap;P.prediction=null;P.phase="directions";
  flow.say(`Back to the last version. “${esc(gone.summary)}” is off the board now. Try bold ideas. You can always add it back.`);
  render();autosave();game.load(prev.spec);
}

/* ---------- projects + export ---------- */
function autosave(){
  if(!P.stickers.length&&!P.designMap.nodes.length)return false;
  const ok=saveProject(P);renderProjects();return ok;
}
function toast(t){const el=document.createElement("div");el.className="toast";el.textContent=t;document.body.appendChild(el);setTimeout(()=>el.remove(),2200);}
function loadProject(p){
  P=restoreProject(p,readBotName()||"");flow.resetProject(P);
  UI.onboardQ=[];UI.gen=null;UI.connectMode=false;UI.connectFrom=null;
  const v=P.versions[P.versions.length-1];
  const awaitingPlay=!!v&&P.phase==="playtest";
  UI.journalOpen=true;UI.previewOpen=!!v||UI.previewOpen;
  UI.paneOpen=!!v&&!awaitingPlay;UI.tab=awaitingPlay?"create":(v?"preview":"create");
  renderMsgs();render();
  clearTimeout(UI.askTimer);UI.asked=false;UI.pendingSpec=null;
  if(v)game.load(v.spec);else game.clear();
}
function startFreshProject(resetAll){
  clearTimeout(UI.askTimer);flow.clearAsk();UI.pendingSpec=null;
  P=fresh();flow.resetProject(P);
  UI.connectMode=false;UI.connectFrom=null;
  if(resetAll){P.botName="";UI.expanded=new Set();}
  UI.journalOpen=true;
  UI.onboardQ=[];UI.gen=null;UI.choice=null;UI.tab="create";UI.paneOpen=false;
  game.clear();renderMsgs();render();flow.greet();
}
/* wipe everything (robot name, projects) and start like a first visit; asks for a second tap */
let restartArmed=0;
function restartAll(){
  const b=document.querySelector("[data-act=restart]");
  if(Date.now()-restartArmed>3000){restartArmed=Date.now();if(b){b.classList.add("arm");b.textContent="Tap again to delete all projects and start over";}
    setTimeout(()=>{const x=document.querySelector("[data-act=restart]");if(x&&Date.now()-restartArmed>=3000){x.classList.remove("arm");x.textContent="↺ Start over";}},3100);return;}
  restartArmed=0;clearSavedData();startFreshProject(true);
}
function newProject(){
  if(autosave())toast("This project is already saved");
  startFreshProject(false);
}
function sheet(title,sub,body){
  const m=renderer.createSheet(title,sub,body);
  m.addEventListener("click",e=>{if(e.target===m||e.target.closest("[data-close]")){m.remove();if(m.id==="projectManager")$("[data-act=projects]")?.setAttribute("aria-expanded","false");}});
  $("#layer").appendChild(m);return m;
}
function openProjects(){
  const existing=$("#projectManager");
  const button=$("[data-act=projects]");
  if(existing){existing.remove();button?.setAttribute("aria-expanded","false");return;}
  const modal=sheet("Projects","Switch games or start a new one",`<div id="projectManagerBody"></div>`);
  modal.id="projectManager";modal.classList.add("project-manager");button?.setAttribute("aria-expanded","true");renderProjects();
  modal.querySelector?.("[data-act=new]")?.focus();
}
function exportHTML(){
  exportStandaloneGame(P.versions[P.versions.length-1],P.name,{sheet,toast,esc});
}

const game=window.TinkerEngine($("#cv"));
const flow=createConversation({getProject:()=>P,UI,renderer,render,renderBoard,renderPane,renderTabs,getBoardEl:()=>boardEl,autosave,game,botName,sheet,reduced});
bindEvents({getProject:()=>P,UI,flow,render,renderBoard,renderProjects,renderTabs,renderLive,getBoardEl:()=>boardEl,autosave,toast,allProjects,loadProject,exportHTML,newProject,restartAll,rollback,openProjects});

/* ---------- brand logo: token hops at uneven moments ---------- */
renderer.renderBrand();
if(!reduced){const all=[...document.querySelectorAll(".pz")];
  (function go(){const n=Math.random()<.28?2:1;for(let k=0;k<n;k++){const b=all[Math.floor(Math.random()*all.length)];
    b.style.setProperty("--h",(-5-Math.random()*9).toFixed(1)+"px");b.style.setProperty("--r",(Math.random()*30-15).toFixed(0)+"deg");b.style.setProperty("--d",(.32+Math.random()*.4).toFixed(2)+"s");
    b.classList.remove("hop","wig");void b.getBoundingClientRect();b.classList.add(Math.random()<.2?"wig":"hop");}
    setTimeout(go,Math.random()<.3?120+Math.random()*220:450+Math.random()*1500);})();}
/* robot blinks at uneven intervals */
if(!reduced)(function blink(){document.querySelectorAll(".eye").forEach(e=>{e.style.transform="scaleY(.2)";});
  setTimeout(()=>document.querySelectorAll(".eye").forEach(e=>e.style.transform=""),120);setTimeout(blink,1800+Math.random()*3500);})();

/* ---------- boot ---------- */
render();flow.greet();
