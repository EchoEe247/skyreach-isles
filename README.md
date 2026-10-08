# Skyreach Isles

Skyreach Isles is a mobile-first 3D exploration game built with Three.js. Walk through the island town as Nightweaver, drive the cars, visit and fly from the integrated LAX airport, sail across the open ocean, pilot a diving submarine, launch NASA's SLS continuously from Earth to the Moon, inspect the James Webb Space Telescope from a dedicated deep-space view, explore the lunar surface, fly two alien spacecraft, explore five offshore regions, including the South Padre Island + Port Isabel region and Nexus Isle, and light all six beacons.

**Play:** https://echoee247.github.io/skyreach-isles/

The original playable single-file prototype is preserved unchanged at `legacy/skyreach-original.html`. The maintained version uses Vite and local npm dependencies so the project can grow without turning the original HTML into an increasingly fragile monolith.

## Beyond the horizon

- **Tideglass Cove:** a sheltered inlet, pale beaches, palms, a fishing jetty, and a dolphin pod offshore.
- **Ember Ruins:** a stone approach to a broken observatory, fallen columns, and a sea-view summit.
- **Veilwater Island:** a basalt terrace with flowing water, spray, proximity-based waterfall sound, and a sea arch with a navigable middle.
- **Nexus Isle:** a large offshore island split into two dedicated playable districts: Velocity District and Breaker City.
- **Port Isabel + South Padre Island:** a recognizable mainland town and lighthouse connect by a continuous, drivable Queen Isabella Memorial Causeway to Padre Boulevard, south-city blocks, and a quieter northern shore.
- **Triple Forge expansion:** Skyhold is a landable floating palace above the home-island airspace; Grovekeep is a climbable titan-tree fortress on a new offshore platform; Arachne guards its outer arena as a persistent boss encounter; and Steelhound can be recruited as a follow/stay companion that assists against Arachne.

Tap **Explore** (or press **M**) to chart a destination, locate your airplane, speedboat, submarine, or any of the ten named DAY FORGE vehicles, choose **Multiverse Nexus**, **LAX International Airport**, **NASA Launch Complex**, **Port Isabel · Causeway Start**, or **South Padre Island** for direct map/compass guidance. The compass follows your selected course; the minimap follows your position offshore. Clear the course to restore automatic objective guidance. The chart pauses movement and releases held controls.

