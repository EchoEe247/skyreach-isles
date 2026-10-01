# Skyreach Isles

Skyreach Isles is a mobile-first 3D exploration game built with Three.js. Walk through the island town, drive the car, sail across the open ocean, fly the airliner through sky rings, launch NASA's SLS continuously from Earth to the Moon, explore the lunar surface, fly two alien spacecraft, explore three offshore islands, and light all six beacons.

**Play:** https://echoee247.github.io/skyreach-isles/

The original playable single-file prototype is preserved unchanged at `legacy/skyreach-original.html`. The maintained version uses Vite and local npm dependencies so the project can grow without turning the original HTML into an increasingly fragile monolith.

## Beyond the horizon

- **Tideglass Cove:** a sheltered inlet, pale beaches, palms, a fishing jetty, and a dolphin pod offshore.
- **Ember Ruins:** a stone approach to a broken observatory, fallen columns, and a sea-view summit.
- **Veilwater Island:** a basalt terrace with flowing water, spray, proximity-based waterfall sound, and a sea arch with a navigable middle.

Tap **Explore** (or press **M**) to chart a destination, locate your speedboat, or choose **NASA Launch Complex** for direct map/compass guidance to the SLS launch pad. The compass follows your selected course; the minimap follows your position offshore. Clear the course to restore automatic objective guidance. The chart pauses movement and releases held controls.

Ocean detail includes gentle geometric swells, coastline-shaped surf bands, and a persistent foam wake. Offshore terrain now fades beneath the water without exposing square support-mesh seams, and Veilwater's cascade uses terrain-conforming flow, soft mist, and a grounded pool instead of hard rectangular spray.

The day/night cycle is intentionally weighted toward exploration: daylight lasts 9 minutes and night lasts 3 minutes. Night keeps cool moonlight plus ambient/hemisphere fill so terrain, vehicles, and the player remain readable instead of dropping to near-black. Fireflies still appear near land after dark. The procedural foundation is enriched with a curated CC0 Quaternius model selection in the existing stylized art direction.

## Living Isles

The world now runs independently of the player instead of remaining mostly static. NPCs follow four day-part schedules, including residents assigned to each offshore island; two ambient ferries travel verified open-water routes; weather transitions through clear, cloudy, rain, storm, and fog states; and intermittent world events can be found and resolved without becoming a permanent quest checklist. Current events include washed-up cargo, a temporary lighthouse outage, and a stranded boat signal.

Weather is coupled to rendering and audio: rain particles, cloud cover/speed, fog distance, ocean roughness, storm dimming/lightning, weather wind, and rain noise all change together. The existing night-visibility floor remains in effect during storms.

See [Living Isles](docs/LIVING-ISLES.md) for the simulation contract and verification notes.

The [curated CC0 asset pass](docs/CURATED-ASSETS.md) adds 25 selected models: planted island biomes, Ember's ruined courts and entrance arch, town street furniture, launch-service details, and six animated animals across three species. Regions load on approach; repeated scenery is instanced and faraway animal animation stops. The motorcycle remains deferred pending a suitable public-web-safe model.

## Current gameplay

- On-foot exploration with touch joystick, jump, sprint/boost, and drag camera
- Detailed user-supplied sports car for the player and color-varied town traffic
- Detailed speedboat using the existing sailing controls and physics, with unrestricted open-ocean travel beyond the island collision field
- Detailed airliner using the existing flight controls and physics
- Official NASA Space Launch System (SLS) Block 1 model on a launch pad, with continuous player-controlled ascent from the surface through the atmosphere, across the 100 km Karman line, through interbody space, and down to the Moon
- Six beacon objectives and eight airborne rings
- Ten hidden Skyshards; finding all of them unlocks a permanent Tailwind speed bonus
- Eight named landmarks with discovery feedback and minimap history
- Nearest-objective compass with live distance guidance
- Procedural island terrain, town, vegetation, lighthouse, traffic, scheduled town/island NPCs, ambient ferries, resolvable world events, particles, dynamic weather, minimap, and day/night cycle
- Progress persistence for beacons, sky rings, Skyshards, landmark discoveries, and quality settings
- Stronger objective feedback with screen pulses and supported-device haptics
- Runtime quality selector with an automatic mobile-friendly default
- Real-scale Earth-Moon celestial navigation with target selection, physical cruise guidance, and proximity-limited 1x/10x/50x/100x/400x simulation-time acceleration
- Explorable low-gravity lunar terrain with a landing site, crater field, rocks, and two boardable alien spacecraft: Alien Scout and Alien Strike Ship
- Adaptive offline WebAudio soundscape: surface-aware footsteps, weather wind and rain, surf, ocean wash, land/town ambience, car engine and road noise, boat engine and wake, airliner engine and jet noise, daytime birds, and nighttime insects
- Installable PWA behavior with offline fallback for the app shell and assets already cached by prior successful loads

