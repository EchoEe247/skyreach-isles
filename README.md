# Skyreach Isles

Skyreach Isles is a mobile-first 3D exploration game built with Three.js. Walk through the island town, drive the car, sail across the open ocean, fly the airliner through sky rings, explore three offshore islands, and light all six beacons.

**Play:** https://echoee247.github.io/skyreach-isles/

The original playable single-file prototype is preserved unchanged at `legacy/skyreach-original.html`. The maintained version uses Vite and local npm dependencies so the project can grow without turning the original HTML into an increasingly fragile monolith.

## Beyond the horizon

- **Tideglass Cove:** a sheltered inlet, pale beaches, palms, a fishing jetty, and a dolphin pod offshore.
- **Ember Ruins:** a stone approach to a broken observatory, fallen columns, and a sea-view summit.
- **Veilwater Island:** a basalt terrace with flowing water, spray, proximity-based waterfall sound, and a sea arch with a navigable middle.

Tap **Explore** (or press **M**) to chart a destination or locate your speedboat. The compass follows your selected course; the minimap follows your position offshore. Clear the course to restore automatic objective guidance. The chart pauses movement and releases held controls.

Ocean detail includes gentle geometric swells, coastline-shaped surf bands, and a persistent foam wake. Offshore terrain now fades beneath the water without exposing square support-mesh seams, and Veilwater's cascade uses terrain-conforming flow, soft mist, and a grounded pool instead of hard rectangular spray.

The day/night cycle is intentionally weighted toward exploration: daylight lasts 9 minutes and night lasts 3 minutes. Night keeps cool moonlight plus ambient/hemisphere fill so terrain, vehicles, and the player remain readable instead of dropping to near-black. Fireflies still appear near land after dark. All additions are locally generated in the existing stylized art direction.

## Living Isles

The world now runs independently of the player instead of remaining mostly static. NPCs follow four day-part schedules, including residents assigned to each offshore island; two ambient ferries travel verified open-water routes; weather transitions through clear, cloudy, rain, storm, and fog states; and intermittent world events can be found and resolved without becoming a permanent quest checklist. Current events include washed-up cargo, a temporary lighthouse outage, and a stranded boat signal.

Weather is coupled to rendering and audio: rain particles, cloud cover/speed, fog distance, ocean roughness, storm dimming/lightning, weather wind, and rain noise all change together. The existing night-visibility floor remains in effect during storms.

See [Living Isles](docs/LIVING-ISLES.md) for the simulation contract and verification notes.

## Current gameplay

- On-foot exploration with touch joystick, jump, sprint/boost, and drag camera
- Detailed user-supplied sports car for the player and color-varied town traffic
- Detailed speedboat using the existing sailing controls and physics, with unrestricted open-ocean travel beyond the island collision field
- Detailed airliner using the existing flight controls and physics
- Six beacon objectives and eight airborne rings
- Ten hidden Skyshards; finding all of them unlocks a permanent Tailwind speed bonus
- Eight named landmarks with discovery feedback and minimap history
- Nearest-objective compass with live distance guidance
- Procedural island terrain, town, vegetation, lighthouse, traffic, scheduled town/island NPCs, ambient ferries, resolvable world events, particles, dynamic weather, minimap, and day/night cycle
- Progress persistence for beacons, sky rings, Skyshards, landmark discoveries, and quality settings
- Stronger objective feedback with screen pulses and supported-device haptics
- Runtime quality selector with an automatic mobile-friendly default
- Adaptive offline WebAudio soundscape: surface-aware footsteps, weather wind and rain, surf, ocean wash, land/town ambience, car engine and road noise, boat engine and wake, airliner engine and jet noise, daytime birds, and nighttime insects
- Installable/offline-capable PWA behavior after the first successful load

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

Asset provenance is recorded beside each GLB.

## World and audio systems

`src/core/world.js` owns terrain-height evaluation plus the explicit boat-navigation contract. The island shoreline remains collidable, while open ocean is intentionally unbounded. Far-ocean terrain depth is capped for stable long-distance queries.

`src/core/living-world.js` defines deterministic weather phases, event cadence, lightning windows, and NPC schedule targets. `src/systems/living-world.js` owns rain rendering, event manifestations, and two ambient ferry routes.\n\n`src/systems/audio.js` owns the adaptive WebAudio mix. Audio starts only after the player's Start gesture to satisfy browser autoplay rules. Mix levels react to movement speed, vehicle type, altitude, coast proximity, town proximity, terrain surface, time of day, rain, and weather wind.

## PWA and update behavior

`public/sw.js` currently uses cache version `skyreach-v10`.

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
    living-world.js
    math.js
    quality.js
    storage.js
    world.js
    archipelago.js
  systems/
    audio.js
    exploration.js
    island-scenery.js
    living-world.js
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
  manifest.webmanifest
  sw.js
tests/
  aircraft-asset.test.mjs
  archipelago.test.mjs
  audio.test.mjs
  living-world.test.mjs
  boat-asset.test.mjs
  exploration.test.mjs
  storage.test.mjs
  vehicle-asset.test.mjs
  world.test.mjs
legacy/
  skyreach-original.html
docs/
  ARCHITECTURE.md
  LIVING-ISLES.md
```

## Development rule

Preserve the feel and playability of the baseline while improving the internals incrementally. Do not rewrite working systems merely to chase architecture. New subsystems should move out of `game.js` when they have a clear interface and can be verified independently.

## World expansion verification

See [verification and boundaries](docs/WORLD-EXPANSION.md) for checks and remaining limitations.