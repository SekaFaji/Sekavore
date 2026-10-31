import test from 'node:test';
import assert from 'node:assert/strict';
import {HUB_OBELISK_GATES,HUB_MILESTONES,hubAvailability,hubFeedback} from '../hub-access-v030.js';

test('Obelisk milestones use one consistent table',()=>{
 const levels={workshop:1,drones:2,skills:4,challenges:10,contracts:12,cards:15,pets:17,construct:19,stars:23,archaeology:30,fishing:37,future:70};
 assert.deepEqual(HUB_OBELISK_GATES,levels);
 assert.deepEqual(HUB_MILESTONES.map(([id])=>id),Object.keys(levels));
});
test('unreached menus are locked with accurate requirements',()=>{
 for(const [id,gate] of Object.entries(HUB_OBELISK_GATES)){
  assert.equal(hubAvailability(id,gate-1).state,'locked',id);
  assert.equal(hubAvailability(id,gate).gate,gate,id);
 }
 assert.match(hubFeedback('drones','Drones',1),/OBELISK 2/);
});
test('reached but unfinished systems remain previews',()=>{
 for(const id of ['contracts','cloud','cards','pets','construct','stars','archaeology','fishing','future']){
  assert.equal(hubAvailability(id,100).state,'preview',id);
  assert.match(hubFeedback(id,id,100),/NOT IMPLEMENTED/);
 }
});
test('available menus stay navigable without new gates',()=>{
 for(const id of ['craft','upgrades','sell','chests','relics','prestige','store','stats','settings','logs']){
  assert.equal(hubAvailability(id,0).available,true,id);
 }
 assert.equal(hubAvailability('drones',2).state,'ready');
 assert.equal(hubAvailability('skills',4).state,'ready');
});
