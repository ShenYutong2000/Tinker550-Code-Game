import { COLS, COLMAP } from "../design/catalog.js";
import { noteLinks } from "../state/design-map.js";

/* The game program: written from the design map, shown in the Code view, and run to make the game.
   Each note becomes setup lines; each "if → then" or "ends when" arrow becomes a when(...) rule. */

const q=v=>JSON.stringify(v);
const name=s=>s.text.replace(/^“(.*)”$/,"$1");

/* setup calls, matched against a note's effect keys in this order */
const PARTS=[
  {keys:["mode","item"],call:"play",args:e=>[e.mode,e.item.e,e.item.n],set:(m,e,n)=>({mode:m,item:{e,n}})},
  {keys:["players","pmode"],call:"players"},
  {keys:["players"],call:"players"},
  {keys:["control"],call:"controls"},
  {keys:["speed"],call:"heroSpeed"},
  {keys:["lives"],call:"lives"},
  {keys:["timer","surviveWin"],call:"timerToWin"},
  {keys:["timer"],call:"timer"},
  {keys:["coins"],call:"coins"},
  {keys:["hazard"],call:"drop"},
  {keys:["enemy"],call:"chaser"},
  {keys:["dense"],call:"moreOften"},
  {keys:["speedUp"],call:"speedUpOverTime"},
  {keys:["tall"],call:"biggerObstacles"},
  {keys:["onCatch"],call:"onCatch"},
  {keys:["onHit"],call:"onHit"},
  {keys:["dodgeScore"],call:"pointPerDodge"},
  {keys:["jumpScore"],call:"pointPerJump"},
  {keys:["bound"],call:"edges"},
  {keys:["outcome","winAt"],call:"ending"},
  {keys:["outcome"],call:"ending"},
  {keys:["target"],call:"goal"},
  {keys:["survive"],call:"longerIsBetter"},
  {keys:["surviveWin"],call:"winWhenTimeRunsOut"}
];
/* a single switch is written without an argument: game.coins(), not game.coins(true) */
const argsOf=(part,e)=>part.args?part.args(e):part.keys.length===1&&e[part.keys[0]]===true?[]:part.keys.map(k=>e[k]);

function splitEffect(effect){
  const rest={...effect},calls=[];
  while(Object.keys(rest).length){
    const part=PARTS.find(p=>p.keys.every(k=>k in rest));
    if(!part){calls.push({call:"set",args:[rest],part:null});break;}
    calls.push({call:part.call,args:argsOf(part,rest),part});
    part.keys.forEach(k=>delete rest[k]);
  }
  return calls;
}

/* ---------- what each note can start, and what it can do, inside a rule ---------- */
const EVENTS={hit:"hero is hit",catch:"hero catches something",score:"score goes up",loseLife:"hero loses a life"};
function eventOf(s){
  const e=s.effect||{};
  if(s.col==="resources"&&e.lives)return "loseLife";
  if(s.col==="rules"&&/li(fe|ves)/i.test(s.text))return "loseLife";
  if(e.onCatch==="score"||e.dodgeScore||e.jumpScore)return "score";
  if(e.onCatch||(e.mode&&["catch","roam","shoot"].includes(e.mode)))return "catch";
  if(e.hazard||e.enemy||e.dense||e.tall||e.onHit||(e.mode&&["dodge","jump"].includes(e.mode)))return "hit";
  return null;
}
function actionOf(s,event){
  const e=s.effect||{};
  if(s.col==="outcome")return {act:event==="catch"||event==="score"?"win":"gameOver"};
  if(e.speedUp)return {act:"goFaster"};
  if(e.hazard)return {act:"dropThings",e:e.hazard};
  if(e.enemy)return {act:"sendChaser",e:e.enemy};
  if(e.lives||(s.col==="rules"&&/li(fe|ves)/i.test(s.text)))return {act:"loseLife"};
  if(e.onCatch==="score"||e.dodgeScore||e.jumpScore)return {act:"addPoint"};
  if(e.onCatch==="grow")return {act:"grow"};
  if(e.onHit==="stun")return {act:"getDizzy"};
  if(e.onHit==="shrink")return {act:"shrink"};
  if(e.coins)return {act:"addCoin"};
  return null;
}
/* notes that switch something on: when they are the "then" of a rule, they wait for it instead of starting right away */
const waitsForRule=a=>["goFaster","dropThings","sendChaser"].includes(a.act);
/* arrows the engine already follows without a rule, so writing one would make it happen twice */
function builtIn(event,action,spec,from,label){
  if(action.act==="addPoint"&&from.effect&&from.effect.mode&&(spec.onCatch==="score"||spec.dodgeScore||spec.jumpScore))return true;   // the main action already scores
  if(event==="hit"&&spec.onHit&&({getDizzy:"stun",shrink:"shrink"})[action.act]===spec.onHit)return true;   // the onHit setting already does it
  return (event==="hit"&&action.act==="loseLife"&&spec.lives)||(event==="loseLife"&&action.act==="gameOver"&&spec.lives&&label==="ends")
    ||(event==="score"&&action.act==="win"&&(spec.winAt||spec.target))||(event==="catch"&&action.act==="addPoint"&&spec.onCatch==="score");
}

