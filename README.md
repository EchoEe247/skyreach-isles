# Skyreach Isles

Skyreach Isles is a mobile-first 3D exploration game built with Three.js. Walk through the island town, drive the car, sail to offshore objectives, fly the plane through sky rings, and light all six beacons.

**Play:** https://echoee247.github.io/skyreach-isles/

The original playable single-file prototype is preserved unchanged at `legacy/skyreach-original.html`. The maintained version uses Vite and local npm dependencies so the project can grow without turning the original HTML into an increasingly fragile monolith.

## Current gameplay

- On-foot exploration with touch joystick, jump, sprint/boost, and drag camera
- Detailed user-supplied sports car for the player and color-varied town traffic
- Detailed speedboat using the existing sailing controls and physics
- Detailed airliner using the existing flight controls and physics
- Six beacon objectives and eight airborne rings
- Procedural island terrain, town, vegetation, lighthouse, traffic, NPCs, particles, weather/lighting ambience, minimap, and day/night cycle
- Progress persistence for beacons, sky rings, hidden Skyshards, and landmark discoveries
- Nearest-objective compass with live distance guidance
- Ten hidden Skyshards; finding all of them unlocks a permanent Tailwind speed bonus
- Five named landmarks with discovery feedback and minimap history
- Stronger objective feedback with screen pulses and supported-device haptics
- Runtime quality selector with an automatic mobile-friendly default
- Installable/offline-capable PWA shell after the first successful load

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

The boat uses `public/assets/boats/speedboat.glb` at its source scale. The source bow points along +X, so the visual is rotated -90° around Y to match Skyreach's +Z vehicle-forward convention. Existing boarding distance, steering, water movement, speed, dock placement, and camera behavior are unchanged. The procedural boat is retained only as a load-failure fallback.

The airplane uses `public/assets/aircraft/airliner.glb` at 30% source scale. Its +Z nose orientation matches Skyreach's existing flight rig, so the established flight controls and physics remain unchanged. The procedural airplane is retained only as a load-failure fallback.

Asset provenance is recorded beside each GLB.

## Repository layout

```text
index.html
src/
  game.js
  style.css
  core/
    math.js
    quality.js
    storage.js
  systems/
    exploration.js
public/
  assets/
    aircraft/
    boats/
    vehicles/
  manifest.webmanifest
  sw.js
tests/
legacy/
  skyreach-original.html
docs/
  ARCHITECTURE.md
```

## Development rule

Preserve the feel and playability of the baseline while improving the internals incrementally. Do not rewrite working systems merely to chase architecture. New subsystems should move out of `game.js` when they have a clear interface and can be verified independently.
