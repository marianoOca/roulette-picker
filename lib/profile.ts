/**
 * Radial cross-section profile of the wheel (blueprint sections A–J).
 *
 * Single source of truth for the wheel silhouette. Widths come from the
 * blueprint TOP VIEW (px) = the horizontal radial projection of each section.
 * Scale anchor: J (tower base) = 24px = current towerBaseRadius (1.05).
 *
 *   radial extent (units) = widthPx · PX                (used directly)
 *   vertical rise (sloped) = radial · tan(slopeAngle)
 *   true surface length    = radial / cos(slopeAngle)   (UVs only)
 *
 * Sections, center → out:
 *   J tower base · I inner burl bowl · H brass wall · G pocket floor ·
 *   F brass wall · E number band · D gold ring · C outer burl+diamonds ·
 *   B brass chamfer · A dark-walnut outer wall.
 *
 * Y reference: pocket floor (G) = 0 (lowest point of the basin).
 */

import { Vector2 } from "three";

export const PX = 1.05 / 24; // ≈ 0.04375 scene units per blueprint pixel

const tan = (deg: number) => Math.tan((deg * Math.PI) / 180);

/**
 * Cumulative outer radius of each section (center → out), in scene units.
 * NOTE: the blueprint tower value (24px) is the tower DIAMETER, so section J's
 * radial extent (tower base radius) is 12px. All bands A–I are radial widths
 * added outward from there; every boundary below sits 12px inward of the
 * earlier (radius-misread) version.
 */
export const R = {
  center: 0,
  J: 12 * PX, // 0.525  tower base radius (24px Ø ÷ 2)
  I: 37 * PX, // 1.619  inner bowl / H
  H: 39 * PX, // 1.706  pocket floor inner
  G: 44 * PX, // 1.925  pocket floor outer  (5px wide)
  F: 45 * PX, // 1.969  pocket outer wall top
  E: 54 * PX, // 2.363  number band outer = ROTOR EDGE
  D: 57 * PX, // 2.494  gold ring outer
  C: 74 * PX, // 3.238  outer wood outer
  B: 78 * PX, // 3.413  chamfer outer
  A: 91 * PX, // 3.981  outer wall / rim
} as const;

// Shallow basin, raised floor. Heights are floor-relative.
const FLOOR = 0.32; // pocket floor / ball-rest level
export const POCKET_DEPTH = 0.13; // shallow — wall tops sit at the gold ring
export const E_SLOPE_DEG = 12; // number-band tilt (gentle, readable)

// H gold ring geometry.
// Outer half: vertical wall from Y.floor to Y.hWallTop (flush with strip inner edge).
// Inner half: H_I_SLOPE_DEG bevel rising from Y.hWallTop at midH up to Y.RI at R.I.
// I burl cone uses same angle → seamless junction at R.I. TOWER_BASE derived from angle.
//   HALF_H   = half of H's radial width (= 1 px = PX) = the bevel's radial run
const H_I_SLOPE_DEG = 15; // shared angle for H inner bevel and I burl cone
const HALF_H = (R.H - R.I) / 2; // = PX
const Y_H_WALL_TOP = FLOOR + POCKET_DEPTH + ((R.I + R.H) / 2 - R.F) * tan(E_SLOPE_DEG);
const Y_RI = Y_H_WALL_TOP + HALF_H * tan(H_I_SLOPE_DEG);
const TOWER_BASE = Y_RI + (R.I - R.J) * tan(H_I_SLOPE_DEG); // derived — keeps I cone at same angle

/** Key Y heights (pocket floor = FLOOR). */
export const Y = {
  floor: FLOOR,
  pocketWall: FLOOR + POCKET_DEPTH,
  hWallTop: Y_H_WALL_TOP, // strip inner edge at midH ≈ 0.385; H outer wall top
  RI: Y_RI, // burl cone outer edge = H-slope inner edge (seamless junction)
  Eouter: FLOOR + POCKET_DEPTH + (R.E - R.F) * tan(E_SLOPE_DEG),
  Douter:
    FLOOR + POCKET_DEPTH + (R.E - R.F) * tan(E_SLOPE_DEG) + (R.D - R.E) * tan(17.5),
  Couter:
    FLOOR +
    POCKET_DEPTH +
    (R.E - R.F) * tan(E_SLOPE_DEG) +
    (R.D - R.E) * tan(17.5) +
    (R.C - R.D) * tan(15),
  Bouter:
    FLOOR +
    POCKET_DEPTH +
    (R.E - R.F) * tan(E_SLOPE_DEG) +
    (R.D - R.E) * tan(17.5) +
    (R.C - R.D) * tan(15) +
    (R.B - R.C) * tan(15),
  towerBase: TOWER_BASE,
} as const;

