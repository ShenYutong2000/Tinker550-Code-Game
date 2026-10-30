/* ---------- design vocabulary ---------- */
export const COLS=[
  {key:"players",en:"PLAYERS",zh:"Players",ic:"👥",tip:"Is this game for one person, or friends too? Do you team up, or compete?",eg:"e.g. two players team up: one uses arrow keys, one uses WASD."},
  {key:"objectives",en:"OBJECTIVES",zh:"Goal",ic:"🎯",tip:"What is the player trying to do? What counts as winning? Without a goal, players don't know what to do.",eg:"e.g. collect 10 stars."},
  {key:"procedures",en:"PROCEDURES",zh:"Controls",ic:"🕹️",tip:"What do the player's fingers do: which keys, how the mouse moves. It's how you talk to the game.",eg:"e.g. use ← → to move."},
  {key:"rules",en:"RULES",zh:"Rules",ic:"⚙️",tip:"The laws of your game world, said as \"if… then…\". The computer only follows rules. It never guesses.",eg:"e.g. if you touch a star, you get 1 point."},
  {key:"resources",en:"RESOURCES",zh:"Resources",ic:"💎",tip:"Precious things that can run out. When they get low, players get nervous.",eg:"e.g. 3 lives, a 30-second timer, coins."},
  {key:"conflict",en:"CONFLICT",zh:"Challenge",ic:"⚡",tip:"What stops you from winning easily? Games that are too easy get boring fast.",eg:"e.g. bombs fall from the sky, and it gets faster."},
  {key:"boundaries",en:"BOUNDARIES",zh:"Edges",ic:"🧱",tip:"Where are the walls of your world? At the edge, do you stop, wrap around, or bounce back?",eg:"e.g. leave on the left, come back on the right."},
  {key:"outcome",en:"OUTCOME",zh:"Ending",ic:"🏁",tip:"What happens when the game ends? A party, a score, or play again right away?",eg:"e.g. reach 10 points to win, with confetti."}
];
export const COLMAP=Object.fromEntries(COLS.map(c=>[c.key,c]));
export const CHAR_COL={key:"character",en:"MY CHARACTER",zh:"My character",ic:"🧩",tip:"This is your game's hero! It becomes a real, moving character on the canvas. You can add more characters later.",eg:"e.g. a cat, a robot."};

export const HEROES=[
  {k:["猫","cat","kitty","kitten"],e:"🐱",n:"cat"},{k:["狗","dog","puppy"],e:"🐶",n:"dog"},{k:["机器人","robot"],e:"🤖",n:"robot"},
  {k:["火箭","rocket","ship"],e:"🚀",n:"rocket"},{k:["鱼","fish"],e:"🐟",n:"fish"},{k:["兔","rabbit","bunny"],e:"🐰",n:"bunny"},
  {k:["恐龙","dino"],e:"🦖",n:"dinosaur"},{k:["企鹅","penguin"],e:"🐧",n:"penguin"},{k:["熊猫","panda"],e:"🐼",n:"panda"},
  {k:["青蛙","frog"],e:"🐸",n:"frog"},{k:["外星","alien"],e:"👽",n:"alien"},{k:["鸡","鸟","chick","bird"],e:"🐥",n:"chick"},
  {k:["章鱼","octopus"],e:"🐙",n:"octopus"},{k:["狐狸","fox"],e:"🦊",n:"fox"}
];
export const ITEMS=[
  {k:["星","star"],e:"⭐",n:"stars"},{k:["苹果","apple"],e:"🍎",n:"apples"},{k:["金币","coin","money"],e:"🪙",n:"coins"},
  {k:["鱼","fish"],e:"🐟",n:"fish"},{k:["糖","candy","sweet"],e:"🍬",n:"candy"},{k:["蛋糕","cake"],e:"🍰",n:"cakes"},
  {k:["宝石","gem","diamond","jewel"],e:"💎",n:"gems"},{k:["泡泡","bubble"],e:"🫧",n:"bubbles"},{k:["气球","balloon"],e:"🎈",n:"balloons"},
  {k:["陨石","meteor","rock","asteroid"],e:"☄️",n:"meteors"},{k:["仙人掌","cactus","cacti"],e:"🌵",n:"cacti"},{k:["箱","box"],e:"📦",n:"boxes"},
  {k:["胡萝卜","carrot"],e:"🥕",n:"carrots"},{k:["骨头","bone"],e:"🦴",n:"bones"},{k:["雪花","snow"],e:"❄️",n:"snowflakes"}
];
export const MODES={
  dodge:{k:["躲","dodg","avoid","escape"],def:{e:"☄️",n:"meteors"},obj:n=>"dodge the falling "+n},
  jump:{k:["跳","jump","hop","leap"],def:{e:"🌵",n:"cacti"},obj:n=>"jump over the "+n},
  shoot:{k:["射","打","shoot","fire","blast","pop"],def:{e:"🎈",n:"balloons"},obj:n=>"shoot bubbles to pop the "+n},
  catch:{k:["接","抓","收集","吃","catch","collect","eat","grab"],def:{e:"⭐",n:"stars"},obj:n=>"catch the falling "+n},
  roam:{k:["游","飞","走","swim","fly","explore","walk","run","move","find"],def:{e:"💎",n:"gems"},obj:n=>"explore and find "+n}
};
