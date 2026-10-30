from pathlib import Path
import re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'screenshots_v024';OUT.mkdir(exist_ok=True)

def page_html():
    html=(ROOT/'index.html').read_text()
    css=['style.css','bomb-panel.css','consumables-panel.css','hud-v016.css','hud-v017.css','floor-auto-v019.css','economy-v022.css','main-controls-v023.css','floor-selector-v024.css']
    for f in css: html=html.replace(f'<link rel="stylesheet" href="{f}">','')
    html=html.replace('</head>','<style>'+ '\n'.join((ROOT/f).read_text() for f in css) + '</style></head>')
    scripts=[]
    for f in ['mining-art-v018.js','mining-waves-v021.js','floor-auto-v019.js','floor-selector-v024.js','core.js','game.js']:
        code=(ROOT/f).read_text()
        code=re.sub(r'^import\s+\{[^}]*\}\s+from\s+[\'\"]\./[^\'\"]+[\'\"];\s*','',code,flags=re.M)
        code=re.sub(r'\bexport\s+','',code)
        scripts.append(code)
    shim="""<script>window.__frames=[];window.requestAnimationFrame=f=>{window.__frames.push(f);return 1};window.setInterval=f=>1;let seed=51;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};</script>"""
    return html.replace('<script type="module" src="game.js"></script>',shim+'<script>'+ '\n'.join(scripts) + '</script>')

errors=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for size in [390,360]:
    ctx=b.new_context(viewport={'width':size,'height':868 if size==390 else 740},device_scale_factor=1,is_mobile=True,has_touch=True)
    ctx.add_init_script("""Object.defineProperty(window,'localStorage',{value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},configurable:true})""")
    p=ctx.new_page();p.on('pageerror',lambda e: errors.append(str(e)))
    p.set_content(page_html(),wait_until='load');p.wait_for_function('window.__deepMineTest');p.evaluate('window.__frames.shift()?.(performance.now())')
    p.locator('#floorPair').click()
    assert p.locator('.floor-selector').is_visible()
    assert p.locator('#overlay').evaluate('(e)=>e.classList.contains("floor-select-mode")')
    assert p.locator('.floor-select-button').count()==10
    assert p.locator('.floor-world').count()==4
    assert p.locator('.floor-world').nth(1).is_disabled()
    assert p.locator('.floor-select-button[data-act="floor:2"]').is_disabled()
    assert p.locator('.floor-select-button[data-act="floor:1"]').get_attribute('class').find('current')>=0
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Horizontal overflow'
    assert p.locator('#panelContent').evaluate('(e)=>e.scrollHeight<=e.clientHeight+1'), 'Modal should not scroll'
    p.screenshot(path=str(OUT/f'{size}_floor_initial.png'))
    p.locator('.floor-select-close').click();assert p.locator('#overlay').get_attribute('aria-hidden')=='true'
    p.locator('#floorPair').click()
    p.evaluate('game.floorProgress[1]=floorQuota(1);game.rocksThisFloor=floorQuota(1);renderMenu();')
    assert p.locator('.floor-select-button[data-act="floor:2"]').is_enabled()
    p.locator('.floor-select-button[data-act="floor:2"]').click()
    assert p.evaluate('game.floor')==2
    assert p.locator('#overlay').get_attribute('aria-hidden')=='true'
    p.locator('#floorPair').click()
    assert p.locator('.floor-select-button[data-act="floor:2"]').get_attribute('class').find('current')>=0
    p.screenshot(path=str(OUT/f'{size}_floor_2.png'))
    # Advanced fixture exercises World 2 without adding game content or bypassing travel gating.
    p.evaluate('game.highestFloor=10;game.floor=10;game.floorProgress[10]=floorQuota(10);game.rocksThisFloor=floorQuota(10);renderMenu();')
    assert p.locator('.floor-world').nth(1).is_enabled()
    p.locator('[data-act="world:2"]').click()
    assert p.locator('.floor-select-button[data-act="floor:11"]').is_enabled()
    assert p.locator('.floor-select-button[data-act="floor:12"]').is_disabled()
    p.screenshot(path=str(OUT/f'{size}_floor_world2.png'))
    p.locator('.floor-select-button[data-act="floor:11"]').click()
    assert p.evaluate('game.floor')==11
    assert p.locator('#overlay').get_attribute('aria-hidden')=='true'
    p.locator('#floorPair').click()
    p.locator('.floor-select-close').click()
    p.locator('#menuDock').click();assert p.locator('#panelTitle').inner_text()=='MENU HUB'
    p.locator('#hubCloseDock').click()
    p.locator('#bombDrawerBtn').click();assert p.locator('#drawerTitle').inner_text()=='BOMBS'
    p.locator('#drawerClose').click()
    p.locator('#inventoryQuick').click();assert p.locator('#drawerTitle').inner_text()=='CONSUMABLES'
    assert not errors,errors
    print('PASS',size,'floor selector, navigation, unlocks, no overflow, independent drawers')
    ctx.close()
 b.close()
assert not errors,errors