/** Keys for sections B–J (spawnable surface, center → out). */
export type SectionKey = "J" | "I" | "H" | "G" | "F" | "E" | "D" | "C" | "B";

/** Inner radius of each section (R has outer edges; this gives the inner edge). */
export const SECTION_INNER: Record<SectionKey, number> = {
  J: 0,
  I: R.J,
  H: R.I,
  G: R.H,
  F: R.G,
  E: R.F,
  D: R.E,
  C: R.D,
  B: R.C,
};

/**
 * Rotor head lathe cross-section, center → out.
 * Straight cone from tower-base flat top (R.J) down to R.I at Y.RI.
 * The cone stops at R.I — the H gold ring (R.I → R.H) is a separate mesh,
 * so the burl-to-brass transition is seamless (same slope, same Y at R.I).
 */
export function rotorHeadPoints(): Vector2[] {
  return [
    new Vector2(0, Y.towerBase),
    new Vector2(R.J, Y.towerBase), // flat tower-base top
    new Vector2(R.I, Y.RI),        // cone outer edge — seamless with H gold ring
  ];
}

/**
 * Rotor COLLISION cross-section, center → R.G (where the static R.G containment
 * wall takes over). Traces the exact visible inner surface — I cone, H slope +
 * wall, flat pocket floor (G), F wall + slope, lower E band — so the physics
 * surface coincides with the art: no ball trespass, no invisible barrier.
 * Revolve into a trimesh collider (lib not visual: rotorHeadPoints stays the art).
 */
export function rotorCollisionPoints(): Vector2[] {
  const midH = (R.I + R.H) / 2;
  const midF = (R.G + R.F) / 2;
  const yConnectF = Y.pocketWall - ((R.F - R.G) / 2) * tan(E_SLOPE_DEG);
  // Radius MUST be monotonically increasing — a fold (e.g. ending at R.G < R.F)
  // makes LatheGeometry self-overlap and produces a degenerate ledge that traps balls.
  return [
    // Start at R.J, not 0 — no flat disc. The turret hull (solid convex body)
    // covers r < R.J, so the junction here is a convex corner (hull edge → I-cone),
    // which Rapier handles correctly. The flat disc created a concave crease that
    // caused balls to fall through at the J/I boundary.
    new Vector2(R.J, Y.towerBase),    // I-cone top = turret hull outer edge
    new Vector2(R.I, Y.RI),           // I cone bottom edge
    // Smooth ramp straight to the floor — NO convex H-wall ledge. A slope→vertical
    // cliff left a convex edge at (midH, hWallTop) that balls perched on, floating
    // ~0.05 above the floor instead of seating in the pocket.
    new Vector2(midH, Y.floor),       // ramp down into the flat pocket floor
    new Vector2(midF, Y.floor),       // flat pocket floor (G)
    new Vector2(midF, yConnectF),     // F inner vertical wall
    new Vector2(R.F, Y.pocketWall),   // F outer slope → E band base
    new Vector2(R.E, Y.Eouter),       // number band (E) out to rotor edge
  ];
}

/**
 * Static bowl COLLISION cross-section, R.E → rim crown. Traces the visible inner
 * surface a ball could touch (D ring, C slope, B chamfer, A rim inner face +
 * crown), matching rimPoints() in RouletteBowl.tsx. Revolve into a trimesh on a
 * fixed body (tunnel-safe). Defense-in-depth: balls are normally held by R.G.
 */
export function bowlCollisionPoints(): Vector2[] {
  return [
    new Vector2(R.E, Y.Eouter),               // D inner (meets rotor E edge)
    new Vector2(R.D, Y.Douter),               // D outer
    new Vector2(R.C, Y.Couter),               // C slope (15°)
    new Vector2(R.B, Y.Bouter),               // B chamfer
    new Vector2(R.B + 0.03, Y.Bouter + 0.28), // A inner face rise
    new Vector2(R.B + 0.03, 1.01),            // A tall vertical inner wall (RIM_TOP - 0.12)
    new Vector2(R.B + 0.14, 1.13),            // A crown inner (RIM_TOP)
  ];
}
