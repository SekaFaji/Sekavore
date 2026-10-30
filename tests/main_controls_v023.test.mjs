import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('main field links to Obelisk, Drones stays independent',()=>{
 assert.match(read('index.html'),/id="obeliskQuick"/);
 assert.doesNotMatch(read('index.html'),/id="droneQuick"/);
 assert.match(read('game.js'),/\$\('obeliskQuick'\)\.onclick=.*openMenu\('obelisk'\)/);
 assert.match(read('game.js'),/k==='drones'/);
});
test('Stats and Currencies buttons and tabs exist',()=>{
 for(const id of ['statsQuick','currenciesQuick'])assert.match(read('index.html'),new RegExp('id="'+id+'"'));
 assert.match(read('game.js'),/menuTabs\.stats==='1'/);
 assert.match(read('game.js'),/k==='currencies'/);
 assert.match(read('main-controls-v023.css'),/\.hud-top-actions/);
});
test('Site deployment copies the v0.23 stylesheet',()=>{
 assert.match(read('index.html'),/main-controls-v023\.css/);
 assert.match(read('.github/workflows/pages.yml'),/main-controls-v023\.css/);
});