## Run locally

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Regression tests:

```bash
npm test
```

Production build:

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

## Vehicle assets

The player car and four town traffic cars use `public/assets/vehicles/sports_car.glb`. Only the named `paint` material is recolored per vehicle, preserving the model's glass, lights, trim, wheels, brakes, and interior materials. The original procedural car remains as a load-failure fallback.

The boat uses `public/assets/boats/speedboat.glb` at its source scale. The source bow points along +X, so the visual is rotated -90° around Y to match Skyreach's +Z vehicle-forward convention. Existing boarding distance, steering, water movement, speed, dock placement, and camera behavior are unchanged. Shorelines of the home island and three offshore islands are collidable, as are the sea-arch pillars. Open ocean has no artificial coordinate boundary. The procedural boat is retained only as a load-failure fallback.

The airplane uses `public/assets/aircraft/airliner.glb` at 30% source scale. Its +Z nose orientation matches Skyreach's existing flight rig, so the established flight controls and physics remain unchanged. The procedural airplane is retained only as a load-failure fallback.

The rocket uses NASA's official `Space Launch System (SLS) Block 1.stl` at `public/assets/space/nasa-sls-block1.stl`. Skyreach normalizes orientation/scale, removes only the STL's large printable display plinth so it does not fly with the vehicle, and applies the recognizable orange-core/white-booster presentation in Three.js. A procedural SLS-shaped fallback remains available only if the STL fails to load. `public/assets/space/nasa-blue-marble-2048.png` provides the NASA Earth texture used for the high-altitude view. Provenance metadata is stored beside both NASA assets.

### Atmospheric ascent and Karman-line handoff

`src/core/spaceflight.js` owns the deterministic rocket-flight model. Atmosphere density decays continuously with altitude, gravity follows the inverse-square Earth-radius relationship, aerodynamic drag falls away with atmospheric density, and thrust/steering continue without switching scenes. The game maps physical altitude into a compressed render coordinate so a mobile WebGL scene can represent tens to hundreds of kilometers without destroying near-surface precision.

The mobile flight HUD separates speed, altitude, and atmospheric region so objective guidance no longer overlaps telemetry. Rocket throttle is adjustable from 20–100% before/while holding THRUST, and SAS can be toggled: SAS damps rotation and adds a gentle gravity-turn assist, while SAS OFF preserves pitch/yaw inertia for manual flight. Horizontal velocity keeps its own travel heading in space instead of snapping instantly to the rocket nose. Crossing the 100 km Kármán line does not load another level or teleport the vehicle: the same SLS object, camera, controls, velocity state, sky, stars, and Earth representation continue in the same simulation.

Asset provenance is recorded beside each detailed vehicle/space asset, including the two user-provided lunar alien craft.

## Continuous Earth-to-Moon flight

Skyreach now extends the existing no-cut SLS ascent into a physical Earth-Moon simulation. At the Karman-line handoff the rocket keeps its velocity and attitude, while `src/core/celestial.js` begins full 3D position/velocity integration in meters. Earth and Moon gravity are applied continuously, the Moon uses its real approximate 384,400 km separation and 1,737.4 km radius, and camera-relative logarithmic rendering keeps those distances stable on mobile without teleporting the craft.

The spacecraft HUD adds **TARGET**, **CRUISE**, and **TIME** controls. Cruise is guidance, not a scene skip: it physically accelerates and brakes along the current trajectory. Time acceleration cycles 1x/10x/50x/100x/400x and automatically collapses near either world. The Moon grows from a distant globe into a streamed local crater field and landing pad. The final lunar descent returns to manual control at low approach speed.

Two user-supplied alien craft are parked at the lunar site: `alien_spaceship.glb` as **Alien Scout** and `alien_ship.glb` as **Alien Strike Ship**. Both are boardable spacecraft using the same interbody simulation. The Strike Ship's 119 source meshes are merged by material at load time to reduce mobile draw-call pressure; missing normals are generated in memory without modifying the original GLB. The SLS STL and NASA Earth texture are deferred until the rocket is used, and the alien GLBs are deferred until Moon travel/boarding makes them relevant, reducing initial network and main-thread work.

Earth return is bidirectional for the SLS: TARGET EARTH + CRUISE guides back to the original launch-site corridor, then hands the rocket continuously back to the atmospheric model near 10 km altitude for manual braking/descent and normal ground exit. Moon walking is bounded to the rendered local terrain patch so the player cannot walk onto invisible collision ground.

