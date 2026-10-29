"""Bomb inventory geometry and Fire All regression at two phone widths."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'screenshots_v012'
OUT.mkdir(exist_ok=True)
def page_html():
 s=(ROOT/'index.html').read_text()
 style=(ROOT/'style.css').read_text()+'\n'+(ROOT/'bomb-panel.css').read_text()
 core=re.sub(r'\bexport\s+','',(ROOT/'core.js').read_text())
 game=re.sub(r'^import\s+\{[^}]*\}\s+from\s+[\'"]\./core\.js[\'"];\s*','',(ROOT/'game.js').read_text(),count=1)
 assert 'ctx.globalAlpha=.72' in game
 assert 'ctx.strokeRect(-16,-18,35,42)' not in game
 game=game.replace('swingAt:(x,y)=>swingHand(x,y)','swingAt:(x,y)=>swingHand(x,y),redraw:()=>draw(performance.now())')
 s=s.replace('<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="bomb-panel.css">','<style>'+style+'</style>')
 sim='<script>window.__frames=0;window.requestAnimationFrame=(fn)=>{if(window.__frames++<2)setTimeout(()=>fn(performance.now()),10);return 1};window.setInterval=()=>0;</script>'
 return s.replace('<script type="module" src="game.js"></script>',sim+'<script>'+core+'\n'+game+'</script>')

errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(390,868),(360,740)]:
  context=browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True)
  page=context.new_page()
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(page_html(),wait_until='load')
  page.wait_for_timeout(100)
  assert not page.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth')
  page.screenshot(path=str(OUT/f'{width}_mining.png'))
  box=page.locator('#field').bounding_box()
  page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
  page.mouse.down()
  page.evaluate('window.__deepMineTest.redraw()')
  page.screenshot(path=str(OUT/f'{width}_hand_pressed.png'))
  page.mouse.up()
  page.locator('#inventoryQuick').click()
  assert page.locator('#drawerTitle').inner_text()=='CONSUMABLES'
  assert page.locator('[data-draw-tab]').count()==0
  assert page.locator('.item-only-grid .empty-slot').count()==14
  assert page.get_by_role('button',name='USE').is_disabled()
  page.screenshot(path=str(OUT/f'{width}_consumables.png'))
  page.locator('#bombDrawerBtn').click()
  assert page.locator('#drawerTitle').inner_text()=='BOMBS'
  assert page.locator('#drawerContent').get_by_text('DRONE').count()==0
  assert page.locator('.bomb-row-five .bomb-inventory-slot').count()==5
  assert page.locator('.bomb-row-seven .bomb-inventory-slot').count()==7
  assert page.locator('.bomb-inventory-slot:disabled').count()==11
  assert page.locator('.bomb-inventory-slot.selected').count()==1
  assert page.locator('.bomb-fire-all').is_enabled()
  assert page.locator('.bomb-fire-all').inner_text().replace('\n',' ')=='FIRE ALL'
  page.screenshot(path=str(OUT/f'{width}_bombs_before.png'))
  old=page.evaluate('window.__deepMineTest.snapshot().bombs')
  page.locator('[data-draw-action="fire"]').click()
  assert page.evaluate('window.__deepMineTest.snapshot().bombs')==old-1
  assert page.locator('.bomb-count').inner_text().startswith(str(old-1))
  page.screenshot(path=str(OUT/f'{width}_bombs.png'))
  page.locator('#drawerClose').click()
  page.locator('#droneQuick').click()
  assert page.locator('#panelTitle').inner_text()=='DRONES'
  page.screenshot(path=str(OUT/f'{width}_drones.png'))
  page.locator('#closeBtn').click()
  page.evaluate('window.__deepMineTest.openMenu("bag")')
  assert page.locator('#panelTitle').inner_text()=='ORE BAG'
  context.close()
 assert not errors,errors
 browser.close()
print('PASS — 5+7 Bombs grid, Fire All, charges, separation and mobile widths')
