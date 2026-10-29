"""UI smoke test and screenshots for the v0.6 browser Menu Hub.
Requires Python Playwright and a local Chromium executable.
"""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'screenshots_v06'
OUT.mkdir(exist_ok=True)
def page_html():
    html=(ROOT/'index.html').read_text();css=(ROOT/'style.css').read_text()
    core=re.sub(r'\bexport\s+','',(ROOT/'core.js').read_text())
    game=re.sub(r'^import\s+\{[^}]*\}\s+from\s+[\'"]\./core\.js[\'"];\s*','',(ROOT/'game.js').read_text(),count=1)
    html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
    sim='<script>window.__shots=0;window.requestAnimationFrame=(fn)=>{if(window.__shots++===0){setTimeout(()=>fn(performance.now()),10)}return 1};window.setInterval=()=>0;</script>'
    return html.replace('<script type="module" src="game.js"></script>',sim+'<script>'+core+'\n'+game+'</script>')
errors=[]
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    mobile=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,has_touch=True,is_mobile=True)
    p=mobile.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.set_content(page_html(),wait_until='load')
    p.locator('#hubBtn').click()
    assert p.locator('.hub-tile').count()==25
    assert p.locator('.hub-icon-box').count()==25
    assert p.locator('.hub-heading').all_inner_texts()==['THIS PRESTIGE','PERMANENT','OTHER MENUS']
    assert p.locator('.hub-tile[data-menu="store"]').is_disabled()
    p.screenshot(path=str(OUT/'01_mobile_hub.png'))
    p.locator('.hub-tile[data-menu="craft"]').click()
    assert p.locator('#panelTitle').inner_text()=='CRAFT BARS'
    p.screenshot(path=str(OUT/'03_mobile_craft.png'))
    p.locator('#backBtn').click()
    p.locator('button[data-act="edit-pins"]').click()
    p.locator('.hub-tile[data-menu="stats"]').click()
    assert p.locator('#pin0').get_attribute('data-menu')=='stats'
    assert p.evaluate('window.__deepMineTest.snapshot().menuPins[0]')=='stats'
    p.screenshot(path=str(OUT/'02_mobile_pin_edit.png'))
    compact=b.new_context(viewport={'width':360,'height':740},device_scale_factor=1,has_touch=True,is_mobile=True)
    c=compact.new_page();c.on('pageerror',lambda e:errors.append(str(e)));c.set_content(page_html(),wait_until='load')
    c.locator('#hubBtn').click()
    assert c.evaluate("document.querySelector('#panelContent').scrollWidth <= document.querySelector('#panelContent').clientWidth")
    c.screenshot(path=str(OUT/'04_compact_hub.png'))
    pc=b.new_context(viewport={'width':1100,'height':900},device_scale_factor=1)
    d=pc.new_page();d.on('pageerror',lambda e:errors.append(str(e)));d.set_content(page_html(),wait_until='load')
    d.locator('#hubBtn').click();d.screenshot(path=str(OUT/'05_desktop_hub.png'))
    assert not errors,errors
    b.close()
print('PASS — 25 Hub tiles, craft navigation, quick pin editing, no horizontal overflow, 2 mobile widths and desktop')
