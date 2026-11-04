import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildProjectSpec, createProject, createUIState, projectContext, restoreProject, updateAutomaticName } from '../src/state/project.js';
import { BOT_KEY, PROJECTS_KEY, clearSavedData, readBotName, readProjects, resetFromLocation, saveBotName, saveProject } from '../src/state/storage.js';
import { createVersionJournal, getAssessmentView, getJournalEntries, savePlaytestAssessment } from '../src/state/journal.js';
import { createIdeaNode } from '../src/state/design-map.js';

function memoryStorage(initial={}){
  const data=new Map(Object.entries(initial));
  return {
    getItem:key=>data.get(key)??null,
    setItem:(key,value)=>data.set(key,value),
    removeItem:key=>data.delete(key),
    raw:key=>data.get(key)
  };
}

const legacy={
  id:'poldv6',botName:'Bolt',name:'Cat: Catching Stars',nameEdited:false,phase:'playtest',
  stickers:[
    {id:'s1',col:'character',text:'🐱 cat',sub:'The hero. It shows up on the canvas',effect:{char:{e:'🐱',n:'cat'}},status:'ok',rot:'0deg',pop:false},
    {id:'s2',col:'objectives',text:'“catching stars”',sub:'catch the falling stars',effect:{mode:'catch',item:{e:'⭐',n:'stars'}},status:'ok',rot:'0deg',pop:false},
    {id:'s3',col:'rules',text:'touch a star: it disappears, +1 point',sub:null,effect:{onCatch:'score'},status:'new',rot:'0deg',pop:false}
  ],
  activeChar:'s1',seen:['boardintro'],chat:[{who:'kid',html:'a cat catching stars'}],
  versions:[{n:1,spec:{speed:1,mode:'catch',item:{e:'⭐',n:'stars'},hero:{id:'s1',e:'🐱',n:'cat'},others:[]},items:['“catching stars”'],summary:'🐱 cat · “catching stars”',snapshot:{stickers:[],activeChar:'s1',lastBuilt:['s1','s2']}}],
  lastBuilt:['s1','s2'],prediction:{round:1,gap:'rules',idx:0,guess:'you get 1 point'},saved:[],updated:12345
};

test('existing v6 JSON stays unchanged in storage and restores with a migrated design map', () => {
  const storage=memoryStorage({[PROJECTS_KEY]:JSON.stringify([legacy]),[BOT_KEY]:JSON.stringify('Bolt')});
  assert.equal(PROJECTS_KEY,'tinkercade.projects.v6');
  assert.equal(BOT_KEY,'tinkercade.bot.v6');
  assert.equal(readBotName(storage),'Bolt');
  assert.deepEqual(readProjects(storage),[legacy]);
  const loaded=restoreProject(readProjects(storage)[0],readBotName(storage));
  const {designMap,...legacyFields}=loaded;
  assert.deepEqual(legacyFields,legacy);
  assert.deepEqual(designMap,{
    nodes:[
      {id:'card-s1',stickerId:'s1',title:'🐱 cat',x:0,y:0,status:'built'},
      {id:'card-s2',stickerId:'s2',title:'“catching stars”',x:260,y:0,status:'built'},
      {id:'card-s3',stickerId:'s3',title:'touch a star: it disappears, +1 point',x:520,y:0,status:'idea'}
    ],
    edges:[]
  });
  assert.deepEqual(buildProjectSpec(loaded,false),legacy.versions[0].spec);
  assert.equal(buildProjectSpec(loaded,true).onCatch,'score');
  assert.deepEqual(projectContext(loaded),{hero:{id:'s1',e:'🐱',n:'cat'},item:{e:'⭐',n:'stars'},mode:'catch'});
  loaded.stickers[0].text='changed';
  assert.equal(readProjects(storage)[0].stickers[0].text,'🐱 cat');
});

