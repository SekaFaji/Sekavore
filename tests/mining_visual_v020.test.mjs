import test from 'node:test';
import assert from 'node:assert/strict';
import { drawCavernGround, drawCavernRock, drawMiningImpacts, recordMiningImpact, resetMiningVisuals } from '../mining-art-v018.js';

function makeContext(){
 const drawn={filled:0,paths:0,images:0};
 const ctx={
  fillRect(){drawn.filled++}, beginPath(){drawn.paths++},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},save(){},restore(){},drawImage(){drawn.images++},
  set fillStyle(_v){},set strokeStyle(_v){},set lineWidth(_v){},set globalAlpha(_v){},set lineCap(_v){},set lineJoin(_v){}
 };
 return {ctx,drawn};
}

test('decorative ambience and hit effects do not alter rock state',()=>{
 const documentBackup=globalThis.document;
 const offscreen=[];
 globalThis.document={createElement:()=>{const {ctx}=makeContext();const canvas={width:0,height:0,getContext:()=>ctx};offscreen.push(canvas);return canvas;}};
 try{
  resetMiningVisuals();
  const {ctx,drawn}=makeContext();
  const ore=[{id:'tin',color:'#cfb99c',edge:'#a68a77'}];
  const rock={x:100,y:100,hp:8,max:10,variant:1,ore:'tin',size:14};
  const snapshot=structuredClone(rock);
  drawCavernGround(ctx,1,1000);drawCavernGround(ctx,1,1020);
  assert.equal(offscreen.length,1,'floor art should be cached');
  assert.ok(drawn.images>=2);
  drawCavernRock(ctx,rock,ore);
  recordMiningImpact(100,100,'#ddaa55');
  drawMiningImpacts(ctx,performance.now()+20);
  drawCavernRock(ctx,rock,ore);
  assert.deepEqual(rock,snapshot);
  assert.ok(drawn.filled>0);
  drawCavernGround(ctx,6,1050);
  assert.equal(offscreen.length,2,'a new floor should rebuild its cached art');
 } finally {resetMiningVisuals();if(documentBackup===undefined)delete globalThis.document;else globalThis.document=documentBackup;}
});