## World and audio systems

`src/core/world.js` owns terrain-height evaluation plus the explicit boat-navigation contract. The island shoreline remains collidable, while open ocean is intentionally unbounded. Far-ocean terrain depth is capped for stable long-distance queries.

`src/core/living-world.js` defines deterministic weather phases, event cadence, lightning windows, and NPC schedule targets. `src/systems/living-world.js` owns rain rendering, event manifestations, and two ambient ferry routes.

`src/systems/audio.js` owns the adaptive WebAudio mix. Audio starts only after the player's Start gesture to satisfy browser autoplay rules. Mix levels react to movement speed, vehicle type, altitude, coast proximity, town proximity, terrain surface, time of day, rain, and weather wind.

## Current verification

Current master verification after the Claude-audit repair pass:

- **60/60 Node tests pass**.
- npm run build passes. The game-owned JS is split to ~97 KB while Three.js is isolated in a cacheable vendor chunk; Vite still reports the known non-fatal >500 kB warning for the Three.js chunk.
- git diff --check passes.
- npm audit reports 0 vulnerabilities.
- Local development serving returns HTTP 200.
- Deterministic transfer coverage verifies that Moon cruise physically intercepts the lunar landing corridor without teleporting.
- The current transfer profile reaches the final guided corridor at roughly 899 m lunar altitude and about 8.1 m/s before manual landing control.
- Headless Termux Chromium cannot provide trustworthy Three.js visual acceptance because EGL/WebGL initialization fails in that environment. This is a QA-environment limitation, not evidence of a rendered pass.
- Native/mobile visual feel and frame pacing should be judged in the actual playable browser session.

## PWA and update behavior

`public/sw.js` currently uses cache version `skyreach-v13`.

- Navigation requests are network-first, with cached fallback.
- `.glb` vehicle/aircraft/boat assets are network-first, with cached fallback.
- Other same-origin assets are cache-first and are populated on successful fetch.
- Old cache versions are deleted on activation.
- The production app registers the service worker with `updateViaCache: 'none'` and reloads once when a new worker takes control.

This keeps repeat loads/offline fallback useful while reducing stale deployed HTML and model assets.

## Repository layout

```text
.github/
  workflows/
    pages.yml
index.html
package.json
package-lock.json
vite.config.js
src/
  game.js
  style.css
  atlas.css
  core/
    daylight.js
    environment-layout.js
    living-world.js
    math.js
    quality.js
    storage.js
    world.js
    spaceflight.js
    celestial.js
    archipelago.js
  systems/
    audio.js
    exploration.js
    island-scenery.js
    living-world.js
    moon.js
    environment-assets.js
    atlas.js
public/
  assets/
    aircraft/
      airliner.glb
      airliner.provenance.json
    boats/
      speedboat.glb
      speedboat.provenance.json
    vehicles/
      sports_car.glb
      sports_car.provenance.json
    animals/
      Deer.glb
      Fox.glb
      ShibaInu.glb
    environment/
      manifest.json
      QUATERNIUS-LICENSE.txt
      nature/
      ruins/
      textures/
      urban/
    space/
      nasa-sls-block1.stl
      nasa-blue-marble-2048.png
      provenance.json
      alien/
        alien_spaceship.glb
        alien_ship.glb
        provenance.json
      earth-provenance.json
  manifest.webmanifest
  sw.js
  icons/
    icon-192.png
    icon-512.png
tests/
  aircraft-asset.test.mjs
  alien-assets.test.mjs
  archipelago.test.mjs
  audio.test.mjs
  boat-asset.test.mjs
  celestial.test.mjs
  daylight.test.mjs
  environment-assets.test.mjs
  exploration.test.mjs
  living-world.test.mjs
  spaceflight.test.mjs
  storage.test.mjs
  vehicle-asset.test.mjs
  world.test.mjs
legacy/
  skyreach-original.html
docs/
  ARCHITECTURE.md
  ASSET-INTEGRATION-PLAN.md
  ASSET-RIGHTS.md
  CURATED-ASSETS.md
  LIVING-ISLES.md
  WORLD-EXPANSION.md
```

## Development rule

Preserve the feel and playability of the baseline while improving the internals incrementally. Do not rewrite working systems merely to chase architecture. New subsystems should move out of `game.js` when they have a clear interface and can be verified independently.

## Asset/licensing status

See [Asset rights status](docs/ASSET-RIGHTS.md) for documented sources and the user-provided models whose third-party redistribution rights still require confirmation.

## World expansion verification

See [verification and boundaries](docs/WORLD-EXPANSION.md) for checks and remaining limitations.
