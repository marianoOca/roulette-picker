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