export function writeProgram(project){
  const lines=[],notes={},links={};
  const push=(text,owner)=>{lines.push(text);if(owner)(owner.list[owner.id]||=[]).push(lines.length-1);};
  const stickers=project.stickers,byId=new Map(stickers.map(s=>[s.id,s]));
  const hero=stickers.find(s=>s.id===project.activeChar&&s.col==="character")||stickers.find(s=>s.col==="character");
  /* the plain settings first, so rule decisions can tell what the engine already does */
  const spec={};for(const s of stickers)if(s.effect&&s.col!=="character")Object.assign(spec,s.effect);
  const rules=[],waiting=new Set();
  for(const link of noteLinks(project)){
    if(link.label!=="then"&&link.label!=="ends")continue;
    const from=byId.get(link.from),to=byId.get(link.to),event=from&&eventOf(from),action=to&&event&&actionOf(to,event);
    const kind=!event||!action?"missing":builtIn(event,action,spec,from,link.label)?"builtin":"rule";
    rules.push({link,from,to,event,action,kind});
    if(kind==="rule"&&waitsForRule(action))waiting.add(to.id);
  }
  push("// Made from your design map. Each part of the map has its own lines.");
  for(const category of COLS){
    const own=stickers.filter(s=>s.col===category.key);
    if(!own.length)continue;
    push("");
    push(`// ${category.ic} ${category.en}`);
    for(const s of own){
      const owner={list:notes,id:s.id};
      if(s.col==="character"){const c=s.effect&&s.effect.char;if(c)push(`game.${s===hero?"hero":"friend"}(${q(c.e)}, ${q(c.n)});`,owner);continue;}
      if(!s.effect){push(`// not in the code yet: “${name(s)}”`,owner);continue;}
      if(!Object.keys(s.effect).length){push(`// built into the game engine: “${name(s)}”`,owner);continue;}
      const calls=splitEffect(s.effect).map(c=>`game.${c.call}(${c.args.map(q).join(", ")});`);
      if(waiting.has(s.id))calls.forEach(c=>push(`// waits for a rule below: ${c}`,owner));
      else calls.forEach((c,i)=>push(c+(i===0?`  // ${name(s)}`:""),owner));
    }
  }
  const ruleStart=lines.length;
  if(rules.length){
    push("");
    push("// 🔗 RULES: when something happens, then…");
    for(const r of rules){
      const owner={list:links,id:r.link.id},title=`// ${name(r.from)} → ${name(r.to)}`;
      push(title,owner);
      if(r.kind==="rule")push(`when(${q(EVENTS[r.event])}, then.${r.action.act}(${r.action.e?q(r.action.e):""}));`,owner);
      else if(r.kind==="builtin")push(`//   the game engine already does this, so no extra line is needed`,owner);
      else push(`//   not in the code yet: the game can't tell when this happens`,owner);
      for(const id of [r.from.id,r.to.id])(notes[id]||=[]).push(...(owner.list[owner.id]||[]));
    }
  }
  for(const id of Object.keys(notes))notes[id]=[...new Set(notes[id])].sort((a,b)=>a-b);
  return {source:lines.join("\n"),lines,notes,links,rules,ruleStart,heroId:hero&&hero.id};
}

