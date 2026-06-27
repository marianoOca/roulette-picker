"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import SceneLights from "@/lib/SceneLights";
import { Physics, type RapierRigidBody } from "@react-three/rapier";
import { Quaternion, Vector3 } from "three";
import RouletteWheel from "./RouletteWheel";
import ParticipantBall, { type BallSpawn } from "@/lib/ParticipantBall";
import RouletteTable from "@/betting-table/Table";
import { SCENE, WHEEL_GEOMETRY_V1 } from "@/lib/scene";
import { secureRandomFloat } from "@/lib/spin";
import { resolveWinner, type BallState, type SpinResult } from "@/lib/settle";
import type { SectionKey } from "@/lib/profile";
import config from "@/lib/config";

export type Phase = "idle" | "dropping" | "settling" | "resolved";

export interface Participant {
  id: string;
  name: string;
  color: string;
}

const V1_WHEEL_SCALE = 0.5;

const Y_AXIS = new Vector3(0, 1, 0);
const MIN_SETTLE_TIME = 5.0; // s before we even consider resolving
const HARD_TIMEOUT = 11.0; // s — resolve no matter what
const FELL_Y = -1.5; // below the table (felt ≈ -0.165, frame bottom ≈ -1.1) = fell off

function buildSpawns(participants: Participant[]): BallSpawn[] {
  const shuffled = [...participants]
    .map((p) => ({ p, key: secureRandomFloat(0, 1) }))
    .sort((a, b) => a.key - b.key)
    .map(({ p }) => p);

  const layerSep = SCENE.ballRadius * 2 * 1.01;
  const rMin = SCENE.towerBaseRadius * V1_WHEEL_SCALE + 0.05;
  const rMax = SCENE.rimRadius * V1_WHEEL_SCALE - 0.4;

  return shuffled.map((p, i) => {
    const angle = secureRandomFloat(0, Math.PI * 2);
    const radius = secureRandomFloat(rMin, rMax);
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      position: [Math.cos(angle) * radius, SCENE.spawnHeight + i * layerSep, Math.sin(angle) * radius] as [number, number, number],
      velocity: [0, 0, 0] as [number, number, number],
    };
  });
}

