import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,awardRock,ORES,craftBars,sellOre,LVL_REQ,pickaxeBase,grantXp,UPGRADE_DEFS,upgradeCost,buyUpgrade,availablePrestige,prestige,offlineGrant,isValidSave,bossArmor} from '../core.js';
test('initial state & save are valid',()=>{const s=newGame();assert.ok(isValidSave(s));assert.equal(s.floor,1);assert.equal(s.gold,0);assert.equal(s.bombs,3);});
test('pickaxe base formula is triangular',()=>{assert.equal(pickaxeBase(0),1);assert.equal(pickaxeBase(3),10);});
test('mine, craft and sell maintain ore accounting',()=>{const s=newGame();awardRock(s,ORES[0],6);assert.equal(s.ore.tin,6);assert.equal(craftBars(s,'tin',1,()=>1),1);assert.equal(s.ore.tin,1);assert.equal(s.bars.tin,1);assert.equal(sellOre(s,'tin'),2);assert.equal(s.gold,2);});
test('upgrades require unlock level and gold',()=>{const s=newGame();s.gold=2000;assert.ok(buyUpgrade(s,'pick'));assert.equal(s.upgrades.pick,1);assert.equal(buyUpgrade(s,'crit'),false);});
test('prestige preserves permanent systems and resets temporary',()=>{const s=newGame();s.level=24;s.gold=15000;s.drone=true;s.obeliskLevel=1;s.levelCap=25;s.artifacts.power=1;let result=prestige(s);assert.ok(result>0);assert.equal(s.level,1);assert.equal(s.gold,0);assert.equal(s.obeliskLevel,1);assert.equal(s.levelCap,25);assert.equal(s.artifacts.power,1);assert.equal(s.drone,true);});
test('offline mining requires drone and is capped',()=>{const s=newGame();assert.equal(offlineGrant(s,999).ore,0);s.drone=true;assert.ok(offlineGrant(s,60).ore>0);assert.ok(Object.values(s.ore).reduce((a,b)=>a+b,0)>0);});
test('invalid saves rejected',()=>{let s=newGame();s.ore.tin=-1;assert.equal(isValidSave(s),false);});

test('material costs are enforced after early pickaxe levels',()=>{const s=newGame();s.gold=100000;s.upgrades.pick=3;assert.equal(buyUpgrade(s,'pick'),false);s.bars.tin=1;assert.equal(buyUpgrade(s,'pick'),true);assert.equal(s.bars.tin,0);});

test('floor progress persists per floor when revisiting',async()=>{
 const {moveFloor,canNextFloor,floorQuota,getFloorProgress}=await import('../core.js');
 const s=newGame();
 for(let i=0;i<floorQuota(1);i++)awardRock(s,ORES[0]);
 assert.equal(canNextFloor(s),true);
 assert.equal(moveFloor(s,1),true);
 assert.equal(s.floor,2);assert.equal(s.rocksThisFloor,0);
 awardRock(s,ORES[0]);awardRock(s,ORES[0]);
 assert.equal(moveFloor(s,-1),true);
 assert.equal(s.rocksThisFloor,floorQuota(1));
 assert.equal(moveFloor(s,1),true);
 assert.equal(s.rocksThisFloor,2);
 assert.equal(getFloorProgress(s,1),floorQuota(1));
 assert.ok(isValidSave(s));
});

test('floor map cannot skip locked floors',async()=>{
 const {travelToFloor,floorQuota}=await import('../core.js');
 const s=newGame();
 assert.equal(travelToFloor(s,2),false);
 for(let i=0;i<floorQuota(1);i++)awardRock(s,ORES[0]);
 assert.equal(travelToFloor(s,3),false);
 assert.equal(travelToFloor(s,2),true);
 assert.equal(travelToFloor(s,3),false);
});

test('older v0.2 saves migrate floor progress without discarding completed quota',async()=>{
 const {moveFloor,canNextFloor,floorQuota,getFloorProgress}=await import('../core.js');
 const s=newGame();delete s.floorProgress;
 s.floor=3;s.highestFloor=3;s.rocksThisFloor=floorQuota(3);
 assert.ok(isValidSave(s));assert.equal(canNextFloor(s),true);
 assert.equal(getFloorProgress(s,3),floorQuota(3));
 assert.equal(moveFloor(s,1),true);assert.equal(s.rocksThisFloor,0);
 assert.equal(moveFloor(s,-1),true);assert.equal(s.rocksThisFloor,floorQuota(3));
});

test('prestige clears all temporary per-floor progress',async()=>{
 const {getFloorProgress}=await import('../core.js');
 const s=newGame();s.level=21;s.floorProgress[1]=10;s.rocksThisFloor=10;
 assert.ok(prestige(s)>0);assert.equal(s.floor,1);assert.equal(getFloorProgress(s,1),0);
});

test('hand radius targets all rocks in range, not only the first', async()=>{
 const {handReach,targetsInReach}=await import('../core.js');
 const s=newGame(); const points=[{x:10,y:10,hp:10,size:14},{x:30,y:15,hp:10,size:14},{x:110,y:80,hp:10,size:14}];
 assert.equal(handReach(s),48);
 assert.equal(targetsInReach(points,15,14,handReach(s)).length,2);
 s.upgrades.radius=5;
 assert.equal(handReach(s),67);
 assert.equal(targetsInReach(points,15,14,handReach(s)).length,2);
 assert.equal(targetsInReach(points,Number.NaN,14,50).length,0);
});
