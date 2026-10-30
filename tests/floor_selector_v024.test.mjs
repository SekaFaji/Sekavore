import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,floorQuota,getFloorProgress,travelToFloor} from '../core.js';
import {worldForFloor,worldBounds,floorPairs,worldTabs,highestSelectableFloor,isFloorSelectable} from '../floor-selector-v024.js';

test('world boundaries group exactly ten sequential floors',()=>{
  assert.equal(worldForFloor(1),1);assert.equal(worldForFloor(10),1);assert.equal(worldForFloor(11),2);
  assert.deepEqual(worldBounds(2),{first:11,last:20});
  const rows=floorPairs(1);assert.equal(rows.length,5);assert.deepEqual(rows.map(x=>[x.left,x.right]),[[1,2],[3,4],[5,6],[7,8],[9,10]]);
  assert.equal(rows[3].zone,'STONE');assert.equal(rows[4].zone,'MAGMA');
});
test('new save only allows floor 1 and locks future world pages',()=>{
  const s=newGame();assert.equal(highestSelectableFloor(s,false),1);
  assert.deepEqual(worldTabs(s,false).map(x=>x.unlocked),[true,false,false,false]);
  assert.equal(isFloorSelectable(s,2,false),false);assert.equal(isFloorSelectable(s,1,false),true);
});
test('clear deepest floor unlocks exactly the next floor, not a world',()=>{
  const s=newGame();s.floorProgress[1]=floorQuota(1);s.rocksThisFloor=floorQuota(1);
  assert.equal(highestSelectableFloor(s,true),2);assert.equal(isFloorSelectable(s,3,true),false);
  assert.equal(travelToFloor(s,2),true);assert.equal(getFloorProgress(s,2),0);
  assert.equal(highestSelectableFloor(s,false),2);
});
test('later-world floor access follows actual unlocked progress',()=>{
  const s=newGame();s.highestFloor=10;s.floor=10;
  assert.equal(worldTabs(s,false)[1].unlocked,false);
  s.floorProgress[10]=floorQuota(10);s.rocksThisFloor=floorQuota(10);
  assert.equal(worldTabs(s,true)[1].unlocked,true);
  assert.equal(isFloorSelectable(s,11,true),true);
  assert.equal(isFloorSelectable(s,12,true),false);
});
test('floor selection does not control saving or alter mining economy',()=>{
  const s=newGame();const prev=JSON.stringify(s);floorPairs(1);worldTabs(s,false);isFloorSelectable(s,9,false);
  assert.equal(JSON.stringify(s),prev);
});
