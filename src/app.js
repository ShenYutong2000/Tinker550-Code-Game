import "./game/engine.js";
import { exportStandaloneGame } from "./game/export.js";
import { createProject, restoreProject, createUIState, projectCharacters, isBuilt } from "./state/project.js";
import { readBotName, readProjects, saveProject, clearSavedData, resetFromLocation } from "./state/storage.js";
import { esc } from "./ui/templates.js";
import { createRenderer } from "./ui/render.js";
import { createConversation } from "./conversation/flow.js";
import { bindEvents } from "./events/bind.js";
(function(){
"use strict";
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

/* ---------- sidebar / header / pane ---------- */
const allProjects=()=>readProjects();
const renderer=createRenderer({getProject:()=>P,UI,botName,directions:()=>flow.directions(),chars:()=>projectCharacters(P),built:id=>isBuilt(P,id),editableText:s=>flow.editableText(s),allProjects});
const {renderMsgs,renderSide,renderBar,renderPane,renderTabs}=renderer;
function render(){P.updated=Date.now();renderSide();renderBar();renderPane();renderTabs();renderLive();renderBoard();}

/* ---------- board modal ---------- */
let boardEl=null;
function renderBoard(){
  boardEl=renderer.renderBoard(boardEl);
  if(!UI.boardOpen)return;
  P.stickers.forEach(s=>s.pop=false);
  flow.runOnboarding();
}
function rollback(){
  if(P.versions.length<2||flow.isPumping())return;
  const gone=P.versions.pop(),prev=P.versions[P.versions.length-1],snap=JSON.parse(JSON.stringify(prev.snapshot));
  clearTimeout(UI.askTimer);flow.clearAsk();UI.pendingSpec=null;UI.paneOpen=true;
  P.stickers=snap.stickers;P.activeChar=snap.activeChar;P.lastBuilt=snap.lastBuilt;P.prediction=null;P.phase="directions";
  flow.say(`Back to the last version. “${esc(gone.summary)}” is off the board now. Try bold ideas. You can always add it back.`);
  render();autosave();game.load(prev.spec);
}

/* ---------- projects + export ---------- */
function autosave(){
  if(!P.stickers.length)return false;
  const ok=saveProject(P);renderSide();return ok;
}
function toast(t){const el=document.createElement("div");el.className="toast";el.textContent=t;document.body.appendChild(el);setTimeout(()=>el.remove(),2200);}
function loadProject(p){
  P=restoreProject(p,readBotName()||"");flow.resetProject(P);
  UI.boardOpen=false;UI.onboardQ=[];UI.gen=null;UI.paneOpen=!!P.versions.length;UI.tab=P.versions.length?"preview":"create";
  renderMsgs();render();
  const v=P.versions[P.versions.length-1];
  clearTimeout(UI.askTimer);UI.asked=false;UI.pendingSpec=null;
  if(v&&P.phase==="playtest"){UI.paneOpen=false;UI.tab="create";UI.pendingSpec=v.spec;game.clear();render();}
  else if(v)game.load(v.spec);else game.clear();
}
/* wipe everything (robot name, projects) and start like a first visit; asks for a second tap */
let restartArmed=0;
function restartAll(){
  const b=document.querySelector("[data-act=restart]");
  if(Date.now()-restartArmed>3000){restartArmed=Date.now();if(b){b.classList.add("arm");b.textContent="Tap again to delete all projects and start over";}
    setTimeout(()=>{const x=document.querySelector("[data-act=restart]");if(x&&Date.now()-restartArmed>=3000){x.classList.remove("arm");x.textContent="↺ Start over";}},3100);return;}
  restartArmed=0;clearTimeout(UI.askTimer);flow.clearAsk();UI.pendingSpec=null;clearSavedData();
  P=fresh();flow.resetProject(P);P.botName="";UI.expanded=new Set();UI.boardOpen=false;UI.onboardQ=[];UI.gen=null;UI.choice=null;UI.tab="create";UI.paneOpen=false;
  game.clear();renderMsgs();render();flow.greet();
}
function newProject(){
  clearTimeout(UI.askTimer);flow.clearAsk();UI.pendingSpec=null;
  if(autosave())toast("This project is already saved");
  P=fresh();flow.resetProject(P);UI.boardOpen=false;UI.onboardQ=[];UI.gen=null;UI.choice=null;UI.tab="create";UI.paneOpen=false;
  game.clear();renderMsgs();render();flow.greet();
}
function sheet(title,sub,body){
  const m=renderer.createSheet(title,sub,body);
  m.addEventListener("click",e=>{if(e.target===m||e.target.closest("[data-close]"))m.remove();});
  $("#layer").appendChild(m);return m;
}
function exportHTML(){
  exportStandaloneGame(P.versions[P.versions.length-1],P.name,{sheet,toast,esc});
}

const game=window.TinkerEngine($("#cv"));
const flow=createConversation({getProject:()=>P,UI,renderer,render,renderBoard,renderSide,renderPane,renderTabs,getBoardEl:()=>boardEl,autosave,game,botName,sheet,reduced});
bindEvents({getProject:()=>P,UI,flow,render,renderBoard,renderSide,renderTabs,renderPane,renderLive,getBoardEl:()=>boardEl,autosave,toast,allProjects,loadProject,exportHTML,newProject,restartAll,rollback});

/* ---------- brand logo: token hops at uneven moments at uneven moments ---------- */
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
})();
