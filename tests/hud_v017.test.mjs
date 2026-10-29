import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');

test('HUD includes status toggle and both stylesheets',()=>{
 assert.match(html,/id="statusToggle"/);
 assert.match(html,/href="hud-v016.css"/);
 assert.match(html,/href="hud-v017.css"/);
});
test('right resource HUD is data-backed with ore icons',()=>{
 assert.match(game,/function renderStatusRail\(\)/);
 assert.match(game,/const pixelOreIcon=/);
 assert.match(game,/\.slice\(-4\)/);
 assert.match(game,/o\.min<=game\.highestFloor/);
});
test('Pages workflow includes all HUD stylesheets',()=>{
 for(const css of ['style.css','bomb-panel.css','consumables-panel.css','hud-v016.css','hud-v017.css'])
   assert.ok(workflow.includes(css),css+' missing from deployment');
});
