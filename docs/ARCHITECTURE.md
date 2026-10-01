# Architecture

## Baseline

`legacy/skyreach-original.html` is the immutable reference build supplied at project creation. It remains available for visual and behavioral comparisons.

## Maintained build

Vite owns development and production bundling. Three.js is installed through npm rather than loaded from a CDN.

`src/game.js` still owns the main scene construction and simulation loop. Extraction is incremental: stable subsystems move out only when they have a clear interface and regression coverage.

Current extracted modules:

- `src/core/environment-layout.js`: curated regional model placements and six animal home ranges.
- `src/systems/environment-assets.js`: demand-loaded CC0 GLBs, cached sources, per-region static instancing, lightweight collisions and distance-throttled skeletal animals.

- `src/core/math.js`: deterministic RNG and shared math helpers.
- `src/core/storage.js`: versioned localStorage persistence for progress and settings.
- `src/core/quality.js`: mobile-aware quality resolution and renderer configuration.
- `src/core/world.js`: terrain-height evaluation, the LAX flattened-site contract, and the open-ocean boat-navigation contract.
- `src/core/spaceflight.js`: deterministic SLS atmosphere, gravity, drag, altitude mapping, Kármán-line state, and rocket integration.
- `src/core/celestial.js`: deterministic Earth-Moon 3D position/velocity integration, two-body gravity, spacecraft target guidance, render-coordinate compression, lunar approach mapping, and safe time acceleration.
- `src/core/daylight.js`: asymmetric 9-minute-day / 3-minute-night timing and bounded lighting profiles.
- `src/core/living-world.js`: deterministic weather, lightning, world-event cadence, and NPC schedule targets.
- `src/systems/exploration.js`: navigation, 2D proximity/bearing helpers, and lightweight haptic feedback.
- `src/systems/audio.js`: adaptive WebAudio environment, movement, wildlife, and vehicle sound layers.
- `src/systems/moon.js`: deterministic lunar terrain patch, craters, rocks, landing pad, and local surface queries.
- `src/style.css`: presentation separated from game logic.

New world modules:

- src/core/archipelago.js: stable offshore island definitions and analytic heights.
- src/systems/island-scenery.js: island meshes, instanced vegetation/rocks/paths, ruins, jetty, waterfall, surf, dolphins, fireflies and pooled wakes.
- src/systems/living-world.js: rain particles, event manifestations/resolution state, and ambient ferry traffic.
- src/systems/atlas.js and src/atlas.css: chart, field notes, course selection and scrolling radar.

## State and persistence

Beacon, sky-ring, Skyshard, and landmark completion are persisted under a versioned progress key. Quality preference is persisted separately. Corrupt or unavailable localStorage data fails safely to defaults.

The vehicle GLBs are content assets rather than persisted runtime state. Their provenance metadata lives beside each model under `public/assets/`.

## Vehicle visuals

The maintained game uses detailed GLB visuals while keeping the original procedural vehicle meshes as load-failure fallbacks:

- `public/assets/vehicles/sports_car.glb`: player car and four traffic variants; only the named `paint` material is recolored.
- `public/assets/boats/speedboat.glb`: source scale, rotated -90° around Y so its +X bow matches Skyreach's +Z forward convention.
- `public/assets/aircraft/airliner.glb`: uniform 0.30 scale; its +Z nose already matches the flight rig.
- `public/assets/space/nasa-sls-block1.stl`: official NASA SLS Block 1 geometry, normalized at load time; only the printable display-plinth triangles are discarded before rendering, then the rocket is colored in-engine for the orange core/white boosters.
- `public/assets/space/nasa-blue-marble-2048.png`: NASA Blue Marble texture for the high-altitude Earth representation.
- `public/assets/space/alien/alien_spaceship.glb`: user-provided Alien Scout visual; textured PBR asset with normals/UVs, loaded directly as the compact lunar craft.
- `public/assets/space/alien/alien_ship.glb`: user-provided Alien Strike Ship visual; missing normals are generated at runtime and its many source meshes are merged by material before display to reduce mobile draw submissions.

