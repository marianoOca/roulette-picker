"use client";

import { forwardRef } from "react";
import {
  RigidBody,
  CuboidCollider,
  ConeCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import { Text } from "@react-three/drei";
import { POCKETS, POCKET_ANGLE } from "@/lib/rouletteOrder";
import { POKET_PALETTE } from "@/lib/colors";
import { SCENE } from "@/lib/scene";
import Frets from "./Frets";

const CONE_HALF = 1.5;

/**
 * The spinning rotor: central deflector cone, pocket floor, colored pocket
 * wedges, printed numbers, frets, and the outer wall. Driven externally as a
 * kinematic-position body (the parent integrates its Y rotation each frame).
 */
const RouletteWheel = forwardRef<RapierRigidBody>(function RouletteWheel(_props, ref) {
  return (
    <RigidBody
      ref={ref}
      type="kinematicPosition"
      colliders={false}
      friction={0.7}
      restitution={0.15}
    >
      {/* Pocket floor disc */}
      <CuboidCollider args={[SCENE.rimRadius, 0.15, SCENE.rimRadius]} position={[0, -0.15, 0]} />
      <mesh receiveShadow position={[0, -0.15, 0]}>
        <cylinderGeometry args={[SCENE.rimRadius, SCENE.rimRadius + 0.3, 0.3, 64]} />
        <meshStandardMaterial color="#2a1608" metalness={0.5} roughness={0.55} />
      </mesh>

      {/* Central deflector cone (turret) */}
      <ConeCollider args={[CONE_HALF, SCENE.hubRadius]} position={[0, CONE_HALF, 0]} />
      <mesh castShadow position={[0, CONE_HALF, 0]}>
        <coneGeometry args={[SCENE.hubRadius, CONE_HALF * 2, 48]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Decorative spindle tip */}
      <mesh position={[0, CONE_HALF * 2 + 0.2, 0]}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color="#f3e3a3" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Colored pocket wedges (visual bottoms) */}
      {POCKETS.map((p) => (
        <mesh
          key={`wedge-${p.index}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
        >
          <ringGeometry
            args={[
              SCENE.hubRadius,
              SCENE.rimRadius,
              1,
              1,
              -p.angle - POCKET_ANGLE / 2,
              POCKET_ANGLE,
            ]}
          />
          <meshStandardMaterial
            color={POKET_PALETTE[p.color]}
            metalness={0.2}
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* Printed pocket numbers */}
      {POCKETS.map((p) => {
        const r = SCENE.rimRadius - 0.55;
        const x = Math.cos(p.angle) * r;
        const z = Math.sin(p.angle) * r;
        return (
          <Text
            key={`num-${p.index}`}
            position={[x, 0.06, z]}
            rotation={[-Math.PI / 2, 0, -p.angle - Math.PI / 2]}
            fontSize={0.35}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {p.number}
          </Text>
        );
      })}

      <Frets />
    </RigidBody>
  );
});

export default RouletteWheel;
