# Sekavore v0.12 — Bomb Panel Fidelity

- Rebuilt the Bombs quick panel into two compact inventory rows (five slots, then seven slots), with a clear selected Basic Bomb.
- Reserved unimplemented slots are visually empty and disabled; no bomb content, economy or effects added.
- Added Basic Bomb charge state and labeled recharge information.
- Moved the action to a large bottom-right **FIRE ALL** control; with only one bomb type implemented it uses exactly one Basic Bomb charge per press.
- Removed the misleading single-row Fire layout. Fire All disables at zero charges or during the boss encounter, preserving existing restrictions.
- Left mining, radius hits, drones, consumables, materials and save data unchanged.
- Core tests and mobile Chromium UI screenshot/regression tests are included.
