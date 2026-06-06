"use client";

/**
 * Central tower / spindle — blueprint "TOWER / SPINDLE (NO CROSS)".
 *
 * Built as ONE lathe-revolved silhouette so the profile matches the drawing
 * exactly: a wide base plate → five rounded stepped discs (ziggurat) → a thin
 * neck → a flattened onion bulb → a small nub. Uniform polished brass; the step
 * grooves self-shadow to give the layered look. Spins with the rotor.
 *
 * Profile is normalized to base radius = 1.0, total height ≈ 2.25. The parent
 * scales it to the cone-top radius.
 */

import { useMemo } from "react";
import { Vector2 } from "three";

// [radius, y] cross-section points, bottom → top, revolved about Y.
// Built from the user's exact pixel measurements of the blueprint front view.
// widths 1..11 (diam px) ÷102 = radius; heights 1..13 (px) cumulated ÷51 = y.
// Structure: base plate + 5 discs → tall narrow shaft → wide collar → thin neck
// → capsule ball (dome + straight mid-band + dome). Disc edges crisp; ball round.
const PROFILE: [number, number][] = [
  [0.0, 0.0],

  // disc 1 — base plate  (w102 h11)
  [1.0, 0.0],
  [1.0, 0.216],
  // disc 2  (w83 h12)
  [0.814, 0.216],
  [0.814, 0.451],
  // disc 3  (w71 h13)
  [0.696, 0.451],
  [0.696, 0.706],
  // disc 4  (w63 h13)
  [0.618, 0.706],
  [0.618, 0.961],
  // disc 5  (w52 h12)
  [0.51, 0.961],
  [0.51, 1.196],
  // disc 6  (w43 h13)
  [0.422, 1.196],
  [0.422, 1.451],
  // disc 7 — tall narrow shaft  (w35 h18)
  [0.343, 1.451],
  [0.343, 1.804],
  // disc 8  (w34 h5)
  [0.333, 1.804],
  [0.333, 1.902],
  // disc 9 — wide collar  (w52 h11)
  [0.51, 1.902],
  [0.51, 2.118],
  // disc 10 — thin neck  (w25 h4)
  [0.245, 2.118],
  [0.245, 2.196],

  // ball — capsule: lower dome (h4) → straight band (h5) → upper dome (h8); band w40
  [0.33, 2.235],
  [0.392, 2.275],
  [0.392, 2.373],
  [0.37, 2.42],
  [0.3, 2.47],
  [0.18, 2.51],
  [0.0, 2.529],
];

export default function Turret() {
  const points = useMemo(() => PROFILE.map(([r, y]) => new Vector2(r, y)), []);

  return (
    <mesh castShadow receiveShadow>
      <latheGeometry args={[points, 128]} />
      <meshStandardMaterial color="#c8a13c" metalness={1} roughness={0.3} envMapIntensity={1.2} />
    </mesh>
  );
}
