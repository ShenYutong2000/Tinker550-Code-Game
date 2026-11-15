import { MODES } from "./catalog.js";
import { parseHero, parseAction, sing } from "./parse.js";
import { optionsFor } from "./options.js";
import { readMechanism } from "./analyze.js";

/* Builds the first draft of a design map from the three onboarding answers and an optional description.
   Every element gets at least one note; the child's own words win over any default for the same element.
   This is a local rule set; anything that returns the same shape (for example an AI model) can replace it. */

const has=key=>o=>o.e&&Object.prototype.hasOwnProperty.call(o.e,key);
const is=(key,value)=>o=>o.e&&o.e[key]===value;
/* per feeling: which suggestion to prefer in each element, best first */
const PLANS={
  excited:{conflict:[has("speedUp")],resources:[is("timer",30)],rules:[has("onCatch"),has("dodgeScore"),has("jumpScore")],boundaries:[is("bound","clamp")],outcome:[is("outcome","celebrate")]},
  challenged:{conflict:[has("hazard"),has("enemy"),has("dense")],resources:[has("lives")],rules:[has("onCatch"),has("dodgeScore"),has("jumpScore")],boundaries:[is("bound","clamp")],outcome:[is("outcome","endScreen")]},
  curious:{conflict:[has("enemy"),has("hazard")],resources:[has("coins"),is("timer",60)],rules:[has("onCatch"),has("dodgeScore"),has("jumpScore")],boundaries:[is("bound","wrap"),is("bound","ceiling")],outcome:[is("outcome","endScreen")]},
  relaxed:{conflict:[],resources:[is("timer",60),has("coins"),is("timer",30)],rules:[has("onCatch"),has("dodgeScore"),has("jumpScore")],boundaries:[is("bound","bounce"),is("bound","clamp")],outcome:[is("outcome","endScreen")]},
  surprised:{conflict:[has("hazard"),has("enemy")],resources:[has("lives")],rules:[is("onCatch","bounce"),is("onCatch","split"),is("onHit","shrink"),is("onHit","reset")],boundaries:[is("bound","wrap"),is("bound","ceiling")],outcome:[is("outcome","celebrate")]}
};
const DEFAULT_PLAN={conflict:[has("hazard"),has("enemy")],resources:[has("lives")],rules:[has("onCatch"),has("dodgeScore"),has("jumpScore")],boundaries:[is("bound","clamp")],outcome:[is("outcome","celebrate")]};

/* what a note does in the game, used to draw the default connections */
function roleOf(note){
  const e=note.effect||{};
  if(note.col==="character")return "hero";
  if(note.key)return note.key;
  if(e.lives)return "lives";
  if(e.timer&&note.col==="resources")return "timer";
  if(e.hazard||e.enemy||e.dense||e.tall)return "danger";
  if(e.speedUp)return "faster";
  if(e.onCatch==="score"||e.dodgeScore||e.jumpScore)return "score";
  if(e.onHit)return "hit";
  if(note.col==="outcome")return "end";
  if(note.col==="procedures")return "controls";
  if(note.col==="players")return "players";
  return null;
}

export function buildDraft({who,act,feel,idea}){
  const h=parseHero(who),a=parseAction(act),context={hero:{n:h.n,e:h.e},item:a.item,mode:a.mode};
  const plan=PLANS[feel]||DEFAULT_PLAN,notes=[],links=[];
  const add=(note)=>{notes.push(note);return notes.length-1;};
  add({col:"character",text:h.e+" "+h.n,sub:"The hero. It shows up on the canvas",effect:{char:{e:h.e,n:h.n}},by:"kid",key:"hero"});
  add({col:"objectives",text:"“"+act+"”",sub:MODES[a.mode].obj(a.item.n),effect:{mode:a.mode,item:a.item},by:"kid",key:"action"});
  const own=(idea&&idea.mechanisms||[]).map(m=>add({col:m.col,...readMechanism(m,context),by:"kid"}));
  (idea&&idea.links||[]).forEach(([from,to])=>links.push([own[from],own[to],"then"]));
  const mine=col=>notes.some(n=>n.col===col&&n.by==="kid"&&!n.key);
  const choose=(col,prefs)=>{const opts=optionsFor(col,context);for(const p of prefs){const o=opts.find(p);if(o)return o;}return null;};
  const draft=(col,o,sub)=>o&&add({col,text:o.t,sub:sub||null,effect:o.e,by:"ai"});

  if(!mine("players"))draft("players",choose("players",[is("players",1)]));
  if(!mine("procedures"))draft("procedures",choose("procedures",[is("control","keys")]));
  if(!mine("conflict")){
    const o=choose("conflict",plan.conflict);
    if(o)draft("conflict",o);
    else add({col:"conflict",text:"nothing chases you, so take your time",sub:"A calm game on purpose",effect:{},by:"ai"});
  }
  if(!mine("resources"))draft("resources",choose("resources",plan.resources)||choose("resources",[has("lives")]));
  if(!mine("rules")){
    const scoring=[has("onCatch"),has("dodgeScore"),has("jumpScore")].map(p=>o=>p(o)&&(o.e.onCatch||"score")==="score");
    const o=choose("rules",plan.rules)||choose("rules",[()=>true]),score=choose("rules",scoring);
    /* a surprise rule still needs a way to score, unless both would set the same game setting */
    if(scoring.some(p=>p(o))||!score)draft("rules",o);
    else if(Object.keys(o.e).some(k=>k in score.e))draft("rules",score);
    else{draft("rules",o);draft("rules",score);}
  }
  if(!mine("boundaries"))draft("boundaries",choose("boundaries",plan.boundaries)||choose("boundaries",[()=>true]));
  if(!mine("outcome"))draft("outcome",choose("outcome",plan.outcome));

  /* lives only make sense if something can hurt the hero; say so as a rule the child can see */
  const danger=notes.find(n=>roleOf(n)==="danger"),hurtByItem=["dodge","jump"].includes(a.mode),NAMES={"💣":"bomb","🐦":"bird","👻":"ghost"};
  if(notes.some(n=>roleOf(n)==="lives")&&!notes.some(n=>roleOf(n)==="hit")&&(danger||hurtByItem)){
    const thing=danger&&(danger.effect.hazard||danger.effect.enemy)?NAMES[danger.effect.hazard||danger.effect.enemy]||"monster":sing(a.item.n);
    add({col:"rules",text:`if the ${h.n} touches a ${thing}, it loses 1 life`,sub:"Lives go down when something hits you",effect:{},by:"ai",key:"hit"});
  }

  const find=role=>notes.findIndex(n=>roleOf(n)===role);
  const link=(from,to,label)=>{const i=find(from),j=find(to);if(i>=0&&j>=0&&i!==j)links.push([i,j,label]);};
  link("players","controls","uses");
  link("controls","hero","controls");
  link("action","score","then");
  link("danger","hit","then");
  link("hit","lives","uses");
  link("lives","end","ends");
  link("timer","end","ends");
  if(notes.some(n=>n.effect&&(n.effect.winAt||n.effect.target)))link("score","end","ends");
  return {notes:notes.map(({key,...note})=>note),links,unsorted:idea&&idea.unsorted||[]};
}
