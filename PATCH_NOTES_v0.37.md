# Sekavore v0.37 - Startup recovery safeguards

- Versioned the browser entry script, floor controls module and floor control stylesheet to prevent mixed cached releases.
- Added a readable startup-error alert if the game script cannot finish initialization; does not reset saved progress.
- Preserved the v0.36 floor control logic (up for smaller floor numbers, down for larger unlocked numbers), auto-next, mining systems, menus and save keys.
- Added release regression tests for entrypoint loading and error visibility.
- No art, balance, level quota, content, or persistence changes.
