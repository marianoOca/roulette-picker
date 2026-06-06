"use client";

import { forwardRef, useMemo } from "react";
import {
  RigidBody,
  MeshCollider,
  TrimeshCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import { Text } from "@react-three/drei";
import { DoubleSide, LatheGeometry } from "three";
import { POCKETS, POCKET_ANGLE } from "@/lib/rouletteOrder";
import { POKET_PALETTE } from "@/lib/colors";
import { SCENE } from "@/lib/scene";
import { R, Y, E_SLOPE_DEG, rotorHeadPoints, rotorCollisionPoints } from "@/lib/profile";
import { makeBurlTexture } from "@/lib/woodTexture";
import Frets from "./Frets";
import Turret from "./Turret";

const NUM_RADIUS = (R.F + R.E) / 2; // numbers centered on the E band
// E-band surface height at the number radius, and the band's tilt, so the
// numbers lie flush on the slope (no z-fighting with the colored band).
const NUM_SURFACE_Y =
  Y.pocketWall + ((NUM_RADIUS - R.F) / (R.E - R.F)) * (Y.Eouter - Y.pocketWall);
const NUM_SLOPE = (E_SLOPE_DEG * Math.PI) / 180;

const N_I = 8;
const I_STRIP_W = 0.04;
const I_MID_R = (R.J + R.I) / 2;
const I_POS_Y = (Y.towerBase + Y.RI) / 2;
const I_SLOPE_RAD = Math.atan2(Y.towerBase - Y.RI, R.I - R.J);
const I_TRUE_LEN = (R.I - R.J) / Math.cos(I_SLOPE_RAD);

/**
 * The spinning rotor (wheel head). Burl inner bowl + pocket floor + sloped
 * number band (one lathe), with per-pocket matte colored cells (flat G floor +
 * sloped E band) following the lathe surface, brass ring walls, white numbers
 * on the E band, gold frets, and the central tower. Sections I–J of the
 * blueprint radial profile (lib/profile.ts). Kinematic-position body.
 */
const RouletteWheel = forwardRef<RapierRigidBody>(function RouletteWheel(_props, ref) {
  const burl = useMemo(() => makeBurlTexture(), []);
  const headPts = useMemo(() => rotorHeadPoints(), []);
  const basin = useMemo(() => {
    const g = new LatheGeometry(rotorCollisionPoints(), 128);
    const vertices = g.attributes.position.array as Float32Array;
    const orig = g.index!.array as Uint32Array;
    // Two-sided: duplicate with reversed winding so balls can't pass through from either direction.
    const indices = new Uint32Array(orig.length * 2);
    indices.set(orig, 0);
    for (let i = 0; i < orig.length; i += 3) {
      indices[orig.length + i]     = orig[i + 2];
      indices[orig.length + i + 1] = orig[i + 1];
      indices[orig.length + i + 2] = orig[i];
    }
    return { vertices, indices };
  }, []);

  // F section — two equal radial halves (ceiling view):
  //   inner half (R.G → midF): vertical wall, sits at pocket floor outer edge
  //   outer half (midF → R.F): slope at same angle as E, top contacts E band bottom
  const fShape = useMemo(() => {
    const halfF = (R.F - R.G) / 2;
    const midF = R.G + halfF;
    const slopeRise = halfF * Math.tan((E_SLOPE_DEG * Math.PI) / 180);
    const yConnect = Y.pocketWall - slopeRise; // junction wall-top / slope-base
    return { midF, yConnect, slopeRise };
  }, []);

  // H section — two equal radial halves (ceiling view):
  //   outer half (midH → R.H): vertical wall, outer face touches G inner edge
  //   inner half (R.I → midH): slope matching I bowl, rises to Y.RI at R.I (seamless)
  // slopeRise derived from Y.RI exported by profile.ts — same angle as burl cone.
  const hShape = useMemo(() => {
    const halfH = (R.H - R.I) / 2;
    const midH = R.I + halfH;
    const slopeRise = Y.RI - Y.hWallTop; // Y difference: H wall top → burl cone contact
    return { midH, slopeRise };
  }, []);

  return (
    <RigidBody
      ref={ref}
      type="kinematicPosition"
      colliders={false}
      friction={0.2}
      restitution={0.1}
    >
      {/* ── physics ── */}
      {/* Basin trimesh — coincides with the visible inner surface (cone, H, floor,
          F, lower E band) so balls never trespass and there is no invisible wall.
          Built explicitly (NOT via MeshCollider, which skips invisible meshes).
          Outer containment is the R.G wall in Frets.tsx. */}
      <TrimeshCollider args={[basin.vertices, basin.indices]} />

      {/* ── burl head surface (inner bowl + floor + number-band slope) ── */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[headPts, 128]} />
        <meshPhysicalMaterial
          map={burl}
          color="#b06a32"
          roughness={0.42}
          clearcoat={1}
          clearcoatRoughness={0.13}
          envMapIntensity={1.5}
          side={DoubleSide}
        />
      </mesh>


      {/* I — gold radial strips painted on cone surface, zero thickness */}
      {Array.from({ length: N_I }, (_, i) => {
        const a = (i / N_I) * Math.PI * 2;
        return (
          <group
            key={`i-strip-${i}`}
            position={[Math.cos(a) * I_MID_R, I_POS_Y, Math.sin(a) * I_MID_R]}
            rotation={[0, -a, 0]}
          >
            <group rotation={[0, 0, -I_SLOPE_RAD]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[I_TRUE_LEN, I_STRIP_W]} />
                <meshStandardMaterial
                  color="#cda842"
                  metalness={1}
                  roughness={0.16}
                  side={2}
                  polygonOffset
                  polygonOffsetFactor={-4}
                  polygonOffsetUnits={-4}
                />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* dark underside disc so the open lathe / pocket gaps never show through */}
      <mesh position={[0, Y.floor - 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R.E, 96]} />
        <meshStandardMaterial color="#160b04" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* central tower — hull collider is solid/seam-free on kinematic bodies */}
      <group position={[0, Y.towerBase, 0]} scale={SCENE.towerBaseRadius}>
        <MeshCollider type="hull">
          <Turret />
        </MeshCollider>
      </group>

      {/* ── colored pockets: flat G floor + sloped E band, per pocket ── */}
      {POCKETS.map((p) => {
        const hex = POKET_PALETTE[p.color];
        const ringStart = -p.angle - POCKET_ANGLE / 2;
        const cylStart = Math.PI / 2 - p.angle - POCKET_ANGLE / 2;
        return (
          <group key={`pocket-${p.index}`}>
            {/* flat floor — from H_wall midpoint outward to F; burl cone ends at R.I so no z-fight */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y.floor + 0.004, 0]}>
              <ringGeometry args={[hShape.midH, R.F, 1, 1, ringStart, POCKET_ANGLE]} />
              <meshStandardMaterial color={hex} metalness={0} roughness={0.92} side={DoubleSide} />
            </mesh>
            {/* sloped number band (E) */}
            <mesh position={[0, (Y.pocketWall + Y.Eouter) / 2, 0]}>
              <cylinderGeometry
                args={[R.E, R.F, Y.Eouter - Y.pocketWall, 4, 1, true, cylStart, POCKET_ANGLE]}
              />
              <meshStandardMaterial color={hex} metalness={0} roughness={0.92} side={DoubleSide} />
            </mesh>
          </group>
        );
      })}

      {/* H outer half — vertical wall from floor to hWallTop (flush with strip inner edge) */}
      <mesh position={[0, (Y.floor + Y.hWallTop) / 2, 0]}>
        <cylinderGeometry args={[hShape.midH, hShape.midH, Y.hWallTop - Y.floor, 160, 1, true]} />
        <meshStandardMaterial color="#cda842" metalness={1} roughness={0.16} side={DoubleSide} />
      </mesh>
      {/* H inner half — slope rising from hWallTop up to burl cone at Y.RI */}
      <mesh position={[0, Y.hWallTop + hShape.slopeRise / 2, 0]}>
        <cylinderGeometry args={[R.I, hShape.midH, hShape.slopeRise, 160, 1, true]} />
        <meshStandardMaterial color="#cda842" metalness={1} roughness={0.16} side={DoubleSide} />
      </mesh>
      {/* F inner half — vertical wall from floor to junction (at midF radius, inner face ~R.G) */}
      <mesh position={[0, (Y.floor + fShape.yConnect) / 2, 0]}>
        <cylinderGeometry args={[fShape.midF, fShape.midF, fShape.yConnect - Y.floor, 160, 1, true]} />
        <meshStandardMaterial color="#cda842" metalness={1} roughness={0.16} side={DoubleSide} />
      </mesh>
      {/* F outer half — slope matching E angle, from junction up to E band bottom */}
      <mesh position={[0, (fShape.yConnect + Y.pocketWall) / 2, 0]}>
        <cylinderGeometry args={[R.F, fShape.midF, fShape.slopeRise, 160, 1, true]} />
        <meshStandardMaterial color="#cda842" metalness={1} roughness={0.16} side={DoubleSide} />
      </mesh>

      {/* ── printed numbers, tilted to lie flush on the sloped E band ── */}
      {POCKETS.map((p) => {
        const x = Math.cos(p.angle) * NUM_RADIUS;
        const z = Math.sin(p.angle) * NUM_RADIUS;
        return (
          <group
            key={`num-${p.index}`}
            position={[x, NUM_SURFACE_Y + 0.001, z]}
            rotation={[0, -p.angle, 0]}
          >
            <group rotation={[0, 0, NUM_SLOPE]}>
              <Text
                rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
                fontSize={0.2}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.008}
                outlineColor="#000000"
                material-polygonOffset
                material-polygonOffsetFactor={-4}
                material-polygonOffsetUnits={-4}
              >
                {p.number}
              </Text>
            </group>
          </group>
        );
      })}

      <Frets />
    </RigidBody>
  );
});

export default RouletteWheel;
