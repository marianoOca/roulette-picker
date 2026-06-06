"use client";

/**
 * Static outer bowl — blueprint sections D, C, B, A (the part that doesn't
 * spin). Inner → out: brass gold ring (D) → sloped burl wood with brass diamond
 * deflectors (C) → brass chamfer (B) → tall dark-walnut outer wall/rim (A).
 * Built as per-section cone-bands + a walnut rim lathe so each material reads
 * correctly. Purely visual; ball containment is the rotor's wall collider.
 */

import { useMemo } from "react";
import { Vector2, LatheGeometry } from "three";
import { RigidBody, TrimeshCollider, MeshCollider } from "@react-three/rapier";
import { R, Y, bowlCollisionPoints } from "@/lib/profile";
import { makeBurlTexture, makeDarkWoodTexture } from "@/lib/woodTexture";

/** Walnut rim (A): tall heavy vertical wall — inner face up → rounded crown →
 *  outer face down → underside. Stands well above the wood band. */
const RIM_TOP = 1.13; // wall height: previous + visible wall gap added back
const SLOPE_C = (15 * Math.PI) / 180; // outer-wood incline (diamonds sit on it)

// Side gold strip — recessed groove in the outer face of the walnut rim
const SIDE_STRIP_MID_Y = 0.608; // vertical center of the groove (midpoint of outer face 0.205→1.01)
const SIDE_STRIP_HALF = 0.08;   // half-height of the gold band
const SIDE_STRIP_DEPTH = 0.084; // inset depth (creates shadow / perceived depth)
const SIDE_STRIP_BEVEL = 0.022; // chamfer width leading into/out of groove

// Plain base disc beneath the wheel. The outer-wall side gold strip is the
// "guard" reference: its height = SIDE_STRIP_HALF*2 = 0.16.
//   vertical thickness = guard height (0.16) — thin slab
//   radial overhang past the outer wall = 3× the guard (0.48) — "3× as deep" in x/y
const GUARD_H = SIDE_STRIP_HALF * 2; // 0.16
const BASE_TOP = 0.205; // flush with the walnut rim underside
const BASE_DEPTH = GUARD_H; // thickness same as the gold guard
const BASE_BOTTOM = BASE_TOP - BASE_DEPTH;
const BASE_MID = (BASE_TOP + BASE_BOTTOM) / 2;
const BASE_R = R.A - GUARD_H * 3;

function rimPoints(): Vector2[] {
  const gT = SIDE_STRIP_MID_Y + SIDE_STRIP_HALF; // groove top Y
  const gB = SIDE_STRIP_MID_Y - SIDE_STRIP_HALF; // groove bottom Y
  return [
    new Vector2(R.B, Y.Bouter), // inner foot
    new Vector2(R.B + 0.03, Y.Bouter + 0.28), // inner face rises
    new Vector2(R.B + 0.03, RIM_TOP - 0.12), // tall vertical inner wall
    new Vector2(R.B + 0.14, RIM_TOP), // rounded crown inner
    new Vector2(R.A - 0.08, RIM_TOP), // crown
    new Vector2(R.A, RIM_TOP - 0.12), // rounded outer top
    // groove cut into outer face
    new Vector2(R.A, gT + SIDE_STRIP_BEVEL),              // wall above groove
    new Vector2(R.A - SIDE_STRIP_DEPTH, gT),              // chamfer → groove top
    new Vector2(R.A - SIDE_STRIP_DEPTH, gB),              // groove floor
    new Vector2(R.A, gB - SIDE_STRIP_BEVEL),              // chamfer → wall below
    new Vector2(R.A, 0.205), // outer bottom (raised to halve outer wall height)
    new Vector2(R.B - 0.1, 0.205), // underside
  ];
}

const N = 8; // number of gold strips / diamonds
const SEG_THETA = (Math.PI * 2) / N; // 45° per segment
// Gold strip tangential width matched to prior box (0.04 units at C midpoint).
// Each strip is a sector wedge at the same surface level as the wood — no z-fighting.
const GOLD_THETA = 0.04 / ((R.C + R.D) / 2);
const WOOD_THETA = SEG_THETA - GOLD_THETA;

// Precompute per-segment angle ranges (gold centered between diamonds)
const SECTORS = Array.from({ length: N }, (_, i) => {
  const center = ((i + 0.5) / N) * Math.PI * 2;
  return { goldStart: center - GOLD_THETA / 2, woodStart: center + GOLD_THETA / 2 };
});

const DIAMONDS = Array.from({ length: N });