South Padre now uses the user-supplied **`South_Padre_Island_Texas.glb`** as the authoritative detailed region visual. The source GLB is already meter-scale (causeway asphalt PCA length **3,813.76 m**; asphalt width about **17.5–18.5 m**, concrete about **19.1–20.15 m**), so the island, causeway and Port Isabel geometry use **1.50 world units per source meter**, a human-relative scale based on Nightweaver's 2.8-unit visual height representing an approximately 1.85–1.9 m adult. This makes South Padre/Port Isabel and its dedicated sports car read at appropriate player/road proportions without resizing Nightweaver. The source lighthouse top (~25.83 m) receives a **Y-only 21.95/25.83 correction** to match the Texas Historical Commission's **72 ft (21.95 m)** reference; bridge vertical scale uses a separate **23.8/26.43 correction**, preserving the asphalt/concrete width and X/Z shape. WJE's Queen Isabella Memorial Causeway reference is **2.4 miles long, 68 ft wide, with a 78 ft deck above mean high tide**; gameplay collision tracks the elevated route at **35.7 world units** (=23.8 real meters × 1.5). The full-scale region is offset east so Port Isabel does not overlap the original Skyreach island; its internal source geometry, bridge alignment, and continuous road relationship remain unchanged. A dedicated sports car remains parked at a clear Port Isabel start spot, with Explore guidance pointing directly to it; the drive continues Port Isabel → causeway → South Padre/Padre Boulevard without a scene cut. SPI keeps its local visibility out to 18,000 world units, but clear-weather atmospheric haze now starts much farther away (12,000 → 79,000 world units) so the coast, bridge and skyline stay crisp instead of washing into a gray veil; real cloudy/rainy weather can still pull haze inward to roughly 350 → 6,500. The uploaded vertex-colour terrain also receives a subtle warm sand multiplier so neutral terrain reads coastal rather than concrete-gray. Instanced low-rise/palm game-context dressing is illustrative, not survey-accurate geometry. Skyreach's animated ocean replaces duplicate GLB water, and vegetation/jetties remain quality-gated (restored on High).

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
- Surface swimming: exit a boat into open water, swim with the normal movement controls, use **Stroke** for a faster burst, and board nearby boats directly from the water
- Playable user-supplied Abyss submarine with separate Boost, Dive, and Surface controls, live depth telemetry, seabed-aware movement, underwater camera support, and a live Explore-map locator
- Detailed airliner relocated to the integrated four-runway **LAX International Airport**, with runway-ready spawn placement and a live Explore-map locator
- Ten playable DAY FORGE ships, aircraft, and a monster truck integrated on the home island; each has a named live Explore locator. See [DAY FORGE Fleet](docs/DAY-FORGE-FLEET.md).
- Four selected Triple Forge assets integrated as gameplay rather than scenery: aircraft can land on Skyhold, Grovekeep exposes model-surface vertical traversal, Arachne has a persistent reactor-health encounter, and Steelhound has persistent Follow/Stay behavior plus boss assist. The imported static meshes are lazy-loaded/batched and their glTF emissive semantics are normalized for standards-compliant loading.
- User-supplied **Nightweaver LOD0** replaces the procedural player visual; its 104 source meshes are batched by material at runtime while preserving embedded textures
- Dedicated **JWST VIEW** button loads the user-supplied James Webb Space Telescope on demand and opens an orbitable deep-space observatory view with Earth, Moon, stars, and Sun context
- Official NASA Space Launch System (SLS) Block 1 model on a launch pad, with continuous player-controlled ascent from the surface through the atmosphere, across the 100 km Karman line, through interbody space, and down to the Moon
- Six beacon objectives and eight airborne rings
- Ten hidden Skyshards; finding all of them unlocks a permanent Tailwind speed bonus
- Nine named landmarks with discovery feedback and minimap history
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

The boat uses `public/assets/boats/speedboat.glb` at its source scale. The source bow points along +X, so the visual is rotated -90° around Y to match Skyreach's +Z vehicle-forward convention. Existing boarding distance, steering, water movement, speed, dock placement, and camera behavior are unchanged. Shorelines of the home island and four offshore islands are collidable, as are the sea-arch pillars. Open ocean has no artificial coordinate boundary. The procedural boat is retained only as a load-failure fallback.

The submarine uses the user-supplied `public/assets/vehicles/submarine.glb`, normalized at runtime to the game's vehicle scale. It starts offshore in water deep enough to move immediately while remaining reachable from the home island. The left stick handles forward/reverse and steering, **Boost** increases propulsion, **Dive** descends, and **Surface** rises. The depth limiter follows the local seafloor and blocks forward movement before the hull would intersect terrain. Explore includes a live **Find my submarine** course and chart marker. A lightweight procedural submarine remains only as a model-load fallback.

The airplane uses `public/assets/aircraft/airliner.glb` at 30% source scale. Its +Z nose orientation matches Skyreach's existing flight rig, so the established flight controls and physics remain unchanged. The procedural airplane is retained only as a load-failure fallback.

The rocket uses NASA's official `Space Launch System (SLS) Block 1.stl` at `public/assets/space/nasa-sls-block1.stl`. Skyreach normalizes orientation/scale, removes only the STL's large printable display plinth so it does not fly with the vehicle, and applies the recognizable orange-core/white-booster presentation in Three.js. A procedural SLS-shaped fallback remains available only if the STL fails to load. `public/assets/space/nasa-blue-marble-2048.png` provides the NASA Earth texture used for the high-altitude view. Provenance metadata is stored beside both NASA assets.

