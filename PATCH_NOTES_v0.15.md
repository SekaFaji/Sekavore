# Sekavore v0.15 — HUD and inventory fidelity

- Display only implemented, unlocked bomb types. Basic Bomb is the only available type at this stage.
- Empty Consumables inventory is compact; future owned items render slots dynamically. Use stays disabled until consumable effects exist.
- Display next bomb charge, overall time until full, exact progress bar and 1 / 9s current recharge rate.
- Preserve partial bomb recharge progress using the existing `bombCharge` save field. No save version change.
- Add a left HUD bomb timer and progress strip, and show up to four held ore counters.
- No new paid features, consumable effects, drone upgrades, or gameplay damage changes.
