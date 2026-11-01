import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,floorQuota,awardWaveClear,travelToFloor} from '../core.js';
import {activeRocks,waveComplete,floorTravelDisplay} from '../floor-controls-v035.js';
import {readFileSync} from 'node:fs';

test('floor counter shows remaining full clears, not the floor number',()=>{
 const s=newGame();assert.equal(floorTravelDisplay(s).label,String(floorQuota(1)));
 awardWaveClear(s);assert.equal(floorTravelDisplay(s).label,String(floorQuota(1)-1));
 for(let i=1;i<floorQuota(1);i++)awardWaveClear(s);
 assert.deepEqual({label:floorTravelDisplay(s).label,canTravel:floorTravelDisplay(s).canTravel},{label:'▼',canTravel:true});
 assert.equal(travelToFloor(s,2),true);
 assert.deepEqual({label:floorTravelDisplay(s).label,canTravel:floorTravelDisplay(s).canTravel},{label:String(floorQuota(2)),canTravel:false});
 assert.equal(travelToFloor(s,1),true);
 assert.deepEqual({label:floorTravelDisplay(s).label,canTravel:floorTravelDisplay(s).canTravel},{label:'▼',canTravel:true});
});
test('destroyed nodes remain in the array but cannot be targeted',()=>{
 const rocks=[{id:1,hp:0},{id:2,hp:15}];
 assert.equal(activeRocks(rocks).length,1);assert.equal(waveComplete(rocks),false);
 rocks[1].hp=0;
 assert.equal(activeRocks(rocks).length,0);assert.equal(waveComplete(rocks),true);
 assert.equal(waveComplete([]),false);
});
test('controls have one picker, one up and one contextual lower button',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/id="floorPair"/);assert.match(html,/id="floorUp"/);
 assert.match(html,/id="floorCurrentCount"/);assert.doesNotMatch(html,/id="floorDown"/);
 const src=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 assert.match(src,/rock.hp=0; \/\/ Leave the mined node visible/);
 assert.match(src,/waveComplete\(rocks\)/);
 assert.match(src,/r.hp>0&&r.id===droneMotion.targetId/);
});

test('up and down controls have opposite directions and Auto Next uses one floor step',()=>{
 const src=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 assert.match(src,/\$\('floorUp'\)\.onclick=\(\)=>changeFloor\(-1\)/);
 assert.match(src,/if\(floorTravelDisplay\(game\)\.canTravel\)changeFloor\(1\)/);
 assert.doesNotMatch(src,/while\(steps\+\+<100/);
 assert.match(src,/shouldAutoAdvance\(game,canNextFloor\(game\)\)/);
 assert.match(src,/travelToFloor\(game,game\.floor\+1\)/);
});
test('Auto Next uses grey off and green on, and exposes pressed state',()=>{
 const css=readFileSync(new URL('../floor-controls-v035.css',import.meta.url),'utf8');
 const idle=css.match(/\.floor-controls #autoFloor\{([^}]*)\}/)?.[1]||'';
 const active=css.match(/\.floor-controls #autoFloor\.active\{([^}]*)\}/)?.[1]||'';
 assert.match(idle,/background:linear-gradient\(#717078,#414149\)/);
 assert.match(active,/background:linear-gradient\(#55c87c,#188142\)/);
 const gameJs=readFileSync(new URL('../game.js',import.meta.url),'utf8');
 assert.match(gameJs,/setAttribute\('aria-pressed',String\(game\.autoFloorUnlocked&&game\.autoFloor\)\)/);
});