### Atmospheric ascent and Karman-line handoff

`src/core/spaceflight.js` owns the deterministic rocket-flight model. Atmosphere density decays continuously with altitude, gravity follows the inverse-square Earth-radius relationship, aerodynamic drag falls away with atmospheric density, and thrust/steering continue without switching scenes. The game maps physical altitude into a compressed render coordinate so a mobile WebGL scene can represent tens to hundreds of kilometers without destroying near-surface precision.

The mobile flight HUD separates speed, altitude, and atmospheric region so objective guidance no longer overlaps telemetry. Rocket throttle is adjustable from 20–100% before/while holding THRUST, and SAS can be toggled: SAS damps rotation and adds a gentle gravity-turn assist, while SAS OFF preserves pitch/yaw inertia for manual flight. Horizontal velocity keeps its own travel heading in space instead of snapping instantly to the rocket nose. Crossing the 100 km Kármán line does not load another level or teleport the vehicle: the same SLS object, camera, controls, velocity state, sky, stars, and Earth representation continue in the same simulation. The render anchor is also preserved across the handoff, preventing an X/Z snap toward world origin on the first celestial frame.

Asset provenance is recorded beside each detailed vehicle/space asset, including the two user-provided lunar alien craft.

## Multiverse Nexus

Nexus Isle now focuses entirely on **two physically separated, larger districts**. The former platforming replica has been removed from the project rather than hidden.

- **Velocity District / Volt Runner:** occupies the west side of Nexus Isle as a 24-gate ordered time-trial course. It has a wider terrain-following checker track, five boost pads, four off-line checkpoints, three springs, three spike hazards, Spin Dash, a rideable vertical full loop, stronger realm-specific speed, live timing, best-time tracking, and S/A/B/C finish ranks.
- **Breaker City / Brick Titan:** occupies the east side as a larger street-grid demolition arena with **12 multi-hit towers** and **6 patrolling security guards**. Towers take two or three punches, targets stay physically solid until destroyed, debris bursts on impact, guards can break combos, and rapid hits multiply the score.

The central Nexus is now a simple fork/return plaza between those two destinations rather than a three-world cluster. The two in-world entrances are more than 120 world units apart, each district has its own scenery, signage and return pad, and **MULTIVERSE** still provides fast access while the island remains physically reachable by normal exploration.
## LAX, Nightweaver, and JWST

The main island now contains a compressed but complete LAX airport footprint in its southeast quadrant. `src/core/world.js` owns the airport-site contract and blends the natural terrain into a flat 10-unit airport plateau with a softened perimeter. The supplied `lax_airport.glb` is 150×110 source units and is rendered at 1.25× scale, fitting inside that flattened zone. Airport buildings contribute lightweight collision circles, runway/apron lights are instanced, and procedural trees/rocks are excluded from the airport footprint.

The existing player airliner is relocated to Runway 24R and keeps the established aircraft physics. **Explore** now exposes both **LAX International Airport** and **Find my airplane**, so the aircraft remains discoverable after the player lands elsewhere.

The player visual is now `public/assets/characters/nightweaver_LOD0.glb`. The source contains 104 meshes, roughly 166k triangles, six materials, and embedded textures. It is normalized to **2.8 world units tall**, slightly taller than the procedural NPC range, while retaining the existing player collision radius and camera behavior. Because the supplied asset has no skeletal animation clips, Skyreach builds a lightweight procedural articulation rig from Claude's semantic limb meshes. Shoulders, elbows, hips, and knees now animate in an alternating walk/run gait with torso counter-rotation, smooth idle return, and subtle cape response; high-detail paired armor overlays are spatially split into the same limb groups so the detailed appearance moves with the body.

