import { cap } from '../design/parse.js';
import { syncStickerNodes } from './design-map.js';

export function createProject(botName){
  return {id:"p"+Date.now().toString(36),botName,name:"",nameEdited:false,phase:"opening",stickers:[],activeChar:null,seen:[],chat:[],versions:[],lastBuilt:[],prediction:null,saved:[],designMap:{nodes:[],edges:[]},updated:Date.now()};
}

function migrateDesignMap(project, savedMap){
  const map=savedMap;
  if(map&&Array.isArray(map.nodes)&&Array.isArray(map.edges))return map;
  const stickers=Array.isArray(project.stickers)?project.stickers:[];
  const built=new Set(Array.isArray(project.lastBuilt)?project.lastBuilt:[]);
  return {
    nodes:stickers.map((sticker,index)=>({
      id:"card-"+sticker.id,
      stickerId:sticker.id,
      title:sticker.text,
      x:(index%3)*260,
      y:Math.floor(index/3)*190,
      status:sticker.status==="new"?"idea":built.has(sticker.id)?"built":"confirmed"
    })),
    edges:[]
  };
}

export function restoreProject(saved, botName){
  const project=Object.assign(createProject(botName),JSON.parse(JSON.stringify(saved)));
  project.saved=project.saved||[];
  project.designMap=migrateDesignMap(project,saved.designMap);
  syncStickerNodes(project);
  if(["generating","choice","newchar"].includes(project.phase))project.phase=project.versions.length?"directions":(project.stickers.length?"confirm":"opening");
  return project;
}

export function createUIState(viewportWidth){
  return {expanded:new Set(),editing:null,menuOpen:false,onboardQ:[],gen:null,choice:null,tab:"create",journalOpen:true,previewOpen:true,paneOpen:false,reveal:false,mapZoom:.8,connectFrom:null};
}

export const projectCharacters=project=>project.stickers.filter(sticker=>sticker.col==="character");
export const isBuilt=(project,id)=>project.lastBuilt.includes(id);

export function buildProjectSpec(project,includeNew){
  const spec={speed:1};
  project.stickers.filter(sticker=>(sticker.status==="ok"||includeNew)&&sticker.effect&&sticker.col!=="character").forEach(sticker=>Object.assign(spec,sticker.effect));
  const characters=projectCharacters(project).filter(sticker=>sticker.status==="ok"||includeNew).map(sticker=>({id:sticker.id,...sticker.effect.char}));
  const active=characters.find(character=>character.id===project.activeChar)||characters[0];
  spec.hero=active||null;spec.others=characters.filter(character=>character!==active);
  return JSON.parse(JSON.stringify(spec));
}

export function projectContext(project){
  const spec=buildProjectSpec(project,true);
  return {hero:spec.hero||{n:"hero",e:"👾"},item:spec.item||{n:"stars",e:"⭐"},mode:spec.mode||"catch"};
}

export function updateAutomaticName(project){
  if(project.nameEdited)return;
  const hero=projectCharacters(project)[0],objective=project.stickers.find(sticker=>sticker.col==="objectives"&&sticker.effect&&sticker.effect.mode);
  project.name=hero?(objective?cap(hero.effect.char.n)+": "+cap(objective.text.replace(/[“”]/g,"")):"The "+cap(hero.effect.char.n)+" Game").slice(0,40):"";
}
