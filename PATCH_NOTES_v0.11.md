# Sekavore v0.11 — subsystem separation and hand polish

- Removed the incorrect materials tab from the consumables shortcut; ore and bars remain in Ore Bag, Craft and Sell.
- Removed the Drone Menu control from the Bombs drawer. The Drone system is still available in its existing permanent menu and status shortcut.
- Created separate quick drawers for Bombs and Consumables, preserving the working Basic Bomb Fire action.
- Shown as neutral empty slots only: no new item content, charges, buffs, or effects were added.
- Rendered the hand sprite at 72% opacity and removed the unwanted rectangular pressed-hand outline. The circular radius indicator and multi-rock hit mechanics are unchanged.
- Preserved local save format, economic formulas, and existing control placements.

**Testing:** `npm test` and `python3 tests/layout_v011.py`. Browser screenshot tests include 390×868 and 360×740 phones.
