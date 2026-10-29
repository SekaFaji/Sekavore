from pathlib import Path
import re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'screenshots_v010';OUT.mkdir(exist_ok=True)
def html():
 s=(ROOT/'index.html').read_text();style=(ROOT/'style.css').read_text();core=re.sub(r'\bexport\s+','',(ROOT/'core.js').read_text());game=re.sub(r'^import\s+\{[^}]*\}\s+from\s+[\'\"]\./core\.js[\'\"];\s*','',(ROOT/'game.js').read_text(),count=1)
 s=s.replace('<link rel="stylesheet" href="style.css">','<style>'+style+'</style>')
 # Freeze graphics to a single frame to make screenshots stable, but allow UI events and direct clicks.
 sim='<script>window.__frames=0;window.requestAnimationFrame=(fn)=>{if(window.__frames++<2)setTimeout(()=>fn(performance.now()),10);return 1};window.setInterval=()=>0;</script>'
 return s.replace('<script type="module" src="game.js"></script>',sim+'<script>'+core+'\n'+game+'</script>')
errs=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(390,868),(360,740)]:
  ctx=b.new_context(viewport={'width':width,'height':height},has_touch=True,is_mobile=True,device_scale_factor=1)
  p=ctx.new_page();p.on('pageerror',lambda e:errs.append(str(e)));p.evaluate("Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}})");p.set_content(html(),wait_until='load');p.wait_for_timeout(100)
  assert p.locator('.dock-main button').count()==5
  assert p.locator('#shopDock').is_visible() and p.locator('#eventShortcut').is_hidden()
  assert p.locator('#resourceRows .mineral-count').count()>=2
  assert p.locator('#inventoryQuick').is_visible() and p.locator('#bombDrawerBtn').is_visible()
  assert not p.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth')
  assert p.locator('#shopDock').bounding_box()['x']>p.locator('#menuDock').bounding_box()['x']+30
  p.screenshot(path=str(OUT/f'{width}_mining.png'))
  p.locator('#inventoryQuick').click();assert p.locator('#quickDrawer').is_visible()
  assert p.locator('#drawerTitle').inner_text()=='ITEMS / CONSUMABLES'
  p.locator('[data-draw-tab="consumables"]').click()
  assert p.locator('.drawer-empty').count() and p.locator('#quickDrawer button:has-text("USE")').is_disabled()
  p.screenshot(path=str(OUT/f'{width}_consumables.png'))
  p.locator('[data-draw-tab="materials"]').click();p.screenshot(path=str(OUT/f'{width}_inventory.png'))
  p.locator('#drawerClose').click();p.locator('#bombDrawerBtn').click()
  assert p.locator('#drawerTitle').inner_text()=='BOMBS / DRONES'
  before=p.evaluate('window.__deepMineTest.snapshot().bombs')
  p.locator('[data-draw-action="fire"]').click()
  assert p.evaluate('window.__deepMineTest.snapshot().bombs')==before-1
  p.screenshot(path=str(OUT/f'{width}_bombs.png'))
  p.locator('#drawerClose').click();p.locator('#shopDock').click()
  assert p.locator('#panelTitle').inner_text()=='GEM & PACK STORE'
  assert p.locator('button:has-text("UNAVAILABLE")').is_disabled()
  p.screenshot(path=str(OUT/f'{width}_store.png'))
  p.locator('#closeBtn').click();p.locator('#menuDock').click()
  assert p.locator('.hub-cell').count()==23, p.locator('.hub-cell').count()
  assert p.locator('.hub-heading').all_inner_texts()==['PERMANENT','THIS PRESTIGE','MISCELLANEOUS']
  p.screenshot(path=str(OUT/f'{width}_hub.png'))
  p.locator('#hubCloseDock').click(); assert p.locator('#overlay').is_hidden()
  ctx.close()
 assert not errs,errs
 b.close()
print('PASS layout and functional drawers at 390x868 / 360x740')
