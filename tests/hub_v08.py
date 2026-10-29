"""Browser interaction/layout smoke tests and screenshots for Sekavore v0.8."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'screenshots_v08';OUT.mkdir(exist_ok=True)
def html_inline():
    html=(ROOT/'index.html').read_text();css=(ROOT/'style.css').read_text()
    core=re.sub(r'\bexport\s+','',(ROOT/'core.js').read_text())
    game=re.sub(r'^import\s+\{[^}]*\}\s+from\s+[\'\"]\./core\.js[\'\"];\s*','',(ROOT/'game.js').read_text(),count=1)
    html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
    # Run real UI with a stable animation frame so snapshots don't drift.
    stub='<script>window.__shots=0;window.requestAnimationFrame=fn=>{if(window.__shots++===0)setTimeout(()=>fn(performance.now()),10);return 1};window.setInterval=()=>0;</script>'
    return html.replace('<script type="module" src="game.js"></script>',stub+'<script>'+core+'\n'+game+'</script>')
errors=[];layout={}
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for w,h,name in [(390,844,'mobile'),(360,740,'compact'),(1100,900,'desktop')]:
        ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,has_touch=w<700,is_mobile=w<700)
        p=ctx.new_page();p.on('pageerror',lambda e:errors.append(f'{name}: {e}'));p.set_content(html_inline(),wait_until='load')
        p.locator('#hubBtn').click()
        assert p.locator('.hub-cell').count()==25
        assert p.locator('.hub-heading').all_inner_texts()==['PERMANENT','THIS PRESTIGE','MISCELLANEOUS']
        assert p.locator('#hubCloseDock').is_visible()
        assert not p.locator('.panel-head').is_visible()
        assert p.locator('.hub-tile').first.evaluate('(e)=>Math.round(e.getBoundingClientRect().width)') in (41,44)
        d=p.evaluate('''()=>{const c=document.querySelector('#panelContent'), m=document.querySelector('.hub-bottom-tools'),panel=document.querySelector('.panel');return {contentScroll:c.scrollHeight, contentVisible:c.clientHeight, horizontal:c.scrollWidth-c.clientWidth, lastToolsBottom:Math.round(m.getBoundingClientRect().bottom), panelBottom:Math.round(panel.getBoundingClientRect().bottom)}}''')
        layout[name]=d
        assert d['horizontal']<=1, d
        p.screenshot(path=str(OUT/f'01_{name}_hub.png'))
        if name=='mobile':
            p.locator('button[data-pinpick="1"]').click()
            p.locator('.hub-tile[data-menu="stats"]').click()
            assert p.evaluate('window.__deepMineTest.snapshot().menuPins[1]')=='stats'
            p.screenshot(path=str(OUT/'04_mobile_pin_setup.png'))
            p.locator('button[data-act="edit-pins"]').click()
            p.locator('.hub-tile[data-menu="upgrades"]').click()
            assert p.locator('#panelTitle').inner_text()=='UPGRADES'
            assert not p.locator('#hubCloseDock').is_visible()
            p.screenshot(path=str(OUT/'05_mobile_upgrades.png'))
            p.locator('#backBtn').click()
            p.locator('#hubCloseDock').click()
            assert not p.locator('#overlay').is_visible()
            p.screenshot(path=str(OUT/'06_mobile_mining.png'))
        ctx.close()
    browser.close()
assert not errors, errors
# before/after preview
old=Path('/mnt/data/DeepMine_Research_V0_7/screenshots_v07/01_mobile_hub.png')
if old.exists():
    a=Image.open(old).convert('RGB');b=Image.open(OUT/'01_mobile_hub.png').convert('RGB')
    gap=10;head=28
    out=Image.new('RGB',(a.width+b.width+gap,max(a.height,b.height)+head),(28,25,29))
    draw=ImageDraw.Draw(out)
    draw.text((10,7),'v0.7  /  full panel',fill='white');draw.text((a.width+gap+10,7),'v0.8  /  transparent overlay',fill='white')
    out.paste(a,(0,head));out.paste(b,(a.width+gap,head))
    out.save(OUT/'07_before_after.png')
print('PASS — screenshots',len(list(OUT.glob('*.png'))),'layout',layout)
