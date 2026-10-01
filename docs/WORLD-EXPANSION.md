# Beyond the horizon — September 30, 2026

Angel's priority was believable world detail and exploration. Timed challenges were not implemented.

## Play

Open Explore, choose an offshore island, and follow the compass. Find my speedboat tracks its current location. Land at a beach, exit, and explore on foot. Existing objectives, vehicles, audio and saved progress remain supported.

New destinations: Tideglass Cove (720, 350), Ember Ruins (470, -670), Veilwater Island (-650, 420). Coordinates are world x/z.

## Verification at the time of the world-expansion release

- The suite at that point contained 36 passing Node tests. Coverage includes actual GLTF parsing, existing boat navigation, offshore shore approaches, cove entry, sea-arch collision, radial seafloor continuity, rendered-terrain height interpolation, daylight/night timing and lighting continuity, living-world weather/events/NPC schedules, waterfall terrain drop/audio bounds, and eight-slot discovery persistence.
- Production Vite build succeeds. The existing large-bundle warning remains.
- Isolated Chromium on the Pixel/Termux host rendered the cove, observatory ruins and Veilwater cascade. These views were visually inspected.
- Browser inspection confirmed boat and aircraft model states were ready.
- Browser simulation registered all three offshore discoveries.
- At a 412 × 850 viewport the chart had no horizontal overflow.
- Chart opening, course selection, closing and movement pause/resume were exercised.
- Browser keyboard input moved the player on Tideglass terrain; the selected Tideglass course reached HUD state.
- No JavaScript errors were captured during that chart/movement sequence.
- The updated cycle is deterministic at 9 minutes of daylight and 3 minutes of night. Midnight retains ambient, hemisphere, moonlight, and water-lightness floors for gameplay visibility.
- Offshore terrain now fades radially below the waterline and gameplay ground queries interpolate the same mesh triangles that are rendered, removing the square seafloor/support-boundary artifacts seen from above.
- Veilwater's cascade was rebuilt as a denser terrain-conforming ribbon with irregular alpha, circular soft mist particles, and a terrain-conforming shallow pool.

## Performance and boundaries

This remains a stylized procedural game. The update adds environmental detail and explorable places, not photorealistic rendering. Dolphin movement is ambient animation. Water is visual animation; this is not a fluid, tide or current simulation.

Palms, rocks and stepping stones are instanced. Wakes use a fixed 64-instance pool. Forest bounds allow culling. Each new island mesh has 76 × 76 subdivisions; water has 100 × 100.

Verification used software-rendered Chromium in a separate Xvfb display, with no Android Display 0 actions. It verifies rendering and interactions, not native Android GPU performance. Native Chrome frame pacing and the subjective audio mix still need player feedback.

The bullets above are historical evidence for the world-expansion release, not the current repository-wide test count. The maintained build now has **57/57 passing tests** and additionally includes continuous Earth-Moon flight, lunar terrain, and two boardable alien spacecraft. Current verification and spaceflight architecture are documented in README.md and docs/ARCHITECTURE.md.

The original expansion used repository-authored terrain, scenery and shaders. The subsequent [curated CC0 asset pass](CURATED-ASSETS.md) adds selected imported scenery and animals. Existing user-provided vehicle assets and their provenance are unchanged.
## Curated enrichment

See [Curated assets](CURATED-ASSETS.md) for the subsequent planted biomes, Ember ruined courts, urban/launch detail, curated wildlife and source provenance. Terrain height, island coordinates, inlet and sea-arch navigation contracts are unchanged.
