import { sing } from "../design/parse.js";

/* Scratch-style blocks for the Code view: each program line is said in plain words, with its values in slots.
   {key} is a value the line sets (a slot when the child may change it), {0} is the line's first argument,
   {item}/{item1}/{hero} come from the game itself. */

const PLAY={catch:"catch {1} {2} falling from the sky",dodge:"dodge {1} {2} falling from the sky",jump:"jump over {1} {2}",shoot:"shoot bubbles at {1} {2}",roam:"walk around and collect {1} {2}"};
const WORDS={
  hero:"show {0} {1} as the hero",
  friend:"add {0} {1} as a friend",
  play:b=>PLAY[b.args[0]]||"play with {1} {2}",
  players:b=>b.keys.includes("pmode")?"{players} players who {pmode}":"{players} player",
  controls:"move with {control}",
  heroSpeed:"the hero moves at speed {speed} ×",
  lives:"start with {lives} lives ❤️",
  timer:"start a timer at {timer} seconds ⏱️",
  timerToWin:"last {timer} seconds to win 🏅",
  coins:"each {item1} you catch is a coin 🪙",
  drop:"drop {0} from the sky",
  chaser:"send {0} to chase the hero",
  moreOften:"falling things come twice as often",
  speedUpOverTime:"everything gets faster as time goes by ⏩",
  biggerObstacles:"obstacles are 1.5 × bigger",
  onCatch:"when the hero gets a {item1}: {onCatch}",
  onHit:"when the hero is hit: {onHit}",
  pointPerDodge:"+1 point for every {item1} you dodge",
  pointPerJump:"+1 point for every {item1} you jump over",
  edges:"at the edge: {bound}",
  ending:b=>b.keys.includes("winAt")?"win at {winAt} points, then {outcome}":"at the end: {outcome}",
  goal:"collect {target} {item} to win",
  longerIsBetter:"count how long you survive",
  winWhenTimeRunsOut:"win when the timer runs out",
  itemSpeed:(b,c)=>c.mode==="jump"?"{item} slide in at speed {itemSpeed}":c.mode==="shoot"?"{item} fly across at speed {itemSpeed}":"{item} fall at speed {itemSpeed}",
  itemEvery:"a new {item1} every {itemEvery} seconds",
  jumpPower:"jump with power {jumpPower}",
  dropSpeed:"they fall at speed {dropSpeed}",
  dropEvery:"drop a new one every {dropEvery} seconds",
  chaserSpeed:"the chaser moves at speed {chaserSpeed}",
  set:"change the settings: {0}"
};
export const CHOICE_WORDS={
  players:{1:"1",2:"2"},pmode:{coop:"team up 🤝",versus:"race ⚔️"},control:{keys:"the keyboard ⌨️",mouse:"the mouse 🖱️"},
  onCatch:{score:"+1 point",grow:"grow and glow 🌟",bounce:"it bounces away ↩️",split:"it splits in two ✂️"},
  onHit:{stun:"dizzy for 1 second 💫",shrink:"shrink a bit 🔽",reset:"start over 🔁"},
  bound:{clamp:"stop 🧱",wrap:"come out the other side 🌀",bounce:"bounce back 🏓",ceiling:"bonk the ceiling 🔝"},
  outcome:{celebrate:"confetti 🎉",endScreen:"show the score 🔢",leaderboard:"a leaderboard 🏆"}
};
export const choiceWord=(key,value)=>(CHOICE_WORDS[key]&&CHOICE_WORDS[key][value])||String(value);
export const EVENT_WORDS={tick:"every 5 seconds ⏰",hit:"the hero is hit 💥",catch:"the hero catches something ✋",score:"the score goes up ⬆️",loseLife:"the hero loses a life 💔"};
export const ACT_WORDS={goFaster:"everything speeds up ⏩",dropThings:"drop {e} from the sky",sendChaser:"send {e} to chase the hero",loseLife:"lose a life 💔",addPoint:"+1 point",addCoin:"get a coin 🪙",grow:"the hero grows 🌟",shrink:"the hero shrinks 🔽",getDizzy:"the hero gets dizzy 💫",win:"you win 🏆",gameOver:"game over 🏁"};

/* a call block as pieces: {t} plain words, {v} a fixed value, {slot} a value the child can change */
export function blockParts(block,ctx,editable){
  const words=WORDS[block.call]||(()=>block.call+" {0}");
  const text=typeof words==="function"?words(block,ctx):words;
  const item=ctx.item||{e:"⭐",n:"stars"},parts=[];
  for(const piece of text.split(/(\{[^}]+\})/)){
    if(!piece)continue;
    const name=piece.startsWith("{")?piece.slice(1,-1):null;
    if(name===null)parts.push({t:piece});
    else if(/^\d+$/.test(name)){const v=block.args[+name];parts.push({v:typeof v==="object"?JSON.stringify(v):String(v)});}
    else if(name==="item")parts.push({v:item.e+" "+item.n});
    else if(name==="item1")parts.push({v:sing(item.n)});
    else if(block.keys.includes(name)){
      const value=block.args[block.keys.indexOf(name)];
      parts.push(editable(name)?{slot:{key:name,value}}:{v:choiceWord(name,value)});
    }else parts.push({t:piece});
  }
  return parts;
}
