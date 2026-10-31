// Permanent chest rewards, independent of temporary artifacts and consumables.
// Historical research documents these effect sizes; limited to stats implemented in Sekavore.
const REWARDS = [
 {id:'pickaxe-common', name:'Pickaxe Damage', tier:'Common', effect:'pickaxe', amount:.03, text:'+3% Pickaxe Damage'},
 {id:'sell-common', name:'Ore Sell Price', tier:'Common', effect:'sell', amount:.03, text:'+3% Ore Sell Price'},
 {id:'xp-common', name:'Experience Gain', tier:'Common', effect:'xp', amount:.01, text:'+1% Experience Gain', cap:10000},
 {id:'bomb-rare', name:'Bomb Damage', tier:'Rare', effect:'bomb', amount:.20, text:'+20% Bomb Damage'},
 {id:'xp-rare', name:'Experience Gain', tier:'Rare', effect:'xp', amount:.03, text:'+3% Experience Gain'},
 {id:'pickaxe-epic', name:'Pickaxe Damage', tier:'Epic', effect:'pickaxe', amount:.10, text:'+10% Pickaxe Damage'},
 {id:'recharge-epic', name:'Bomb Recharge Speed', tier:'Epic', effect:'recharge', amount:.02, text:'+2% Bomb Recharge Speed', cap:250},
 {id:'capacity-epic', name:'Bomb Capacity', tier:'Epic', effect:'capacity', amount:1, text:'+1 Bomb Capacity', cap:2500},
 {id:'prestige-legendary', name:'Prestige Point Gain', tier:'Legendary', effect:'prestige', amount:.15, text:'+15% Prestige Point Gain'},
];
export const RELIC_REWARDS=Object.freeze(REWARDS.map(r=>Object.freeze({...r})));
export const RELIC_TIERS=Object.freeze(['Common','Rare','Epic','Legendary']);
const TIER_WEIGHTS=Object.freeze({Common:48,Rare:30,Epic:14,Legendary:7});
const integer=n=>Number.isSafeInteger(n)&&n>=0?n:0;
export function normalizeRelics(state){
 if(!state.relicInventory||typeof state.relicInventory!=='object'||Array.isArray(state.relicInventory))state.relicInventory={};
 const clean={};
 for(const reward of RELIC_REWARDS){const n=integer(state.relicInventory[reward.id]);if(n)clean[reward.id]=Math.min(n,reward.cap||1000000);}
 state.relicInventory=clean;
 state.relicsOpened=integer(state.relicsOpened);
 // This game has a base cap of 3; capacity relics add to the real bomb stock, not decorative stats.
 state.bombMax=Math.max(integer(state.bombMax),3+(clean['capacity-epic']||0));
 state.bombs=Math.min(state.bombMax,integer(state.bombs));
 return state;
}
export function relicCount(state,id){return integer(state?.relicInventory?.[id]);}
export function relicBonus(state,effect){return RELIC_REWARDS.reduce((sum,r)=>sum+(r.effect===effect?relicCount(state,r.id)*r.amount:0),0);}
function rollWeighted(entries,random){
 const total=entries.reduce((sum,r)=>sum+r.weight,0);
 if(!total)return null;
 let value=Math.max(0,Math.min(.999999999,Number(random())||0))*total;
 for(const entry of entries){value-=entry.weight;if(value<0)return entry.value;}
 return entries.at(-1).value;
}
export function chooseRelic(state,random=Math.random){
 const available=RELIC_REWARDS.filter(r=>relicCount(state,r.id)<(r.cap||1000000));
 if(!available.length)return null;
 const tiers=RELIC_TIERS.filter(t=>available.some(r=>r.tier===t));
 const tier=rollWeighted(tiers.map(t=>({weight:TIER_WEIGHTS[t],value:t})),random);
 const pool=available.filter(r=>r.tier===tier);
 return pool[Math.min(pool.length-1,Math.floor(Math.max(0,Math.min(.999999999,Number(random())||0))*pool.length))];
}
export function openRelicChests(state,requested=1,random=Math.random){
 normalizeRelics(state);
 const stock=integer(state.relicChests);
 const count=Math.min(stock,Math.max(0,Math.floor(Number.isFinite(Number(requested))?Number(requested):0)),500);
 const found={};let opened=0;
 for(let i=0;i<count;i++){
  const reward=chooseRelic(state,random);
  if(!reward)break;
  state.relicInventory[reward.id]=relicCount(state,reward.id)+1;
  found[reward.id]=(found[reward.id]||0)+1;
  opened++;
 }
 state.relicChests=stock-opened;
 state.relicsOpened+=opened;
 normalizeRelics(state);
 return {opened,found};
}
