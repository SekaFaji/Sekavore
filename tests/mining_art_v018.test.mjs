import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawCavernGround,drawCavernRock,recordMiningImpact,drawMiningImpacts,resetMiningVisuals} from '../mining-art-v018.js';
function fakeContext(){
 let fills=0,strokes=0,images=0;
 const ctx={beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){fills++},stroke(){strokes++},fillRect(){fills++},drawImage(){images++},save(){},restore(){},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},set lineCap(v){},set lineJoin(v){},set globalAlpha(v){}};
 return {ctx,get fills(){return fills},get strokes(){return strokes},get images(){return images}};
}
test('floor renderer caches offscreen art per floor',()=>{
 const oldDocument=globalThis.document;let created=0;
 globalThis.document={createElement:()=>{created++;return {width:0,height:0,getContext:()=>fakeContext().ctx}}};
 try{resetMiningVisuals();let f=fakeContext();drawCavernGround(f.ctx,1);drawCavernGround(f.ctx,1);assert.equal(created,1);assert.equal(f.images,2);drawCavernGround(f.ctx,6);assert.equal(created,2)}
 finally{globalThis.document=oldDocument;resetMiningVisuals()}
});
test('rock art and hit effect cannot change rock health',()=>{
 const ores=[{id:'tin',color:'#d5d5d5',edge:'#555555'}],rock={x:100,y:120,size:16,max:10,hp:5,variant:2,ore:'tin'};
 const before=JSON.stringify(rock),f=fakeContext();
 drawCavernRock(f.ctx,rock,ores);assert.equal(JSON.stringify(rock),before);
 recordMiningImpact(100,120,'#d5d5d5');drawMiningImpacts(f.ctx);assert.ok(f.fills>0&&f.strokes>0)
});
test('GitHub Pages publishes the art module',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
 const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 assert.match(workflow,/cp .*mining-art-v018\.js/);
 assert.match(game,/from '\.\/mining-art-v018\.js'/);
 assert.match(game,/drawMiningImpacts\(ctx\)/)
});