`public/assets/space/jwst.glb` is deferred until **JWST VIEW** is actually opened, so normal ascent no longer pays the model parse/merge cost. JWST VIEW switches to an orbit camera around the observatory, adds a denser deep-space star field, and keeps Earth and Moon visible through the game's compressed celestial rendering rather than loading a separate scene. Returning from the view restores the existing player/vehicle state.

## Continuous Earth-to-Moon flight

Skyreach now extends the existing no-cut SLS ascent into a physical Earth-Moon simulation. At the Karman-line handoff the rocket keeps its velocity and attitude, while `src/core/celestial.js` begins full 3D position/velocity integration in meters. Earth and Moon gravity are applied continuously, the Moon uses its real approximate 384,400 km separation and 1,737.4 km radius, and camera-relative logarithmic rendering keeps those distances stable on mobile without teleporting the craft.

The spacecraft HUD adds **TARGET**, **AUTO NAV**, and **TIME** controls. The launch HUD uses a five-column telemetry row so speed, altitude, fuel, heat, and target state do not overlap the navigation strip. A cyan target locator appears from high ascent onward: when the Moon/Earth target is off-screen it pins to the screen edge with a pointer; when visible it sits over the target. The navigation strip also reports live yaw and pitch error. AUTO NAV is a complete autonomous trip mode: from the Earth pad it commands liftoff without holding THRUST, continues through Kármán, steers/thrusts/brakes with gravity compensation, and turns itself off only after confirmed Moon/Earth touchdown. Earth return uses an ALIGN → DESCEND sequence over the saved landing site. AUTO NAV is guidance, not a scene skip: it physically accelerates and brakes along the current trajectory. Time acceleration cycles 1x/10x/50x/100x/400x and automatically collapses near either world. The Moon grows from a distant globe into a streamed local crater field and landing pad. The final lunar descent returns to manual control at low approach speed.

Two user-supplied alien craft are parked at the lunar site: `alien_spaceship.glb` as **Alien Scout** and `alien_ship.glb` as **Alien Strike Ship**. Both are boardable spacecraft using the same interbody simulation. The Strike Ship's 119 source meshes are merged by material at load time to reduce mobile draw-call pressure; missing normals are generated in memory without modifying the original GLB. The SLS STL and NASA Earth texture are deferred until the rocket is used, and the alien GLBs are deferred until Moon travel/boarding makes them relevant, reducing initial network and main-thread work.

Earth return is bidirectional for every spacecraft. TARGET EARTH + AUTO NAV guides toward the original Earth return corridor; the SLS can hand continuously back to the atmospheric model as high as 85 km inside its reentry envelope, while alien craft use their own lower-speed atmospheric handoff. Ground contact now distinguishes controlled landing from destructive impact. Lunar terrain recenters deterministically around off-site landings and walking, so Moon exploration is no longer confined to a fixed local patch.

## World and audio systems

`src/core/world.js` owns terrain-height evaluation plus the explicit boat-navigation contract. The island shoreline remains collidable, while open ocean is intentionally unbounded. Far-ocean terrain depth is capped for stable long-distance queries.

`src/core/living-world.js` defines deterministic weather phases, event cadence, lightning windows, and NPC schedule targets. `src/systems/living-world.js` owns rain rendering, event manifestations, and two ambient ferry routes.

`src/systems/audio.js` owns the adaptive WebAudio mix. Audio starts only after the player's Start gesture to satisfy browser autoplay rules. Mix levels react to movement speed, vehicle type, altitude, coast proximity, town proximity, terrain surface, time of day, rain, and weather wind.

## Space-stack remediation

The SLS/Moon/alien-spacecraft stack received a dedicated correctness and mobile-performance remediation. It now includes real crash thresholds, celestial SAS/manual inertia, safe manual time acceleration, continuous alien Earth reentry, streamed arbitrary lunar landing terrain, physical 1.62 m/s² lunar walking gravity, NASA LRO/LOLA Moon data, dedicated vacuum spacecraft audio, deep-space suspension of Earth-only simulation, fuel/heat state, staged SLS plume behavior, and a 55k-triangle mobile SLS derivative. See [Space Stack Remediation](docs/SPACE-REMEDIATION.md).

