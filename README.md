# Sekavore

A browser-playable incremental mining game.

## Play

Open https://sekafaji.github.io/Sekavore/ to play in a browser. Progress is saved locally per browser.

## Development

Run `npm test` for gameplay tests, or `python3 -m http.server 8080` for local play.

- `core.js` — mining economy, saves, targeting calculations
- `game.js` — rendering, inputs, menus
- `style.css` — responsive visual layout
- `index.html` — browser shell

Changes should be reviewed through feature branches and pull requests. The main branch is published to GitHub Pages.

## Latest changes

See `PATCH_NOTES_v0.9.md` for the hand and controls update.
