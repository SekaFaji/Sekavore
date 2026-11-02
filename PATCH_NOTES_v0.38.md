# Sekavore v0.38 - Rendering and update-loop performance

- Coalesce rapid mining save writes so a multi-node sweep or bomb does not synchronously rewrite local storage once for every node. Explicit saves, floor travel, imports, visibility changes and page exit still flush immediately.
- Cache the darkened appearance of mined nodes as small (72 x 72) per-node sprites until the next wave, avoiding a canvas brightness filter and repeated vector paths for each destroyed node every frame.
- Keep unchanged Resource, Menu and Bomb Drawer markup mounted. Update Status rail labels and recharge bars in-place, retaining buttons rather than recreating them each tick.
- Limit rendering to roughly 30 FPS for large waves, heavy particles or open overlays; retain regular rendering on smaller fields while leaving game state ticks and input handling unchanged.
- Preserve all saved progress, node populations, clear requirements, floor directions and automation unlocks.
