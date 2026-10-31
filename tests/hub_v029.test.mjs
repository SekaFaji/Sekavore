import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Hub fits one screen and has no fixed spacer',()=>{
 const css=read('hub-v029.css');
 assert.match(css,/overflow:hidden/);
 assert.match(css,/margin:auto/);
 assert.match(css,/@media\(max-height:630px\)/);
 assert.doesNotMatch(css,/margin-top:100px/);
});
test('Hub styling is included in the published site',()=>{
 assert.match(read('index.html'),/href="hub-v029\.css"/);
 assert.ok(read('.github/workflows/pages.yml').includes('hub-v029.css'));
});