# Architecture

## Baseline

`legacy/skyreach-original.html` is the immutable reference build supplied at project creation. It remains available for visual and behavioral comparisons.

## Maintained build

Vite owns development and production bundling. Three.js is installed through npm rather than loaded from a CDN.

`src/game.js` still owns the main scene construction and simulation loop. Extraction is incremental: stable subsystems move out only when they have a clear interface and regression coverage.

Current extracted modules:

- `src/core/math.js`: deterministic RNG and shared math helpers.
- `src/core/storage.js`: versioned localStorage persistence for progress and settings.
- `src/core/quality.js`: mobile-aware quality resolution and renderer configuration.
- `src/core/world.js`: terrain-height evaluation plus the open-ocean boat-navigation contract.
- `src/systems/exploration.js`: navigation, 2D proximity/bearing helpers, and lightweight haptic feedback.
- `src/systems/audio.js`: adaptive WebAudio environment, movement, wildlife, and vehicle sound layers.
- `src/style.css`: presentation separated from game logic.

New world modules:

- src/core/archipelago.js: stable offshore island definitions and analytic heights.
- src/systems/island-scenery.js: island meshes, instanced vegetation/rocks/paths, ruins, jetty, waterfall, surf, dolphins, fireflies and pooled wakes.
- src/systems/atlas.js and src/atlas.css: chart, field notes, course selection and scrolling radar.

## State and persistence

Beacon, sky-ring, Skyshard, and landmark completion are persisted under a versioned progress key. Quality preference is persisted separately. Corrupt or unavailable localStorage data fails safely to defaults.

The vehicle GLBs are content assets rather than persisted runtime state. Their provenance metadata lives beside each model under `public/assets/`.

## Vehicle visuals

The maintained game uses detailed GLB visuals while keeping the original procedural vehicle meshes as load-failure fallbacks:

- `public/assets/vehicles/sports_car.glb`: player car and four traffic variants; only the named `paint` material is recolored.
- `public/assets/boats/speedboat.glb`: source scale, rotated -90° around Y so its +X bow matches Skyreach's +Z forward convention.
- `public/assets/aircraft/airliner.glb`: uniform 0.30 scale; its +Z nose already matches the flight rig.

Driving, sailing, and flight physics remain owned by the existing gameplay simulation rather than by the visual models.

## World continuity

The home island and three offshore islands are finite terrain features in an unbounded ocean. All use the same height query for walking, vehicle grounding, chart generation and shoreline collision. Sea-arch pillars have explicit boat collision while the middle remains navigable.

`terrainHeight()` caps the far mathematical seafloor at -80 so very large ocean coordinates remain numerically stable. `boatCanTravel()` checks all real terrain plus sea-arch pillars, without a coordinate boundary. The old radius >= 360 shortcut is removed because offshore islands occupy some of those coordinates.

The 3000×3000 water plane follows the camera every frame, so its visible surface effectively moves with the player. The sky dome, sun/moon visuals, stars, and directional-light target also follow the player/camera frame. Clouds wrap around the player's current coordinates, preventing long ocean voyages from leaving the atmospheric field behind.

## Audio

Audio begins only after the player's Start gesture so mobile/browser autoplay restrictions are respected.

`src/systems/audio.js` generates the soundscape locally with WebAudio rather than streamed audio assets. The mix includes:

- surface-aware footsteps for grass, sand, stone/road, wood, and shallow water
- environmental wind
- shoreline surf
- open-ocean wash
- land/foliage ambience
- subtle town ambience
- speed-reactive car engine and road noise
- speed-reactive boat engine and wake noise
- speed/altitude-reactive airliner engine, jet noise, and wind
- sparse daytime bird calls
- sparse nighttime insect chirps
- distance-faded waterfall noise within 90 units of Veilwater, capped at 0.20 gain

Mix levels react continuously to vehicle mode, speed, altitude, coast proximity, town proximity, terrain surface, and day/night state. A master compressor and bounded layer gains keep the synthesized mix under control.

## Exploration systems

The current progression layer includes six beacons, eight airborne rings, ten Skyshards, and eight named landmarks. Skyshards unlock the persistent Tailwind movement bonus when all ten are collected.

`src/systems/exploration.js` supplies nearest-pending objective selection, distance/bearing helpers, and haptic feedback. The HUD compass prioritizes an explicitly selected destination, then unfinished beacons, then unfinished Skyshards. The radar follows the player with a 660-unit span. Eight discovery slots preserve the original five slots unchanged.

## Performance

Automatic quality chooses a conservative preset from browser-reported device memory/CPU information when available. The player can cycle Auto, Low, Medium, and High without leaving the game. Pixel ratio and shadow rendering are the main runtime quality controls.

Detailed GLB meshes currently disable their own dynamic shadows where appropriate to avoid turning visual upgrades into an unnecessary mobile GPU cost.

The production bundle still emits Vite's >500 kB chunk warning; this is non-fatal and is primarily a future code-splitting/performance-maintenance item rather than a current deployment blocker.

The ocean adds low-amplitude vertex waves on a 100×100 grid. Surf is generated from sampled coastline contours. Wakes use a pool of 64 instances. Palms, rocks and stepping stones are instanced. Original forest instances now have computed bounds for frustum culling.

Explore releases held controls and pauses simulation movement. Blur and visibility changes also clear controls. Development-only inspection hooks are removed by the production build.

## PWA and deployment updates

The production build registers `public/sw.js`. Current cache version: `skyreach-v8`.

Service-worker behavior:

1. The application shell (`./`, `index.html`, and `manifest.webmanifest`) is pre-cached during install.
2. Navigation requests are network-first with cached fallback.
3. Same-origin `.glb` model requests are network-first with cached fallback.
4. Other same-origin GET assets use cache-first behavior and are cached after successful network retrieval.
5. Activation removes older Skyreach cache versions and claims open clients.

The production app registers the worker with `updateViaCache: 'none'`. When an existing controlled page receives a new worker, the app listens for `controllerchange` and reloads once so a newly deployed version replaces stale runtime code promptly.

GitHub Pages deployment runs through `.github/workflows/pages.yml`, which performs `npm ci`, `npm test`, and `npm run build` before packaging and deploying the site.

## Regression coverage

The current Node test suite covers:

- aircraft GLB integrity, orientation, and real `GLTFLoader` parsing
- speedboat GLB integrity, bow orientation, dimensions, and real `GLTFLoader` parsing
- sports-car GLB integrity and paint-material contract
- adaptive audio mix behavior and bounded gains
- open-ocean boat travel, shoreline blocking, and far-ocean terrain stability
- exploration nearest-objective/bearing/distance helpers
- backward-compatible persistence for eight discoveries
- offshore shore approaches, cove entry, waterfall terrain drop and sea-arch passage/pillars
- bounded waterfall audio gains

## Next extraction boundaries

Continue extracting only when the boundary is useful and testable:

1. world construction: terrain mesh, water, town, vegetation, lighthouse
2. entities: player, NPCs, vehicle wrappers
3. systems: input, camera, objectives, particles, day/night
4. UI: HUD, minimap, settings

Each extraction should preserve `legacy/skyreach-original.html` as the behavioral reference and be followed by tests, a production build, and an appropriate runtime smoke check.