function Scene({
  participants,
  spinId,
  phase,
  onResolved,
  onPhaseChange,
  highlightId,
  ballRestitution,
  eggUnlocked,
}: {
  participants: Participant[];
  spinId: number;
  phase: Phase;
  onResolved: (r: SpinResult) => void;
  onPhaseChange: (p: Phase) => void;
  highlightId: string | null;
  ballRestitution: number;
  eggUnlocked: boolean;
}) {
  const rotor = useRef<RapierRigidBody>(null);
  const bodies = useRef<Map<string, RapierRigidBody>>(new Map());
  const angle = useRef(0);
  const omega = useRef(0);
  const elapsed = useRef(0);
  const resolvedFor = useRef<number>(-1);
  const announcedSettling = useRef<number>(-1);
  // Per-ball spin tracking: when it first left the wheel, and whether it fell off.
  const leftAt = useRef<Map<string, number>>(new Map());
  const fellOff = useRef<Set<string>>(new Set());

  const active = phase === "dropping" || phase === "settling";
  const spawns = useMemo(
    () => (active || phase === "resolved" ? buildSpawns(participants) : []),
    // Rebuild only when a fresh spin starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spinId]
  );

  // Reset spin dynamics whenever a new spin begins.
  useEffect(() => {
    if (phase !== "dropping") return;
    elapsed.current = 0;
    resolvedFor.current = -1;
    announcedSettling.current = -1;
    bodies.current.clear();
    leftAt.current.clear();
    fellOff.current.clear();
    const dir = Math.random() < 0.5 ? 1 : -1;
    omega.current = dir * secureRandomFloat(6.5, 9.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId, phase]);

  const registerRef = (id: string, body: RapierRigidBody | null) => {
    if (body) bodies.current.set(id, body);
    else bodies.current.delete(id);
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);

    // Spin the rotor with exponential decay (only while a spin is live).
    if (active) {
      omega.current *= Math.exp(-0.5 * dt);
    } else {
      omega.current *= Math.exp(-2 * dt);
    }
    angle.current += omega.current * dt;
    if (rotor.current) {
      const q = new Quaternion().setFromAxisAngle(Y_AXIS, angle.current);
      rotor.current.setNextKinematicRotation(q);
    }

    if (!active) return;
    elapsed.current += dt;

    const wheelStopped = Math.abs(omega.current) < 0.08;

    // Announce the settling phase once the wheel has clearly slowed.
    if (
      phase === "dropping" &&
      wheelStopped &&
      elapsed.current > 2 &&
      announcedSettling.current !== spinId
    ) {
      announcedSettling.current = spinId;
      onPhaseChange("settling");
    }

    // All balls at rest? Also record when each ball first leaves the wheel and
    // whether it has dropped below the table (fell off).
    let allRest = true;
    for (const [id, body] of bodies.current.entries()) {
      // A removed body (e.g. roster edited between spins) leaves a dangling
      // handle — calling into it panics Rapier ("unreachable"). Prune & skip.
      if (!body.isValid()) {
        bodies.current.delete(id);
        continue;
      }
      const lv = body.linvel();
      if (Math.hypot(lv.x, lv.y, lv.z) > SCENE.restLinearThreshold) allRest = false;
      const t = body.translation();
      if (t.y < FELL_Y) fellOff.current.add(id);
      if (!leftAt.current.has(id) && Math.hypot(t.x, t.z) > WHEEL_GEOMETRY_V1.houseRadius) {
        leftAt.current.set(id, elapsed.current);
      }
    }

    const settledNaturally =
      elapsed.current > MIN_SETTLE_TIME && wheelStopped && allRest;
    const timedOut = elapsed.current > HARD_TIMEOUT * (eggUnlocked ? 3 : 1);

    if ((settledNaturally || timedOut) && resolvedFor.current !== spinId) {
      resolvedFor.current = spinId;
      const balls: BallState[] = participants.map((p) => {
        const body = bodies.current.get(p.id);
        const t = body && body.isValid() ? body.translation() : { x: 0, y: 0, z: 0 };
        return {
          id: p.id,
          name: p.name,
          color: p.color,
          position: { x: t.x, y: t.y, z: t.z },
          leftAt: leftAt.current.get(p.id) ?? null,
          fellOff: fellOff.current.has(p.id),
        };
      });
      // Rotor rotates by +angle about Y; local = world + angle (see settle.ts).
      const result = resolveWinner(balls, -angle.current, WHEEL_GEOMETRY_V1);
      if (result) onResolved(result);
    }
  });

  return (
    <>
      <RouletteTable />
      <group scale={V1_WHEEL_SCALE}>
        <RouletteWheel ref={rotor} />
      </group>
      <group key={spinId}>
        {spawns.map((s) => (
          <ParticipantBall
            key={s.id}
            spawn={s}
            registerRef={registerRef}
            highlight={highlightId === s.id}
            restitution={ballRestitution}
          />
        ))}
      </group>
    </>
  );
}

export default function RouletteCanvas(props: {
  participants: Participant[];
  spinId: number;
  phase: Phase;
  onResolved: (r: SpinResult) => void;
  onPhaseChange: (p: Phase) => void;
  highlightId: string | null;
  ballRestitution: number;
  spawnSections: SectionKey[];
  eggUnlocked: boolean;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 6, 8], fov: 45 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#04130b"]} />
      <fog attach="fog" args={["#04130b", 22, 42]} />

      <SceneLights />

      <Suspense fallback={null}>
        <Physics gravity={[0, -22, 0]} timeStep="vary">
          {/* Full roulette table — frame, felt, betting layout, chips —
              rendered inside Scene so its fell-off sensor reaches Scene's state. */}
          <Scene {...props} />
        </Physics>
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={config.viewMode === "prod" ? 6 : 1}
        maxDistance={config.viewMode === "prod" ? 15 : 40}
        minPolarAngle={0}
        maxPolarAngle={config.viewMode === "prod" ? Math.PI * 0.45 : Math.PI}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  );
}
