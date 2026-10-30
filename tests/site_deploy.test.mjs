import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';

// Prevent startup failures caused by missing browser modules in the Pages build.
const repo=path.resolve(import.meta.dirname,'..');
const read=filename=>readFileSync(path.join(repo,filename),'utf8');

test('Pages artifact list includes all browser JS imports and linked CSS',()=>{
  const workflow=read('.github/workflows/pages.yml');
  const cp=workflow.match(/^\s*cp\s+([^\n]+?)\s+_site\/\s*$/m);
  assert.ok(cp,'Pages workflow must assemble _site with a cp command');
  const copied=new Set(cp[1].trim().split(/\s+/));
  const checked=new Set();
  const ensure=filename=>{
    assert.ok(existsSync(path.join(repo,filename)),`Referenced site file missing from repository: ${filename}`);
    assert.ok(copied.has(filename),`Referenced site file missing from Pages deployment: ${filename}`);
  };
  const html=read('index.html');
  ensure('index.html');
  for(const m of html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["']/g)){
    if(!m[1].startsWith('http'))ensure(m[1].replace(/^\.\//,''));
  }
  const scriptPaths=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m=>m[1]);
  for(const file of scriptPaths){
    if(file.startsWith('http'))continue;
    const visit=(filename)=>{
      if(checked.has(filename))return;
      checked.add(filename);
      ensure(filename);
      for(const m of read(filename).matchAll(/^\s*(?:import|export)\s+[^\n]*?\sfrom\s+["'](\.[^"']+)["']/gm)){
        const next=path.posix.normalize(path.posix.join(path.posix.dirname(filename),m[1]));
        visit(next);
      }
      for(const m of read(filename).matchAll(/^\s*import\s+["'](\.[^"']+)["']/gm)){
        visit(path.posix.normalize(path.posix.join(path.posix.dirname(filename),m[1])));
      }
    };
    visit(file.replace(/^\.\//,''));
  }
  assert.ok(checked.size>1,'Expected to validate multiple browser modules');
});
