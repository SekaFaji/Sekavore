# Sekavore v0.20 — mining-field visual polish

## Changes
- Added subtle drifting ambient mineral dust over the cached cave floor without changing field geometry.
- Added dithered stone grain, cracked chips, and embedded highlights.
- Added rock idle motion, short hit shake and occasional ore-facet glints (visual only).
- Improved impact fragments, flashes and dust when rocks break.
- No changes to damage, rewards, upgrade or auto-floor unlock logic, bomb recharging, drone behavior, or saves.

## Verification
- `npm test`: 25 passing tests.
- Browser screenshots and interaction checks at 390×868 and 360×740, including independent Bombs and Consumables drawers, with no JavaScript errors.
- Animations are most visible in motion; screenshots show frozen frames.
- Live Pages deployment and physical-device testing remain unverified.
