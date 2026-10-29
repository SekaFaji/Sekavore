"""Inline Chromium UI checks and screenshots for v0.13 consumables layout."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'screenshots_v013';OUT.mkdir(exist_ok=True)
def embedded_html():
    doc=(ROOT/'index.html').read_text()
    styles=(ROOT/'style.css').read_text()+'\n'+(ROOT/'bomb-panel.css').read_text()+'\n'+(ROOT/'consumables-panel.css').read_text()
    core=re.sub(r'\bexport\s+','',(ROOT/'core.js').read_text())
    game=re.sub(r'^import\s+\{[^}]*\}\s+from\s+[\'\"]\./core\.js[\'\"];\s*','',(ROOT/'game.js').read_text(),count=1)
    assert 'consumables-panel.css' in doc and 'bomb-panel.css' in doc
    doc=doc.replace('<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="bomb-panel.css"><link rel="stylesheet" href="consumables-panel.css">','<style>'+styles+'</style>')
    # Stable frame capture; game can still process direct user events.
    sim='<script>window.__frames=0;window.requestAnimationFrame=(fn)=>{if(window.__frames++<2)setTimeout(()=>fn(performance.now()),10);return 1};window.setInterval=()=>0;</script>'
    return doc.replace('<script type="module" src="game.js"></script>',sim+'<script>'+core+'\n'+game+'</script>')
errors=[]
with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width,height in [(390,868),(360,740)]:
   ctx=b.new_context(viewport={'width':width,'height':height},device_scale_factor=1,has_touch=True,is_mobile=True)
   p=ctx.new_page()
   p.on('pageerror',lambda e:errors.append(str(e)))
   p.set_content(embedded_html(),wait_until='load');p.wait_for_timeout(150)
   assert p.locator('style').count()==1
   assert p.evaluate('getComputedStyle(document.querySelector(".quick-drawer")).position')=='absolute'
   p.screenshot(path=str(OUT/f'{width}_mining.png'))
   p.locator('#inventoryQuick').click()
   assert p.locator('#drawerTitle').inner_text()=='CONSUMABLES'
   assert p.locator('.consumable-featured .consumable-slot').count()==3
   assert p.locator('.consumable-inventory .consumable-slot').count()==21
   assert p.locator('.consumable-slot').count()==24
   assert p.locator('.consumable-use').is_disabled()
   assert p.locator('.consumable-action-mini').is_disabled()
   assert p.locator('#drawerContent').get_by_text('MATERIALS').count()==0
   assert p.locator('#drawerContent').get_by_text('DRONE').count()==0
   assert p.locator('.consumable-inventory').evaluate('(e)=>getComputedStyle(e).gridTemplateColumns.split(" ").length')==7
   bounds=p.locator('#quickDrawer').bounding_box(); assert bounds
   assert bounds['x']>=0 and bounds['x']+bounds['width']<=width+1
   assert bounds['y']>=0 and bounds['y']+bounds['height']<height-45
   before=p.evaluate('window.__deepMineTest.snapshot()')
   p.screenshot(path=str(OUT/f'{width}_consumables.png'))
   p.locator('.consumable-slot').first.click(force=True)
   assert p.locator('.consumable-use').is_disabled()
   assert p.evaluate('window.__deepMineTest.snapshot()')==before, 'Tapping empty slots should not change save state'
   p.locator('#bombDrawerBtn').click()
   assert p.locator('#drawerTitle').inner_text()=='BOMBS'
   assert p.locator('.bomb-inventory-slot').count()==12
   assert p.locator('.bomb-fire-all').is_enabled()
   p.screenshot(path=str(OUT/f'{width}_bombs.png'))
   p.locator('#drawerClose').click()
   p.locator('#droneQuick').click()
   assert p.locator('#panelTitle').inner_text()=='DRONES'
   assert p.locator('.consumable-inventory').count()==0
   p.screenshot(path=str(OUT/f'{width}_drones.png'))
   ctx.close()
  b.close()
  assert not errors, errors

# Render side by side from preexisting v0.12 screenshot (same viewport width) and current version.
old=Path('/mnt/data/Sekavore_v0.12/screenshots_v012/390_consumables.png')
new=OUT/'390_consumables.png'
if old.exists():
 a=Image.open(old).convert('RGB'); b=Image.open(new).convert('RGB');maxh=max(a.height,b.height);title=30;gap=8
 cmp=Image.new('RGB',(a.width+b.width+gap,maxh+title),(26,22,29));d=ImageDraw.Draw(cmp)
 d.text((12,9),'v0.12 — old consumables',fill='white')
 d.text((a.width+gap+12,9),'v0.13 — new consumables',fill='white')
 cmp.paste(a,(0,title));cmp.paste(b,(a.width+gap,title));cmp.save(OUT/'comparison_v012_v013.png')
print('PASS: 24 empty consumable slots (3+21), disabled item controls, no invented mechanics; all production stylesheets present in HTML and loaded in test, bombs and drones independent; mobile 390 & 360 screenshots.')