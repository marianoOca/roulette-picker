/**
 * Resolve the winner from where the balls came to rest.
 *
 * For each ball we find which pocket it sits in (by angle, relative to the
 * wheel's current rotation, and only if it's within the pocket ring band).
 * The highest pocket number wins. Ambiguity — two balls in the same top pocket,
 * or no ball settled in any pocket — is broken with crypto RNG.
 */

import { POCKETS, POCKET_ANGLE, POCKET_COUNT } from "./rouletteOrder";
import { SCENE, type Vec3 } from "./scene";
import { securePick } from "./spin";

export interface BallState {
  id: string;
  name: string;
  position: Vec3;
}

export interface BallReading extends BallState {
  /** Pocket index the ball landed in, or null if outside the ring. */
  pocketIndex: number | null;
  /** Pocket number, or null if not pocketed. */
  number: number | null;
}

export interface SpinResult {
  winner: BallReading;
  readings: BallReading[];
  /** True when crypto RNG had to break a tie or messy settle. */
  byTiebreak: boolean;
}

const TAU = Math.PI * 2;

function norm(a: number): number {
  return ((a % TAU) + TAU) % TAU;
}

/**
 * Map a ball's world XZ position to a pocket, given the wheel's Y rotation.
 * Returns null if the ball is outside the pocket ring band.
 */
export function readBall(ball: BallState, wheelRotationY: number): BallReading {
  const { x, z } = ball.position;
  const radius = Math.hypot(x, z);

  const inBand =
    Math.abs(radius - SCENE.pocketRingRadius) <= SCENE.pocketBandHalfWidth;

  if (!inBand) {
    return { ...ball, pocketIndex: null, number: null };
  }

  // World angle of the ball, then subtract wheel rotation for local angle.
  const worldAngle = Math.atan2(z, x);
  const localAngle = norm(worldAngle - wheelRotationY);
  const idx = Math.round(localAngle / POCKET_ANGLE) % POCKET_COUNT;
  const pocket = POCKETS[idx];

  return { ...ball, pocketIndex: pocket.index, number: pocket.number };
}

/**
 * Resolve the winner. `wheelRotationY` is the rotor's final Y rotation (radians).
 */
export function resolveWinner(
  balls: BallState[],
  wheelRotationY: number
): SpinResult | null {
  if (balls.length === 0) return null;

  const readings = balls.map((b) => readBall(b, wheelRotationY));
  const pocketed = readings.filter((r) => r.number !== null);

  // Messy settle: nobody landed in a pocket → crypto tie-break among everyone.
  if (pocketed.length === 0) {
    const winner = securePick(readings)!;
    return { winner, readings, byTiebreak: true };
  }

  const topNumber = Math.max(...pocketed.map((r) => r.number as number));
  const topCandidates = pocketed.filter((r) => r.number === topNumber);

  if (topCandidates.length === 1) {
    return { winner: topCandidates[0], readings, byTiebreak: false };
  }

  // Two+ balls share the top pocket → crypto tie-break among them.
  const winner = securePick(topCandidates)!;
  return { winner, readings, byTiebreak: true };
}
