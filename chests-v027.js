// Independent chest progression. Thresholds and loot odds are provisional Sekavore balance.
export const ITEM_CHEST_BASE_DAMAGE=90;
export const RELIC_CHEST_BASE_DAMAGE=500;
export const ITEM_CHEST_GROWTH=1.35;
export const RELIC_CHEST_GROWTH=1.55;
export const CHEST_ITEM_POOL=Object.freeze([
 {name:'Apple',weight:16,icon:'A'},
 {name:'Bread',weight:16,icon:'B'},
 {name:'Drone Juice',weight:16,icon:'D'},
 {name:'Banana Coffee',weight:10,icon:'C'},
 {name:'Pike',weight:10,icon:'P'},
 {name:'Eye of Newt',weight:10,icon:'E'},
 {name:'Rock Cake',weight:4.6,icon:'R'},
 {name:'Juicy Plums',weight:4.6,icon:'J'},
 {name:'Chaos Totem',weight:4.6,icon:'T'},
 {name:'Primal Meat',weight:2.6,icon:'M'},
 {name:'Cherries',weight:2.6,icon:'H'},
 {name:'Charge Magnet',weight:2.6,icon:'G'},
 {name:'Blue Cow',weight:.2,icon:'U'}
]);
const kinds={item:{progress:'itemChestDamage',earned:'itemChestEarned',stock:'itemChests',base:ITEM_CHEST_BASE_DAMAGE,growth:ITEM_CHEST_GROWTH},relic:{progress:'relicChestDamage',earned:'relicChestEarned',stock:'relicChests',base:RELIC_CHEST_BASE_DAMAGE,growth:RELIC_CHEST_GROWTH}};
export function normalizeChests(s){
 for(const spec of Object.values(kinds))for(const key of [spec.progress,spec.earned,spec.stock]){
  if(!Number.isFinite(s[key])||s[key]<0)s[key]=0;
  s[key]=key===spec.progress?s[key]:Math.floor(s[key]);
 }
 if(!Array.isArray(s.consumables))s.consumables=[];
 s.consumables=s.consumables.filter(i=>i&&typeof i.name==='string'&&Number.isSafeInteger(i.qty)&&i.qty>0).map(i=>({...i,id:(typeof i.id==='string'&&i.id)?i.id:i.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),qty:Math.min(i.qty,1e9)}));
 return s;
}
export function chestThreshold(kind,earned=0){
 const spec=kinds[kind];if(!spec)throw Error('Unknown chest meter');
 return Math.ceil(spec.base*Math.pow(spec.growth,Math.max(0,Math.min(earned,120))));
}
export function chestStatus(s,kind){
 const spec=kinds[kind];if(!spec)throw Error('Unknown chest meter');
 const target=chestThreshold(kind,s[spec.earned]||0),progress=Math.max(0,s[spec.progress]||0);
 return {owned:s[spec.stock]||0,earned:s[spec.earned]||0,progress,target,percent:Math.max(0,Math.min(100,100*progress/target))};
}
export function recordChestDamage(s,rawDamage){
 normalizeChests(s);
 const damage=Number.isFinite(rawDamage)?Math.max(0,rawDamage):0;
 if(!damage)return {item:0,relic:0};
 const results={item:0,relic:0};
 for(const [name,spec] of Object.entries(kinds)){
  s[spec.progress]+=damage;
  let steps=0;
  while(steps<500&&s[spec.progress]>=chestThreshold(name,s[spec.earned])){
   s[spec.progress]-=chestThreshold(name,s[spec.earned]);
   s[spec.earned]++;s[spec.stock]++;steps++;results[name]++;
  }
 }
 return results;
}
export function chooseChestItem(random=Math.random){
 let n=Math.max(0,Math.min(.999999999,Number(random())||0))*CHEST_ITEM_POOL.reduce((a,i)=>a+i.weight,0);
 for(const item of CHEST_ITEM_POOL){n-=item.weight;if(n<0)return item;}
 return CHEST_ITEM_POOL[CHEST_ITEM_POOL.length-1];
}
export function openItemChests(s,requested=1,random=Math.random){
 normalizeChests(s);
 const take=Math.min(s.itemChests,Math.max(0,Math.floor(requested)),500);
 const found={};
 for(let i=0;i<take;i++){
  const item=chooseChestItem(random);
  let owned=s.consumables.find(x=>x.name===item.name);
  if(!owned){owned={id:item.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name:item.name,qty:0,icon:item.icon};s.consumables.push(owned);}
  owned.qty++;
  found[item.name]=(found[item.name]||0)+1;
 }
 s.itemChests-=take;
 return {opened:take,found};
}
