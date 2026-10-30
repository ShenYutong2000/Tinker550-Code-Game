import { sing } from "./parse.js";

/* option catalogs per column, given context */
export function optionsFor(col,c){
  const it=c.item.n, hero=c.hero.n, m=c.mode, it1=sing(it), collect=["catch","roam","shoot"].includes(m);
  const speed={t:"the "+hero+" moves faster",e:{speed:1.45},pic:"💨"};
  switch(col){
    case "rules":
      if(m==="dodge") return [{t:"dodge a "+it1+": +1 point",e:{dodgeScore:true},pic:"+1"},{t:"get hit by a "+it1+": dizzy for 1 second",e:{onHit:"stun"},pic:"💫"},{t:"get hit: the "+hero+" shrinks a bit",e:{onHit:"shrink"},pic:"🔽"}];
      if(m==="jump") return [{t:"jump over a "+it1+": +1 point",e:{jumpScore:true},pic:"+1"},{t:"bump a "+it1+": dizzy for 1 second",e:{onHit:"stun"},pic:"💫"},{t:"bump a "+it1+": start over",e:{onHit:"reset"},pic:"🔁"}];
      if(m==="shoot") return [{t:"hit a "+it1+": it disappears, +1 point",e:{onCatch:"score"},pic:"+1"},{t:"hit a "+it1+": it splits in two",e:{onCatch:"split"},pic:"✂️"},{t:"hit a "+it1+": the "+hero+" grows and glows",e:{onCatch:"grow"},pic:"🌟"}];
      return [{t:"touch a "+it1+": it disappears, +1 point",e:{onCatch:"score"},pic:"+1"},{t:"touch a "+it1+": the "+hero+" grows and glows",e:{onCatch:"grow"},pic:"🌟"},{t:"touch a "+it1+": it bounces away",e:{onCatch:"bounce"},pic:"↩️"}];
    case "procedures":
      if(m==="jump") return [{t:"press SPACE to jump",e:{control:"keys"},pic:"⌨️"},{t:"click the mouse to jump",e:{control:"mouse"},pic:"🖱️"},speed];
      if(m==="shoot") return [{t:"← → to move, SPACE to shoot",e:{control:"keys"},pic:"⌨️"},{t:"move the mouse, click to shoot",e:{control:"mouse"},pic:"🖱️"},speed];
      return [{t:m==="roam"?"arrow keys to move around":"← → arrow keys to move",e:{control:"keys"},pic:"⌨️"},{t:"the "+hero+" follows the mouse",e:{control:"mouse"},pic:"🖱️"},speed];
    case "resources":
      return [{t:"3 lives, lose 1 when hit",e:{lives:3},pic:"❤️"},{t:"a 30-second timer",e:{timer:30},pic:"⏱️"},
        collect?{t:"every "+it1+" turns into a coin",e:{coins:true},pic:"🪙"}:{t:"a 60-second timer",e:{timer:60},pic:"⏳"}];
    case "conflict":
      if(m==="dodge") return [{t:"the "+it+" fall faster and faster",e:{speedUp:true},pic:"⏩"},{t:"a little ghost chases the "+hero,e:{enemy:"👻"},pic:"👻"},{t:"twice as many "+it,e:{dense:true},pic:"✖️2"}];
      if(m==="jump") return [{t:"it gets faster and faster",e:{speedUp:true},pic:"⏩"},{t:"the "+it+" get bigger",e:{tall:true},pic:"⬆️"},{t:"birds fly in from the sky",e:{hazard:"🐦"},pic:"🐦"}];
      return [{t:"bombs fall from the sky",e:{hazard:"💣"},pic:"💣"},{t:"the "+it+" come faster and faster",e:{speedUp:true},pic:"⏩"},{t:"a little ghost chases the "+hero,e:{enemy:"👻"},pic:"👻"}];
    case "boundaries":
      if(m==="jump") return [{t:"stay between the ground and the sky",e:{bound:"clamp"},pic:"🧱"},{t:"jump too high and bonk the ceiling",e:{bound:"ceiling"},pic:"🔝"}];
      return [{t:"can't leave the screen",e:{bound:"clamp"},pic:"🧱"},{t:"leave on the left, come back on the right",e:{bound:"wrap"},pic:"🌀"},{t:"bounce back at the edge",e:{bound:"bounce"},pic:"🏓"}];
    case "outcome":
      return [{t:"get 10 points to win, with confetti",e:{outcome:"celebrate",winAt:10},pic:"🎉"},{t:"show the score at the end, click to replay",e:{outcome:"endScreen"},pic:"🔢"},{t:"a high-score leaderboard",e:{outcome:"leaderboard"},pic:"🏆"}];
    case "players":
      return [{t:"one player",e:{players:1},pic:"🙂"},{t:"two players team up (arrows + WASD)",e:{players:2,pmode:"coop"},pic:"🤝"},{t:"two players race for the high score",e:{players:2,pmode:"versus"},pic:"⚔️"}];
    case "objectives":
      if(collect) return [{t:"collect 10 "+it+" to win",e:{target:10},pic:"🔟"},{t:"the longer you last, the better",e:{survive:true},pic:"⏱️"}];
      return [{t:"last 30 seconds to win",e:{timer:30,surviveWin:true},pic:"🏅"},{t:"the longer you last, the better",e:{survive:true},pic:"⏱️"}];
  }
  return [];
}
/* open design questions: they name a gap, never a solution; the kid supplies the answer */
export function questionFor(col,c){
  const it=c.item.n, hero=c.hero.n, m=c.mode, it1=sing(it);
  return ({
    rules:m==="dodge"?"When a "+it1+" hits you, what do you want to happen?":m==="jump"?"When you bump a "+it1+", what do you want to happen?":m==="shoot"?"When you hit a "+it1+", what do you want to happen?":"When you touch a "+it1+", what do you want to happen?",
    procedures:"How do you want to control the "+hero+"?",
    conflict:"What could make this game a bit harder?",
    resources:"Does the "+hero+" have anything that can run out?",
    outcome:"When does your game end?",
    boundaries:"When the "+hero+" reaches the edge, what do you want to happen?",
    players:"Who plays this game?",
    objectives:"What does the player need to do?"
  })[col];
}
export const WHY={
  rules:"Touching things only makes them disappear. No \"if… then…\" yet.",
  procedures:"Keyboard and mouse both work right now. Pick one that fits your game.",
  conflict:"Nothing gets in the way, so the game is too easy.",
  resources:"Nothing runs out, so players never feel nervous.",
  outcome:"The game doesn't know when to end yet.",
  boundaries:"Right now it just stops at the screen edge.",
  players:"Right now it's one player.",
  objectives:"Players don't know how to win yet."
};



