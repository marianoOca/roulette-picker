/**
 * Canonical European single-zero roulette wheel.
 *
 * Pocket order around the wheel (clockwise, starting at 0) and the standard
 * red/black/green color map. 37 pockets total (0–36).
 */

import { PocketColor } from "./colors";

// Physical pocket sequence on a European wheel, clockwise from the single zero.
export const EUROPEAN_ORDER: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export const POCKET_COUNT = EUROPEAN_ORDER.length; // 37

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export function colorForNumber(n: number): PocketColor {
  if (n === 0) return "green";
  return RED_NUMBERS.has(n) ? "red" : "black";
}

export interface Pocket {
  /** Index in the physical ring (0 = at angle 0). */
  index: number;
  /** Printed roulette number. */
  number: number;
  color: PocketColor;
  /** Angle (radians) of the pocket center in wheel-local space, CCW from +X. */
  angle: number;
}

/**
 * Build the 37 pocket definitions arranged evenly around the ring.
 * Pocket `index` i sits at angle i * (2π / 37).
 */
export function buildPockets(): Pocket[] {
  const step = (Math.PI * 2) / POCKET_COUNT;
  return EUROPEAN_ORDER.map((number, index) => ({
    index,
    number,
    color: colorForNumber(number),
    angle: index * step,
  }));
}

export const POCKETS = buildPockets();
export const POCKET_ANGLE = (Math.PI * 2) / POCKET_COUNT;
