import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGame,pickDamage,bombDamage,saleMultiplier,xpMultiplier,availablePrestige,prestige} from '../core.js';
import {normalizeChests} from '../chests-v027.js';
import {normalizeRelics,relicBonus,relicCount,RELIC_REWARDS,openRelicChests} from '../relics-v028.js';
const fresh=()=>normalizeRelics(normalizeChests(newGame()));
test('old save migrates with no loss of existing economy and missing relic data',()=>{
 const s=newGame();s.gold=42;s.bombs=2;normalizeRelics(s);
 assert.equal(s.gold,42);assert.equal(s.bombs,2);assert.deepEqual(s.relicInventory,{});assert.equal(s.relicsOpened,0);
});
test('relic chest opens exactly once and awards supported permanent relic',()=>{
 const s=fresh();s.relicChests=2;
 const result=openRelicChests(s,1,()=>0);
 assert.equal(result.opened,1);assert.equal(s.relicChests,1);assert.equal(s.relicsOpened,1);
 assert.equal(relicCount(s,'pickaxe-common'),1);
});
test('bulk opening is bounded, repeatable and does not consume item chests',()=>{
 const s=fresh();s.itemChests=5;s.relicChests=800;
 const result=openRelicChests(s,Infinity,()=>.5);
 assert.equal(result.opened,0,'Infinity cannot silently consume items');
 const batch=openRelicChests(s,800,()=>.5);
 assert.equal(batch.opened,500);assert.equal(s.relicChests,300);assert.equal(s.itemChests,5);
 assert.equal(s.relicsOpened,500);
});
test('permanent relic bonuses modify implemented gameplay with no stat inflation before opening',()=>{
 const s=fresh();s.upgrades.pick=5;const base={pick:pickDamage(s),bomb:bombDamage(s),sell:saleMultiplier(s),xp:xpMultiplier(s)};
 s.relicInventory={'pickaxe-common':4,'bomb-rare':2,'sell-common':2,'xp-common':3,'recharge-epic':2,'capacity-epic':2};normalizeRelics(s);
 assert.ok(pickDamage(s)>base.pick);assert.ok(bombDamage(s)>base.bomb);
 assert.ok(saleMultiplier(s)>base.sell);assert.ok(xpMultiplier(s)>base.xp);
 assert.equal(s.bombMax,5);assert.equal(relicBonus(s,'recharge'),.04);
});
test('prestige keeps relic inventory and granted permanent benefits',()=>{
 const s=fresh();s.level=24;s.highestFloor=10;s.relicInventory={'prestige-legendary':2,'pickaxe-common':3};s.relicsOpened=5;normalizeRelics(s);
 const withBonus=availablePrestige(s);const without={...s,relicInventory:{}};assert.ok(withBonus>availablePrestige(without));
 const count=prestige(s);normalizeRelics(s);assert.equal(count,withBonus);assert.equal(relicCount(s,'pickaxe-common'),3);assert.equal(s.relicsOpened,5);
});
test('invalid relic values are bounded and unknown keys ignored',()=>{
 const s=fresh();s.relicInventory={'pickaxe-common':-100,'capacity-epic':3,'hacked':999,'recharge-epic':Infinity};normalizeRelics(s);
 assert.deepEqual(s.relicInventory,{'capacity-epic':3});assert.equal(s.bombMax,6);
});
test('relic rarities and effects represent only implemented categories',()=>{
 assert.deepEqual([...new Set(RELIC_REWARDS.map(r=>r.tier))],['Common','Rare','Epic','Legendary']);
 for(const r of RELIC_REWARDS)assert.ok(['pickaxe','sell','xp','bomb','recharge','capacity','prestige'].includes(r.effect));
});
test('Pages lists new module and CSS (startup dependency regression)',()=>{
 const wf=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
 for(const asset of ['relics-v028.js','relics-v028.css','bomb-controls-v025.js','chests-v027.js'])assert.ok(wf.includes(asset),asset);
});
