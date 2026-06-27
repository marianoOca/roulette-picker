/**
 * Shared scene geometry constants. The wheel renderer and the settle resolver
 * both import these so they agree on the pocket ring band.
 *
 * Radii follow the blueprint radial profile (see lib/profile.ts). The ball
 * settles on the flat pocket floor (section G); detection is centered there.
 *
 * Coordinate system: Y up. Wheel horizontal, spins about Y. Pocket floor = y0.
 */

import { R, SECTION_INNER, type SectionKey } from "./profile";

export type { SectionKey };


/**
 * Given an array of section keys, returns [minRadius, maxRadius] covering
 * the union of those sections. Non-contiguous picks collapse to one band.
 */
export function spawnRadiusRange(sections: SectionKey[]): [number, number] {
  const min = Math.min(...sections.map((s) => SECTION_INNER[s]));
  const max = Math.max(...sections.map((s) => R[s]));
  return [min, max];
}

export const SCENE = {
  /** Center of the flat pocket floor (G) — where balls rest / are detected. */
  pocketRingRadius: (R.H + R.G) / 2, // ≈ 2.428
  /** Half-width of the pocket band; a ball within this of the ring is pocketed. */
  pocketBandHalfWidth: 0.22,
  /** Inner edge of the pocket ring (deflector base = pocket floor inner). */
  hubRadius: R.H, // 2.231
  /** Tower base radius (top of the central mound). */
  towerBaseRadius: R.J, // 1.05
  /** Containment wall radius — at the pocket-floor outer edge (G), so balls
   *  settle in the flat pockets and never reach the raised number band. */
  wallRadius: R.G, // ≈ 2.10
  /** Containment wall height (rotor collider, invisible). */
  wallHeight: 1.0,
  /** Decorative outer rim radius (static walnut wall). */
  outerRimRadius: R.A, // ≈ 4.681
  /** v1 outer wall radius (restores the removed constant v1 components depend on). */
  rimRadius: R.A,
  /** Ball radius — a bit under the narrowest pocket gap (~0.252 at inner edge); Ø0.23. */
  ballRadius: 0.115,
  /** Height balls spawn above the wheel — low, shallow basin. */
  spawnHeight: 1.0,
  /** Velocity magnitude below which a ball is considered at rest. */
  restLinearThreshold: 0.18,
  /** Fret (separator) dimensions — low thin gold blades spanning G+E. */
  fretHeight: 0.26,
  fretThickness: 0.04,
} as const;

export type Vec3 = { x: number; y: number; z: number };

/**
 * Geometry the resolver needs to classify where a ball came to rest. Passed in
 * per wheel version (v2 exact, v1 half-scale) so the leaderboard works for both.
 */
export interface WheelGeometry {
  /** Center of the pocket detection band (world units). */
  pocketRingRadius: number;
  /** A ball within this of the ring counts as "in a pocket". */
  pocketBandHalfWidth: number;
  /** Wheel + its wooden border outer radius — beyond this is the table tier. */
  houseRadius: number;
}

/** v2: real wheel, full-size table collar. */
export const WHEEL_GEOMETRY: WheelGeometry = {
  pocketRingRadius: SCENE.pocketRingRadius,
  pocketBandHalfWidth: SCENE.pocketBandHalfWidth,
  // ≈ Table.tsx RING_OUTER (R.A + 0.08 + 90mm·MM); just past the wooden collar.
  houseRadius: R.A + 1.02,
};

/**
 * v1: the whole interior is numbered pockets and the wheel is rendered at half
 * scale, so the band spans 0..rim — any in-wheel ball is "pocketed" (no tier 2),
 * and anything beyond the (half-scale) rim has left the wheel.
 */
const V1_RIM = R.A * 0.5;
export const WHEEL_GEOMETRY_V1: WheelGeometry = {
  pocketRingRadius: V1_RIM / 2,
  pocketBandHalfWidth: V1_RIM / 2,
  houseRadius: V1_RIM,
};
