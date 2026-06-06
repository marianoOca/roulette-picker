/**
 * Randomness helpers for the physics roulette.
 *
 * The winner emerges from the simulation (highest-numbered pocket), but we use
 * crypto-grade RNG for everything that *seeds* the run — name→ball shuffle,
 * per-ball spawn jitter — and for the tie-break when the physics is ambiguous.
 */

/** Cryptographically uniform integer in [0, max). Falls back to Math.random. */
export function secureRandomInt(max: number): number {
  if (max <= 0) return 0;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    // Rejection sampling to avoid modulo bias.
    const limit = Math.floor(0xffffffff / max) * max;
    const buf = new Uint32Array(1);
    let x = 0;
    do {
      crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % max;
  }
  return Math.floor(Math.random() * max);
}

/** Uniform float in [min, max) using crypto entropy. */
export function secureRandomFloat(min: number, max: number): number {
  let r: number;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    r = buf[0] / 0x100000000;
  } else {
    r = Math.random();
  }
  return min + r * (max - min);
}

/** Pick one random element. Returns undefined for empty input. */
export function securePick<T>(input: readonly T[]): T | undefined {
  if (input.length === 0) return undefined;
  return input[secureRandomInt(input.length)];
}
