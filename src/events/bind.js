import { esc } from "../ui/templates.js";

export function bindEvents({ getProject, UI, flow, render, renderBoard, renderSide, renderTabs, renderPane, renderLive, getBoardEl, autosave, toast, allProjects, loadProject, exportHTML, newProject, restartAll, rollback }) {
const $=(s,r=document)=>r.querySelector(s);
const {say,doOpening,send,generate,confirmSticker,saveEdit,delSticker,pickOption,submitGuess,pickGo,conceptDesign,conceptOther,openPane,finishGen,autosize,renameBot,startTour}=flow;

/* ---------- events ---------- */
document.addEventListener("click",e=>{
  const t=e.target,P=getProject();
  const tab=t.closest("[data-tab]");if(tab&&tab.closest("#tabbar")){UI.tab=tab.dataset.tab;renderTabs();if(UI.tab==="preview")openPane();return;}
  const fill=t.closest("[data-fill]");if(fill){const i=$("#"+fill.dataset.fill);i.value=fill.dataset.val;if(i.id==="composer"){autosize();send();}else i.focus();return;}
  const ak=t.closest("#pane .ask");if(ak&&!t.closest("[data-act]")&&innerWidth<=900){UI.tab="create";renderTabs();setTimeout(()=>$("#composer").focus(),50);return;}
  const ed=t.closest("[data-edit]");if(ed){e.stopPropagation();if(flow.isOnboardingOpen())return;UI.editing=ed.dataset.edit;renderBoard();const ta=getBoardEl().querySelector(".ed-text");if(ta){ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);}return;}
  const es=t.closest("[data-edit-save]");if(es){saveEdit(es.dataset.editSave);return;}
  if(t.closest("[data-edit-cancel]")){UI.editing=null;renderBoard();return;}
  const del=t.closest("[data-del]");if(del){e.stopPropagation();delSticker(del.dataset.del);return;}
  const cf=t.closest("[data-confirm]");if(cf){if(!flow.isOnboardingOpen())confirmSticker(cf.dataset.confirm);return;}
  const st=t.closest("[data-star]");if(st){const c=st.dataset.star,i=P.saved.findIndex(v=>v.col===c);
    if(i>=0)P.saved.splice(i,1);else{P.saved.push({col:c,q:st.dataset.q});UI.expanded.add(P.id);toast("Saved! Find it later in “My game ideas”");}renderSide();renderLive();autosave();return;}
  const ex=t.closest("[data-expand]");if(ex){const id=ex.dataset.expand;UI.expanded.has(id)?UI.expanded.delete(id):UI.expanded.add(id);renderSide();return;}
  const us=t.closest("[data-unstar]");if(us){P.saved=P.saved.filter(v=>v.col!==us.dataset.unstar);renderSide();renderLive();return;}
  const sl=t.closest("[data-sel]");if(sl){if(P.phase!=="directions")return;const c=sl.dataset.sel;UI.sel=UI.sel===c?null:c;const i=$("#ownIdea");if(i&&UI.sel){i.value="";UI.ownText="";}renderLive();return;}
  const dir=t.closest("[data-dir]");if(dir){if(flow.isPumping()||!["directions","concept","choice"].includes(P.phase)){toast("Finish this round first, then pick from “My game ideas”");return;}
    if(innerWidth<=900)UI.sideOpen=false;UI.tab="create";UI.ownText="";UI.sel=dir.dataset.dir;P.phase="directions";pickGo();return;}
  const pk=t.closest("[data-pick]");if(pk){pickOption(+pk.dataset.pick);return;}
  const pp=t.closest("[data-p]");if(pp&&UI.gen&&UI.gen.guess===undefined){const i=+pp.dataset.p;UI.gen.sel=UI.gen.sel===i?null:i;if(UI.gen.sel!=null)UI.gen.typed="";renderLive();return;}
  const op=t.closest("[data-open]");if(op){const p=allProjects().find(x=>x.id===op.dataset.open);if(p&&p.id!==P.id){autosave();loadProject(p);}if(innerWidth<=900){UI.sideOpen=false;renderSide();}return;}
  const ch=t.closest("[data-char]");if(ch){
    const s=P.stickers.find(x=>x.id===ch.dataset.char);UI.menuOpen=false;
    if(s&&P.activeChar!==s.id){P.activeChar=s.id;
      if(s.status==="ok"&&P.versions.length){say(`Your hero is now ${s.effect.char.e} <b>${esc(s.effect.char.n)}</b>. In the next version, Player 1 controls it.`);P.lastBuilt=P.lastBuilt.filter(x=>x!==s.id);if(P.phase==="directions")P.phase="confirm";}}
    render();return;}
  const a=t.closest("[data-act]");
  if(a){const act=a.dataset.act;
    ({opening:doOpening,send,generate,rollback,export:exportHTML,
      board:()=>{UI.boardOpen=true;renderBoard();},closeboard:()=>{UI.boardOpen=false;UI.menuOpen=false;renderBoard();},
      menu:()=>{UI.menuOpen=!UI.menuOpen;renderBoard();},
      addchar:flow.beginAddCharacter,
      cancel:flow.cancelChoice,
      guess:submitGuess,
      skip:flow.skipGeneration,
      go:finishGen,openpane:openPane,pickgo:pickGo,cdesign:conceptDesign,cother:conceptOther,dismissask:()=>{const a=document.querySelector("#pane .ask");if(a)a.remove();},closepane:()=>{UI.paneOpen=false;UI.tab="create";renderPane();renderTabs();renderLive();},
      side:()=>{UI.sideOpen=!UI.sideOpen;renderSide();},
      save:()=>{if(!P.stickers.length){toast("Share your first idea, then save");return;}toast(autosave()?"Saved on this device":"This browser won't let me save. Try another window.");},
      new:newProject,rename:renameBot,tour:startTour,restart:restartAll
    })[act]?.();
    return;}
  if(UI.menuOpen&&!t.closest(".picker")){UI.menuOpen=false;renderBoard();}
  if(getBoardEl()&&t===getBoardEl()&&!flow.isOnboardingOpen()){UI.boardOpen=false;renderBoard();}
});
document.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey&&e.target.id==="composer"){e.preventDefault();send();return;}
  if(e.key==="Enter"&&(e.target.id==="inWho"||e.target.id==="inDo"))doOpening();
  if(e.key==="Enter"&&e.target.id==="guessIn"&&!e.isComposing){e.preventDefault();if(UI.gen)UI.gen.typed=e.target.value;submitGuess();return;}
  if(e.key==="Enter"&&e.target.id==="ownIdea"&&!e.isComposing){e.preventDefault();UI.ownText=e.target.value;pickGo();return;}
  if(e.target.matches("[data-edit-text]")){if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();saveEdit(e.target.dataset.editText);}else if(e.key==="Escape"){UI.editing=null;renderBoard();}return;}
  if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-confirm]")){e.preventDefault();confirmSticker(e.target.dataset.confirm);}
  if(e.key==="Escape"){if(UI.menuOpen){UI.menuOpen=false;renderBoard();}else if(UI.boardOpen&&!flow.isOnboardingOpen()){UI.boardOpen=false;renderBoard();}}
});
$("#composer").addEventListener("input",autosize);
document.addEventListener("input",e=>{if(e.target.id==="guessIn"&&UI.gen){UI.gen.typed=e.target.value;if(e.target.value.trim()&&UI.gen.sel!=null){UI.gen.sel=null;document.querySelectorAll(".pchoice.picked").forEach(x=>x.classList.remove("picked"));}
    const b=document.querySelector("[data-act=guess]");if(b)b.disabled=!(UI.gen.sel!=null||e.target.value.trim());return;}
  if(e.target.id!=="ownIdea")return;UI.ownText=e.target.value;if(e.target.value.trim()&&UI.sel){UI.sel=null;document.querySelectorAll(".dir.sel,.chip.on").forEach(x=>x.classList.remove("sel","on"));}
  const b=document.querySelector("[data-act=pickgo]");if(b)b.disabled=!(UI.sel||e.target.value.trim());});
$("#gameName").addEventListener("input",e=>{const P=getProject();P.name=e.target.value;P.nameEdited=true;renderSide();$("#paneTitle").textContent=P.name||"My game";});
$("#gameName").addEventListener("change",()=>autosave());

}
