import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawCachedRock,ROCK_SPRITE_SIZE} from '../mining-sprite-cache-v039.js';

function context(){return {calls:[],setTransform(){},clearRect(){},save(){},restore(){},translate(){},drawImage(...args){this.calls.push(args)},fillRect(){},set imageSmoothingEnabled(v){},set globalAlpha(v){},set filter(v){},set fillStyle(v){}};}
function mockDocument(){const created=[];return {created,document:{createElement(tag){assert.equal(tag,'canvas');const painter=context();const tile={width:0,height:0,getContext:()=>painter,painter};created.push(tile);return tile;}}};}
const rock=()=>({id:17,x:130.25,y:202.4,hp:100,max:100,size:15,variant:0,ore:'tin'});
const ores=[{id:'tin',color:'#aaaaaa',edge:'#444444'}];

test('unchanged rock paints once and reuses same bitmap on every frame',()=>{
 const prev=globalThis.document,{document,created}=mockDocument();globalThis.document=document;
 try{
  let paints=0;const ctx=context(),r=rock(),paint=()=>{paints++};
  for(let t=0;t<80;t++)drawCachedRock(ctx,r,ores,paint,t*16.67);
  assert.equal(created.length,1);assert.equal(created[0].width,ROCK_SPRITE_SIZE);
  assert.equal(paints,1);assert.equal(ctx.calls.length,80);
 }finally{globalThis.document=prev;}
});

test('damage, mining, and idle frames invalidate only when HP changes',()=>{
 const prev=globalThis.document,{document,created}=mockDocument();globalThis.document=document;
 try{
  let paints=0;const r=rock(),ctx=context(),paint=()=>{paints++};
  drawCachedRock(ctx,r,ores,paint,0);
  r.hp=45;r.hitAt=100;drawCachedRock(ctx,r,ores,paint,100);
  drawCachedRock(ctx,r,ores,paint,110);
  r.hp=0;drawCachedRock(ctx,r,ores,paint,200);
  drawCachedRock(ctx,r,ores,paint,400);
  assert.equal(paints,3);assert.equal(created.length,1);
  assert.equal(ctx.calls.length,5);
 }finally{globalThis.document=prev;}
});

test('cache does not modify rock gameplay attributes or save shape',()=>{
 const prev=globalThis.document,{document}=mockDocument();globalThis.document=document;
 try{
  const r=rock(),before=JSON.stringify(r);drawCachedRock(context(),r,ores,()=>{},100);
  assert.equal(JSON.stringify(r),before);
 }finally{globalThis.document=prev;}
});

test('game relies on sprite cache without removing live or destroyed nodes',()=>{
 const s=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 assert.match(s,/function drawRock\(r,now\)\{drawCachedRock\(ctx,r,ORES,drawCavernRock,now\);\}/);
 assert.match(s,/rock\.hp=0; \/\/ Leave the mined node visible/);
 assert.match(s,/drawMiningImpacts\(ctx\)/);
 assert.match(s,/rock\.hitAt=performance\.now\(\)/);
});