/* runs a program and returns the game settings it makes; the engine plays these */
export function runProgram(source){
  const spec={speed:1},rules=[],others=[];let hero=null;
  const game={hero:(e,n)=>{hero={e,n};},friend:(e,n)=>{others.push({e,n});},set:values=>Object.assign(spec,values)};
  for(const part of PARTS)game[part.call]||=(...args)=>{
    if(part.set)return Object.assign(spec,part.set(...args));
    if(part.keys.length===1&&!args.length)spec[part.keys[0]]=true;
    else part.keys.forEach((k,i)=>{if(args[i]!==undefined)spec[k]=args[i];});
  };
  const then=new Proxy({},{get:(_,act)=>e=>e?{act,e}:{act}});
  const when=(event,action)=>{const id=Object.keys(EVENTS).find(k=>EVENTS[k]===event);if(!id)return;const rule=rules.find(r=>r.when===id);if(rule)rule.do.push(action);else rules.push({when:id,do:[action]});};
  new Function("game","when","then",source)(game,when,then);
  if(rules.length)spec.rules=rules;
  spec.hero=hero;spec.others=others;
  return JSON.parse(JSON.stringify(spec));
}

/* ---------- the engine lines behind each kind of note, with a kid-sized explanation ---------- */
const ENGINE={
  play:{anchors:['if(m==="catch"&&st.sg<=0)','if(m==="dodge"&&st.sh<=0)','if(m==="jump"&&st.sh<=0)','if(m==="shoot"&&st.goods.length<5','if(m==="roam"&&st.goods.length<4'],pick:(e)=>e.mode,
    say:e=>`This sets what your game is about. Every moment, the engine checks a timer and adds a new ${e.item.e} ${e.item.n} to the screen.`},
  hero:{anchors:["function hero(i){"],say:()=>"This puts your hero on the canvas. The engine remembers where it is, how big it is, and which way it faces."},
  friend:{anchors:["const npcSrc="],say:()=>"Extra characters walk around the screen. With two players, Player 2 controls one of them."},
  players:{anchors:["if(sp.players===2) st.heroes.push(hero(1));"],say:()=>"This decides how many heroes there are. With 2 players, the engine adds a second hero for the WASD keys."},
  controls:{anchors:["function ctrl(i){"],say:()=>"Every frame, the engine reads the keys or the mouse and turns them into moves for the hero."},
  heroSpeed:{anchors:["spd=200*(sp.speed||1)"],say:()=>"This number is how fast the hero moves. A bigger number means faster."},
  lives:{anchors:['if(sp.lives){st.lives--'],say:()=>"The game keeps a number called lives. Each time the hero is hit, lives goes down by 1. When it reaches 0, the game is over."},
  timer:{anchors:["if(sp.timer){st.timer-=dt;"],say:()=>"The timer counts down a little every frame. When it reaches 0, the game ends."},
  timerToWin:{anchors:["if(sp.timer){st.timer-=dt;"],say:()=>"The timer counts down every frame. If you are still playing when it reaches 0, you win."},
  coins:{anchors:["if(sp.coins){st.coins++;"],say:()=>"Every time the hero catches something, the coin counter goes up by 1."},
  drop:{anchors:["if(drop&&st.sb<=0){","for(const o of st.hz){if(o.dead)continue;if(Math.hypot"],say:e=>`Every couple of seconds, the engine drops a ${e.hazard||"💣"} from the top. Then it checks: is it touching the hero? If yes, the hero is hit.`},
  chaser:{anchors:["if(st.enemy){const h=st.heroes[0];const a=Math.atan2"],say:()=>"The chaser turns toward the hero every frame and moves a little closer. If it touches the hero, the hero is hit."},
  moreOften:{anchors:['if(m==="dodge"&&st.sh<=0)'],say:()=>"This makes the waiting time between falling things shorter, so more of them come."},
  speedUpOverTime:{anchors:["sm=(sp.speedUp?1+st.t/30:1)"],say:()=>"The engine multiplies every speed by a number that grows as time goes by, so everything gets faster and faster."},
  biggerObstacles:{anchors:["const big=sp.tall?1.5:1"],say:()=>"Obstacles are made 1.5 times bigger, so they are harder to jump over."},
  onCatch:{anchors:["const r=sp.onCatch;"],say:e=>({score:"When the hero touches an item, the score goes up by 1.",grow:"When the hero touches an item, the hero grows bigger and glows.",bounce:"When the hero touches an item, the item bounces away instead of disappearing.",split:"When a bubble hits an item, the item splits into two smaller ones."})[e.onCatch]||"This decides what happens when the hero touches an item."},
  onHit:{anchors:['if(sp.onHit==="stun")'],say:e=>({stun:"When the hero is hit, it can't move for 1 second.",shrink:"When the hero is hit, it gets a little smaller.",reset:"When the hero is hit, the whole game starts over."})[e.onHit]||"This decides what happens when the hero is hit."},
  pointPerDodge:{anchors:["if(sp.dodgeScore)addScore"],say:()=>"When a falling thing reaches the bottom without hitting you, you get 1 point."},
  pointPerJump:{anchors:["if(sp.jumpScore)addScore"],say:()=>"When an obstacle passes behind the hero, you get 1 point."},
  edges:{anchors:['if(b==="wrap")'],say:e=>({wrap:"If the hero goes past one edge, the engine moves it to the opposite edge.",bounce:"If the hero reaches an edge, the engine pushes it back.",clamp:"The engine never lets the hero's position go past the edges.",ceiling:"If the hero jumps too high, the engine stops it at the ceiling."})[e.bound]||"This decides what happens at the edges."},
  ending:{anchors:["function end(kind){"],say:e=>e.winAt?`When the score reaches ${e.winAt}, the game ends and shows that you won.`:"This decides what the end of the game looks like."},
  goal:{anchors:["const goal=sp.winAt||sp.target;"],say:e=>`When you have collected ${e.target}, you win.`},
  longerIsBetter:{anchors:["pix(st.alive.toFixed(1)"],say:()=>"The game counts how long you have survived and shows it in the corner."},
  winWhenTimeRunsOut:{anchors:["if(sp.timer){st.timer-=dt;"],say:()=>"If you are still playing when the timer reaches 0, you win."},
  builtin:{anchors:["for(const o of st.hz){if(o.dead)continue;if(Math.hypot",'if(sp.lives){st.lives--'],say:()=>"The engine already does this: it checks if something touches the hero, and if so, takes away 1 life."},
  rule:{anchors:["function fire(event,h,x,y){","function act(a,h,x,y){"],say:()=>""}
};
const RULE_WORDS={hit:"the hero is hit",catch:"the hero catches something",score:"the score goes up",loseLife:"the hero loses a life"};
const ACT_WORDS={goFaster:"everything speeds up",dropThings:"things start falling",sendChaser:"a chaser appears",loseLife:"the hero loses a life",addPoint:"you get 1 point",addCoin:"you get a coin",grow:"the hero grows",shrink:"the hero shrinks",getDizzy:"the hero gets dizzy",win:"you win",gameOver:"the game is over"};

