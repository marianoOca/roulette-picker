"use client";

/**
 * Pocket separators (frets) and the outer containing wall.
 * Rendered as children of the rotor RigidBody so they spin with the wheel.
 * Each is both a visible mesh and a Rapier collider.
 */

import { CuboidCollider } from "@react-three/rapier";
import { POCKETS, POCKET_ANGLE } from "@/lib/rouletteOrder";
import { SCENE } from "@/lib/scene";

const WALL_SEGMENTS = 60;

export default function Frets() {
  const midRadius = (SCENE.hubRadius + SCENE.rimRadius) / 2;
  const radialLen = SCENE.rimRadius - SCENE.hubRadius;
  const fh = SCENE.fretHeight;
  const ft = SCENE.fretThickness;

  return (
    <group>
      {/* Radial frets between adjacent pockets. */}
      {POCKETS.map((p) => {
        const a = p.angle - POCKET_ANGLE / 2;
        const x = Math.cos(a) * midRadius;
        const z = Math.sin(a) * midRadius;
        return (
          <group key={`fret-${p.index}`} position={[x, fh / 2, z]} rotation={[0, -a, 0]}>
            <CuboidCollider args={[radialLen / 2, fh / 2, ft / 2]} />
            <mesh castShadow>
              <boxGeometry args={[radialLen, fh, ft]} />
              <meshStandardMaterial color="#cdb46a" metalness={0.85} roughness={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* Outer wall ring (segmented boxes). */}
      {Array.from({ length: WALL_SEGMENTS }).map((_, i) => {
        const a = (i / WALL_SEGMENTS) * Math.PI * 2;
        const segLen = ((Math.PI * 2 * SCENE.rimRadius) / WALL_SEGMENTS) * 1.15;
        const wallH = 1.1;
        const x = Math.cos(a) * SCENE.rimRadius;
        const z = Math.sin(a) * SCENE.rimRadius;
        return (
          <group
            key={`wall-${i}`}
            position={[x, wallH / 2, z]}
            rotation={[0, -a - Math.PI / 2, 0]}
          >
            <CuboidCollider args={[segLen / 2, wallH / 2, 0.12]} />
            <mesh>
              <boxGeometry args={[segLen, wallH, 0.24]} />
              <meshStandardMaterial color="#7a3b12" metalness={0.4} roughness={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
