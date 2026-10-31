import test from 'node:test';
import assert from 'node:assert/strict';
import {createWave,waveSize,WAVE_REFRESH_MS,FIELD_BOUNDS,secondsToWave,waveIsClear} from '../mining-waves-v021.js';
import {newGame,awardRock,canNextFloor,travelToFloor,getFloorProgress,ORES,floorQuota,floorOrePopulation,awardWaveClear} from '../core.js';
import {shouldAutoAdvance} from '../floor-auto-v019.js';
import {readFileSync} from 'node:fs';

test('wave density scales with floor requirement and is bounded',()=>{
 assert.equal(waveSize(1,floorOrePopulation(1)),9);
 assert.equal(waveSize(4,floorOrePopulation(4)),18);
 assert.equal(waveSize(80,floorOrePopulation(80)),18);
 assert.equal(WAVE_REFRESH_MS,1250);
});
test('a wave is complete, spaced and within mining field bounds',()=>{
 let id=0,seed=1;
 const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(const floor of [1,2,4,15,60]){
  const rocks=createWave(floor,floorOrePopulation(floor),(x,y)=>({id:++id,x,y,hp:10}),rnd);
  assert.equal(rocks.length,waveSize(floor,floorOrePopulation(floor)));
  for(const r of rocks){
   assert.ok(r.x>=FIELD_BOUNDS.left&&r.x<=FIELD_BOUNDS.right);
   assert.ok(r.y>=FIELD_BOUNDS.top&&r.y<=FIELD_BOUNDS.bottom);
   for(const r2 of rocks)if(r!==r2)assert.ok(Math.hypot(r.x-r2.x,r.y-r2.y)>40);
  }
 }
});
test('wave refresh deadline and clear state',()=>{
 assert.equal(waveIsClear([]),true);
 assert.equal(waveIsClear([{hp:1}]),false);
 assert.equal(secondsToWave(2000,750),1.3);
 assert.equal(secondsToWave(2000,2100),0);
});
test('floor clearance is capped, while farming rewards continue',()=>{
 const s=newGame();for(let i=0;i<15;i++)awardRock(s,ORES[0]);
 assert.equal(getFloorProgress(s),0);
 for(let i=0;i<floorQuota(1)+7;i++)awardWaveClear(s);
 assert.equal(getFloorProgress(s),floorQuota(1));
 assert.equal(s.rocksThisFloor,floorQuota(1));
 assert.equal(s.rocksBroken,15);
 assert.equal(s.ore.tin,15);
 assert.equal(canNextFloor(s),true);
});
test('oversized legacy progress normalizes on read and travel',()=>{
 const s=newGame();delete s.floorProgressMode;s.rocksThisFloor=999;s.floorProgress={1:999};
 assert.equal(getFloorProgress(s),floorQuota(1));
 assert.equal(travelToFloor(s,2),true);
 assert.equal(s.rocksThisFloor,0);
 assert.equal(travelToFloor(s,1),true);
 assert.equal(s.rocksThisFloor,floorQuota(1));
});
test('Auto-Floor resumes from earlier completed floors and stops when uncleared',()=>{
 const s=newGame();s.autoFloorUnlocked=true;s.autoFloor=true;
 for(let i=0;i<floorQuota(1);i++)awardWaveClear(s);
 assert.equal(shouldAutoAdvance(s,canNextFloor(s)),true);
 assert.equal(travelToFloor(s,2),true);
 assert.equal(shouldAutoAdvance(s,canNextFloor(s)),false);
 assert.equal(travelToFloor(s,1),true);
 assert.equal(shouldAutoAdvance(s,canNextFloor(s)),true);
});
test('Pages deployment includes wave logic module',()=>{
 const wf=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
 assert.match(wf,/mining-waves-v021\.js/);
});
