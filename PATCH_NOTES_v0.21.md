# Sekavore v0.21 — Mining Wave & Floor Systems

## Behavior corrections

- Rocks now generate in complete waves. Individual rocks are not replaced mid-wave; the next wave begins only after clearing the current field.
- The wave refresh delay is 1.25 seconds. This is a provisional tuning value, not a confirmed exact external-game rule.
- Wave size uses the current Sekavore floor quota, capped at 18 visible rocks. Ore selection, damage, loot, XP and crafting balance are unchanged.
- Floor clearance counts stop at the required quota. Additional farming still awards ore and XP.
- Auto-Floor resumes from any completed earlier floor. When enabled on an already-completed floor, it advances through consecutively cleared floors, stopping at the first unfinished floor.
- Manual floor travel, save imports and Prestige retain their existing rules.
- The floor progress indicator shows a short wave countdown while the next wave is pending.

## Limits

Reference reports support group-based rock regeneration and Auto-Floor advancing through required floor clears, but exact spawn counts and regeneration times are not independently verified. This patch keeps original Sekavore values where evidence is missing.

## Tests

- 32 Node tests, including wave placement, quota boundaries, legacy saves, Auto-Floor and Pages deployment.
- Chromium mobile checks for wave clear and regeneration, Auto-Floor, Bombs, Consumables and page width at 390×868 and 360×740.
