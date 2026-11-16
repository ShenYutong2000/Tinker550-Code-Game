import { optionsFor } from "../design/options.js";
import { KNOBS, runProgram, SLOTS, writeProgram } from "../game/program.js";
import { ensureStickerNode } from "./design-map.js";
import { isBuilt, projectContext } from "./project.js";

/* Changing a value straight from the Code view, with no conversation in between.
   The note on the map changes with it, and if the note is already in the game, the game plays the new value right away. */

const KEY_WORDS={speed:"hero speed",itemSpeed:"speed",itemEvery:"seconds between new ones",jumpPower:"jump power",dropSpeed:"falling speed",dropEvery:"seconds between drops",chaserSpeed:"chaser speed",
  lives:"lives",timer:"timer",winAt:"points to win",target:"how many to collect",players:"players",pmode:"two players",control:"controls",onCatch:"what a catch does",onHit:"what a hit does",bound:"edges",outcome:"ending"};
const noteName=s=>s.text.replace(/^“(.*)”$/,"$1");

/* the value a note has for a slot now: its own, or the engine's when the note never changed it */
export function slotValue(project,sticker,key){
  const e=sticker.effect||{};
  return key in e?e[key]:KNOBS[key]?KNOBS[key].d(projectContext(project).mode):undefined;
}
/* what a choice slot can be set to: the element's own suggestions, plus whatever it is now */
export function slotChoices(project,sticker,key){
  const values=optionsFor(sticker.col,projectContext(project)).map(o=>o.e[key]).filter(v=>v!==undefined);
  return [...new Set([slotValue(project,sticker,key),...values])].filter(v=>v!==undefined);
}

function readValue(key,raw){
  const slot=SLOTS[key];
  if(slot.choice)return typeof raw==="string"&&/^\d+$/.test(raw)?Number(raw):raw;
  const n=Number(raw);
  if(raw===""||!Number.isFinite(n))return undefined;
  return Number((Math.round(Math.min(slot.max,Math.max(slot.min,n))/slot.step)*slot.step).toFixed(2));
}

/* a number keeps the rest of the note and fixes the number in its words;
   a choice becomes the matching suggestion, replacing only the settings that suggestion is about */
function applyValue(project,sticker,key,value,before){
  if(SLOTS[key].choice){
    const options=optionsFor(sticker.col,projectContext(project)).filter(o=>key in o.e),pick=options.find(o=>o.e[key]===value);
    const family=new Set(options.flatMap(o=>Object.keys(o.e)));
    const rest=Object.fromEntries(Object.entries(sticker.effect).filter(([k])=>!family.has(k)));
    sticker.effect=pick?{...rest,...pick.e}:{...sticker.effect,[key]:value};
    if(pick){sticker.text=pick.t;sticker.sub=null;}
  }else{
    sticker.effect={...sticker.effect,[key]:value};
    if(!(key in KNOBS)){
      const old=new RegExp(`(^|[^\\d.])${String(before).replace(".","\\.")}(?![\\d.])`);
      for(const field of ["text","sub"])if(sticker[field])sticker[field]=sticker[field].replace(old,`$1${value}`);
    }
  }
  sticker.by="kid";
}

export function setCodeValue(project,stickerId,key,raw){
  const s=project.stickers.find(x=>x.id===stickerId);
  if(!s||!s.effect||!(key in SLOTS))return {ok:false};
  const value=readValue(key,raw),before=slotValue(project,s,key);
  if(value===undefined||(SLOTS[key].choice&&!slotChoices(project,s,key).includes(value)))return {ok:false};
  if(value===before)return {ok:false,same:true};
  applyValue(project,s,key,value,before);
  ensureStickerNode(project,s);
  const change={key,from:before,to:value,word:KEY_WORDS[key]||key};
  if(!isBuilt(project,s.id)||!project.versions.length)return {ok:true,live:false,...change};

  /* the note is in the game: code changes since the last build share one new version, so going back undoes them together */
  const last=project.versions[project.versions.length-1];
  let v=last;
  if(!last.byCode){
    v=JSON.parse(JSON.stringify(last));
    Object.assign(v,{n:last.n+1,byCode:true,journal:{steps:[],expected:null,createdAt:Date.now()}});
    delete v.assessment;
    project.versions.push(v);
  }
  const copy=v.snapshot.stickers.find(x=>x.id===s.id);
  if(copy){Object.assign(copy,JSON.parse(JSON.stringify({effect:s.effect,text:s.text,sub:s.sub,by:s.by})));ensureStickerNode(v.snapshot,copy);}
  v.program=writeProgram(v.snapshot).source;
  v.spec=runProgram(v.program);
  v.items=v.snapshot.stickers.filter(x=>x.status==="ok"&&x.effect&&x.col!=="character").map(x=>x.text);
  const steps=v.journal.steps,text=SLOTS[key].choice?`Changed in the code: “${noteName(s)}”`:`Changed in the code: ${change.word} of “${noteName(s)}” is now ${value}`;
  const same=steps.find(step=>step.stickerId===s.id&&step.key===key);
  if(same)same.text=text;else steps.push({stickerId:s.id,key,text,category:s.col});
  v.summary=steps.map(step=>step.text).join(" · ");
  return {ok:true,live:true,spec:v.spec,...change};
}
