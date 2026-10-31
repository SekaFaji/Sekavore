import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGame,prestige,awardRock,canNextFloor,awardWaveClear,floorQuota,travelToFloor,ORES} from '../core.js';
import {AUTO_FLOOR_OBELISK_GATE,AUTO_FLOOR_SKILL_COST,SKILL_POINT_GEM_PRICE,normalizeFloorAutomation,purchaseSkillPoint,unlockAutoFloor,setAutoFloor,shouldAutoAdvance} from '../floor-auto-v019.js';
test('auto-floor starts locked and old toggle cannot bypass the gate',()=>{
 const s=newGame();delete s.autoFloorUnlocked;delete s.skillPoints;s.autoFloor=true;
 normalizeFloorAutomation(s);assert.equal(s.autoFloor,false);assert.equal(s.skillPoints,0);
 assert.equal(unlockAutoFloor(s),false);assert.equal(setAutoFloor(s,true),false);
});
test('three skill points and Obelisk 4 required before permanent unlock',()=>{
 const s=newGame();s.gems=500;
 assert.equal(purchaseSkillPoint(s),false);s.obeliskLevel=AUTO_FLOOR_OBELISK_GATE;
 for(let i=0;i<AUTO_FLOOR_SKILL_COST;i++)assert.equal(purchaseSkillPoint(s),true);
 assert.equal(s.gems,500-AUTO_FLOOR_SKILL_COST*SKILL_POINT_GEM_PRICE);
 assert.equal(unlockAutoFloor(s),true);assert.equal(s.skillPoints,0);
 assert.equal(purchaseSkillPoint(s),false);assert.equal(unlockAutoFloor(s),false);
 assert.equal(setAutoFloor(s,true),true);assert.equal(s.autoFloor,true);
});
test('advance only after clearing deepest floor; cannot skip',()=>{
 const s=newGame();s.obeliskLevel=4;s.autoFloorUnlocked=true;s.autoFloor=true;
 assert.equal(shouldAutoAdvance(s,canNextFloor(s)),false);
 for(let i=0;i<floorQuota(1);i++)awardWaveClear(s);
 assert.equal(shouldAutoAdvance(s,canNextFloor(s)),true);
 assert.equal(travelToFloor(s,2),true);
 assert.equal(travelToFloor(s,4),false);
 assert.equal(travelToFloor(s,1),true);
 assert.equal(shouldAutoAdvance(s,canNextFloor(s)),true);
});
test('permanent unlock survives prestige',()=>{
 const s=newGame();s.obeliskLevel=5;s.autoFloorUnlocked=true;s.autoFloor=true;s.skillPoints=2;s.level=21;
 assert.ok(prestige(s));normalizeFloorAutomation(s);
 assert.equal(s.autoFloorUnlocked,true);assert.equal(s.skillPoints,2);
 assert.equal(s.autoFloor,false);
});
test('Pages includes new module and stylesheet',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
 assert.match(workflow,/floor-auto-v019\.js/);assert.match(workflow,/floor-auto-v019\.css/);
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/floor-auto-v019\.css/);
});
