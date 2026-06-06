"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { MM, WHEEL_POS } from "@/betting-table/layout";

// Table center in world space — wheel is at origin, table is offset from it.
const CX = -WHEEL_POS.x * MM; // ≈ 7.96
const CZ = WHEEL_POS.y * MM; // ≈ 3.77

export default function SceneLights() {
  return (
    <>
      <Environment resolution={256} environmentIntensity={3}>
        <Lightformer form="circle" intensity={10} color="#fff4dc"
          position={[CX + 5, 8, CZ + 6]} rotation={[Math.PI / 2, 0, 0]} scale={14} />
        <Lightformer form="rect" intensity={6} color="#ffd27a"
          position={[CX - 9, 5, CZ + 6]} rotation={[0, Math.PI / 3, 0]} scale={[10, 8, 1]} />
        <Lightformer form="rect" intensity={5} color="#ffe6b0"
          position={[CX + 9, 5, CZ - 4]} rotation={[0, -Math.PI / 3, 0]} scale={[10, 8, 1]} />
        <Lightformer form="rect" intensity={3.5} color="#cfe0ff"
          position={[CX, 4, CZ - 10]} rotation={[0, Math.PI, 0]} scale={[12, 6, 1]} />
      </Environment>

      {/* Key casino lamp centered over table */}
      <spotLight
        position={[CX, 20, CZ]}
        angle={0.7}
        penumbra={0.6}
        intensity={20}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        color="#fff8e7"
      />
      {/* Side fills */}
      <spotLight position={[CX - 9, 14, CZ + 7]} angle={0.6} penumbra={0.8} intensity={8} color="#ffd580" />
      <spotLight position={[CX + 9, 14, CZ - 5]} angle={0.6} penumbra={0.8} intensity={6} color="#ffe8a0" />
      {/* Rim from below back */}
      <pointLight position={[CX, -1.5, CZ - 7]} intensity={2.5} color="#1a4a2a" />
      <ambientLight intensity={1.5} color="#fff4d6" />
    </>
  );
}
