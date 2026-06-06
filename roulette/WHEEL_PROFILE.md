# Roulette Wheel — Radial Profile Constraints

**Single source of truth for wheel proportions and section geometry.**
Numbers here mirror `lib/profile.ts` — check both whenever uncertain about
dimensions, slopes, or material boundaries. If they ever disagree, `profile.ts`
wins and this doc is stale.

## ASCII Cross-Section (side silhouette, half shown)

```
 _                       _
| |                     | |
|  \         _         /  |
|   \       | |       /   |
|    \     /   \     /    |
|     \   /     \   /     |
|      |_|       |_|      |

AAABCDEFGHHIJJJIHHGFEDCBAAA
```

## Section Definitions (center → out)

Widths are RADIAL (blueprint top-view px). `%` is px ÷ 24 (J diameter = scale ref).
Outer radii live in `R` (profile.ts); the px deltas below come straight from it.

| # | Name | Width (px) | Width (%) | Angle | Material | Notes |
|---|------|-----------|-----------|-------|----------|-------|
| J | Center Tower / Spindle Base | 24 px Ø | 100% (ref) | vertical | Brass | Scale anchor. 24px = DIAMETER → 12px radius (`R.J`) |
| I | Inner Wooden Cone | 25 px | 104.17% | 15° | Burl wood | Concave bowl, varnished. Radial segmentation visible |
| H | Inner Gold Ring | 2 px | 8.33% | vertical → 15° | Brass | Vertical wall (outer half) + inward bevel matching I slope (inner half) |
| G | Pocket Floor | 5 px | 20.83% | flat | Painted (red/black/green) | Flat landing area; ball rest + detection band |
| F | Outer Gold Ring | 1 px | 4.17% | 12° → vertical | Brass | Slope matching E (outer half) + vertical wall touching G (inner half) |
| E | Number Band | 9 px | 37.50% | 12° | Painted (per pocket) | Numbers slope inward, readable from top-down. Rotor edge at R.E |
| D | Golden Ring | 3 px | 12.50% | 17.5° | Brass | Transition bevel between E (number band) and C (wood) |
| C | Outer Wood Area | 17 px | 70.83% | 15° | Burl wood | Gentle inward slope. Carries 8 brass diamond deflectors + 8 radial lines |
| B | Golden Chamfer | 4 px | 16.67% | 15° | Brass | Small smooth chamfer transition |
| A | Outer Wall | 13 px | 54.17% | vertical | Dark walnut | Thick heavy rim, rounded outer edges |

## Critical Geometry Rules

- **Scale anchor**: J = 24 px DIAMETER → 12 px RADIUS. All other widths are radial.
- **Seamless I→H junction**: the burl cone outer edge (at R.I) and H's inner bevel
  both meet at `Y.RI`. They share the same angle (`H_I_SLOPE_DEG` = 15°) so there
  is no step. The tower-base height is *derived* from this angle, not hand-set.
- **H shape**: outer half = vertical wall from floor to `Y.hWallTop`; inner half =
  15° bevel matching the I bowl, rising up-inward.
- **F shape**: outer half = 12° slope matching E going up-outward; inner half =
  vertical wall sitting at G's outer edge.
- **Equal halves**: both H and F split into two equal radial halves (ceiling view).
- **Pocket floor (G)**: flat at `Y.floor`. Colored per pocket. Ball rests here and
  the settle resolver reads pockets from this band (see `lib/scene.ts`).
- **Shallow basin**: `POCKET_DEPTH` is small (wall tops sit ~at the gold ring), so
  balls seat cleanly without a deep well that traps them.

## Slope Angles (from horizontal)

These are the live constants in `profile.ts` — not approximations.

| Section | Angle | Constant |
|---------|-------|----------|
| I (inner bowl) | 15° | `H_I_SLOPE_DEG` |
| H inner half | 15° (same as I, seamless) | `H_I_SLOPE_DEG` |
| E (number band) | 12° | `E_SLOPE_DEG` |
| F outer half | 12° (same as E, seamless) | `E_SLOPE_DEG` |
| D transition | 17.5° | inline `tan(17.5)` |
| C outer wood | 15° | inline `tan(15)` |
| B chamfer | 15° | inline `tan(15)` |

## Source of Truth Files

- `lib/profile.ts` — all R (radii) and Y (heights) values + the collision/lathe
  cross-sections (`rotorHeadPoints`, `rotorCollisionPoints`, `bowlCollisionPoints`)
- `lib/scene.ts` — derived scene constants (ball radius, spawn band, wall radius)
- `roulette/RouletteWheel.tsx` — spinning rotor (J, I, H, G, F, E sections) + frets + turret
- `roulette/RouletteBowl.tsx` — static bowl (D, C, B, A sections)
