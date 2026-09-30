# Skyreach Isles

Skyreach Isles is a mobile-first 3D exploration game built with Three.js. Walk through the island town, drive the car, sail to offshore objectives, fly the plane through sky rings, and light all six beacons.

**Play:** https://echoee247.github.io/skyreach-isles/

The original playable single-file prototype is preserved unchanged at `legacy/skyreach-original.html`. The maintained version uses Vite and local npm dependencies so the project can grow without turning the original HTML into an increasingly fragile monolith.

## Current gameplay

- On-foot exploration with touch joystick, jump, sprint/boost, and drag camera
- Driveable car, sailboat, and airplane
- Six beacon objectives and eight airborne rings
- Procedural island terrain, town, vegetation, lighthouse, traffic, NPCs, particles, weather/lighting ambience, minimap, and day/night cycle
- Progress persistence for completed beacons and rings
- Runtime quality selector with an automatic mobile-friendly default
- Installable/offline-capable PWA shell after the first successful load

## Run locally

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Production build:

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

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
public/
  manifest.webmanifest
  sw.js
legacy/
  skyreach-original.html
docs/
  ARCHITECTURE.md
```

## Development rule

Preserve the feel and playability of the baseline while improving the internals incrementally. Do not rewrite working systems merely to chase architecture. New subsystems should move out of `game.js` when they have a clear interface and can be verified independently.