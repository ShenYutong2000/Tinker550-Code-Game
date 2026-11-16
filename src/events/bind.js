import { esc } from "../ui/templates.js";
import { choiceWord } from "../ui/blocks.js";
import { connectNotes, mapLayout, moveCluster, NOTE_GAP, NOTE_H, reorderNote, setLinkLabel, toggleCluster, unlinkNotes } from "../state/design-map.js";

export function bindEvents({ getProject, UI, flow, render, renderBoard, renderEdges, renderCode, renderProjects, renderTabs, renderLive, getBoardEl, autosave, toast, allProjects, loadProject, exportHTML, newProject, restartAll, rollback, openProjects }) {
const $=(s,r=document)=>r.querySelector(s);
const {say,doOpening,send,generate,saveEdit,delSticker,pickOption,submitGuess,pickGo,conceptDesign,conceptOther,openPane,autosize,renameBot,startTour}=flow;
function closeProjects(){const modal=$("#projectManager");if(modal){modal.remove();$("[data-act=projects]")?.setAttribute("aria-expanded","false");}}
const LINK_PROBLEM={self:"Tap a different note",duplicate:"Those two are already connected",missing:"That note is gone"};

/* ---------- design map ---------- */
const mapZoom=()=>Math.max(.35,Math.min(1.4,Number(UI.mapZoom)||.8));
function clearMapSelection(){UI.focus=null;UI.adding=null;UI.editing=null;UI.connectFrom=null;}
function focusNote(id){
  const P=getProject();
  if(UI.connectFrom){
    const from=UI.connectFrom,{result}=connectNotes(P,from,id);UI.connectFrom=null;
    if(result==="linked"){UI.focus={note:from};renderBoard();autosave();toast("Connected! Change how they're linked in the panel");}
    else{renderBoard();toast(LINK_PROBLEM[result]);}
    return;
  }
  UI.focus={note:id};UI.adding=null;UI.editing=null;renderBoard();
}
function startAdding(col){
  if(!getProject().versions.length){toast("Answer the questions first, then add your own ideas");return;}
  clearMapSelection();UI.adding=col;renderBoard();$("[data-add-text]")?.focus();
}
function setMapZoom(value){
  const viewport=$("#mapViewport"),old=mapZoom();
  const cx=viewport?(viewport.scrollLeft+viewport.clientWidth/2)/old:0,cy=viewport?(viewport.scrollTop+viewport.clientHeight/2)/old:0;
  UI.mapZoom=Math.max(.35,Math.min(1.4,Math.round(value*100)/100));
  if(viewport){UI.mapScrollLeft=Math.max(0,cx*UI.mapZoom-viewport.clientWidth/2);UI.mapScrollTop=Math.max(0,cy*UI.mapZoom-viewport.clientHeight/2);}
  renderBoard();
}
/* a press on the map becomes a drag only after it moves a few pixels; otherwise it stays a tap */
let drag=null,swallowClick=false;
function swallowNextClick(){swallowClick=true;setTimeout(()=>{swallowClick=false;},0);}

/* ---------- events ---------- */
document.addEventListener("click",e=>{
  const t=e.target,P=getProject();
  if(swallowClick&&t.closest("#mapViewport")){swallowClick=false;return;}
  const feel=t.closest("[data-feel]");
  if(feel){UI.feel=UI.feel===feel.dataset.feel?null:feel.dataset.feel;
    document.querySelectorAll("[data-feel]").forEach(b=>{const on=b.dataset.feel===UI.feel;b.classList.toggle("on",on);b.setAttribute("aria-pressed",String(on));});return;}
  const toggle=t.closest("[data-cluster-toggle]");if(toggle){toggleCluster(P,toggle.dataset.clusterToggle);renderBoard();autosave();return;}
  const add=t.closest("[data-cluster-add]");if(add){if(!flow.isOnboardingOpen())startAdding(add.dataset.clusterAdd);return;}
  const named=t.closest("[data-cluster-focus]");if(named){if(UI.connectFrom)return;UI.focus={col:named.dataset.clusterFocus};UI.adding=null;UI.editing=null;renderBoard();return;}
  const mapAction=t.closest("[data-map-act]");
  if(mapAction){
    const note=UI.focus&&UI.focus.note;
    switch(mapAction.dataset.mapAct){
      case "close":clearMapSelection();renderBoard();break;
      case "add-save":{const text=$("[data-add-text]")?.value||"",s=flow.addNote(UI.adding,text);if(!s){$("[data-add-text]")?.focus();break;}
        UI.adding=null;UI.focus={note:s.id};renderBoard();toast("Added! Use 🔗 to connect it to other notes");break;}
      case "edit":if(note){UI.editing=note;renderBoard();const ta=$("[data-edit-text]");if(ta){ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);}}break;
      case "connect":if(note){UI.connectFrom=note;renderBoard();}break;
      case "connect-cancel":UI.connectFrom=null;renderBoard();break;
      case "delete":if(note)delSticker(note);break;
      case "zoom-in":setMapZoom(mapZoom()+.1);break;
      case "zoom-out":setMapZoom(mapZoom()-.1);break;
      case "fit":UI.fitMap=true;renderBoard();break;
    }
    return;
  }
  const unlink=t.closest("[data-unlink]");if(unlink){unlinkNotes(P,unlink.dataset.unlink);renderBoard();autosave();return;}
  const es=t.closest("[data-edit-save]");if(es){saveEdit(es.dataset.editSave);return;}
  if(t.closest("[data-edit-cancel]")){UI.editing=null;renderBoard();return;}
  const ch=t.closest("[data-char]");if(ch){
    const s=P.stickers.find(x=>x.id===ch.dataset.char);
    if(s&&P.activeChar!==s.id){P.activeChar=s.id;
      if(P.versions.length){say(`Your hero is now ${s.effect.char.e} <b>${esc(s.effect.char.n)}</b>. In the next version, Player 1 controls it.`);P.lastBuilt=P.lastBuilt.filter(x=>x!==s.id);}}
    render();autosave();return;}
  const note=t.closest("[data-note]");if(note&&!flow.isOnboardingOpen()){focusNote(note.dataset.note);return;}
  if(t.closest("#mapViewport")&&!t.closest(".cluster")&&(UI.focus||UI.connectFrom)){clearMapSelection();renderBoard();return;}
  if(t.closest("[data-code-edit]"))return;
  const mode=t.closest("[data-code-mode]");if(mode){UI.codeMode=mode.dataset.codeMode;renderCode();return;}
  const block=t.closest("[data-block-note]");if(block){focusNote(block.dataset.blockNote);return;}
  const paneTab=t.closest("[data-pane-tab]");if(paneTab){UI.paneTab=paneTab.dataset.paneTab;renderCode();if(UI.paneTab==="play")setTimeout(()=>$("#cv").focus({preventScroll:true}),40);return;}
  const tab=t.closest("[data-tab]");if(tab&&tab.closest("#tabbar")){UI.tab=tab.dataset.tab;if(UI.tab==="create")UI.journalOpen=true;if(UI.tab==="preview")UI.previewOpen=true;renderTabs();if(UI.tab==="preview")openPane();return;}
  const fill=t.closest("[data-fill]");if(fill){const i=$("#"+fill.dataset.fill);i.value=fill.dataset.val;if(i.id==="composer"){autosize();send();}else i.focus();return;}
  const ak=t.closest("#pane .ask");if(ak&&!t.closest("[data-act]")&&innerWidth<=900){UI.tab="create";renderTabs();setTimeout(()=>$("#composer").focus(),50);return;}
  const st=t.closest("[data-star]");if(st){const c=st.dataset.star,i=P.saved.findIndex(v=>v.col===c);
    if(i>=0)P.saved.splice(i,1);else{P.saved.push({col:c,q:st.dataset.q});UI.expanded.add(P.id);toast("Saved! Find it later in “My game ideas”");}renderProjects();renderLive();autosave();return;}
  const ex=t.closest("[data-expand]");if(ex){const id=ex.dataset.expand;UI.expanded.has(id)?UI.expanded.delete(id):UI.expanded.add(id);renderProjects();return;}
  const us=t.closest("[data-unstar]");if(us){P.saved=P.saved.filter(v=>v.col!==us.dataset.unstar);renderProjects();renderLive();return;}
  const sl=t.closest("[data-sel]");if(sl){if(P.phase!=="directions")return;const c=sl.dataset.sel;UI.sel=UI.sel===c?null:c;const i=$("#ownIdea");if(i&&UI.sel){i.value="";UI.ownText="";}renderLive();return;}
  const dir=t.closest("[data-dir]");if(dir){if(flow.isPumping()||!["directions","concept","choice","confirm"].includes(P.phase)){toast("Finish this round first, then pick from “My game ideas”");return;}
    closeProjects();UI.tab="create";UI.ownText="";UI.sel=dir.dataset.dir;P.phase="directions";pickGo();return;}
  const pk=t.closest("[data-pick]");if(pk){pickOption(+pk.dataset.pick);return;}
  const pp=t.closest("[data-p]");if(pp&&UI.gen&&UI.gen.guess===undefined){const i=+pp.dataset.p;UI.gen.sel=UI.gen.sel===i?null:i;if(UI.gen.sel!=null)UI.gen.typed="";renderLive();return;}
  const op=t.closest("[data-open]");if(op){const p=allProjects().find(x=>x.id===op.dataset.open);if(p&&p.id!==P.id){autosave();loadProject(p);}closeProjects();return;}
  const a=t.closest("[data-act]");
  if(a){const act=a.dataset.act;
    ({opening:doOpening,send,generate,rollback,export:exportHTML,
      board:()=>{UI.tab="board";renderTabs();},
      "toggle-journal":()=>{UI.journalOpen=!UI.journalOpen;if(!UI.journalOpen&&innerWidth<=767&&UI.tab==="create")UI.tab="board";renderTabs();},
      "toggle-preview":()=>{UI.previewOpen=!UI.previewOpen;if(!UI.previewOpen&&innerWidth<=767&&UI.tab==="preview")UI.tab="board";renderTabs();},
      cancel:flow.cancelChoice,
      guess:submitGuess,
      openpane:openPane,pickgo:pickGo,cdesign:conceptDesign,cother:conceptOther,"assessment-chat":()=>{if(innerWidth<=767){UI.tab="create";UI.journalOpen=true;renderTabs();}setTimeout(()=>$("#composer").focus(),40);},dismissask:()=>{const a=document.querySelector("#pane .ask");if(a)a.remove();},
      "show-code":()=>{UI.paneTab="code";UI.previewOpen=true;if(innerWidth<=767)UI.tab="preview";renderTabs();renderCode();},
      projects:openProjects,
      save:()=>{if(!P.stickers.length&&!P.designMap.nodes.length){toast("Add your first design note, then save");return;}toast(autosave()?"Saved on this device":"This browser won't let me save. Try another window.");},
      new:()=>{newProject();closeProjects();},rename:renameBot,tour:startTour,restart:restartAll
    })[act]?.();
    return;}
});
document.addEventListener("change",e=>{
  if(e.target.matches("[data-link-label]")){setLinkLabel(getProject(),e.target.dataset.linkLabel,e.target.value);renderBoard();autosave();}
  /* a value changed in a code block: no chat needed, the game takes it right away */
  if(e.target.matches("[data-code-edit]")){
    const [id,key]=e.target.dataset.codeEdit.split("|"),r=flow.codeEdit(id,key,e.target.value);
    if(r.ok)toast(r.live?`Changed! ${r.word}: ${choiceWord(r.key,r.from)} → ${choiceWord(r.key,r.to)}. Your game is using it now`:`Saved. It runs after you tap “Update my game”`);
    else if(!r.same){renderCode();toast("That value doesn't work here");}
  }
});
document.addEventListener("pointerdown",e=>{
  if(e.button!==0||flow.isOnboardingOpen())return;
  const t=e.target,P=getProject(),zoom=mapZoom();
  const head=t.closest("[data-cluster-drag]");
  if(head&&!t.closest(".cluster-btn")){
    const col=head.dataset.clusterDrag,box=mapLayout(P).clusters[col];
    drag={kind:"cluster",col,el:head.closest(".cluster"),x:e.clientX,y:e.clientY,ox:box.x,oy:box.y,zoom,moved:false};
    try{head.setPointerCapture(e.pointerId);}catch{}e.preventDefault();return;
  }
  const note=t.closest(".cluster [data-note]");
  if(note){drag={kind:"note",id:note.dataset.note,el:note,x:e.clientX,y:e.clientY,zoom,moved:false};return;}
  const viewport=t.closest("#mapViewport");
  if(viewport&&!t.closest(".cluster,.map-link")){drag={kind:"pan",viewport,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,moved:false};viewport.classList.add("is-panning");}
});
document.addEventListener("pointermove",e=>{
  if(!drag)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<6)return;
  drag.moved=true;
  if(drag.kind==="cluster"){moveCluster(getProject(),drag.col,drag.ox+dx/drag.zoom,drag.oy+dy/drag.zoom);
    const box=mapLayout(getProject()).clusters[drag.col];drag.el.style.left=box.x+"px";drag.el.style.top=box.y+"px";drag.el.classList.add("dragging");renderEdges();}
  else if(drag.kind==="note"){drag.el.classList.add("dragging");drag.el.style.transform=`translateY(${dy/drag.zoom}px)`;}
  else{drag.viewport.scrollLeft=drag.left-dx;drag.viewport.scrollTop=drag.top-dy;}
  e.preventDefault();
});
function endDrag(e){
  if(!drag)return;
  const d=drag;drag=null;
  if(d.kind==="pan"){d.viewport.classList.remove("is-panning");UI.mapScrollLeft=d.viewport.scrollLeft;UI.mapScrollTop=d.viewport.scrollTop;}
  if(!d.moved)return;
  swallowNextClick();
  if(d.kind==="cluster"){renderBoard();autosave();}
  if(d.kind==="note"){
    const P=getProject(),s=P.stickers.find(x=>x.id===d.id);if(!s)return;
    const index=P.stickers.filter(x=>x.col===s.col).indexOf(s),steps=Math.round((e.clientY-d.y)/d.zoom/(NOTE_H+NOTE_GAP));
    reorderNote(P,d.id,index+steps);renderBoard();autosave();
  }
}
document.addEventListener("pointerup",endDrag);
document.addEventListener("pointercancel",endDrag);
document.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey&&e.target.id==="composer"){e.preventDefault();send();return;}
  if(e.key==="Enter"&&(e.target.id==="inWho"||e.target.id==="inDo")){e.preventDefault();doOpening();return;}
  if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)&&e.target.id==="inIdea"){e.preventDefault();doOpening();return;}
  if(e.key==="Enter"&&e.target.id==="guessIn"&&!e.isComposing){e.preventDefault();if(UI.gen)UI.gen.typed=e.target.value;submitGuess();return;}
  if(e.key==="Enter"&&e.target.id==="ownIdea"&&!e.isComposing){e.preventDefault();UI.ownText=e.target.value;pickGo();return;}
  if(e.target.matches("[data-edit-text]")){if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();saveEdit(e.target.dataset.editText);}else if(e.key==="Escape"){UI.editing=null;renderBoard();}return;}
  if(e.target.matches("[data-add-text]")){if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();$("[data-map-act=add-save]")?.click();}else if(e.key==="Escape"){UI.adding=null;renderBoard();}return;}
  if((e.key==="Enter"||e.key===" ")&&e.target.matches(".cluster [data-note]")){e.preventDefault();focusNote(e.target.dataset.note);$(`.cluster [data-note="${e.target.dataset.note}"]`)?.focus();return;}
  if(e.key==="Escape"){if(UI.connectFrom){UI.connectFrom=null;renderBoard();}else if($("#projectManager")){closeProjects();}else if(UI.focus||UI.adding){clearMapSelection();renderBoard();}}
});
$("#composer").addEventListener("input",autosize);
document.addEventListener("input",e=>{if(e.target.id==="guessIn"&&UI.gen){UI.gen.typed=e.target.value;if(e.target.value.trim()&&UI.gen.sel!=null){UI.gen.sel=null;document.querySelectorAll(".pchoice.picked").forEach(x=>x.classList.remove("picked"));}
    const b=document.querySelector("[data-act=guess]");if(b)b.disabled=!(UI.gen.sel!=null||e.target.value.trim());return;}
  if(e.target.id==="inIdea"){UI.ideaText=e.target.value;return;}
  if(e.target.id!=="ownIdea")return;UI.ownText=e.target.value;if(e.target.value.trim()&&UI.sel){UI.sel=null;document.querySelectorAll(".dir.sel,.chip.on").forEach(x=>x.classList.remove("sel","on"));}
  const b=document.querySelector("[data-act=pickgo]");if(b)b.disabled=!(UI.sel||e.target.value.trim());});
$("#gameName").addEventListener("input",e=>{const P=getProject();P.name=e.target.value;P.nameEdited=true;renderProjects();$("#paneTitle").textContent=P.name||"My game";});
$("#gameName").addEventListener("change",()=>autosave());

}