Driving, sailing, and flight physics remain owned by the existing gameplay simulation rather than by the visual models.

## Atmospheric ascent and celestial handoff

The SLS is part of the same vehicle registry and main simulation loop as the car, boat, and airplane. There is no scene transition at altitude boundaries. `src/core/spaceflight.js` updates physical altitude, vertical/horizontal speed, body heading, inertial horizontal-velocity heading, pitch/yaw rates, atmosphere density, gravity, drag, throttle response, SAS damping, and the gravity-turn assist deterministically.

For numerical stability, physical rocket altitude is mapped to render height with a logarithmic function and can be inverted by tests. This preserves useful meter-scale ground coordinates while still representing the 100 km Kármán line and higher altitudes in the same Three.js scene. Visual atmosphere blending begins gradually above the lower atmosphere; fog/cloud contribution falls away, stars become fully visible, and the NASA Earth globe fades into view continuously.

The spacecraft HUD exposes speed and body-relative altitude plus a 20–100% throttle preset and SAS toggle. After celestial handoff it also exposes TARGET, AUTO NAV, and TIME controls for Earth/Moon navigation. A camera-projected target locator is activated during high ascent/interbody flight and clamps to the viewport edge when the target is off-screen; the navigation readout exposes yaw and pitch error from the vehicle attitude to the selected body. The near-surface water plane is now 40 km across and crossfades with local terrain between 18–70 km physical altitude while the curved NASA Earth representation fades in, preventing the old square-ocean edge from appearing during ascent. Earlier browser smoke checks covered ~105 m, 16.6 km, 44.2 km, and ~297 km during the atmospheric-only phase; current automated coverage additionally exercises the Earth-Moon celestial handoff and transfer corridor.

## Earth-Moon interbody simulation

`src/core/celestial.js` owns the physical interbody layer. The atmospheric SLS model remains authoritative through launch and crosses into celestial state at the Karman line with velocity and attitude preserved. Celestial state uses meter-scale 3D vectors, inverse-square Earth/Moon gravity, deterministic thrust integration, body-relative altitude, target guidance, and proximity-limited simulation acceleration.

The Moon is physically placed about 384,400 km from Earth with a 1,737.4 km radius. Rendering uses a floating/camera-relative compressed representation instead of placing Three.js objects hundreds of millions of world units apart. The spacecraft remains near a stable render anchor during cruise while Earth and Moon are rendered from physical relative vectors; this avoids precision loss and prevents a visible scene transition at the atmospheric handoff.

`src/systems/moon.js` provides the local lunar landing/exploration patch: deterministic cratered terrain, rocks, landing pad, and low-gravity walking. The distant Moon globe fades out as the local patch becomes relevant. The two lunar alien craft share the same celestial physics as the SLS. The larger 119-mesh craft is merged by material at runtime before display to reduce draw submissions on Pixel-class hardware.

AUTO NAV computes a physical steering/thrust/braking command toward the selected Earth or Moon target. It does not teleport or rewrite position. Player-selected 1x-400x simulation acceleration is automatically clamped near either world so approach and landing remain controllable.

For SLS Earth return, the celestial state retains the original launch-site x/z coordinates. TARGET EARTH guides into that corridor; once horizontal alignment is within 300 m, altitude is below 15 km, and speed is below 100 m/s, the vehicle hands back into `spaceflight.js` with radial/tangential velocity preserved. Reentry, descent, touchdown and exit then use the normal atmospheric/ground path rather than a reset or teleport.

## World continuity

The home island and three offshore islands are finite terrain features in an unbounded ocean. All use the same height query for walking, vehicle grounding, chart generation and shoreline collision. Sea-arch pillars have explicit boat collision while the middle remains navigable.

`terrainHeight()` caps the far mathematical seafloor at -80 so very large ocean coordinates remain numerically stable. `boatCanTravel()` checks all real terrain plus sea-arch pillars, without a coordinate boundary. The old radius >= 360 shortcut is removed because offshore islands occupy some of those coordinates.

