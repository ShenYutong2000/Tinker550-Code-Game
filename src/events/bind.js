import { esc } from "../ui/templates.js";
import { connectMapNodes, createIdeaNode, deleteIdeaNode, MAP_HEIGHT, MAP_NOTE_WIDTH, MAP_WIDTH, moveMapNode } from "../state/design-map.js";

export function bindEvents({ getProject, UI, flow, render, renderBoard, renderProjects, renderTabs, renderLive, getBoardEl, autosave, toast, allProjects, loadProject, exportHTML, newProject, restartAll, rollback, openProjects }) {
const $=(s,r=document)=>r.querySelector(s);
const {say,doOpening,send,generate,confirmSticker,saveEdit,delSticker,pickOption,submitGuess,pickGo,conceptDesign,conceptOther,openPane,autosize,renameBot,startTour}=flow;
function closeProjects(){const modal=$("#projectManager");if(modal){modal.remove();$("[data-act=projects]")?.setAttribute("aria-expanded","false");}}
let mapDrag=null,mapPan=null;
const mapZoom=()=>Math.max(.35,Math.min(1.2,Number(UI.mapZoom)||.8));
function redrawEdges(){
  const P=getProject(),world=$("#mapWorld");if(!world)return;
  for(const path of world.querySelectorAll(".map-edge")){
    const edge=P.designMap.edges.find(item=>(item.id||item.from+"-"+item.to)===path.dataset.edgeId);if(!edge)continue;
    const from=P.designMap.nodes.find(item=>item.id===edge.from),to=P.designMap.nodes.find(item=>item.id===edge.to);if(!from||!to)continue;
    const sx=from.x+MAP_NOTE_WIDTH/2,sy=from.y+78,tx=to.x+MAP_NOTE_WIDTH/2,ty=to.y+78,bend=Math.max(46,Math.abs(tx-sx)*.38);
    path.setAttribute("d","M "+sx+" "+sy+" C "+(sx+bend)+" "+sy+", "+(tx-bend)+" "+ty+", "+tx+" "+ty);
  }
}
function setMapZoom(value){
  const viewport=$("#mapViewport"),old=mapZoom(),cx=viewport?(viewport.scrollLeft+viewport.clientWidth/2)/old:MAP_WIDTH/2,cy=viewport?(viewport.scrollTop+viewport.clientHeight/2)/old:MAP_HEIGHT/2;
  UI.mapZoom=Math.max(.35,Math.min(1.2,Math.round(value*100)/100));renderBoard();
  const next=$("#mapViewport");if(next){next.scrollLeft=Math.max(0,cx*UI.mapZoom-next.clientWidth/2);next.scrollTop=Math.max(0,cy*UI.mapZoom-next.clientHeight/2);UI.mapScrollLeft=next.scrollLeft;UI.mapScrollTop=next.scrollTop;}
}
function fitMap(){
  const viewport=$("#mapViewport"),nodes=getProject().designMap.nodes;if(!viewport)return;
  if(!nodes.length){setMapZoom(Math.min(1,viewport.clientWidth/MAP_WIDTH,viewport.clientHeight/MAP_HEIGHT));return;}
  const minX=Math.min(...nodes.map(node=>node.x)),minY=Math.min(...nodes.map(node=>node.y)),maxX=Math.max(...nodes.map(node=>node.x+MAP_NOTE_WIDTH)),maxY=Math.max(...nodes.map(node=>node.y+180));
  UI.mapZoom=Math.max(.35,Math.min(1.2,(viewport.clientWidth-100)/Math.max(1,maxX-minX+120),(viewport.clientHeight-100)/Math.max(1,maxY-minY+120)));
  renderBoard();const next=$("#mapViewport");next.scrollLeft=Math.max(0,((minX+maxX)/2)*UI.mapZoom-next.clientWidth/2);next.scrollTop=Math.max(0,((minY+maxY)/2)*UI.mapZoom-next.clientHeight/2);UI.mapScrollLeft=next.scrollLeft;UI.mapScrollTop=next.scrollTop;
}
function addMapNote(){
  const P=getProject(),viewport=$("#mapViewport"),zoom=mapZoom(),x=viewport?(viewport.scrollLeft+viewport.clientWidth/2)/zoom-MAP_NOTE_WIDTH/2:120,y=viewport?(viewport.scrollTop+viewport.clientHeight/2)/zoom-80:120;
  const color=$("#mapNoteColor")?.value||"sunshine",node=createIdeaNode(P,"New idea…",x,y,color);UI.connectFrom=null;renderBoard();autosave();
  const next=$("#mapViewport");if(next){next.scrollLeft=Math.max(0,(node.x+MAP_NOTE_WIDTH/2)*zoom-next.clientWidth/2);next.scrollTop=Math.max(0,(node.y+80)*zoom-next.clientHeight/2);UI.mapScrollLeft=next.scrollLeft;UI.mapScrollTop=next.scrollTop;}
  requestAnimationFrame(()=>$("[data-map-title=\""+node.id+"\"]")?.focus());
}

/* ---------- events ---------- */
document.addEventListener("click",e=>{
  const t=e.target,P=getProject();
  const mapAction=t.closest("[data-map-act]");
  if(mapAction){switch(mapAction.dataset.mapAct){case "add-note":addMapNote();break;case "connect":UI.connectMode=!UI.connectMode;UI.connectFrom=null;renderBoard();break;case "zoom-in":setMapZoom(mapZoom()+.1);break;case "zoom-out":setMapZoom(mapZoom()-.1);break;case "fit":fitMap();break;}return;}
  const mapDelete=t.closest("[data-map-delete]");
  if(mapDelete){deleteIdeaNode(P,mapDelete.dataset.mapDelete);UI.connectFrom=null;renderBoard();autosave();return;}
  const mapNode=t.closest("[data-map-node]");
  if(UI.connectMode&&mapNode&&!t.closest("button,textarea")){
    const id=mapNode.dataset.mapNode;
    if(!UI.connectFrom){UI.connectFrom=id;renderBoard();}
    else if(UI.connectFrom===id){UI.connectFrom=null;UI.connectMode=false;renderBoard();}
    else{const result=connectMapNodes(P,UI.connectFrom,id);UI.connectFrom=null;UI.connectMode=false;if(result==="connected"){renderBoard();autosave();toast("Steps connected!");}else{renderBoard();toast(result==="duplicate"?"Those notes are already connected":"Choose two different notes");}}
    return;
  }
  const tab=t.closest("[data-tab]");if(tab&&tab.closest("#tabbar")){UI.tab=tab.dataset.tab;if(UI.tab==="create")UI.journalOpen=true;if(UI.tab==="preview")UI.previewOpen=true;renderTabs();if(UI.tab==="preview")openPane();return;}
  const fill=t.closest("[data-fill]");if(fill){const i=$("#"+fill.dataset.fill);i.value=fill.dataset.val;if(i.id==="composer"){autosize();send();}else i.focus();return;}
  const ak=t.closest("#pane .ask");if(ak&&!t.closest("[data-act]")&&innerWidth<=900){UI.tab="create";renderTabs();setTimeout(()=>$("#composer").focus(),50);return;}
  const ed=t.closest("[data-edit]");if(ed){e.stopPropagation();if(flow.isOnboardingOpen())return;UI.editing=ed.dataset.edit;renderBoard();const ta=getBoardEl().querySelector(".ed-text");if(ta){ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);}return;}
  const es=t.closest("[data-edit-save]");if(es){saveEdit(es.dataset.editSave);return;}
  if(t.closest("[data-edit-cancel]")){UI.editing=null;renderBoard();return;}
  const del=t.closest("[data-del]");if(del){e.stopPropagation();delSticker(del.dataset.del);return;}
  const cf=t.closest("[data-confirm]");if(cf){if(!flow.isOnboardingOpen())confirmSticker(cf.dataset.confirm);return;}
  const st=t.closest("[data-star]");if(st){const c=st.dataset.star,i=P.saved.findIndex(v=>v.col===c);
    if(i>=0)P.saved.splice(i,1);else{P.saved.push({col:c,q:st.dataset.q});UI.expanded.add(P.id);toast("Saved! Find it later in “My game ideas”");}renderProjects();renderLive();autosave();return;}
  const ex=t.closest("[data-expand]");if(ex){const id=ex.dataset.expand;UI.expanded.has(id)?UI.expanded.delete(id):UI.expanded.add(id);renderProjects();return;}
  const us=t.closest("[data-unstar]");if(us){P.saved=P.saved.filter(v=>v.col!==us.dataset.unstar);renderProjects();renderLive();return;}
  const sl=t.closest("[data-sel]");if(sl){if(P.phase!=="directions")return;const c=sl.dataset.sel;UI.sel=UI.sel===c?null:c;const i=$("#ownIdea");if(i&&UI.sel){i.value="";UI.ownText="";}renderLive();return;}
  const dir=t.closest("[data-dir]");if(dir){if(flow.isPumping()||!["directions","concept","choice"].includes(P.phase)){toast("Finish this round first, then pick from “My game ideas”");return;}
    closeProjects();UI.tab="create";UI.ownText="";UI.sel=dir.dataset.dir;P.phase="directions";pickGo();return;}
  const pk=t.closest("[data-pick]");if(pk){pickOption(+pk.dataset.pick);return;}
  const pp=t.closest("[data-p]");if(pp&&UI.gen&&UI.gen.guess===undefined){const i=+pp.dataset.p;UI.gen.sel=UI.gen.sel===i?null:i;if(UI.gen.sel!=null)UI.gen.typed="";renderLive();return;}
  const op=t.closest("[data-open]");if(op){const p=allProjects().find(x=>x.id===op.dataset.open);if(p&&p.id!==P.id){autosave();loadProject(p);}closeProjects();return;}
  const ch=t.closest("[data-char]");if(ch){
    const s=P.stickers.find(x=>x.id===ch.dataset.char);UI.menuOpen=false;
    if(s&&P.activeChar!==s.id){P.activeChar=s.id;
      if(s.status==="ok"&&P.versions.length){say(`Your hero is now ${s.effect.char.e} <b>${esc(s.effect.char.n)}</b>. In the next version, Player 1 controls it.`);P.lastBuilt=P.lastBuilt.filter(x=>x!==s.id);if(P.phase==="directions")P.phase="confirm";}}
    render();return;}
  const a=t.closest("[data-act]");
  if(a){const act=a.dataset.act;
    ({opening:doOpening,send,generate,rollback,export:exportHTML,
      board:()=>{UI.tab="board";renderTabs();},
      "toggle-journal":()=>{UI.journalOpen=!UI.journalOpen;if(!UI.journalOpen&&innerWidth<=767&&UI.tab==="create")UI.tab="board";renderTabs();},
      "toggle-preview":()=>{UI.previewOpen=!UI.previewOpen;if(!UI.previewOpen&&innerWidth<=767&&UI.tab==="preview")UI.tab="board";renderTabs();},
      menu:()=>{UI.menuOpen=!UI.menuOpen;renderBoard();},
      addchar:flow.beginAddCharacter,
      cancel:flow.cancelChoice,
      guess:submitGuess,
      openpane:openPane,pickgo:pickGo,cdesign:conceptDesign,cother:conceptOther,"assessment-chat":()=>{if(innerWidth<=767){UI.tab="create";UI.journalOpen=true;renderTabs();}setTimeout(()=>$("#composer").focus(),40);},dismissask:()=>{const a=document.querySelector("#pane .ask");if(a)a.remove();},
      projects:openProjects,
      save:()=>{if(!P.stickers.length&&!P.designMap.nodes.length){toast("Add your first design note, then save");return;}toast(autosave()?"Saved on this device":"This browser won't let me save. Try another window.");},
      new:()=>{newProject();closeProjects();},rename:renameBot,tour:startTour,restart:restartAll
    })[act]?.();
    return;}
  if(UI.menuOpen&&!t.closest(".picker")){UI.menuOpen=false;renderBoard();}
});
document.addEventListener("pointerdown",e=>{
  const handle=e.target.closest("[data-map-drag]");
  if(handle&&e.button===0){
    const node=getProject().designMap.nodes.find(item=>item.id===handle.dataset.mapDrag),world=$("#mapWorld");if(!node||!world)return;
    const rect=world.getBoundingClientRect(),zoom=mapZoom();mapDrag={nodeId:node.id,offsetX:(e.clientX-rect.left)/zoom-node.x,offsetY:(e.clientY-rect.top)/zoom-node.y};
    try{handle.setPointerCapture(e.pointerId);}catch{}e.preventDefault();return;
  }
  const viewport=e.target.closest("#mapViewport");
  if(viewport&&e.button===0&&!e.target.closest(".map-node")){mapPan={viewport,startX:e.clientX,startY:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.classList.add("is-panning");try{viewport.setPointerCapture(e.pointerId);}catch{}e.preventDefault();}
});
document.addEventListener("pointermove",e=>{
  if(mapDrag){const node=getProject().designMap.nodes.find(item=>item.id===mapDrag.nodeId),world=$("#mapWorld");if(!node||!world)return;
    const rect=world.getBoundingClientRect(),zoom=mapZoom();moveMapNode(getProject(),node.id,(e.clientX-rect.left)/zoom-mapDrag.offsetX,(e.clientY-rect.top)/zoom-mapDrag.offsetY);
    const element=$("[data-map-node=\""+node.id+"\"]");if(element){element.style.left=node.x+"px";element.style.top=node.y+"px";}redrawEdges();e.preventDefault();return;}
  if(mapPan){mapPan.viewport.scrollLeft=mapPan.left-(e.clientX-mapPan.startX);mapPan.viewport.scrollTop=mapPan.top-(e.clientY-mapPan.startY);}
});
function finishMapPointer(){if(mapDrag){mapDrag=null;autosave();}if(mapPan){mapPan.viewport.classList.remove("is-panning");UI.mapScrollLeft=mapPan.viewport.scrollLeft;UI.mapScrollTop=mapPan.viewport.scrollTop;mapPan=null;}}
document.addEventListener("pointerup",finishMapPointer);
document.addEventListener("pointercancel",finishMapPointer);
document.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey&&e.target.id==="composer"){e.preventDefault();send();return;}
  if(e.target.matches("[data-map-drag]")&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){
    e.preventDefault();const id=e.target.dataset.mapDrag,node=getProject().designMap.nodes.find(item=>item.id===id),step=e.shiftKey?25:10;if(!node)return;
    moveMapNode(getProject(),id,node.x+(e.key==="ArrowLeft"?-step:e.key==="ArrowRight"?step:0),node.y+(e.key==="ArrowUp"?-step:e.key==="ArrowDown"?step:0));
    renderBoard();redrawEdges();autosave();$('[data-map-drag="'+id+'"]')?.focus();return;
  }
  if(e.key==="Enter"&&(e.target.id==="inWho"||e.target.id==="inDo"))doOpening();
  if(e.key==="Enter"&&e.target.id==="guessIn"&&!e.isComposing){e.preventDefault();if(UI.gen)UI.gen.typed=e.target.value;submitGuess();return;}
  if(e.key==="Enter"&&e.target.id==="ownIdea"&&!e.isComposing){e.preventDefault();UI.ownText=e.target.value;pickGo();return;}
  if(e.target.matches("[data-edit-text]")){if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();saveEdit(e.target.dataset.editText);}else if(e.key==="Escape"){UI.editing=null;renderBoard();}return;}
  if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-confirm]")){e.preventDefault();confirmSticker(e.target.dataset.confirm);}
  if(e.key==="Escape"){if(UI.connectMode){UI.connectMode=false;UI.connectFrom=null;renderBoard();}else if($("#projectManager")){closeProjects();}else if(UI.menuOpen){UI.menuOpen=false;renderBoard();}}
});
$("#composer").addEventListener("input",autosize);
document.addEventListener("input",e=>{if(e.target.id==="guessIn"&&UI.gen){UI.gen.typed=e.target.value;if(e.target.value.trim()&&UI.gen.sel!=null){UI.gen.sel=null;document.querySelectorAll(".pchoice.picked").forEach(x=>x.classList.remove("picked"));}
    const b=document.querySelector("[data-act=guess]");if(b)b.disabled=!(UI.gen.sel!=null||e.target.value.trim());return;}
  if(e.target.matches("[data-map-title]")){updateIdeaTitle(getProject(),e.target.dataset.mapTitle,e.target.value);return;}
  if(e.target.id!=="ownIdea")return;UI.ownText=e.target.value;if(e.target.value.trim()&&UI.sel){UI.sel=null;document.querySelectorAll(".dir.sel,.chip.on").forEach(x=>x.classList.remove("sel","on"));}
  const b=document.querySelector("[data-act=pickgo]");if(b)b.disabled=!(UI.sel||e.target.value.trim());});
document.addEventListener("change",e=>{if(e.target.matches("[data-map-title]"))autosave();});
$("#gameName").addEventListener("input",e=>{const P=getProject();P.name=e.target.value;P.nameEdited=true;renderProjects();$("#paneTitle").textContent=P.name||"My game";});
$("#gameName").addEventListener("change",()=>autosave());

}
