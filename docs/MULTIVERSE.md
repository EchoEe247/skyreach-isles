# Multiverse Nexus — playable worlds

## Enter and play

Tap **MULTIVERSE** while on foot on Earth. The portal carries Nightweaver to Nexus Isle; **Return to my island** takes you back to the point where you opened it. The island also remains physically reachable and charted in Explore.

Choose **Enter Jump Kingdom**, **Enter Velocity Circuit**, or **Enter Breaker City** in the hub, or walk up to the matching labeled ring and use **Enter**. Each entry changes the visible character, controls/movement profile, objective guidance, and playable challenge in the same open world.

- **Jump Kingdom / Redcap Rover** — Mario-inspired platforming: red cap and blue overalls, grass-topped brick platforms, pipes, mushrooms and a castle skyline. Jump/Boost across the raised course, collect six stars, stomp patrolling walkers, collect coins, and hit gold blocks from below. Sweep bars and falls restore a checkpoint with brief protection.
- **Velocity Circuit / Volt Runner** — Sonic-inspired speed course: blue spiked runner, gloves and red shoes, a continuous checker track, ordered gold ring gates, boost pads, springs and spikes. **Action / E** performs a Spin Dash; Boost increases running speed. The timer freezes at the finish, and replay resets progression.
- **Breaker City / Brick Titan** — Wreck-It Ralph-inspired demolition: broad-shouldered orange-shirted brawler, oversized fists, nine city towers with windows, four patrolling security guards, punch animation, debris and combo scoring. Move within reach and **SMASH / E**. Guard contact breaks a combo.

The on-screen realm card explains controls and exposes **Restart world** and **Return to Nexus** anywhere in a realm. The compass guides to the next star, ordered ring or destruction target. Return pads also remain available in-world. Completion opens the finish return gates for Jump and Velocity.

## Implementation

- `src/systems/multiverse-isle.js`: characters, portal transitions, objective state, collisions and gameplay.
- `src/systems/multiverse-art.js`: original procedural scenery; static decorative meshes batched by material.
- `src/game.js`: touch/keyboard integration, HUD, fast Nexus access and return-point handling.
- The registry keeps three realm IDs: `jump`, `velocity`, `breaker`. Future realms can extend the registry and portal definitions.
- No ripped models, official franchise assets, downloads or paid services are used. These are small original homage games, not full reproductions of the commercial games.
- Progress within a run and the session's best Velocity time are in memory. Realm completion is not yet persisted between page reloads.

## Audit fixes and checks (2026-10-01)

Fixed terrain-dependent jump heights, large-step platform tunneling, checkpoints activating from underneath, stale completion on replay, a timer continuing after the finish, inaccessible return behavior, unlabeled portals, and the lack of an easy route to the hub. Added a short post-recovery grace period.

All **16 multiverse regression tests pass**, including all three transforms/returns, replay resets, checkpoint/fall recovery, swept landings, stomps, gold blocks, spring launches, and mathematical platform jump margins. Production build passes.

Full clean-tree GitHub suite: **102/102 runtime tests pass**. The separate local workspace still has the pre-existing uncommitted `public/assets/space/nasa-sls-block1-mobile.stl` modification; it remains outside this task and is excluded from these commits. The deployed build uses the committed derivative.

GitHub Actions run 36880818915 passed all 102 runtime tests, built the production game, and deployed audit-fix commit 6aff35d. The live HTML exposes the portal selector and the initial discovery counter is corrected to 0/9.

Visual acceptance remains blocked, not passed: the cloud-browser console reports THREE.WebGLRenderer could not create a context (GL_VENDOR/GL_RENDERER Disabled). The browser-skill runtime in the ChatGPT execution environment also fails to launch because socket creation is not permitted. Local Termux browser checks were not used, as requested.

Follow-up controls preserve vertical velocity during Spin Dash/Smash and orient the runner toward the next gate on entry. Independent audit also fixed Spin Dash to rotate Volt Runner around a body-center pivot for four complete turns, returning exactly to neutral instead of orbiting around the feet and potentially clipping through the ground. The pre-existing local rocket derivative remains untouched.