The 40000×40000 water plane follows the camera every frame. During rocket ascent, local terrain and water crossfade out between roughly 18–70 km physical altitude while the curved Earth representation takes over, preventing a finite square ocean edge from appearing beneath the SLS. The sky dome, sun/moon visuals, stars, and directional-light target also follow the player/camera frame. Clouds wrap around the player's current coordinates, preventing long ocean voyages from leaving the atmospheric field behind.

## Audio

Audio begins only after the player's Start gesture so mobile/browser autoplay restrictions are respected.

`src/systems/audio.js` generates the soundscape locally with WebAudio rather than streamed audio assets. The mix includes:

- surface-aware footsteps for grass, sand, stone/road, wood, and shallow water
- environmental and weather-driven wind
- rain noise driven by the living-world weather profile
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

Mix levels react continuously to vehicle mode, speed, altitude, coast proximity, town proximity, terrain surface, day/night state, rain, and weather wind. A master compressor and bounded layer gains keep the synthesized mix under control.

## Exploration systems

The current progression layer includes six beacons, eight airborne rings, ten Skyshards, and eight named landmarks. Skyshards unlock the persistent Tailwind movement bonus when all ten are collected.

`src/systems/exploration.js` supplies nearest-pending objective selection, distance/bearing helpers, and haptic feedback. The HUD compass prioritizes an explicitly selected destination, then unfinished beacons, then unfinished Skyshards. The radar follows the player with a 660-unit span. Eight discovery slots preserve the original five slots unchanged.

## Living-world simulation

The living-world clock advances only while gameplay is active. Weather follows a 600-second continuous cycle with clear, cloudy, rain, storm, and fog phases blended over transition windows. Rendering responds by changing cloud density/speed, rain particles, linear-fog range, water bump strength, sky/sun/moon contribution, and bounded lightning flashes. Storm darkness is deliberately capped so the game's night-visibility contract remains intact.

The existing 24 NPC population is redistributed rather than increased: 18 residents remain on the home island and six live on the offshore islands. Four schedule periods (morning/day/evening/night) move each resident between deterministic community anchors with short local wandering around each anchor. This adds behavior without increasing character draw-call count.

Two low-poly ambient ferries traverse sampled open-water routes between the home island and offshore destinations. They are ambience only and do not affect player boat collision.

World events are intermittent rather than a second checklist. Washed-up cargo, lighthouse outage, and stranded-boat events appear in bounded windows, manifest in the world, announce once, and resolve when the player reaches their event radius. Resolving the outage restores the lighthouse immediately. Event state is intentionally session-local and repeats on a later cycle.

## Performance

Automatic quality chooses a conservative preset from browser-reported device memory/CPU information when available. The player can cycle Auto, Low, Medium, and High without leaving the game. Pixel ratio and shadow rendering are the main runtime quality controls.

Detailed GLB meshes currently disable their own dynamic shadows where appropriate to avoid turning visual upgrades into an unnecessary mobile GPU cost. The NASA Earth texture and 13.7 MB SLS STL are no longer fetched during module startup; they load when the rocket is used. The two Moon alien GLBs are likewise deferred until Moon travel or boarding requires them. Humanoid characters share unit geometry and cached materials, and NPC steering reuses a temporary vector instead of allocating a clone per NPC per frame.

The app-owned production JavaScript is split from Three.js through Vite manual chunking: the current game chunk is about 97 KB minified while the Three.js vendor chunk is about 606 KB. Vite therefore still emits a >500 kB warning for the vendor chunk, but game-code deploys can reuse the separately cached Three.js payload.

The ocean adds low-amplitude vertex waves on a 100×100 grid. Surf is generated from sampled coastline contours. Wakes use a pool of 64 instances. Palms, rocks and stepping stones are instanced. Original forest instances now have computed bounds for frustum culling.

Explore releases held controls and pauses simulation movement. Blur and visibility changes also clear controls. Development-only inspection hooks are removed by the production build.

## PWA and deployment updates

The production build registers `public/sw.js`. Current cache version: `skyreach-v17`.

Service-worker behavior:

