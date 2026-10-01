# Space Stack Remediation

This document records the full remediation pass following the focused SLS / Moon / alien-spacecraft audit.

## Flight safety and controls

- Celestial surface contact now distinguishes controlled landing, hard contact and destructive impact.
- Landing is accepted at <= 8 m/s. High-energy impacts above 18 m/s enter an explicit crashed state instead of being converted into a perfect landing.
- Crash recovery is a deliberate post-failure gameplay action; normal travel remains continuous and never teleports.
- Celestial SAS now has real angular-rate damping. SAS-off flight carries yaw/pitch inertia.
- Manual flight cannot receive the full 50x/100x/400x control amplification. Manual celestial integration is capped at 10x; AUTO NAV can use the larger requested warp where proximity limits permit.
- AUTO NAV remains a physical steering/thrust/braking controller rather than a scene transition.
- The SLS uses booster/core/upper-stage state for presentation; side-booster plume visuals cut off above 45 km.
- Spacecraft now track propellant and atmospheric heat in the HUD. Reentry heat rises from density and velocity and produces a thermal-limit warning.

## Earth return

- SLS return can hand continuously back into the atmosphere as high as 85 km when it is inside a physically bounded reentry corridor.
- Alien craft can also hand continuously from celestial flight into atmospheric flight and proceed to an Earth landing/exit state.
- Atmospheric ground impacts use the same safe-landing/crash distinction as celestial impacts.
- The original Earth launch-site vector remains the return navigation reference.

## Moon surface

- The old fixed 1.9 km lunar patch has been replaced by a deterministic recentering 2.2 km terrain tile.
- Terrain recenters as the craft/player travels, so off-site lunar landings and extended walking do not fall onto invisible ground.
- Procedural collision height remains deterministic at arbitrary local lunar coordinates.
- On-foot lunar gravity is 1.62 m/s². Jump and walking speeds were retuned around that value.
- The lunar base pad remains at local 0,0 while off-base streamed tiles omit the base structures.
- Distant and local Moon visuals now use NASA Scientific Visualization Studio CGI Moon Kit data:
  - LRO/LROC 2K lunar color map.
  - LOLA-derived 8-bit elevation preview as local terrain bump detail.
- Provenance is stored in public/assets/space/moon-provenance.json.

## Spacecraft visuals and runtime cost

- Runtime SLS now uses a Blender-derived mobile STL: 55,000 triangles / ~2.75 MB, down from 274,432 triangles / ~13.7 MB.
- The original NASA STL remains in the repository as the provenance source.
- The optimized SLS is still loaded only when the rocket is used.
- Alien Scout and Alien Strike Ship remain deferred until Moon travel requires them.
- Strike Ship source geometry is still merged from 119 source meshes into approximately five material groups at load time.
- Alien craft now have runtime propulsion glow/plumes, deployable landing-gear visuals and a crash-status light independent of the source GLBs.

## Space-mode CPU and audio

- Earth-only Living Isles updates are suspended in deep space and on the Moon instead of continuing every frame.
- Earth traffic, gulls, NPC movement, local objectives, environment assets and island scenery stop updating when the Earth world is not active.
- Exterior wind/rain/ocean/town ambience is suppressed in vacuum.
- SLS and alien craft have dedicated internal propulsion/cabin layers. Coasting in vacuum is quiet instead of using airplane jet/wind audio.

## Planet presentation

- Earth globe rotation now follows the game day angle.
- The Earth-Moon distances/radii and inverse-square gravity model remain physically scaled.
- The Moon target/locator and AUTO NAV point at the same physical Moon used by the simulation.
- Full astronomical ephemeris (moving Moon orbit, multi-day orbital phase propagation and mission-grade n-body transfer planning) is intentionally outside the current real-time arcade-simulation scope; adding it would change the game's navigation contract rather than repair a defect.

## Verification

- 73/73 Node tests pass after this remediation.
- New regression coverage includes destructive/gentle lunar impacts, celestial SAS/manual divergence, manual high-warp limiting, atmospheric crash semantics, streamed lunar recentering, physical lunar gravity, vacuum spacecraft audio, and the optimized SLS asset envelope.
- Production Vite build passes.
- git diff --check passes.
- The current local play URL is expected at http://127.0.0.1:8877.

## Launch continuity correction

A follow-up launch audit found two render-continuity faults hidden behind otherwise-correct flight physics: the celestial branch could reset spacecraft X/Z toward world origin when lunar-local blend was zero, and the Earth globe switched instantly from the full atmospheric representation to the compressed celestial representation at Kármán. The celestial render path now preserves the exact launch render anchor until lunar-local blending begins. The Earth globe now transitions smoothly from its atmospheric representation to its compressed celestial representation across 100–400 km instead of switching scale/position in one frame. Engine plumes remain visually continuous through atmospheric ascent until actual booster geometry separation exists, and liftoff clears stale ground-landing state. The rocket HUD telemetry row is five columns to avoid overlap after FUEL/HEAT were added.
