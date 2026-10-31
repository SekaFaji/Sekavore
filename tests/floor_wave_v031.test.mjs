import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,ORES,awardRock,awardWaveClear,normalizeFloorProgress,canNextFloor,floorQuota,travelToFloor,legacyRockQuota,floorOrePopulation} from '../core.js';
import {WAVE_REFRESH_MS,waveSize} from '../mining-waves-v021.js';

test('floor unlocks count completed waves rather than individual rocks',()=>{
 const s=newGame();for(let i=0;i<200;i++)awardRock(s,ORES[0]);
 assert.equal(s.rocksBroken,200);assert.equal(s.rocksThisFloor,0);assert.equal(canNextFloor(s),false);
 for(let i=0;i<floorQuota(1)-1;i++)awardWaveClear(s);
 assert.equal(canNextFloor(s),false);
 awardWaveClear(s);assert.equal(canNextFloor(s),true);
 awardWaveClear(s);assert.equal(s.rocksThisFloor,floorQuota(1));
 assert.equal(travelToFloor(s,2),true);assert.equal(s.rocksThisFloor,0);
});
test('legacy rock progress migrates without relocking already visited floors',()=>{
 const s=newGame();s.floor=3;s.highestFloor=3;s.rocksThisFloor=legacyRockQuota(3)/2;
 s.floorProgress={1:legacyRockQuota(1),2:0,3:legacyRockQuota(3)/2};delete s.floorProgressMode;
 normalizeFloorProgress(s);
 assert.equal(s.floorProgressMode,'waves-v031');
 assert.equal(s.floorProgress[1],150);assert.equal(s.floorProgress[2],150);
 assert.equal(s.floorProgress[3],75);assert.equal(s.rocksThisFloor,75);
 normalizeFloorProgress(s);assert.equal(s.floorProgress[3],75);
});
test('wave size and respawn duration are independent of floor unlock quota',()=>{
 assert.equal(floorQuota(1),150);
 assert.equal(waveSize(1,floorOrePopulation(1)),9);
 assert.equal(waveSize(4,floorOrePopulation(4)),18);
 assert.equal(WAVE_REFRESH_MS,1250);
});