1. The application shell (`./`, `index.html`, and `manifest.webmanifest`) is pre-cached during install.
2. Navigation requests are network-first with cached fallback.
3. Same-origin `.glb` model requests are network-first with cached fallback and a 3.5-second abort timeout before falling back to cache.
4. Other same-origin GET assets use cache-first behavior and are cached after successful network retrieval.
5. Activation removes older Skyreach cache versions and claims open clients.

The production app registers the worker with `updateViaCache: 'none'`. When an existing controlled page receives a new worker, the app listens for `controllerchange` and reloads once so a newly deployed version replaces stale runtime code promptly.

GitHub Pages deployment runs through `.github/workflows/pages.yml`, which performs `npm ci`, `npm test`, and `npm run build` before packaging and deploying the site.

## Regression coverage

The current Node test suite covers:

- aircraft GLB integrity, orientation, and real `GLTFLoader` parsing
- speedboat GLB integrity, bow orientation, dimensions, and real `GLTFLoader` parsing
- sports-car GLB integrity and paint-material contract
- adaptive audio mix behavior, weather ambience, and bounded gains
- open-ocean boat travel, shoreline blocking, and far-ocean terrain stability
- exploration nearest-objective/bearing/distance helpers
- backward-compatible persistence for eight discoveries plus storage-denial fallback when localStorage access throws
- offshore shore approaches, cove entry, waterfall terrain drop and sea-arch passage/pillars
- bounded waterfall audio gains
- weather continuity/bounds across a full cycle, storm-only lightning, four NPC schedule periods, and intermittent event cadence
- deterministic rocket ascent, atmosphere-density decay, altitude-dependent Earth gravity, invertible render-altitude mapping, and Kármán-line space blending
- launch-site-preserving Earth return/reentry state and Moon-to-Earth cruise corridor
- Kármán render-anchor continuity for both spacecraft position and the atmospheric-to-celestial Earth globe representation
- destructive versus controlled lunar/terrestrial impact semantics
- celestial SAS damping versus inertial SAS-off steering and manual high-warp limiting
- streamed lunar terrain recentering plus 1.62 m/s² lunar walking gravity
- vacuum-specific SLS/alien audio behavior and the optimized 55k-triangle SLS asset envelope

## Current verification status

As of the current full space-remediation build, the repository test suite is **75/75 passing** and the production Vite build succeeds. git diff --check is clean, npm audit reports 0 vulnerabilities, and local serving has returned HTTP 200 for the current build.

Current regression coverage includes real-scale Earth-Moon separation/radius, deterministic celestial integration, Karman-line velocity handoff, streamed lunar terrain, impact/crash thresholds, celestial SAS/manual divergence, manual-warp safety, physical Moon/Earth AUTO NAV interception, vacuum spacecraft audio, the mobile SLS derivative, and both alien GLB assets in addition to the earlier world/vehicle/audio coverage.

The deterministic transfer test verifies a physical Moon intercept rather than a teleport. Headless Termux Chromium is not accepted as visual evidence for the current space build because its EGL/WebGL path fails to initialize; native/mobile visual QA remains a rendered-session concern.

## Next extraction boundaries

Continue extracting only when the boundary is useful and testable:

1. world construction: terrain mesh, water, town, vegetation, lighthouse
2. entities: player, NPCs, vehicle wrappers
3. systems: input, camera, objectives, particles, day/night
4. UI: HUD, minimap, settings

Each extraction should preserve `legacy/skyreach-original.html` as the behavioral reference and be followed by tests, a production build, and an appropriate runtime smoke check.

## Space remediation state

The celestial layer now models explicit landing/crash thresholds, angular inertia with SAS damping, manual-warp safety, fuel/heat presentation, continuous SLS/alien atmospheric handoff, and streamed lunar-local terrain. Earth-only simulation is gated off in deep space/Moon mode. NASA LRO/LOLA Moon maps are shared by the distant Moon and local terrain material path. The runtime SLS uses the 55k-triangle mobile derivative while retaining the original NASA source asset for provenance.

See `SPACE-REMEDIATION.md` for the detailed acceptance record.
