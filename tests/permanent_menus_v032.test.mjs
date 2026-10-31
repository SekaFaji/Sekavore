import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeAutoBomber,unlockAutoBomber,setAutoBomber,autoBombReady,AUTO_BOMBER_INTERVAL_MS,skillsView,workshopView,challengesView} from '../permanent-menus-v032.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('older saves do not unlock or activate automatic bombs',()=>{
 const s={skillPoints:10};normalizeAutoBomber(s);
 assert.equal(s.autoBomberUnlocked,false);assert.equal(s.autoBomberOn,false);
 assert.equal(autoBombReady(s,2000,0,true),false);
});
test('Auto-Bomber costs 10 skill points exactly once',()=>{
 const s={skillPoints:11};
 assert.equal(unlockAutoBomber(s),true);assert.equal(s.skillPoints,1);
 assert.equal(unlockAutoBomber(s),false);assert.equal(s.skillPoints,1);
});
test('automatic firing is opt-in and requires the unlocked skill',()=>{
 const s={skillPoints:9};
 assert.equal(setAutoBomber(s,true),false);assert.equal(unlockAutoBomber(s),false);
 s.skillPoints=10;unlockAutoBomber(s);
 assert.equal(s.autoBomberOn,false);
 assert.equal(setAutoBomber(s,true),true);
 assert.equal(autoBombReady(s,2000,2000,true),true);
 assert.equal(autoBombReady(s,1999,2000,true),false);
 assert.equal(autoBombReady(s,2000,2000,false),false);
 setAutoBomber(s,false);assert.equal(autoBombReady(s,3000,0,true),false);
 assert.equal(AUTO_BOMBER_INTERVAL_MS,1250);
});
test('Workshop previews have no made-up purchase actions',()=>{
 for(const t of ['bombs','mining','legacy']){
  const html=workshopView({dronePoints:3},t);
  assert.match(html,/WORKSHOP/);
  assert.doesNotMatch(html,/data-act="workshop:reinforce"/);
 }
});
test('Skill Tree offers functional nodes and a separate point tab',()=>{
 const s={skillPoints:10,gems:200,obeliskLevel:4,autoFloorUnlocked:false,autoBomberUnlocked:false};
 assert.match(skillsView(s,'nodes',3,4,125),/data-act="autobomber:unlock"/);
 assert.match(skillsView(s,'nodes',3,4,125),/data-act="autounlock"/);
 assert.match(skillsView(s,'points',3,4,125),/data-act="skillpoint"/);
});
test('Challenge previews grant no unverified rewards',()=>{
 for(const t of ['current','next','rewards']){
  const html=challengesView({highestFloor:1,gold:0,prestiges:0},t);
  assert.match(html,/CHALLENGES/);assert.doesNotMatch(html,/data-act=/);
 }
});
test('Pages bundles the permanent-menu module and stylesheet',()=>{
 assert.match(read('game.js'),/permanent-menus-v032.js/);
 assert.match(read('index.html'),/permanent-menus-v032.css/);
 assert.match(read('.github/workflows/pages.yml'),/permanent-menus-v032.js/);
 assert.match(read('.github/workflows/pages.yml'),/permanent-menus-v032.css/);
});
