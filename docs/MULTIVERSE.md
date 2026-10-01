# Nexus Isle — two focused playable districts

## Current design

The former platforming replica has been removed completely. Nexus Isle now reserves its space and development budget for two larger, physically separated experiences.

### Velocity District — Volt Runner

The west side of Nexus Isle is a dedicated high-speed time-trial district.

- 24 ordered gold gates on a wider terrain-following procedural checker track.
- Five boost pads and a much faster realm movement profile.
- Spin Dash on Action / E with a body-centered four-turn animation.
- One full rideable vertical loop is integrated into the ordered route; reaching it with the required gate progression carries Volt Runner around the loop and exits back onto the track.
- Three spring launchers and three spike hazard groups.
- Four checkpoint recovery positions; their marker posts are offset from the running line so they no longer block the character/camera.
- Live elapsed time, best time, and S/A/B/C finish ranks.
- Guidance always points at the next valid ordered gate with a real label such as `Gate 8/24`; the previous `undefined` compass label is removed.
- Its entrance portal and scenery are physically separated from Breaker City.

### Breaker City — Brick Titan

The east side is a dedicated destruction district rather than a small arcade cluster.

- 12 destructible city towers arranged on a street grid.
- Towers require two or three punches rather than disappearing on the first hit.
- Six patrolling security guards.
- Solid target collision remains until destruction.
- Punch animation, debris bursts, impact feedback, combo multipliers and score.
- Guard contact breaks the active combo.
- Guidance points to the nearest remaining demolition target.

## Navigation and transformations

**MULTIVERSE** moves Nightweaver to the central Nexus fork. From there the two portals are more than 120 world units apart and lead into their respective halves of the island. The hub UI offers only **Velocity District** and **Breaker City**. Each district has its own return pad, and **Return to my island** still restores the location from which the Nexus was opened.

The island remains present in Explore/Atlas and can be reached physically by normal world travel.

## Implementation

- src/systems/multiverse-isle.js: two transformations, gameplay, collisions, timers, scoring, portals, return flow and guidance.
- src/systems/multiverse-art.js: original procedural scenery for the west speed district, east demolition city and central fork.
- src/game.js: mobile/keyboard controls, realm HUD, fast Nexus access and return-point handling.
- No ripped or official franchise assets are used.

## Verification boundary

The Pixel screenshots from 2026-10-01 exposed crowded oversized decorative arches, checkpoint obstruction, a narrow/partly floating course, `undefined` objective labels, and landscape HUD clutter. The current pass removes the decorative arch spam, widens and terrain-aligns the track, makes the track itself a gameplay surface, offsets checkpoint posts, hides unrelated global controls while a realm is active, and adds the functional full loop.

Automated tests and the production build remain the correctness gates. This environment still cannot provide trustworthy WebGL visual acceptance, so native/mobile visual feel should be judged in the actual Pixel browser.