export default function RouletteBowl() {
  const burl = useMemo(() => makeBurlTexture(), []);
  const darkWood = useMemo(() => makeDarkWoodTexture(), []);
  const rim = useMemo(() => rimPoints(), []);
  const bowlCol = useMemo(() => {
    const g = new LatheGeometry(bowlCollisionPoints(), 160);
    return {
      vertices: g.attributes.position.array as Float32Array,
      indices: g.index!.array as Uint32Array,
    };
  }, []);

  // diamonds sit on the C slope at mid-C radius
  const diamondR = (R.D + R.C) / 2;
  const diamondSurfY = (Y.Douter + Y.Couter) / 2;

  const heightC = Y.Couter - Y.Douter;
  const posYC = (Y.Douter + Y.Couter) / 2;
  const heightB = Y.Bouter - Y.Couter;
  const posYB = (Y.Couter + Y.Bouter) / 2;

  return (
    <group>
      {/* D — brass gold ring */}
      <mesh position={[0, (Y.Eouter + Y.Douter) / 2, 0]}>
        <cylinderGeometry args={[R.D, R.E, Y.Douter - Y.Eouter, 160, 1, true]} />
        <meshStandardMaterial color="#cda842" metalness={1} roughness={0.16} side={2} />
      </mesh>

      {/* B — brass chamfer base (rendered first so wood sectors draw on top) */}
      <mesh position={[0, posYB, 0]}>
        <cylinderGeometry args={[R.B, R.C, heightB, 160, 1, true]} />
        <meshStandardMaterial color="#cda842" metalness={1} roughness={0.18} side={2} />
      </mesh>

      {/* C — alternating gold/wood sectors (strips flush with wood surface) */}
      {/* B wood sectors overlay the brass chamfer, creating strip/wood/strip pattern */}
      {SECTORS.map(({ goldStart, woodStart }, i) => (
        <group key={`sector-${i}`}>
          {/* C gold strip */}
          <mesh position={[0, posYC, 0]}>
            <cylinderGeometry args={[R.C, R.D, heightC, 3, 1, true, goldStart, GOLD_THETA]} />
            <meshStandardMaterial color="#cda842" metalness={1} roughness={0.16} side={2} />
          </mesh>
          {/* C wood sector */}
          <mesh receiveShadow position={[0, posYC, 0]}>
            <cylinderGeometry args={[R.C, R.D, heightC, 18, 1, true, woodStart, WOOD_THETA]} />
            <meshPhysicalMaterial
              map={burl}
              color="#b06a32"
              roughness={0.4}
              clearcoat={1}
              clearcoatRoughness={0.13}
              envMapIntensity={1.5}
              side={2}
            />
          </mesh>
        </group>
      ))}

      {/* A — dark walnut outer wall / rim */}
      <mesh receiveShadow castShadow>
        <latheGeometry args={[rim, 160]} />
        <meshPhysicalMaterial
          map={darkWood}
          color="#3a1d0e"
          metalness={0}
          roughness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.14}
          envMapIntensity={1.1}
          side={2}
        />
      </mesh>

      {/* side gold strip — fills the recessed groove in the outer face */}
      <mesh position={[0, SIDE_STRIP_MID_Y, 0]}>
        <cylinderGeometry
          args={[R.A - SIDE_STRIP_DEPTH + 0.002, R.A - SIDE_STRIP_DEPTH + 0.002, SIDE_STRIP_HALF * 2, 160, 1, true]}
        />
        <meshStandardMaterial color="#cda842" metalness={1} roughness={0.12} side={2} />
      </mesh>

      {/* gold pinstripe on the rim crown */}
      <mesh position={[0, RIM_TOP + 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[R.A - 0.42, R.A - 0.34, 160]} />
        <meshStandardMaterial color="#cda842" metalness={1} roughness={0.16} />
      </mesh>

      {/* Base disc — plain dark walnut disc under the wheel */}
      <mesh receiveShadow castShadow position={[0, BASE_MID, 0]}>
        <cylinderGeometry args={[BASE_R, BASE_R, BASE_DEPTH, 160]} />
        <meshPhysicalMaterial
          map={darkWood}
          color="#3a1d0e"
          metalness={0}
          roughness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.14}
          envMapIntensity={1.1}
          side={2}
        />
      </mesh>

      {/* Static bowl physics — trimesh surface (D, C, B, A) + diamond deflectors,
          all on one fixed body. */}
      <RigidBody type="fixed" colliders={false}>
        <TrimeshCollider args={[bowlCol.vertices, bowlCol.indices]} />

        {/* brass diamond deflectors — pyramid (cone 4-seg) sitting flat ON the slope.
            Each wrapped in a hull collider → exact convex match (bakes scale + tilt). */}
        {DIAMONDS.map((_, i) => {
          const a = (i / N) * Math.PI * 2;
          const tangential = i % 2 === 0; // "–" long axis tangential; "|" radial
          const W = tangential ? 0.14 : 0.22;
          const D = tangential ? 0.22 : 0.14;
          const H = 0.07;
          return (
            <group
              key={`diamond-${i}`}
              position={[Math.cos(a) * diamondR, diamondSurfY + 0.004, Math.sin(a) * diamondR]}
              rotation={[0, -a, 0]}
            >
              <group rotation={[0, 0, SLOPE_C]}>
                <MeshCollider type="hull">
                  <mesh castShadow position={[0, H / 2, 0]} scale={[W, H, D]}>
                    <coneGeometry args={[0.707, 1, 4, 1]} />
                    <meshStandardMaterial color="#cda842" metalness={1} roughness={0.14} />
                  </mesh>
                </MeshCollider>
              </group>
            </group>
          );
        })}
      </RigidBody>
    </group>
  );
}