export const STEMS={
  rules:c=>c.mode==="dodge"?`When a ${sing(c.item.n)} hits the ${c.hero.n}, `:c.mode==="jump"?`When the ${c.hero.n} bumps a ${sing(c.item.n)}, `:c.mode==="shoot"?`When a bubble hits a ${sing(c.item.n)}, `:`When the ${c.hero.n} touches a ${sing(c.item.n)}, `,
  procedures:()=>"I want to use ",conflict:()=>"I want the game to have ",resources:c=>`The ${c.hero.n} has `,outcome:()=>"When the game ends, ",
  boundaries:c=>`When the ${c.hero.n} reaches the edge, `,players:()=>"This game is for ",objectives:()=>"To win, you need to "
};
export const COL_WORDS={
  players:["two","2 player","friend","team","together","versus","race","one player","alone"],outcome:["end","win","lose","leaderboard","score at","confetti","replay","game over"],
  resources:["life","lives","heart","coin","timer","time","seconds","health","run out"],conflict:["enemy","enemies","bomb","ghost","obstacle","hard","harder","faster","danger"],
  boundaries:["edge","wall","border","screen","wrap"],procedures:["key","mouse","control","press","click","arrow"],objectives:["goal","collect","to win","target"],
  rules:["touch","if ","when","point","score","grow","disappear","bounce","happen","nothing"]
};
