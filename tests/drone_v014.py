"""Browser regression for v0.14: a drone must travel to and damage its visible target.
Run manually with: python3 tests/drone_v014.py (requires Playwright and Chromium).
"""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

def embedded_page():
    html = (ROOT / "index.html").read_text()
    styles = "\n".join((ROOT / p).read_text() for p in ("style.css", "bomb-panel.css", "consumables-panel.css"))
    core = re.sub(r"\bexport\s+", "", (ROOT / "core.js").read_text())
    game = re.sub(r'^import\s+\{[^}]*\}\s+from\s+[\'"]\./core\.js[\'"];\s*', "", (ROOT / "game.js").read_text(), count=1)
    assert game.startswith("const $=")
    game = game.replace("let game=newGame();try{", "let game=newGame();game.drone=true;game.droneLevel=2;game.settings.sound=false;try{", 1)
    links = '<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="bomb-panel.css"><link rel="stylesheet" href="consumables-panel.css">'
    assert links in html
    html = html.replace(links, "<style>" + styles + "</style>")
    clock = """<script>
window._frames=[];window._intervals=[];
window.requestAnimationFrame=f=>{_frames.push(f);return _frames.length};
window.setInterval=f=>{_intervals.push(f);return _intervals.length};
window.advance=n=>{let t=window._now??performance.now();for(let i=0;i<n;i++){const f=_frames.shift();if(!f)break;t+=33;f(t)}window._now=t};
window.untilHit=()=>{let t=window._now??performance.now();for(let i=0;i<190;i++){const f=_frames.shift();if(!f)break;t+=33;f(t);if(droneMotion.lastImpact){window._now=t;return true}}return false}
</script>"""
    return html.replace('<script type="module" src="game.js"></script>', clock + "<script>" + core + "\n" + game + "</script>")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    for width, height in ((390,868), (360,740)):
        page = browser.new_page(viewport={"width":width,"height":height})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.set_content(embedded_page(), wait_until="load")
        page.evaluate("droneMotion.x=180;droneMotion.y=555;window.advance(1)")
        before = page.evaluate("__deepMineTest.rocks()")
        target_id = page.evaluate("__deepMineTest.drone().targetId")
        assert target_id is not None
        page.evaluate("window.advance(9)")
        assert page.evaluate("__deepMineTest.rocks()") == before
        assert page.evaluate("__deepMineTest.drone().y") < 555
        page.evaluate("for(let i=0;i<20;i++)_intervals[0]()")
        assert page.evaluate("__deepMineTest.drone().ready")
        assert page.evaluate("window.untilHit()")
        impact = page.evaluate("__deepMineTest.drone().lastImpact")
        assert impact["id"] == target_id
        after = page.evaluate("__deepMineTest.rocks()")
        previous = next(x for x in before if x["id"] == target_id)
        hit = next((x for x in after if x["id"] == target_id), None)
        assert hit is None or hit["hp"] < previous["hp"]
        for rock in before:
            if rock["id"] != target_id:
                same = next(x for x in after if x["id"] == rock["id"])
                assert same["hp"] == rock["hp"]
        page.evaluate("window.advance(20)")
        assert page.evaluate("__deepMineTest.rocks()") == after
        page.evaluate("spawnRocks()")
        assert page.evaluate("__deepMineTest.drone().targetId") is None
        page.locator("#droneQuick").click()
        assert page.locator("#panelTitle").inner_text() == "DRONES"
        assert not errors, errors
        page.close()
    browser.close()
print("PASS: drone travel, target-aligned damage, no double hits, floor reset, mobile sizes")
