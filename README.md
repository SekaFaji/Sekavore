# Sekavore

A browser-playable incremental mining game.

Play: https://sekafaji.github.io/Sekavore/

Run `npm test` to verify gameplay, and `python tests/hud_v016.py` for Chromium UI checks (requires Playwright and Chromium).

Current version: v0.17. The game stores progress in the local browser.

### v0.17 HUD update
- Pixel ore counters and a collapsible live status list; boss/drone details appear only when relevant.
- No fabricated status durations or gameplay balance changes.

## v0.18 — Mining field visuals

The mining field uses an independent procedural rendering module (`mining-art-v018.js`). Rock damage, drops, progression, the hand radius and save format are unchanged.
