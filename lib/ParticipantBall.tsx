"use client";

import { RigidBody, BallCollider, type RapierRigidBody } from "@react-three/rapier";
import { Billboard, Text } from "@react-three/drei";
import { SCENE } from "@/lib/scene";

export interface BallSpawn {
  id: string;
  name: string;
  color: string;
  /** Initial world position. */
  position: [number, number, number];
  /** Initial linear velocity. */
  velocity: [number, number, number];
}

export default function ParticipantBall({
  spawn,
  registerRef,
  highlight,
  restitution,
}: {
  spawn: BallSpawn;
  registerRef: (id: string, body: RapierRigidBody | null) => void;
  highlight: boolean;
  restitution: number;
}) {
  const r = SCENE.ballRadius;
  return (
    <RigidBody
      ref={(b) => registerRef(spawn.id, b)}
      colliders={false}
      position={spawn.position}
      linearVelocity={spawn.velocity}
      friction={0.2}
      restitution={restitution}
      linearDamping={0.4}
      angularDamping={0.3}
      ccd
    >
      <BallCollider args={[r]} />
      <mesh castShadow>
        <sphereGeometry args={[r, 32, 32]} />
        <meshPhysicalMaterial
          color={spawn.color}
          metalness={0.1}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.08}
          emissive={highlight ? spawn.color : "#000000"}
          emissiveIntensity={highlight ? 0.7 : 0}
        />
      </mesh>
      <Billboard position={[0, r + 0.55, 0]}>
        <Text
          fontSize={0.45}
          color="#fefefe"
          outlineWidth={0.035}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {spawn.name}
        </Text>
      </Billboard>
    </RigidBody>
  );
}