test('new projects and older incomplete v6 entries keep their defaults without sidebar state', () => {
  const fresh=createProject('Bolt');
  assert.equal(fresh.botName,'Bolt');
  assert.equal(fresh.phase,'opening');
  assert.deepEqual(fresh.stickers,[]);
  assert.deepEqual(fresh.versions,[]);
  assert.deepEqual(fresh.saved,[]);
  assert.deepEqual(fresh.designMap,{nodes:[],edges:[]});
  assert.equal(createUIState(390).journalOpen,true);
  assert.equal(createUIState(390).previewOpen,true);
  assert.equal('boardOpen' in createUIState(390),false);
  assert.equal('sideOpen' in createUIState(390),false);
  assert.equal('sideOpen' in createUIState(1440),false);
  const incomplete={id:'polder',phase:'generating',stickers:legacy.stickers,versions:legacy.versions};
  const loaded=restoreProject(incomplete,'Bolt');
  assert.equal(loaded.phase,'directions');
  assert.deepEqual(loaded.saved,[]);
  assert.equal(loaded.botName,'Bolt');
  const unnamed=createProject('Bolt');
  unnamed.stickers=structuredClone(legacy.stickers.slice(0,2));
  updateAutomaticName(unnamed);
  assert.equal(unnamed.name,'Cat: Catching Stars');
});

test('a project containing only design notes can be saved and restored', () => {
  const storage=memoryStorage();
  const project=createProject('Robo');
  project.name='Puzzle ideas';
  const note=createIdeaNode(project,'Find the hidden key',320,180,'sky');
  assert.equal(saveProject(project,storage),true);
  const restored=restoreProject(readProjects(storage)[0],'Robo');
  assert.equal(restored.designMap.nodes[0].title,'Find the hidden key');
  assert.equal(restored.designMap.nodes[0].x,320);
  assert.equal(restored.designMap.nodes[0].y,180);
  assert.equal(restored.designMap.nodes[0].id,note.id);
});

test('saving keeps the v6 key, JSON format, newest-first order and 20-project limit', () => {
  const older=Array.from({length:20},(_,i)=>({...legacy,id:`p${i}`,name:`Old ${i}`}));
  const storage=memoryStorage({[PROJECTS_KEY]:JSON.stringify(older)});
  const project=structuredClone(legacy);
  project.name='Updated';
  assert.equal(saveProject(project,storage),true);
  const saved=JSON.parse(storage.raw(PROJECTS_KEY));
  assert.equal(saved.length,20);
  assert.equal(saved[0].id,legacy.id);
  assert.equal(saved[0].name,'Updated');
  assert.equal(saved[1].id,'p0');
  assert.deepEqual(saved[0],project);
  assert.equal(saveBotName('Robo',storage),true);
  assert.equal(storage.raw(BOT_KEY),'"Robo"');
});

test('journal entries keep version notes, predictions and playtest reflections together', () => {
  const project=createProject('Bolt');
  project.versions=[{n:1,summary:'catch stars',journal:createVersionJournal([
    {id:'s1',text:'Catch stars',col:'objectives'},
    {id:'s2',text:'A cat is the hero',col:'character'}
  ],'you get 1 point')}];
  project.prediction={round:1,guess:'you get 1 point'};
  const UI=createUIState(1440);
  assert.deepEqual(getJournalEntries(project)[0],{
    version:1,
    steps:[
      {stickerId:'s1',text:'Catch stars',category:'objectives'},
      {stickerId:'s2',text:'A cat is the hero',category:'character'}
    ],
    expected:'you get 1 point',assessment:null
  });
  assert.deepEqual(getAssessmentView(project,UI),{state:'ready',expected:'you get 1 point',canStart:true});
  const assessment=savePlaytestAssessment(project,{response:'nothing happened',feeling:'hard',discovery:'rules'});
  assert.equal(assessment.alignment,'different');
  assert.equal(assessment.expected,'you get 1 point');
  assert.equal(getJournalEntries(project)[0].assessment.response,'nothing happened');
  assert.equal(getAssessmentView(project,UI).state,'complete');
});

test('reset and unavailable storage retain the original fallback behavior', () => {
  const storage=memoryStorage({[PROJECTS_KEY]:'[]',[BOT_KEY]:'"Bolt"'});
  const calls=[];
  resetFromLocation({search:'?reset',hash:'',pathname:'/game/'},{replaceState:(...args)=>calls.push(args)},storage);
  assert.equal(storage.raw(PROJECTS_KEY),undefined);
  assert.equal(storage.raw(BOT_KEY),undefined);
  assert.deepEqual(calls,[[null,'','/game/']]);
  saveBotName('Bolt',storage);
  clearSavedData(storage);
  assert.equal(readBotName(storage),null);
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
  assert.deepEqual(readProjects(blocked),[]);
  assert.equal(saveBotName('Bolt',blocked),false);
  assert.doesNotThrow(()=>clearSavedData(blocked));
});
