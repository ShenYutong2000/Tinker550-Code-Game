import { HEROES, ITEMS, MODES } from "./catalog.js";

const hasKey=(t,k)=>/^[a-z]/.test(k)?new RegExp("\\b"+k).test(t):t.includes(k);   // English keys match from a word start ("cat" is not in "scatter")
const findIn=(list,t)=>{t=t.toLowerCase();return list.find(x=>x.k.some(k=>hasKey(t,k)));};
export const sing=n=>({cacti:"cactus",fish:"fish",candy:"candy"})[n]||n.replace(/(ch|sh|x)es$/,"$1").replace(/([^s])s$/,"$1");
export const cap=s=>s.replace(/\b[a-z]/g,m=>m.toUpperCase());
/* loose English matching: compare word stems, ignoring words every option shares */
const STOP=new Set("the a an and to of it its is in on at you your my i be get gets got so".split(" "));
const words=s=>s.toLowerCase().replace(/[^a-z0-9+ ]/g," ").split(/\s+/).filter(w=>w&&!STOP.has(w)).map(w=>w.replace(/(ing|ed|es|s)$/,"").slice(0,5)||w);
export function bestMatch(t,opts,c){
  const skip=new Set(words(c.hero.n+" "+c.item.n+" "+sing(c.item.n)));   // the hero and item are in every sentence, so they prove nothing
  const sets=opts.map(o=>new Set(words(o.t))),tw=new Set(words(t).filter(w=>!skip.has(w)));let best=-1,score=0;
  sets.forEach((set,i)=>{const n=[...tw].filter(w=>set.has(w)&&!sets.every(x=>x.has(w))).length;if(n>score){score=n;best=i;}});
  return {best,score};
}
export function parseHero(t){const h=findIn(HEROES,t);const n=t.trim().replace(/^(a|an|the|my)\s+/i,"");return h?{e:h.e,n:n||h.n}:{e:"👾",n:n||"little monster"};}
export function parseAction(t){
  const low=t.toLowerCase();
  let mode="catch";
  for(const m of ["dodge","jump","shoot","catch","roam"]) if(MODES[m].k.some(k=>hasKey(low,k))){mode=m;break;}
  const it=findIn(ITEMS,t);
  const item=it?{e:it.e,n:it.n}:MODES[mode].def;
  return {mode,item};
}

