# Sekavore v0.39 - Live ore sprite caching

- Cache intact and partially damaged ore-node pixel art, redrawing the complex vector artwork only after a change to that node's HP.
- Preserve per-node hover movement, fresh-hit shake, shimmering mineral facets, and existing mining-impact particles as inexpensive overlays.
- Reuse a single small offscreen canvas per visible node for all damage states; mined nodes remain darkened until the next full-wave respawn.
- Keep mining damage, loot, floor unlocks, Auto Next, bomb mechanics, save data and UI unchanged.
- Add drawing regression tests plus browser startup and mobile-layout smoke checks.
