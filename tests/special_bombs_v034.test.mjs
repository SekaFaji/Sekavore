import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,awardRock,prestige,ORES} from '../core.js';
import {normalizeWorkshop,buyWorkshopUpgrade} from '../workshop-v033.js';
import {normalizeSpecialBombs,specialBombInfo,applySpecialBomb,rechargeSpecialBombs,rockMarkReward} from '../special-bombs-v034.js';
function unlock(){const s=newGame();s.obeliskLevel=2;normalizeWorkshop(s);
 for(const bar of ['copper','mithril','adamant','runite','citrine'])s.bars[bar]=5;
 assert.ok(buyWorkshopUpgrade(s,'plenty'));assert.ok(buyWorkshopUpgrade(s,'experience'));
 normalizeSpecialBombs(s);return s;
}
test('new saves show only unlocked bomb types',()=>{const s=newGame();normalizeSpecialBombs(s);assert.equal(specialBombInfo(s,'plenty'),null);assert.equal(applySpecialBomb(s,'plenty',[{hp:10}]),0);});
test('special bomb charges are independent from Basic Bomb and from each other',()=>{const s=unlock(),r=[{hp:10},{hp:11}];const basic=s.bombs;
 assert.equal(applySpecialBomb(s,'plenty',r),1);assert.equal(s.bombs,basic);assert.equal(specialBombInfo(s,'plenty').charges,2);assert.equal(specialBombInfo(s,'experience').charges,3);
 assert.equal(applySpecialBomb(s,'experience',r),1);assert.equal(applySpecialBomb(s,'plenty',r),0);
 assert.deepEqual(rockMarkReward(r[0]),{oreMultiplier:2,xpMultiplier:2});
 rechargeSpecialBombs(s,9);assert.equal(specialBombInfo(s,'plenty').charges,3);
});
test('special marks double ore and XP only when a rock is mined',()=>{const a=newGame(),b=newGame();awardRock(a,ORES[0]);awardRock(b,ORES[0],1,{oreMultiplier:2,xpMultiplier:2});assert.equal(b.ore.tin,2);assert.equal(b.xp,2*a.xp);assert.equal(b.rocksBroken,1);});
test('bulk mark firing uses only its own charges and carries Workshop unlocks over Prestige',()=>{const s=unlock();const r=[{hp:10}];assert.equal(applySpecialBomb(s,'plenty',r,'all'),3);assert.equal(specialBombInfo(s,'plenty').charges,0);s.level=24;assert.ok(prestige(s)>0);normalizeWorkshop(s);normalizeSpecialBombs(s);assert.equal(s.workshopUpgrades.plenty,1);assert.equal(specialBombInfo(s,'plenty').charges,0);});
