import { HEROES, MODES } from "./catalog.js";
import { bestMatch } from "./parse.js";
import { optionsFor, COL_WORDS } from "./options.js";

/* Breaks a child's free description into the hero, the main action, and mechanisms sorted by design element.
   This is a local keyword reader; anything that returns the same shape (for example an AI model) can replace it. */

const hasWord=(t,k)=>/^[a-z]/.test(k)?new RegExp("\\b"+k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).test(t):t.includes(k);
const wordAt=(t,k)=>/^[a-z]/.test(k)?t.search(new RegExp("\\b"+k)):t.indexOf(k);
/* the animal mentioned first, not the first one in the catalog */
function heroIn(t){
  const low=t.toLowerCase();let found=null,at=Infinity;
  for(const h of HEROES)for(const k of h.k){const i=wordAt(low,k);if(i>=0&&i<at){at=i;found=h;}}
  return found;
}
const FILLER=new Set("the a an and to of it its is in on at you your my i be so this that game games want make about called named there will would like idea fun really very also lot just".split(" "));
const PRONOUN=/^(you|i|we|it|they|he|she|the player|players?)$/i;
const AUX=/\s+(is|are|who is|that is|who|that|has to|have to|must|can|will|wants to|tries to|needs to|gets to|likes to|loves to)$/i;

function splitClauses(text){
  return text.split(/[.!?;。！？\n]+/).map(s=>s.trim()).filter(Boolean).map((sentence,index)=>({
    index,conditional:/^(when|if|whenever|every time)\b/i.test(sentence),
    parts:sentence.split(/\s*,\s*|\s+(?:and then|then|while|but|so that|so)\s+|\s+and\s+(?=(?:the|a|an|you|it|there|if|when|every)\b)/i).map(s=>s.trim()).filter(Boolean)
  }));
}
/* the earliest action word, measured the same way the opening sentence always has been */
function actionCut(clause){
  const low=clause.toLowerCase();let cut=-1;
  for(const m of Object.values(MODES))for(const k of m.k){const i=wordAt(low,k);if(i>=0&&(cut<0||i<cut))cut=i;}
  return cut;
}
function elementFor(clause){
  const low=clause.toLowerCase();let col=null,score=0;
  for(const [key,list] of Object.entries(COL_WORDS)){const n=list.filter(w=>hasWord(low,w)).length;if(n>score){score=n;col=key;}}
  return col;
}
const isFiller=clause=>!clause.toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).some(w=>w&&!FILLER.has(w));

export function analyzeDescription(text){
  const sentences=splitClauses(String(text||""));
  const clauses=sentences.flatMap(s=>s.parts.map(part=>({text:part,sentence:s.index,conditional:s.conditional})));
  const actionAt=clauses.findIndex(c=>actionCut(c.text)>=0);
  let who=null,act=null;
  if(actionAt>=0){
    const c=clauses[actionAt].text,cut=actionCut(c);
    act=c.slice(cut).trim().replace(/\s+as (a|an|the) \S+$/i,"");
    const prefix=c.slice(0,cut).trim().replace(AUX,"").trim();
    if(prefix&&!PRONOUN.test(prefix))who=prefix;
  }
  const named=heroIn(String(text||""));
  if(!who&&named)who=named.n;
  const hero=who&&heroIn(who);
  const mechanisms=[],links=[],unsorted=[];
  clauses.forEach((clause,i)=>{
    if(i===actionAt||isFiller(clause.text))return;
    const col=elementFor(clause.text),other=heroIn(clause.text);
    if(col)mechanisms.push({col,text:clause.text,sentence:clause.sentence,conditional:clause.conditional});
    else if(other&&other!==hero&&other!==named)mechanisms.push({col:"character",text:clause.text,char:{e:other.e,n:other.n},sentence:clause.sentence});
    else if(!other)unsorted.push(clause.text);
  });
  /* "when A, then B": a link only when both parts belong to the same element */
  mechanisms.forEach((m,i)=>{const next=mechanisms[i+1];if(m.conditional&&next&&next.sentence===m.sentence&&next.col===m.col)links.push([i,i+1]);});
  return {who,act,mechanisms:mechanisms.map(({col,text,char})=>char?{col,text,char}:{col,text}),links,unsorted};
}

/* turns one sorted clause into a note: a buildable effect when it matches one, otherwise kept as a plan */
export function readMechanism(mechanism,context){
  if(mechanism.col==="character")return {text:mechanism.char.e+" "+mechanism.char.n,sub:"New character",effect:{char:mechanism.char}};
  const opts=optionsFor(mechanism.col,context),{best,score}=bestMatch(mechanism.text,opts,context);
  if(score>=1)return {text:mechanism.text,sub:"I read it as: "+opts[best].t,effect:opts[best].e};
  return {text:mechanism.text,sub:"This prototype can't build this one yet",effect:null};
}
