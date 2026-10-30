// Deep Mine Research — original browser simulation of publicly documented idle-mining mechanics.
// All balance values below are research approximations, not recovered GameMaker formulas.
export const ORES = [
 {id:'tin',name:'Tin',color:'#b9c8d0',edge:'#788b9b',min:1,max:2,craft:5,price:2},
 {id:'copper',name:'Copper',color:'#d88d62',edge:'#80513e',min:1,max:4,craft:6,price:4},
 {id:'mithril',name:'Mithril',color:'#6dc5dd',edge:'#2b708c',min:3,max:6,craft:7,price:9},
 {id:'adamant',name:'Adamant',color:'#7bc76c',edge:'#346f52',min:5,max:8,craft:8,price:18},
 {id:'runite',name:'Runite',color:'#a47bcb',edge:'#5f4586',min:7,max:10,craft:9,price:36},
 {id:'citrine',name:'Citrine',color:'#edb64e',edge:'#93602d',min:9,max:12,craft:10,price:70}
];
export const UPGRADE_DEFS=[
 {id:'pick',name:'Upgrade Pickaxe',desc:'Increases base pickaxe damage.',req:1,cap:115,base:12,rate:1.31,icon:'⛏'},
 {id:'radius',name:'Pickaxe Radius',desc:'+8% area reach per level.',req:4,cap:16,base:75,rate:1.55,icon:'◎'},
 {id:'crit',name:'Crit Chance',desc:'+2% critical-hit chance per level.',req:8,cap:16,base:180,rate:1.53,icon:'✦'},
 {id:'craft',name:'Double Craft Chance',desc:'+2% chance to create an extra bar.',req:12,cap:16,base:340,rate:1.5,icon:'▣'},
 {id:'multirock',name:'Multi Rock Chance',desc:'+1% chance to duplicate an ore drop.',req:16,cap:16,base:680,rate:1.52,icon:'◈'},
 {id:'bomb',name:'Bomb Damage',desc:'+20% blast damage per level.',req:20,cap:16,base:1100,rate:1.56,icon:'✹'},
 {id:'sell',name:'Ore Sell Price',desc:'+10% gold from selling ores.',req:24,cap:16,base:2100,rate:1.5,icon:'◉'},
 {id:'crdmg',name:'Crit Damage',desc:'+10% critical-hit multiplier.',req:28,cap:11,base:3400,rate:1.55,icon:'✷'}
];
export const ARTIFACTS=[
 {id:'power',name:'Pickaxe Power',desc:'+10% permanent pickaxe damage per tier.',cost:2,rate:1.7,cap:32},
 {id:'growth',name:'Experience Gain',desc:'+10% permanent experience per tier.',cost:3,rate:1.8,cap:27},
 {id:'sales',name:'Ore Sell Value',desc:'+12% permanent sale value per tier.',cost:4,rate:1.9,cap:17},
 {id:'blast',name:'Bomb Strength',desc:'+30% permanent bomb damage per tier.',cost:3,rate:1.85,cap:32}
];
export const LVL_REQ = l=>Math.round(18+8*l+2*l*l);
export const upgradeCost = (def,level)=>Math.round(def.base*Math.pow(def.rate,level));
export const upgradeMaterials = (def,level) => {if(def.id==='pick'&&level<3)return null;const ore=ORES[Math.min(ORES.length-1,Math.floor(Math.max(0,def.req-1)/8))];return {ore,qty:1+Math.floor(level/6)};};
export const artifactCost=(def,level)=>Math.round(def.cost*Math.pow(def.rate,level));
export const pickaxeBase = lvl=>((lvl+1)*(lvl+2))/2; // public wiki equation; not verified on 2.2.51.
export const pickDamage = s=>Math.round(pickaxeBase(s.upgrades.pick||0)*(1+0.10*(s.artifacts.power||0))*(1+0.015*s.prestiges));
export const critChance=s=>Math.min(0.65,0.05+0.02*(s.upgrades.crit||0));
export const damageRoll=(s,r=Math.random)=>Math.max(1,Math.round(pickDamage(s)*(r()<critChance(s)?2+0.1*(s.upgrades.crdmg||0):1)));
export const saleMultiplier=s=>(1+0.10*(s.upgrades.sell||0))*(1+0.12*(s.artifacts.sales||0));
export const bombDamage=s=>Math.round(pickDamage(s)*5*(1+0.2*(s.upgrades.bomb||0))*(1+0.3*(s.artifacts.blast||0)));
export const xpMultiplier=s=>1+0.10*(s.artifacts.growth||0);
export const oreAtFloor=(floor,r=Math.random)=>{let choices=ORES.filter(o=>floor>=o.min&&floor<=o.max);if(!choices.length)choices=ORES.filter(o=>o.min<=floor).slice(-3);return choices[Math.floor(r()*choices.length)]||ORES[0];};
export const floorQuota=f=>Math.round(6+f*3);
export const rockHealth=f=>Math.round(9*Math.pow(1.35,f-1));
export const bossTotal=level=>Math.round(900*Math.pow(2.7,level));
export const bossArmor=level=>Math.round(5*Math.pow(1.9,level));
export const availablePrestige=s=>s.level<20?0:Math.max(1,Math.floor(Math.pow(s.level-19,1.25)*(1+0.02*s.highestFloor)));
const nobj=()=>Object.fromEntries(ORES.map(o=>[o.id,0]));
export function newGame(){return {version:2,gold:0,gems:0,level:1,xp:0,levelCap:20,floor:1,highestFloor:1,rocksBroken:0,rocksThisFloor:0,floorProgress:{1:0},ore:nobj(),bars:nobj(),upgrades:Object.fromEntries(UPGRADE_DEFS.map(u=>[u.id,0])),artifacts:Object.fromEntries(ARTIFACTS.map(u=>[u.id,0])),prestiges:0,prestigePoints:0,obeliskLevel:0,bossRemaining:bossTotal(0),bossReadyAt:0,drone:false,droneLevel:0,dronePoints:0,bombs:3,bombMax:3,bombCharge:0,autoFloor:false,autoFloorUnlocked:false,skillPoints:0,lastSaved:Date.now(),totalClicks:0,totalMined:0,settings:{sound:true},log:[]};}
export function grantXp(s,amount){s.xp+=Math.max(0,Math.floor(amount*xpMultiplier(s)));while(s.level<s.levelCap&&s.xp>=LVL_REQ(s.level)){s.xp-=LVL_REQ(s.level);s.level++;}if(s.level>=s.levelCap)s.xp=Math.min(s.xp,LVL_REQ(s.level));}
// Each floor keeps its own quota even when the player travels back to an older floor.
// The field is optional on old v0.2 browser saves; it migrates without wiping progress.
export function getFloorProgress(s, floor=s.floor){
 if(!s.floorProgress || typeof s.floorProgress!=='object')s.floorProgress={[s.floor]:Math.max(0,s.rocksThisFloor||0)};
 if(!Number.isFinite(s.floorProgress[floor]))s.floorProgress[floor]=0;
 s.floorProgress[floor]=Math.max(0,Math.min(floorQuota(floor),Math.floor(s.floorProgress[floor])));
 return s.floorProgress[floor];
}
export function awardRock(s,ore,amount=1){s.ore[ore.id]=(s.ore[ore.id]||0)+amount;s.rocksBroken++;s.rocksThisFloor=Math.min(floorQuota(s.floor),getFloorProgress(s)+1);s.floorProgress[s.floor]=s.rocksThisFloor;s.totalMined+=amount;grantXp(s,3+s.floor*2);}
export function canNextFloor(s){return getFloorProgress(s)>=floorQuota(s.floor);}
export function travelToFloor(s,destination){
 const next=Math.floor(destination);
 if(!Number.isFinite(next)||next<1||next>s.highestFloor+(s.floor===s.highestFloor&&canNextFloor(s)?1:0))return false;
 if(next===s.floor)return false;
 getFloorProgress(s);
 s.floor=next;s.highestFloor=Math.max(s.highestFloor,next);
 s.rocksThisFloor=getFloorProgress(s,next);
 return true;
}
export function moveFloor(s,offset){return travelToFloor(s,s.floor+offset);}
export function craftBars(s,oreId,count=1,r=Math.random){const item=ORES.find(o=>o.id===oreId);if(!item)return 0;const possible=Math.min(Math.floor((s.ore[oreId]||0)/item.craft),count);if(possible<=0)return 0;s.ore[oreId]-=possible*item.craft;let bonus=0;for(let i=0;i<possible;i++)if(r()<0.02*(s.upgrades.craft||0))bonus++;s.bars[oreId]=(s.bars[oreId]||0)+possible+bonus;return possible+bonus;}
export function sellOre(s,oreId,count=Infinity){const item=ORES.find(o=>o.id===oreId);if(!item)return 0;const qty=Math.min(s.ore[oreId]||0,count);if(qty<=0)return 0;s.ore[oreId]-=qty;const gain=Math.round(qty*item.price*saleMultiplier(s));s.gold+=gain;return gain;}
export function buyUpgrade(s,id){const def=UPGRADE_DEFS.find(x=>x.id===id);if(!def||s.level<def.req)return false;const lvl=s.upgrades[id]||0;const mat=upgradeMaterials(def,lvl);if(lvl>=def.cap||s.gold<upgradeCost(def,lvl)||(mat&&(s.bars[mat.ore.id]||0)<mat.qty))return false;s.gold-=upgradeCost(def,lvl);if(mat)s.bars[mat.ore.id]-=mat.qty;s.upgrades[id]=lvl+1;return true;}
export function buyArtifact(s,id){const def=ARTIFACTS.find(x=>x.id===id);if(!def)return false;const lvl=s.artifacts[id]||0;const cost=artifactCost(def,lvl);if(s.prestigePoints<cost||lvl>=def.cap)return false;s.prestigePoints-=cost;s.artifacts[id]++;return true;}
export function prestige(s){let pts=availablePrestige(s);if(!pts)return 0;let fresh=newGame();const permanent=['levelCap','artifacts','gems','prestigePoints','prestiges','obeliskLevel','bossRemaining','bossReadyAt','drone','droneLevel','dronePoints','totalClicks','totalMined','rocksBroken','settings','log','skillPoints','autoFloorUnlocked'];for(const key of permanent)fresh[key]=structuredClone(s[key]);fresh.prestigePoints+=pts;fresh.prestiges++;Object.assign(s,fresh);return pts;}
export function offlineGrant(s,elapsed){const seconds=Math.max(0,Math.min(elapsed,4*3600));if(!s.drone||seconds<2)return {seconds,rocks:0,ore:0};const attacks=Math.min(10000,Math.floor(seconds/(5/Math.max(1,1+0.15*s.droneLevel))));let mined=0;for(let i=0;i<attacks;i++){const ore=oreAtFloor(s.floor,()=>((i*37)%101)/101);let dmg=Math.max(1,Math.floor(pickDamage(s)*(0.65+0.25*s.droneLevel+0.10*s.dronePoints)));if(i%(Math.max(1,Math.ceil(rockHealth(s.floor)/dmg)))===0){s.ore[ore.id]+=1;mined++;s.totalMined++;grantXp(s,1+s.floor);}}
return {seconds,rocks:mined,ore:mined};}
export function isValidSave(s){return !!s&&s.version===2&&Number.isFinite(s.gold)&&s.gold>=0&&Number.isFinite(s.level)&&s.level>=1&&Number.isFinite(s.floor)&&s.floor>=1&&ORES.every(o=>Number.isFinite(s.ore?.[o.id])&&s.ore[o.id]>=0)&&UPGRADE_DEFS.every(u=>Number.isInteger(s.upgrades?.[u.id])&&s.upgrades[u.id]>=0&&s.upgrades[u.id]<=u.cap)&&(!s.floorProgress||Object.values(s.floorProgress).every(v=>Number.isSafeInteger(v)&&v>=0))};

// Area-of-effect hand targeting, kept separate from rendering and save state.
export function handReach(s){return Math.round(48 * (1 + 0.08 * Math.max(0,s.upgrades?.radius||0)));}
export function targetsInReach(rocks,x,y,radius){
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius<=0)return [];
 return rocks.filter(r=>r.hp>0 && Math.hypot(r.x-x,r.y-y)<=radius + Math.min(8,(r.size||0)*0.30));
}
