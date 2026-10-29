# Sekavore

A browser-playable incremental mining game.

## Play

Open https://sekafaji.github.io/Sekavore/ to play in a browser.

## Test

Run `npm test` for gameplay tests. The browser UI test is in `tests/layout_v011.py` and can produce visual captures with Chromium/Playwright.

## Development

The interface is designed for portrait touch screens. Progress is saved locally in the browser; export before switching devices or clearing browser data.

Development changes are reviewed in GitHub pull requests and published to Pages from `main`.

## v0.11

The consumables and bomb drawers are independent. Drones use their own menu. Ore and bars remain accessible from the mining economy. The hand has a translucent sprite without an attack rectangle.

## v0.12

The Bombs quick panel uses two compact rows of reserved slots, a clear Basic Bomb selection, charge/recharge status, and a bottom-right Fire All control. Only Basic Bomb is functional. The Drone and Consumables systems remain independent.

## v0.13

The Consumables drawer uses a compact inventory layout with reserved selection and timing areas. No item use effects are enabled yet. Bomb and Drone systems remain independent.
