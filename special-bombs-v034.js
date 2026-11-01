// Independent special bombs. Exact recharge and capacity values are provisional.
export const SPECIAL_BOMB_DEFS={
 plenty:{id:'plenty',name:'Bomb of Plenty',mark:'ore',multiplier:2,cap:3,recharge:9,symbol:'◈'},
 experience:{id:'experience',name:'Experience Bomb',mark:'xp',multiplier:2,cap:3,recharge:9,symbol:'✦'}
};
export function normalizeSpecialBombs(save){
 if(!save.specialBombs||typeof save.specialBombs!=='object'||Array.isArray(save.specialBombs))save.specialBombs={};
 for(const def of Object.values(SPECIAL_BOMB_DEFS)){
  if(!(save.workshopUpgrades?.[def.id]>0))continue;
  const prior=save.specialBombs[def.id];
  const safe=prior&&typeof prior==='object'?prior:{};
  save.specialBombs[def.id]={
   charges:Number.isFinite(safe.charges)?Math.max(0,Math.min(def.cap,Math.floor(safe.charges))):def.cap,
   progress:Number.isFinite(safe.progress)?Math.max(0,Math.min(def.recharge,safe.progress)):0
  };
  if(save.specialBombs[def.id].charges>=def.cap)save.specialBombs[def.id].progress=0;
 }
 return save;
}
export function specialBombInfo(save,id){
 const def=SPECIAL_BOMB_DEFS[id];if(!def||!(save.workshopUpgrades?.[id]>0))return null;
 normalizeSpecialBombs(save);const state=save.specialBombs[id];
 return {def,...state,remaining:state.charges>=def.cap?0:def.recharge-state.progress,
  toFull:state.charges>=def.cap?0:(def.recharge-state.progress)+(def.cap-state.charges-1)*def.recharge};
}
export function rechargeSpecialBombs(save,dt){
 normalizeSpecialBombs(save);
 const delta=Math.max(0,Math.min(60,Number.isFinite(dt)?dt:0));
 for(const [id,def] of Object.entries(SPECIAL_BOMB_DEFS)){
  const state=save.specialBombs[id];if(!state||state.charges>=def.cap)continue;
  state.progress+=delta;
  while(state.charges<def.cap&&state.progress>=def.recharge){state.charges++;state.progress-=def.recharge;}
  if(state.charges>=def.cap)state.progress=0;
 }
}
export function applySpecialBomb(save,id,rocks,mode='single'){
 const info=specialBombInfo(save,id);
 if(!info||!Array.isArray(rocks)||!rocks.length||info.charges<1)return 0;
 const available=rocks.filter(r=>r&&r.hp>0&&!(r.bombMarks?.[info.def.mark]));
 if(!available.length)return 0;
 const count=mode==='all'?info.charges:1;
 for(const rock of available){if(!rock.bombMarks||typeof rock.bombMarks!=='object')rock.bombMarks={};rock.bombMarks[info.def.mark]=true;}
 save.specialBombs[id].charges-=count;
 return count;
}
export function rockMarkReward(rock){return {oreMultiplier:rock?.bombMarks?.ore?2:1,xpMultiplier:rock?.bombMarks?.xp?2:1};}
