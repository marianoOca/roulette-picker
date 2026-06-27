/**
 * Resolve the winner from where the balls came to rest, and rank every ball
 * for the leaderboard.
 *
 * A single classifier (`classify`) decides where each ball ended up — in a
 * pocket, on the wheel (no pocket), on the table, or fallen off — using a
 * per-version `WheelGeometry` and the fell-off flag tracked during the spin.
 * The winner pick and the leaderboard both read from it, so the header and the
 * list can never disagree. The highest pocket number wins; ambiguity (two balls
 * in the same top pocket, or nobody pocketed) is broken with crypto RNG.
 */

import { POCKETS, POCKET_ANGLE, POCKET_COUNT } from "./rouletteOrder";
import { WHEEL_GEOMETRY, type Vec3, type WheelGeometry } from "./scene";
import { securePick } from "./spin";

export interface BallState {
  id: string;
  name: string;
  color: string;
  position: Vec3;
  /** Seconds into the spin when the ball first left the wheel, or null. */
  leftAt: number | null;
  /** True once the ball dropped below the table (under-table sensor fired). */
  fellOff: boolean;
}

/** Where a ball ended up, best → worst. */
export type Tier = 1 | 2 | 3 | 4; // pocket | on-wheel | on-table | fell-off

export interface BallReading extends BallState {
  /** Pocket index the ball landed in, or null if not pocketed. */
  pocketIndex: number | null;
  /** Pocket number, or null if not pocketed. */
  number: number | null;
  tier: Tier;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  color: string;
  /** 1-based rank (1 = winner). */
  place: number;
  tier: Tier;
  /** Pocket number for tier 1, else null. */
  number: number | null;
}

export interface SpinResult {
  winner: BallReading;
  readings: BallReading[];
  /** True when crypto RNG had to break a tie or messy settle. */
  byTiebreak: boolean;
  /** Every ball ranked, winner first. */
  leaderboard: LeaderboardEntry[];
}

const TAU = Math.PI * 2;

function norm(a: number): number {
  return ((a % TAU) + TAU) % TAU;
}

/**
 * Classify a ball's final position into a tier (and pocket number for tier 1),
 * given the wheel's Y rotation and the version's geometry.
 */
export function classify(
  ball: BallState,
  wheelRotationY: number,
  geom: WheelGeometry
): { tier: Tier; pocketIndex: number | null; number: number | null } {
  if (ball.fellOff) {
    return { tier: 4, pocketIndex: null, number: null };
  }

  const { x, z } = ball.position;
  const radius = Math.hypot(x, z);

  const inBand =
    Math.abs(radius - geom.pocketRingRadius) <= geom.pocketBandHalfWidth;

  if (inBand) {
    // World angle of the ball, then subtract wheel rotation for local angle.
    const worldAngle = Math.atan2(z, x);
    const localAngle = norm(worldAngle - wheelRotationY);
    const idx = Math.round(localAngle / POCKET_ANGLE) % POCKET_COUNT;
    const pocket = POCKETS[idx];
    return { tier: 1, pocketIndex: pocket.index, number: pocket.number };
  }

  // On the wheel structure (incl. its wooden border) but not in a pocket.
  if (radius <= geom.houseRadius) {
    return { tier: 2, pocketIndex: null, number: null };
  }

  // Beyond the wheel, still on the table (felt or table border).
  return { tier: 3, pocketIndex: null, number: null };
}

/** Order two same-tier readings; negative means `a` ranks higher. */
function compareWithinTier(a: BallReading, b: BallReading, geom: WheelGeometry): number {
  switch (a.tier) {
    case 1: // higher pocket number first
      return (b.number as number) - (a.number as number);
    case 2: { // closest to the pocket ring first
      const da = Math.abs(Math.hypot(a.position.x, a.position.z) - geom.pocketRingRadius);
      const db = Math.abs(Math.hypot(b.position.x, b.position.z) - geom.pocketRingRadius);
      return da - db;
    }
    case 3: // closest to the wheel first
      return Math.hypot(a.position.x, a.position.z) - Math.hypot(b.position.x, b.position.z);
    case 4: // later it left the wheel → higher (earliest departer lands last)
      return (b.leftAt ?? 0) - (a.leftAt ?? 0);
  }
}

/**
 * Rank every ball: winner first, then by tier, then within-tier. Returns all
 * balls with a sequential 1-based place.
 */
function buildLeaderboard(
  readings: BallReading[],
  winnerId: string,
  geom: WheelGeometry
): LeaderboardEntry[] {
  const winner = readings.find((r) => r.id === winnerId)!;
  const rest = readings
    .filter((r) => r.id !== winnerId)
    .sort((a, b) => a.tier - b.tier || compareWithinTier(a, b, geom));

  return [winner, ...rest].map((r, i) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    place: i + 1,
    tier: r.tier,
    number: r.number,
  }));
}

/**
 * Resolve the winner. `wheelRotationY` is the rotor's final Y rotation (radians).
 * `geom` selects the wheel version's geometry (defaults to v2).
 */
export function resolveWinner(
  balls: BallState[],
  wheelRotationY: number,
  geom: WheelGeometry = WHEEL_GEOMETRY
): SpinResult | null {
  if (balls.length === 0) return null;

  const readings: BallReading[] = balls.map((b) => ({
    ...b,
    ...classify(b, wheelRotationY, geom),
  }));
  const pocketed = readings.filter((r) => r.tier === 1);

  let winner: BallReading;
  let byTiebreak: boolean;

  if (pocketed.length === 0) {
    // Messy settle: nobody landed in a pocket → crypto pick among everyone.
    winner = securePick(readings)!;
    byTiebreak = true;
  } else {
    const topNumber = Math.max(...pocketed.map((r) => r.number as number));
    const topCandidates = pocketed.filter((r) => r.number === topNumber);
    if (topCandidates.length === 1) {
      winner = topCandidates[0];
      byTiebreak = false;
    } else {
      // Two+ balls share the top pocket → crypto tie-break among them.
      winner = securePick(topCandidates)!;
      byTiebreak = true;
    }
  }

  const leaderboard = buildLeaderboard(readings, winner.id, geom);
  return { winner, readings, byTiebreak, leaderboard };
}
