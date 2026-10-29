# Sekavore

**Sekavore v0.6** is a browser-playable incremental mining game built with vanilla JavaScript, HTML and CSS.

## Play on GitHub Pages

After the **Publish GitHub Pages** workflow finishes, play at:

**https://sekafaji.github.io/Sekavore/**

If the URL shows 404, check **Settings → Pages → Build and deployment → Source: GitHub Actions**, and inspect **Actions → Publish GitHub Pages**. Pages may require an initial one-time GitHub setting.

## Development

- `index.html`: browser entrypoint.
- `style.css`: game and menu styling.
- `game.js`: UI, rendering, input and saved preferences.
- `core.js`: independent gameplay, resources and progression formulas.
- `tests/core.test.mjs`: 12 game-logic tests.
- `tests/hub_v06.py`: optional Playwright UI test and screenshot capture.
- `.github/workflows/ci.yml`: pull-request validation.
- `.github/workflows/pages.yml`: deploys tested web files from `main`.

Run locally:

```sh
npm test
python3 -m http.server 8080
```

Open http://localhost:8080.

## Contributing and releases

1. Create a branch from `main`, e.g. `feature/hub-icon-polish`.
2. Commit the smallest focused changes possible.
3. Open a pull request into `main` and review checks and screenshots.
4. Merge when ready; merges trigger an automated GitHub Pages deployment.
5. Test the page on mobile before considering release on Android and iOS.

GitHub Pages is a **static web host**, not an account or save-sync backend. Game progress uses the same per-browser local storage key as the previous v0.2–v0.6 prototype; players should export backups if changing browsers/devices. Mobile app packaging can be explored later without requiring an engine rewrite.

## Development notes

Gameplay balance is actively being refined. The web build uses original game code and artwork. Game saves are stored locally in each browser.

## Latest patch

v0.6 reorganizes the Menu Hub into smaller icon-first buttons and retains the existing v0.5 gameplay rules. See [patch notes](PATCH_NOTES_v0.6.md).