## Current verification

- The refocused two-district Multiverse is covered by dedicated regression tests. The SPI integration adds two targeted route/integration tests; the clean deployment remains gated by the full `npm test` and `npm run build` workflow.
- Kármán handoff now initializes finite celestial altitude/speed telemetry immediately instead of exposing a one-frame `NaN` altitude.
- AUTO NAV requested at ×400 is proximity-capped near either Earth or Moon, and the celestial integrator rolls back non-finite numerical steps rather than freezing the render state.
- The local working tree still contains an unrelated pre-existing modification to `public/assets/space/nasa-sls-block1-mobile.stl`; that local file alone causes the SLS triangle-bound regression to fail. The SPI integration preserves and does not stage/commit it.
- The committed tree retains the known-good SLS derivative, so repository CI remains the authority for the clean-tree full-suite result.
- Vite still reports the known non-fatal >500 kB warning for the Three.js vendor chunk.
- git diff --check passes.
- npm audit reports 0 vulnerabilities.
- Local development serving returns HTTP 200.
- Deterministic transfer coverage verifies that Moon AUTO NAV physically intercepts the lunar landing corridor without teleporting.
- The current transfer profile reaches the final guided corridor at roughly 899 m lunar altitude and about 8.1 m/s before manual landing control.
- Headless Termux Chromium cannot provide trustworthy Three.js visual acceptance because EGL/WebGL initialization fails in that environment. This is a QA-environment limitation, not evidence of a rendered pass.
- Cloud browser visual acceptance is also blocked by disabled WebGL; the alternate browser-skill runtime in this execution environment cannot create its required sockets. Neither is reported as a visual pass. See [Multiverse verification](docs/MULTIVERSE.md).
- Native/mobile visual feel and frame pacing remain unverified in this delivery. A subsequent code audit caught and fixed Volt Runner rotating around its foot origin during Spin Dash; the corrected animation now pivots around the body center and returns exactly to neutral.

## PWA and update behavior

`public/sw.js` currently uses cache version `skyreach-v26`.

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
      nasa-sls-block1-mobile.stl
      nasa-blue-marble-2048.png
      nasa-lroc-moon-2k.jpg
      nasa-lola-moon-dem-1k.jpg
      provenance.json
      earth-provenance.json
      moon-provenance.json
      alien/
        alien_spaceship.glb
        alien_ship.glb
        provenance.json
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
  moon.test.mjs
  sls-mobile.test.mjs
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
  SPACE-REMEDIATION.md
  WORLD-EXPANSION.md
```

## Development rule

Preserve the feel and playability of the baseline while improving the internals incrementally. Do not rewrite working systems merely to chase architecture. New subsystems should move out of `game.js` when they have a clear interface and can be verified independently.

## Asset/licensing status

See [Asset rights status](docs/ASSET-RIGHTS.md) for documented sources and the user-provided models whose third-party redistribution rights still require confirmation.

## World expansion verification

See [verification and boundaries](docs/WORLD-EXPANSION.md) for checks and remaining limitations.


## Gameplay QA: collisions, vehicle exits and crash recovery

Run `npm ci`, `npm test` and `npm run build` before deploying. The collision regression suite uses swept movement for characters, cars, boats, submarines and low-altitude aircraft; it covers causeway shoulders, safe disembarkation and spacecraft reset.

For an optional **live** runtime smoke test on the local Pixel/Termux device, launch `npm run dev -- --host 127.0.0.1`, open `http://127.0.0.1:5173/` in the dedicated Local Workspace Chromium runtime with CDP at `127.0.0.1:9230`, then run `npm run qa:runtime`. This exercises each non-spacecraft vehicle's boarding/exiting behavior, both portals, an Earth crash recovery, and real frame progression. It reports pass/fail per scenario and requires the local dev-only `__skyreach` hook; it is not a visual or GPU performance benchmark.

