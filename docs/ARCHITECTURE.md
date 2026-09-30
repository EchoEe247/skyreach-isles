# Architecture

## Baseline

`legacy/skyreach-original.html` is the immutable reference build supplied at project creation. It remains available for visual and behavioral comparisons.

## Maintained build

Vite owns development and production bundling. Three.js is installed through npm rather than loaded from a CDN.

`src/game.js` still contains the tightly coupled world construction and main simulation loop from the original game. This is intentional for the first refactor: moving every world system simultaneously would create unnecessary regression risk.

The first extracted modules are:

- `src/core/math.js`: deterministic RNG and shared math helpers.
- `src/core/storage.js`: versioned localStorage persistence for progress and settings.
- `src/core/quality.js`: mobile-aware quality resolution and renderer configuration.
- `src/systems/exploration.js`: navigation, 2D proximity/bearing helpers, and lightweight haptic feedback.
- `src/style.css`: presentation separated from game logic.

## State and persistence

Beacon, sky-ring, Skyshard, and landmark completion are persisted under a versioned storage key. Quality preference is persisted separately. Corrupt or unavailable localStorage data fails safely to defaults.

## Performance

Automatic quality chooses a conservative preset from browser-reported device memory/CPU information when available. The player can cycle Auto, Low, Medium, and High without leaving the game. Pixel ratio and shadow rendering are the first runtime controls because they have a large GPU cost on mobile.

## PWA

The production build registers `public/sw.js`. The service worker caches the application shell and then caches same-origin assets as they are fetched. This keeps development free of service-worker interference while enabling subsequent offline launches of a built/deployed version.

## Next extraction boundaries

As features grow, extract these in small verified steps:

1. world generation: terrain, water, town, vegetation, lighthouse
2. entities: player, NPCs, vehicles
3. systems: input, camera, objectives, particles, audio, day/night
4. UI: HUD, minimap, settings

Each extraction should preserve the legacy build as the behavioral reference and be followed by a production build plus browser smoke test.
