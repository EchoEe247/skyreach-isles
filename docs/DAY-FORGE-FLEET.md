# DAY FORGE Fleet

The DAY FORGE fleet adds ten boardable vehicles to the existing home/main-island region. The five ships spawn in navigable water off West Harbor; four aircraft occupy distinct LAX apron positions; and the Crushtitan is on the town's north-south road. These placements are intentionally on the main island for now; none are placed on South Padre Island.

| Name | Category / game type | Asset | Approx. normalized length |
|---|---|---|---:|
| Blacktide Pirate Galleon | ship / boat | `blacktide_pirate_galleon.glb` | 40 m |
| Wraithmoor Ghost Frigate | ship / boat | `wraithmoor_ghost_frigate.glb` | 38 m |
| Sunmarque Tropical Mega Cruiser | ship / boat | `sunmarque_tropical_mega_cruiser.glb` | 75 m |
| Tidereign Grand Ocean Liner | ship / boat | `tidereign_grand_ocean_liner.glb` | 70 m |
| Dreadbanner Pirate Brigantine | ship / boat | `dreadbanner_pirate_brigantine.glb` | 32 m |
| Nighthawk Stealth Interceptor | aircraft / plane | `nighthawk_stealth_interceptor.glb` | 17 m |
| Vanguard Tiltrotor Assault Transport | aircraft / plane | `vanguard_tiltrotor_assault_transport.glb` | 22 m |
| Swingwraith Swing-Wing Strike Fighter | aircraft / plane | `swingwraith_swing_wing_strike_fighter.glb` | 18 m |
| Skywatch Airborne Early Warning | aircraft / plane | `skywatch_airborne_early_warning.glb` | 22 m |
| Crushtitan Monster Truck | ground / car | `crushtitan_monster_truck.glb` | 7.5 m |

The procedural Muse designs were supplied as an original package dated October 1, 2026; commercial use is allowed under the supplied package terms. The original GLBs are in `public/assets/day-forge/`. Muse exports use Y-up and forward -Z; the runtime normalizes bounds and rotates the visual so its forward matches Skyreach's +Z vehicle convention. Static meshes are merged by material at load time; source animations are absent. PBR and emissive materials are retained, and detailed meshes do not cast or receive shadows. A per-vehicle procedural fallback keeps the game usable if an asset fails to load.

The original Muse GLBs were repaired in place with `scripts/repair-day-forge-glb.py` to encode valid glTF emissive semantics. The runtime does not rewrite source assets. Vehicle physics, control and audio use the existing `boat`, `plane`, and `car` systems. Explore lists each asset by name with a live locator tied to its stable vehicle ID and current position, in addition to the existing generic locators. Large ships use expanded boarding radii and planar water-to-hull boarding checks. The player can exit any boat into open water, swim to another vessel, and board it without needing a dock; DAY FORGE ships also use hull-scaled exit offsets so disembarking does not place the player inside a large hull.
