# Tauri icons

Place generated Tauri icons in this folder before packaging the desktop app.

Recommended workflow:
1. Design a square SVG master icon (1024×1024 minimum).
2. Use `pnpm tauri icon <path-to-svg>` to generate platform-specific assets.
3. Commit the produced files so builds include proper app imagery.