The local debug snapshot exposes frame age/count, collision blocking counters, mode, active portal realm and vehicle state; inspect hooks are absent from the public production build. Hardware/WebGL capture and human visual checks remain separate requirements before claiming complete graphical QA.

## Gameplay and performance improvements

This revision improves five systems without adding heavyweight asset dependencies:

- **Vehicle dynamics and follow camera:** shared frame-rate-independent acceleration, braking, reverse, steering response and speed caps for cars/boats/submarines/aircraft; aircraft pitch and lift; speed-sensitive chase distance, look-ahead, field of view and follow damping. These are approachable arcade controls, not a full rigid-body suspension or aerodynamic simulator.
- **Spaceflight reliability:** AUTO NAV rejects crashed, fuel-starved or already-arrived targets, reports flight phases, disengages on fuel exhaustion and avoids repeated crash notices. Safe base landings resupply the ship. The lunar/Earth surface flag follows actual spacecraft departure and arrival.
- **Environmental grounding:** the Queen Isabella causeway has a small instanced, terrain-conforming reflector set at its outer deck edges; the markers are hidden away from the South Padre region and do not obstruct the driveable lane.
- **Optional connected exploration:** a five-stop journey connects South Padre, LAX, Nexus Isle, lunar touchdown and Earth return. Progress persists independently of existing collectibles, and the Journey HUD can set a destination without restricting free play.
- **Mobile rendering:** Auto quality adapts pixel resolution and shadows with hysteresis under sustained frame-time pressure; manual choices are respected. Default shadow-map load is lower; anti-aliasing is reserved for manual Medium/High; the mini radar redraws at ~8 Hz.

Verification: `npm test` includes long-route geometry and two-leg spaceflight simulations, collision and physics tests, persistence, quality adaptation and instanced-prop positioning. `npm run qa:runtime` exercises 22 local browser gameplay checks through the separate QA profile. **These checks do not prove graphical fidelity, touch ergonomics or target hardware frame rate**; review visually and profile on a physical Pixel 6a before declaring those aspects finished.

## Living-world and lunar-expedition expansion

The current release extends the five world-polish phases:

- **Environmental variety:** biome-colored instanced foliage across the four offshore islands, main-island terrain-conforming stone props, nearshore foam details, and context-sensitive night lighting. Each collection is visibility-gated.
- **Living world:** four obstacle-aware ambient traffic vehicles, pedestrians with collision-aware walking and a talk/wave interaction, and existing ferries/wildlife/weather preserved.
- **Vehicle behavior:** sampled four-wheel slope and suspension feedback, wet-road traction and visual drift, weather-dependent boat heave/roll, smoother submarine dive pitch, bounded low-speed aerodynamic stall and additional terrain/building camera clearance.
- **Lunar expedition:** a six-wheel drivable rover, ECHO-1 outpost, four individually scan-able locations and persistent lunar research progress. The HUD points to the nearest unscanned site and does not send the Moon explorer back toward Earth beacons.
- **Cinematic response:** context-aware impact sounds and bounded camera impulse from bumps/landings, separate muffled underwater audio, rover cabin audio and exposure feedback during lightning.

**Quality/limits:** simulation remains lightweight arcade-oriented rather than full rigid-body tire and flight dynamics. The screenshot-based local browser uses Mesa software WebGL rather than the Pixel's native GPU. Code, WebGL capture, simulated routes and CDP gameplay checks are regression evidence, not a claim that the entire world has undergone a frame-by-frame art review or a physical-device performance pass.

Regression: `npm test`, `npm run build`, and (in the isolated local browser) `npm run qa:runtime`. The runtime suite includes rover boarding, lunar scans, rover travel, traffic, vehicles, portals, causeway and crash recovery. The existing uncommitted NASA mobile STL must not be staged or committed without explicit authorization.
