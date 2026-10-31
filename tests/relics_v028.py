from pathlib import Path
import re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'screenshots_v028';OUT.mkdir(exist_ok=True)

def build():
 html=(ROOT/'index.html').read_text()
 css=re.findall(r'<link rel="stylesheet" href="([^"]+)"',html)
 for f in css:html=html.replace(f'<link rel="stylesheet" href="{f}">','')
 html=html.replace('</head>','<style>'+'\n'.join((ROOT/f).read_text() for f in css)+'</style></head>')
 js=[]
 for f in ['mining-art-v018.js','mining-waves-v021.js','floor-auto-v019.js','floor-selector-v024.js','bomb-controls-v025.js','chests-v027.js','relics-v028.js','core.js','game.js']:
  s=(ROOT/f).read_text()
  s=re.sub(r'^import\s+\{[^}]*\}\s+from\s+[\'\"]\./[^\'\"]+[\'\"];\s*','',s,flags=re.M)
  s=re.sub(r'\bexport\s+','',s);js.append(s)
 shim='<script>window.__frames=[];window.requestAnimationFrame=f=>{window.__frames.push(f);return 1};window.setInterval=()=>1;let seed=101;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}</script>'
 return html.replace('<script type="module" src="game.js"></script>',shim+'<script>'+'\n'.join(js)+'</script>')
errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(390,868),(360,740)]:
  context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,is_mobile=True,has_touch=True)
  context.add_init_script("Object.defineProperty(window,'localStorage',{value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},configurable:true})")
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(build(),wait_until='load');page.wait_for_function('window.__deepMineTest')
  page.evaluate('window.__frames.shift()?.(performance.now())')
  page.locator('#relicChestMeter').click()
  assert page.locator('#panelTitle').inner_text()=='RELIC CHESTS'
  assert page.locator('[data-act="openrelic:1"]').is_disabled()
  page.screenshot(path=str(OUT/f'{width}_empty.png'))
  page.locator('#closeBtn').click()
  page.evaluate('window.__deepMineTest.recordChestDamage(1800)')
  before=page.evaluate('window.__deepMineTest.relics()');assert before['unopened']>=1,before
  page.locator('#relicChestMeter').click();page.screenshot(path=str(OUT/f'{width}_ready.png'))
  page.locator('button[data-act="openrelic:1"]').click()
  after=page.evaluate('window.__deepMineTest.relics()')
  assert after['unopened']==before['unopened']-1,(before,after)
  assert after['opened']==1 and sum(after['owned'].values())==1,after
  assert page.locator('.relic-reward-row').count()==1
  page.screenshot(path=str(OUT/f'{width}_opened.png'))
  page.locator('#closeBtn').click()
  page.locator('#bombDrawerBtn').click();assert page.locator('#drawerTitle').inner_text()=='BOMBS'
  page.locator('#drawerClose').click()
  page.locator('#inventoryQuick').click();assert page.locator('#drawerTitle').inner_text()=='CONSUMABLES'
  page.locator('#drawerClose').click()
  page.locator('#menuDock').click();assert page.locator('#panelTitle').inner_text()=='MENU HUB'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  print('PASS',width,'Relics earned/opened with permanent ownership, Bombs, Consumables and Hub')
  context.close()
 browser.close()
assert not errors,errors
