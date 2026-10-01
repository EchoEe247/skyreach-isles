# Living Isles — September 30, 2026

## Goal

Make Skyreach feel inhabited and reactive without turning exploration into a permanent task list or increasing the mobile rendering cost recklessly.

## NPC schedules

The existing population stays at 24 characters. Eighteen live around the home town; six are assigned across Tideglass Cove, Ember Ruins, and Veilwater Island. Each character follows deterministic morning, daytime, evening, and nighttime community anchors, then wanders locally around the current anchor. Schedule targets stay inside each character's assigned community.

This reuses the existing character meshes instead of adding a second population layer.

## Dynamic weather

The living-world clock drives a 600-second continuous cycle:

- clear
- cloudy
- rain
- storm
- rain
- cloudy
- fog
- clear

Transitions blend over 14 seconds. Weather simultaneously affects cloud cover and drift speed, rain particles, fog distance, ocean bump/roughness, sun and moon contribution, sky brightness, wind audio, and rain audio. Storm lightning is deterministic and bounded.

Storm darkness is intentionally capped. The 9-minute-day / 3-minute-night cycle and nighttime visibility floor remain authoritative, so bad weather should change mood and visibility without making nighttime unplayable.

## Ambient traffic

Two lightweight ferries run continuously on verified open-water routes. One serves the Tideglass side of the archipelago; the second takes a longer eastern route toward Ember waters. Route samples were checked against the same terrain-height contract used by boat collision so the ferries do not visually cross the home island.

These ferries are ambience, not boardable player vehicles.

## World events

Events are intermittent and session-local:

- **Cargo washed ashore** at Tideglass.
- **Lighthouse outage** temporarily disables the lighthouse beam and lamp.
- **Stranded boat signal** appears offshore with a flashing rescue signal.

Events announce once when they begin. Reaching the event radius resolves the current occurrence; cargo is secured, lighthouse power is restored, or the stranded crew acknowledges the player. The event marker/manifestation disappears after resolution. Events later recur with the living-world cycle rather than becoming persistent collectibles.

## Verification at the time of the Living Isles update

- The suite at that point contained 36 passing Node regression tests.
- Living-world tests cover weather bounds/continuity, storm-only lightning, all four NPC schedule periods, community containment, and intermittent event cadence.
- Audio tests cover bounded rain/storm ambience.
- Production Vite build succeeds; the existing >500 kB bundle warning remains non-fatal.
- Browser QA on isolated Xvfb/Chromium confirmed the new build initializes with no captured JavaScript/console errors.
- Browser state checks confirmed clear weather + cargo event, rain + lighthouse outage, rain + stranded-boat event, storm at midnight, two active ambient ferries, and NPC period changes.
- Teleport QA to Tideglass cargo confirmed the event resolves when the player enters its event radius.
- The alternate Ember ferry path was sampled along every segment and remained below the boat-travel shoreline threshold.

These bullets document the Living Isles release checkpoint. The current repository has since grown to **73/73 passing tests** and adds Earth-Moon flight, streamed lunar terrain, and two alien spacecraft without changing the living-world contracts above. Current repository-wide verification is summarized in README.md and docs/ARCHITECTURE.md.

## Deliberate boundaries

This update does not add interiors, a full economy, combat, NPC dialogue trees, traffic AI collision, or persistent event rewards. Those would be separate systems and should not be hidden inside the living-world controller.

## Curated animals

A later [CC0 asset pass](CURATED-ASSETS.md) adds six animated animals across three species in a separate environment controller. Cached models retain Idle/Eating/Walk animations, with small local routes and distance-based animation suspension. Existing NPC schedules, ferries, events and dolphins are unchanged.
