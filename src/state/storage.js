export const PROJECTS_KEY="tinkercade.projects.v6";
export const BOT_KEY="tinkercade.bot.v6";

const store={
  get(key,storage){try{const target=storage===undefined?localStorage:storage;return JSON.parse(target.getItem(key)||"null");}catch(e){return null;}},
  set(key,value,storage){try{const target=storage===undefined?localStorage:storage;target.setItem(key,JSON.stringify(value));return true;}catch(e){return false;}}
};

export const readBotName=(storage)=>store.get(BOT_KEY,storage);
export const saveBotName=(name,storage)=>store.set(BOT_KEY,name,storage);
export const readProjects=(storage)=>store.get(PROJECTS_KEY,storage)||[];

export function saveProject(project,storage){
  if(!project.stickers.length)return false;
  const list=readProjects(storage).filter(saved=>saved.id!==project.id);
  project.updated=Date.now();list.unshift(JSON.parse(JSON.stringify(project)));
  return store.set(PROJECTS_KEY,list.slice(0,20),storage);
}

export function clearSavedData(storage){
  try{const target=storage===undefined?localStorage:storage;target.removeItem(PROJECTS_KEY);target.removeItem(BOT_KEY);}catch(e){}
}

export function resetFromLocation(currentLocation,currentHistory,storage){
  try{const current=currentLocation===undefined?location:currentLocation;
    if(/[?&]reset\b/.test(current.search)||current.hash==="#reset"){
    const target=storage===undefined?localStorage:storage;
    [PROJECTS_KEY,BOT_KEY].forEach(key=>target.removeItem(key));
    (currentHistory===undefined?history:currentHistory).replaceState(null,"",current.pathname);
  }}catch(e){}
}
