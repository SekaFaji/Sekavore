# Sekavore v0.32 — Permanent Menus and Auto-Bomber

## Changes
- Workshop now has Bomb, Mining, and Owned sections. Unverified material costs are shown as unavailable previews; the previous experimental gold purchase is no longer offered. Previously purchased improvements remain in older saves.
- Skill Tree has Skill Nodes and Skill Points pages. Auto-Floor remains functional. Auto-Bomber is a new optional permanent unlock at 10 Skill Points.
- An Auto-Bomber toggle appears in the Basic Bomb panel only after purchase. When enabled it fires one bomb at a time at 1.25-second intervals, with ordinary charges and recharge. It does not attack the Obelisk.
- Challenges has Current, Next 3, and Rewards pages, with visible progression and historical task examples. Claims and Challenge Coins remain disabled because the exact current requirements and reward accounting are unverified.
- Auto-Bomber ownership and state survive saved games, imports, and Prestige. Prior saves default to locked and off.
- No art changes, mining balance changes, or new ores.

## Source fidelity
Historical sources describe the Workshop as bar-funded, and a 10-point Auto-Bomber Skill Tree node. The 2026 new-player update changed the early Challenges. Material recipes and the current Challenges sequence remain unverified, so neither is invented.

## Quality checks
The new self-contained menu module and stylesheet are listed in the GitHub Pages build. Unit tests verify skill gating, no duplicate charges, no unsupported reward claims, and published dependencies.