/* finds whole lines of engine source by a piece of text on that line; numbers are 1-based */
export function engineLines(engineSource,anchors){
  const all=engineSource.split("\n"),out=[];
  for(const anchor of anchors){const i=all.findIndex(line=>line.includes(anchor));if(i>=0&&!out.some(l=>l.n===i+1))out.push({n:i+1,text:all[i].trim()});}
  return out;
}

/* everything the Code view shows for one note: its program lines, its engine lines, and what they do */
export function codeFor(program,project,stickerId,engineSource){
  const s=project.stickers.find(x=>x.id===stickerId);if(!s)return null;
  const e=s.effect||{},kinds=[];
  if(s.col==="character")kinds.push(program.heroId===s.id?"hero":"friend");
  else if(s.effect&&!Object.keys(e).length)kinds.push("builtin");
  else if(s.effect)splitEffect(e).forEach(c=>c.part&&kinds.push(c.call));
  const rules=program.rules.filter(r=>r.from.id===s.id||r.to.id===s.id);
  const explain=kinds.map(k=>ENGINE[k]&&ENGINE[k].say(e)).filter(Boolean);
  for(const r of rules)if(r.kind==="rule")explain.push(`When ${RULE_WORDS[r.event]}, ${ACT_WORDS[r.action.act]}. The when(...) line tells the engine to listen for that moment.`);
  if(!s.effect)explain.push("The game can't build this idea yet, so there is no code for it. It stays in your design as a plan.");
  const anchors=kinds.flatMap(k=>{const part=ENGINE[k];if(!part)return [];if(k==="play"){const i=["catch","dodge","jump","shoot","roam"].indexOf(e.mode);return [part.anchors[i]];}return part.anchors;});
  if(rules.some(r=>r.kind==="rule"))anchors.push(...ENGINE.rule.anchors);
  return {sticker:s,lines:program.notes[s.id]||[],explain,engine:engineSource?engineLines(engineSource,anchors):[],rules};
}
export const ENGINE_ANCHORS=Object.values(ENGINE).flatMap(part=>part.anchors);
