import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGame} from '../core.js';
import {normalizeChests,chestStatus,chestThreshold,recordChestDamage,openItemChests,CHEST_ITEM_POOL} from '../chests-v027.js';
test('independent chest meters and migration',()=>{
 const s=normalizeChests(newGame());
 assert.equal(chestStatus(s,'item').owned,0);
 assert.equal(chestStatus(s,'relic').owned,0);
 assert.ok(chestThreshold('relic')>chestThreshold('item'));
 assert.deepEqual(s.consumables,[]);
});
test('damage builds two independent meters',()=>{
 const s=normalizeChests(newGame()),item=chestThreshold('item'),relic=chestThreshold('relic');
 recordChestDamage(s,item);
 assert.equal(s.itemChests,1);assert.equal(s.relicChests,0);
 recordChestDamage(s,relic-item);
 assert.equal(s.relicChests,1);assert.ok(s.itemChests>=1);
 assert.ok(chestThreshold('item',1)>item);
});
test('opening an item chest puts an item in Consumables and never Ore Bag',()=>{
 const s=normalizeChests(newGame());s.itemChests=2;
 const r=openItemChests(s,1,()=>0);
 assert.equal(r.opened,1);assert.deepEqual(r.found,{Apple:1});
 assert.equal(s.itemChests,1);assert.equal(s.consumables[0].id,'apple');
 assert.equal(s.relicChests,0);assert.equal(s.ore.tin,0);
});
test('bulk opening respects available chests',()=>{
 const s=normalizeChests(newGame());s.itemChests=3;
 assert.equal(openItemChests(s,500,()=>.9).opened,3);
 assert.equal(s.itemChests,0);assert.equal(s.consumables.reduce((n,i)=>n+i.qty,0),3);
 assert.equal(CHEST_ITEM_POOL.length,13);
});
test('migration discards invalid inventories safely',()=>{
 const s=newGame();s.gold=123;s.itemChests=-7;s.itemChestDamage=NaN;s.consumables=[null,{name:'Apple',qty:-2},{name:'Bread',qty:2}];
 normalizeChests(s);assert.equal(s.gold,123);assert.equal(s.itemChests,0);
 assert.deepEqual(s.consumables.map(i=>i.id),['bread']);
});
test('deployed site includes chests and Bomb module',()=>{
 const wf=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
 for(const file of ['chests-v027.js','chests-v027.css','bomb-controls-v025.js'])assert.ok(wf.includes(file),file);
});