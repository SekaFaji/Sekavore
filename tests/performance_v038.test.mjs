import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('Mining batches browser storage writes but explicit saves remain synchronous',()=>{
 assert.match(game,/function scheduleMiningSave\(\)/);
 assert.match(game,/miningSaveTimer=setTimeout\(\(\)=>\{miningSaveTimer=null;save\(\);\},250\)/);
 assert.match(game,/function save\(\)\{[\s\S]*?localStorage\.setItem\(SAVE_KEY,JSON\.stringify\(game\)\)/);
 assert.match(game,/nextWaveAt=performance\.now\(\)\+WAVE_REFRESH_MS;droneMotion\.targetId=null;\s*\}\s*scheduleMiningSave\(\);/);
 assert.match(game,/window\.addEventListener\('pagehide',save\)/);
});
test('Mined and live nodes use rendering-only sprite cache',()=>{
 assert.match(game,/drawCachedRock\(ctx,r,ORES,drawCavernRock,now\)/);
 assert.match(game,/import \{drawCachedRock\}/);
});
test('Hud and menus reuse mounted markup when unchanged, and status timers update in place',()=>{
 assert.match(game,/function setHTMLIfChanged\(id,markup\)/);
 for(const id of ['resourceRows','statusGroup','panelContent','drawerContent']){
  assert.match(game,new RegExp(`setHTMLIfChanged\\('${id}',`));
 }
 assert.match(game,/if\(sameStructure\)\{/);
 assert.match(game,/progress\.style\.setProperty\('--charge',charge\)/);
});
test('Heavy rendering can be reduced without slowing interval-driven game logic',()=>{
 assert.match(game,/rocks\.length>=14\|\|particles\.length>35/);
 assert.match(game,/if\(targetFrameMs&&t-lastTick<targetFrameMs\)/);
 assert.match(game,/setInterval\(tick,250\)/);
 assert.match(html,/src="game\.js\?v=0\.39\.0"/);
});
