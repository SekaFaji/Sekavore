import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Stats Pages provide four categories and three working tab IDs',()=>{
 const s=read('game.js');
 assert.match(s,/stats-v026/);
 for(const label of ['PICKAXE STATS','BOMB STATS','DRONE STATS','MISC STATS','FLOOR PROGRESS','RECENT ACTIVITY'])assert.ok(s.includes(label),label);
 assert.match(s,/tabBar\('stats',\[\['1','1'\],\['2','2'\],\['3','3'\]\]\)/);
});
test('Currencies show tracked ore, crafted bars, and funds without placeholder assets',()=>{
 const s=read('game.js');
 for(const label of ['ORES + BARS','CRAFTED BARS','Prestige Points','Skill Points','ORE BAG'])assert.ok(s.includes(label),label);
 assert.match(s,/ORE \/ BAR/);
 assert.ok(s.includes('game.ore[o.id]') && s.includes('game.bars[o.id]'));
});
test('Pages includes the new CSS and the dependency verifier protects published assets',()=>{
 const html=read('index.html'), workflow=read('.github/workflows/pages.yml'), css=read('stats-currencies-v026.css');
 assert.ok(html.includes('href="stats-currencies-v026.css"'));
 assert.match(workflow,/cp [^\n]*stats-currencies-v026\.css [^\n]*_site\//);
 assert.ok(css.includes('@media(max-width:365px)'));
});
