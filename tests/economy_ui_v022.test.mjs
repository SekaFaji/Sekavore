import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGame,ORES,craftBars,sellOre,saleMultiplier} from '../core.js';

const gameUI=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const styles=readFileSync(new URL('../economy-v022.css',import.meta.url),'utf8');
const deploy=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');

test('economy menu structure and style are deployed',()=>{
 assert.match(gameUI, /WORLD 1 · REGULAR/);
 assert.match(gameUI, /econ-heading.*PICKAXE/);
 assert.match(gameUI, /data-act="lockall"/);
 assert.match(gameUI, /data-act="unlockall"/);
 assert.match(gameUI, /SELL PREVIEW/);
 assert.match(gameUI, /CRAFT AMOUNT/);
 assert.match(styles, /\.econ-resource/);
 assert.match(html, /economy-v022\.css/);
 assert.match(deploy,/economy-v022\.css/);
});
test('craft previews correspond to quantity and ore cost',()=>{
 const s=newGame();
 const tin=ORES.find(x=>x.id==='tin');
 s.ore.tin=tin.craft*13+1;
 const preview=Math.min(10,Math.floor(s.ore.tin/tin.craft));
 const oreBefore=s.ore.tin;
 const got=craftBars(s,'tin',10,()=>1);
 assert.equal(preview,10);
 assert.equal(got,10);
 assert.equal(s.ore.tin,oreBefore-preview*tin.craft);
});
test('sale preview mirrors the gold calculation, retaining selected stock',()=>{
 const s=newGame();
 const copper=ORES.find(x=>x.id==='copper');
 s.ore.copper=67;s.upgrades.sell=2;
 const fraction=.25;
 const qty=Math.ceil(s.ore.copper*fraction);
 const gold=Math.round(qty*copper.price*saleMultiplier(s));
 assert.equal(sellOre(s,'copper',qty),gold);
 assert.equal(s.ore.copper,67-qty);
});
