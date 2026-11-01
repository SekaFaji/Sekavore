import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,prestige,bombDamage} from '../core.js';
import {WORKSHOP_BASIC_CHAIN,normalizeWorkshop,workshopQuote,workshopBombMultiplier,buyWorkshopUpgrade} from '../workshop-v033.js';
test('Workshop rejects unavailable purchases without changing bars',()=>{
 const s=newGame();normalizeWorkshop(s);const before=bombDamage(s);
 assert.equal(buyWorkshopUpgrade(s),false);
 s.obeliskLevel=1;s.bars.mithril=2;s.bars.adamant=1;
 assert.equal(buyWorkshopUpgrade(s),false);assert.equal(s.bars.mithril,2);assert.equal(bombDamage(s),before);
 s.bars.runite=1;assert.equal(buyWorkshopUpgrade(s),true);
 assert.equal(s.workshopUpgrades.basicChain,1);assert.equal(s.bars.mithril,1);
 assert.equal(s.bars.adamant,0);assert.equal(s.bars.runite,0);
 assert.equal(bombDamage(s),Math.round(before*1.5));
});
test('Workshop max level is enforced and resources remain untouched at cap',()=>{
 const s=newGame();s.obeliskLevel=10;normalizeWorkshop(s);
 for(const bar of WORKSHOP_BASIC_CHAIN.bars)s.bars[bar]=1000;
 for(let i=0;i<22;i++)assert.equal(buyWorkshopUpgrade(s),true);
 const before={...s.bars};assert.equal(buyWorkshopUpgrade(s),false);
 assert.deepEqual(s.bars,before);assert.equal(workshopQuote(s).maxed,true);
 assert.equal(workshopBombMultiplier(s),12);
});
test('Workshop upgrades survive Prestige and legacy saves normalize',()=>{
 const s=newGame();normalizeWorkshop(s);s.workshopUpgrades.basicChain=3;
 s.level=24;s.gold=15000;assert.ok(prestige(s)>0);
 assert.equal(workshopQuote(s).level,3);assert.equal(JSON.parse(JSON.stringify(s)).workshopUpgrades.basicChain,3);
 const legacy=newGame();normalizeWorkshop(legacy);assert.equal(workshopQuote(legacy).level,0);
});
test('Unimplemented blueprints cannot charge crafted bars',()=>{
 const s=newGame();s.obeliskLevel=99;s.bars.copper=100;s.bars.mithril=100;s.bars.adamant=100;
 assert.equal(workshopQuote(s,'plenty').canBuy,false);
 assert.equal(buyWorkshopUpgrade(s,'plenty'),false);assert.equal(s.bars.copper,100);
});
