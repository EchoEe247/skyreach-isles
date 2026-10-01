# Curated asset pass — September 30, 2026

Skyreach's original terrain, vehicles, objectives, weather, sound, and 9/3-minute day/night cycle remain the foundation.

## Delivered
- **Old Town:** benches, hydrants, streetlights, a sign, supply crate and planted transition pockets. Existing building footprints and the parked sports car filter nearby decoration.
- **Tideglass:** twisted coastal trees, flowering shrubs, beach rocks and a small resting/supply area. The eastern inlet and fishing jetty remain clear.
- **Ember:** a southern entry arch, eastern settlement court, western broken court, and low summit fragments framing the existing observatory. Arches have separate pillar collisions; walls have simple collision strips, leaving their openings passable.
- **Veilwater:** layered trees, ferns, shrubs and grasses around the waterfall and cliff transitions. The cascade corridor, southern path and offshore sea arch remain open.
- **NASA launch complex:** service lights, barriers, cones, pallet/crate and pipe supplies outside the rocket footprint.
- **Animals:** six individuals, three animated species: two Shiba Inu dogs near settlements, two deer in Veilwater, and two foxes across Veilwater/Ember. Existing dolphins remain.

## Asset selection and licensing
25 selected Quaternius models are shipped, all CC0-1.0. The authoritative file list, source URLs, mirror commit hashes, output hashes, texture dependencies and conversion notes are in `public/assets/environment/manifest.json`. The author-supplied license text is beside it.

Sources:
- [Stylized Nature MegaKit](https://quaternius.com/packs/stylizednaturemegakit.html): seven trees/plants/rock models.
- [Zombie Apocalypse Kit](https://quaternius.com/packs/zombieapocalypsekit.html): seven ordinary street/service props, with no zombie-themed content.
- [Fantasy Props MegaKit](https://quaternius.com/packs/fantasypropsmegakit.html): bench and wooden crate.
- [Modular Dungeon](https://quaternius.com/packs/medievaldungeon.html): six stone arch, column, broken-column, wall and rubble models.
- [Ultimate Animated Animals](https://quaternius.com/packs/ultimateanimatedanimals.html): Shiba Inu, deer and fox.

The Ultimate Modular Ruins Google Drive distribution returned a quota-exceeded page. Selected CC0 Quaternius Modular Dungeon pieces were used instead, with their mirrored author license checked. No VenCreations files were imported. Downtown MegaKit was substituted with the smaller ordinary street-prop selection above.

Source downloads and conversion staging stay outside the repository and production directory. No full pack or source archive ships. FBX masonry was converted to GLB and given a consistent rough stone material. Other models were packed from glTF into GLB, textures capped at 512 px, and identical textures extracted into shared PNG files. The added runtime payload is approximately **10.61 MiB**, including three animated animal assets.

## Loading and performance
`src/core/environment-layout.js` contains curated placements. `src/systems/environment-assets.js` caches model loads, instances static meshes by model/region, adds lightweight substantial-object collisions, and manages animals.

The game starts immediately. Regions begin loading within 350 units of their radius, and hide beyond 450 units outside it. Distant islands are not downloaded at startup. High-altitude flight hides enrichment. Existing procedural scenery remains if an optional asset fails.

Static models share geometry/materials through instancing and add no dynamic shadow maps. Animals share cached source geometry and use independent skeletons and existing Idle/Eating/Walk clips. Animation updates run at up to 30 Hz nearby, about 6.7 Hz farther away, and stop outside 140 units or when the region is hidden. Routes are small deterministic local loops; these are ambient animals, not blocking gameplay agents.

## Deferred
The motorcycle remains deferred: no suitable modern sporty model with quickly verifiable public-web redistribution rights was obtained. NPC visual replacement is also deferred. Neither is represented as completed.

## Verification for this September 30 asset pass
- At completion of this asset pass, the Node suite was **47/47 passing**, including the then-44 baseline tests and new provenance/dependency, selection, and navigation-clearance checks.
- Production build: passed; existing non-fatal chunk-size warning remains.
- Runtime state checks: all five enrichment regions loaded with no asset failures; 162 static placements and six animals registered. Animals advanced retained animation clips, and distant animals stopped updating. Boat, plane and rocket model states were ready.
- Mobile viewport: 412 × 850, document width 412, HUD contained in viewport.
- Visual sign-off for this isolated asset-pass capture was **not established**: the isolated Termux Chromium software-GPU process repeatedly lost its WebGL context; DOM screenshots were blank behind the HUD. A second rendering backend stalled during pixel readback. These captures are not visual acceptance evidence. No native Android GPU performance claim is made.
- Existing navigation, weather/daylight/audio and deterministic rocket tests passed. Full manual vehicle and spaceflight playtesting was not repeated during this pass.

These bullets are historical evidence for the curated-asset pass, not the current repository-wide verification count.

## Current repository status

The maintained build now also includes continuous Earth-Moon flight, streamed lunar terrain, and two boardable user-provided alien spacecraft. The current repository suite is **75/75 passing**, the production build succeeds, and the current cache version is skyreach-v17. Headless Termux Chromium still cannot be treated as current visual acceptance evidence because EGL/WebGL initialization is unavailable there; use the actual playable browser session for native/mobile visual and frame-pacing judgment.
