"use client";

/**
 * Pocket separators (frets) and the outer containment wall.
 * Children of the rotor RigidBody, so they spin with the wheel.
 *
 * The visible frets are thin gold dividers that lie FLUSH on the pocket
 * surface — a flat strip over the floor (G) and a 20°-tilted strip over the
 * number band (E) — so they separate pockets cleanly without sticking up. Ball
 * separation is handled by invisible cuboid colliders at functional height.
 */

import { useMemo } from "react";
import { MeshStandardMaterial, DoubleSide } from "three";
import { CuboidCollider } from "@react-three/rapier";
import { POCKETS, POCKET_ANGLE } from "@/lib/rouletteOrder";
import { R, Y, E_SLOPE_DEG, POCKET_DEPTH } from "@/lib/profile";

const FT = 0.03; // fret thickness (tangential)
const SLOPE = (E_SLOPE_DEG * Math.PI) / 180;

// Stripe: midH → R.E, tilted at E's slope (12°).
// Top face lies flush on the E cone surface, slope continues inward through G.
// Y_E(r) = Y.pocketWall + (r - R.F) * tan(SLOPE)   [E surface at radius r]
// Box center Y = Y_E(STRIPE_MID_R) − STRIPE_HEIGHT/(2·cos) so top face is on that plane.
const STRIPE_INNER = (R.I + R.H) / 2; // midH
// +POCKET_DEPTH·tan(SLOPE)/2 compensates for top corner being inset due to tilt,
// so the stripe's outer top edge lands exactly at R.E (D/E boundary).
const STRIPE_OUTER = R.E + POCKET_DEPTH * Math.tan(SLOPE) / 2;
const STRIPE_RADIAL = STRIPE_OUTER - STRIPE_INNER;
const STRIPE_LEN = STRIPE_RADIAL / Math.cos(SLOPE);
const STRIPE_MID_R = (STRIPE_INNER + STRIPE_OUTER) / 2;
const STRIPE_HEIGHT = POCKET_DEPTH / Math.cos(SLOPE);
const STRIPE_MID_Y =
  Y.pocketWall + (STRIPE_MID_R - R.F) * Math.tan(SLOPE) - STRIPE_HEIGHT / (2 * Math.cos(SLOPE));

export default function Frets() {
  const gold = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#cda842",
        metalness: 1,
        roughness: 0.16,
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      }),
    []
  );

  return (
    <group>
      {POCKETS.map((p) => {
        const a = p.angle - POCKET_ANGLE / 2; // gap between adjacent pockets
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        return (
          <group key={`fret-${p.index}`}>
            {/* Stripe midH → R.E: box tilted at SLOPE, top face on E cone surface.
                Collider nested in the SAME transform as the blade → identical pose
                (a single euler [0,-a,SLOPE] would skew it and snag balls). */}
            <group
              position={[cosA * STRIPE_MID_R, STRIPE_MID_Y, sinA * STRIPE_MID_R]}
              rotation={[0, -a, 0]}
            >
              <group rotation={[0, 0, SLOPE]}>
                <CuboidCollider args={[STRIPE_LEN / 2, STRIPE_HEIGHT / 2, FT / 2]} />
                <mesh material={gold}>
                  <boxGeometry args={[STRIPE_LEN, STRIPE_HEIGHT, FT]} />
                </mesh>
              </group>
            </group>
          </group>
        );
      })}
    </group>
  );
}
