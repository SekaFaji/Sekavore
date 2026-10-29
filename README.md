# Sekavore — v0.8

Sekavore is a browser-playable portrait incremental mining game built with JavaScript, HTML and CSS.

## Run locally

```sh
npm test
python3 -m http.server 8080
```

Open `http://localhost:8080` or use the GitHub Pages deployment from `main`.

## Project structure

- `core.js`: gameplay rules, rewards, resources, and progression.
- `game.js`: browser UI, input, menus, and saved preferences.
- `style.css`: mobile and desktop layouts.
- `tests/`: gameplay and interface checks.
- `.github/workflows/`: pull-request validation and web deployment.

## Development workflow

Create a patch branch from `main`, open a pull request, run the checks, and merge after reviewing the captured screens. Each merge into `main` publishes the website through GitHub Pages.

## v0.8

The Menu Hub now displays over the visible mining field, with a more compact four-column button grid, narrow section headers, small icon-first tiles with labels below, muted lock states, and an explicit close button in the bottom dock. The other menus retain their existing layout. No progression formulas or save structure changed.

Browser saves remain local to each device; export a backup before changing devices or browsers.
