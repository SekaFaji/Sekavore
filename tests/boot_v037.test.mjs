import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('release entry imports fresh gameplay and floor control URLs',()=>{
  assert.match(read('index.html'),/src="game\.js\?v=0\.37\.0"/);
  assert.match(read('index.html'),/href="floor-controls-v035\.css\?v=0\.37\.0"/);
  assert.match(read('game.js'),/floor-controls-v035\.js\?v=0\.37\.0/);
});
test('startup reports script failure without touching saved browser progress',()=>{
  const html=read('index.html');
  assert.match(html,/sekavore-startup-error/);
  assert.match(html,/__sekavoreBooted/);
  assert.doesNotMatch(html,/localStorage\.clear|localStorage\.removeItem/);
  assert.match(read('game.js'),/__sekavoreBooted=true/);
});
