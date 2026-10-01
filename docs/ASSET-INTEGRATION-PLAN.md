# Curated Free Asset Integration Plan

**Implemented September 30, 2026:** see [delivered selection, substitutions, performance and remaining scope](CURATED-ASSETS.md). The plan below records design intent; it is not a claim that every candidate pack or optional motorcycle/NPC upgrade shipped.

## Goal

Enrich Skyreach Isles in one coordinated pass using selected free assets that fit the existing world. Asset packs are source libraries, not content dumps. Only pieces that improve a specific location, interaction, or visual gap are imported.

This document records the September 30 enrichment baseline. That baseline included the sports car/traffic, speedboat, airliner, NASA SLS, offshore islands, weather, NPC schedules, audio, exploration objectives, and the 9-minute-day / 3-minute-night cycle. The later maintained build additionally includes continuous Earth-Moon flight, streamed lunar terrain, NASA LRO/LOLA Moon data, and two user-provided boardable alien spacecraft; those later systems are documented in README.md and docs/ARCHITECTURE.md.

Current asset-rights status, including user-provided models whose third-party redistribution terms are not yet independently confirmed, is tracked in [ASSET-RIGHTS.md](ASSET-RIGHTS.md).

## Public-web licensing rule

Skyreach Isles is published from a public GitHub repository and serves assets directly to browsers. Prefer assets licensed CC0 or otherwise explicitly allowing redistribution in this form.

Primary safe source family:
- Quaternius — CC0, including modification and commercial use without attribution.

Reference-only until deployment rights are unambiguous:
- VenCreations free assets such as Poly Pro Bike and SimplePoly City. Their store license permits use in games but prohibits redistribution or delivery in a form that lets others extract/use the raw assets. A public web build exposes downloaded asset files, so do not commit those raw source assets to this repository without explicit permission or a deployment method that satisfies the license.

## Selected source libraries

### 1. Downtown City MegaKit — Quaternius, CC0
Use selectively for Old Town and the launch-complex service area.

Preferred categories:
- street furniture
- lamps and signs
- curb/sidewalk detail
- rooftop/utility detail
- storefront/facade accents
- small urban structures

Do not rebuild the entire town from the pack. Preserve the current layout and landmark readability.

### 2. Stylized Nature MegaKit — Quaternius, CC0
Use across the home island and offshore islands.

Preferred categories:
- trees chosen per biome
- shrubs and flowers
- rocks/boulders
- grass/detail clusters
- shoreline vegetation

Reuse/instance repeated meshes instead of loading unique objects everywhere.

### 3. Ultimate Animated Animal Pack — Quaternius, CC0
Use a small subset to make exploration feel alive.

Rules:
- choose only species that visually fit each island after pack inventory
- small populations, not crowds
- animation/update throttling at distance
- no animals placed in vehicle routes, dock approaches, launch pad, or sea-arch navigation path

### 4. Ultimate Modular Ruins Pack — Quaternius, CC0
Use primarily at Ember Ruins.

Preferred categories:
- broken arches
- wall fragments
- columns
- stone floor/steps
- small ruin props

These should extend the existing observatory story rather than replace the current silhouette.

### 5. Universal Base Characters + Universal Animation Library — Quaternius, CC0
Second-wave candidate for upgrading scheduled NPC visuals after the environment batch is stable.

Do not introduce this in the same first pass unless mobile frame pacing remains healthy.

## World placement plan

### Old Town / home island
Objective: make the starting area feel inhabited and materially richer without changing its navigation.

Add:
- selected benches, lights, signs, trash/utility objects and rooftop detail
- a small number of storefront/facade accents around the existing road loop
- vegetation pockets where the procedural town currently looks empty
- one designated motorcycle parking/spawn area once a public-web-safe bike asset is secured

Keep:
- existing sports car as the primary car
- existing color-varied traffic
- current roads and landmark positions
- sightlines needed for objectives and vehicle navigation

### Tideglass Cove
Objective: stronger coastal identity.

Add:
- coastal-suitable trees and shrubs
- beach rocks and flowering detail
- sparse animated wildlife selected from the animal pack
- extra jetty-adjacent props only where they do not obstruct boat docking

Keep the inlet fully navigable from open water.

### Ember Ruins
Objective: make this island the strongest exploration landmark.

Add:
- selected modular ruin walls, arches, columns and steps
- weathered rock clusters
- sparse/drier vegetation
- a few discovery-focused visual compositions around the existing observatory approach

Do not fill the island uniformly; preserve open paths and long sea views.

### Veilwater Island
Objective: lush waterfall/forest contrast.

Add:
- denser but instanced plant and tree clusters away from the navigation path
- rocks around the waterfall approach and pool
- one or two appropriate animal types with low population counts

Keep:
- waterfall visibility
- sea-arch passage
- boat-safe shoreline approaches

### NASA Launch Complex
Objective: make the SLS area feel like a real operating site without turning it into a generic city.

Add only:
- barriers, service lights, signs, utility/street pieces and a small amount of hard-surface detail from CC0 urban packs

Keep the official NASA SLS as the focal point. Do not add unrelated sci-fi props.

## Motorcycle plan

The motorcycle should become a real drivable vehicle rather than decoration.

Target gameplay:
- spawn/parking point near Old Town
- separate front/rear wheel transforms
- steering handlebars/front wheel
- lean based on speed and steering
- motorcycle-specific acceleration, braking and turn radius
- engine pitch tied to speed/throttle
- safe dismount/boarding behavior
- mobile controls integrated with the existing vehicle UI

The previously liked VenCreations Poly Pro Bike remains a visual reference, but it is not safe to commit raw into the public web repo under the current redistribution restriction. Before implementation, either obtain explicit public-web permission or substitute a visually comparable CC0 motorcycle.

## Performance budget

The first asset pass should remain deliberately selective.

Targets:
- prefer GLB/glTF for runtime
- convert only selected models, never ship full source packs
- downscale oversized textures to the smallest resolution that survives Pixel 6a play
- reuse materials and texture atlases where possible
- instance repeated vegetation/rocks
- lazy-load or region-load heavier environment groups
- distance-throttle animated wildlife
- keep source archives outside the production/public tree
- measure the built asset footprint before and after integration

The production bundle still has a known non-fatal large-chunk warning. Runtime model data remains external rather than embedded into JavaScript; the later Moon/spacecraft work follows the same rule.

## Implementation order

1. Download/inventory the CC0 source packs outside `public/`.
2. Generate an asset manifest with source, license, selected file, polygon/texture notes and destination.
3. Pick a compact first batch by world role rather than pack membership.
4. Convert/optimize selected models into production GLB files.
5. Add a dedicated environment-assets system with placement data kept out of `game.js`.
6. Integrate Old Town, Tideglass, Ember, Veilwater and launch-complex placements.
7. Add wildlife with bounded active counts and distance-based updates.
8. Add the motorcycle only after a public-web-safe asset is confirmed.
9. Run all Node tests and production build.
10. Perform Pixel-sized visual QA and compare load/frame behavior against the current baseline.
11. Update provenance/docs and publish only after the baseline remains playable.

## First-pass selection philosophy

A good first pass is roughly dozens of well-placed objects from several packs, not hundreds of objects from one pack. Each imported model must answer one of these questions:

- Does it make a location more believable?
- Does it make exploration more rewarding?
- Does it add useful environmental storytelling?
- Does it make the world feel more alive?
- Does it add a new playable interaction?

If not, it stays out of the production build.
