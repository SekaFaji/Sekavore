# Sekavore v0.19 — Mining feedback and Auto-Floor unlock

## Changes
- Added short rock hit wobble and ore-colored debris without changing damage or rewards.
- Auto-Floor starts LOCKED and must be purchased after Obelisk level 4.
- Permanent purchase costs 3 Skill Points. A provisional 125-gem conversion per point makes the system earnable in this prototype.
- The purchase persists across Prestige. The toggle initially remains OFF and advances only from a cleared deepest floor.
- Older local saves migrate without bypassing the unlock. Save version remains 2.

## Research boundary
The exact current progression route is still under verification. Historical information describes a 3 Skill Point unlock, but the latest available version's node description differs; Sekavore uses an explicitly provisional gate pending additional gameplay reference.

## Validation
- Local gameplay and UI regression tests, including mobile controls and persistence.
- No change to mining damage, ore drops, bomb/drones or consumables.
