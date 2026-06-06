"use client";

/**
 * Full 3D roulette table — dark-walnut framed felt with the printed betting
 * layout and a chip cluster. Static scenery (no colliders). Shared by both
 * canvases so it renders identically for v1 and v2.
 *
 * Built flat in table-local space (mm · MM) inside a group rotated
 * [-PI/2, 0, 0] (local XY → world XZ, local +z → world up). The group is placed
 * so the existing wheel (at world origin) lands at the spec's wheel position,
 * i.e. embedded in the table's left region.
 *
 * Mesh budget is deliberately tiny (frame + felt + 1 layout texture + 7 chips)
 * — an earlier per-cell + Text version caused WebGL context loss.
 *
 * Physics: frame and felt have fixed trimesh colliders so balls land on them.
 */
import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import {
  CanvasTexture,
  ExtrudeGeometry,
  MeshStandardMaterial,
  Path,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
} from "three";
import { makeDarkWoodTexture } from "@/lib/woodTexture";
import { R } from "@/lib/profile";
import { buildLayoutTexture } from "./layoutTexture";
import {
  BETTING_H,
  BETTING_W,
  CHIP_DIA,
  CHIP_THICK,
  CHIPS,
  CHIP_BLACK,
  CHIP_RED,
  CHIP_WHITE,
  CHIP_VIOLET,
  CHIP_CLUSTER,
  CORNER_R,
  FELT_H,
  FELT_HEX,
  FELT_INSET,
  FELT_W,
  FRAME_BORDER,
  LAYOUT_CENTER,
  MM,
  TABLE_H,
  TABLE_THICK,
  TABLE_W,
  WHEEL_POS,
} from "./layout";

// Elevate table so its frame top meets the wheel's base-disc bottom.
// Base disc bottom (RouletteBowl) = BASE_TOP(0.205) - GUARD_H(0.16) = 0.045.
// frame top = FELT_Y + FELT_INSET*MM, so solve for FELT_Y to land the top there.
const BASE_DISC_BOTTOM = 0.045;
const FELT_Y = BASE_DISC_BOTTOM - FELT_INSET * MM; // world height of the felt

// Group placement: solve so the wheel (world origin) sits at WHEEL_POS.
const TX = -WHEEL_POS.x * MM;
const TZ = WHEEL_POS.y * MM;

const FRAME_DEPTH = TABLE_THICK * MM;
const FELT_Z = FRAME_DEPTH - FELT_INSET * MM; // felt sits FELT_INSET below frame top
const LAYOUT_Z = FELT_Z + 0.012;
const CHIP_H = CHIP_THICK * MM;

// Top-left corner cut: top + left frame borders move inward to slice a quarter
// of the wheel's radius (r/4) past its top/left edges, so the wheel bulges out
// of a 45°-beveled corner. Cuts are shared by the frame outer, the felt hole,
// and the felt mesh so the wood border stays uniform. Values in mm.
const WHEEL_R_MM = R.A / MM; // = 380 (spec wheel radius)
const QCUT_MM = WHEEL_R_MM / 4; // quarter-radius slice depth
const TOP_CUT = (TABLE_H / 2 - (WHEEL_POS.y + WHEEL_R_MM - QCUT_MM)) * MM;
const LEFT_CUT = (WHEEL_POS.x - WHEEL_R_MM + QCUT_MM - -TABLE_W / 2) * MM;
const CHAMFER = 90 * MM; // 45° bevel width across the cut corner

// Bottom border raised to sit the same gap from the betting tiles as the moved
// top border does (top-tile gap = TILE_GAP), so top/bottom/right margins match.
const TILE_GAP = (WHEEL_POS.y + WHEEL_R_MM - QCUT_MM) - (LAYOUT_CENTER.y + BETTING_H / 2);
const BOT_CUT = (LAYOUT_CENTER.y - BETTING_H / 2 - TILE_GAP - -TABLE_H / 2) * MM;

/**
 * Centered rounded rect with the TOP-LEFT corner cut: the top edge drops by
 * `topCut`, the left edge moves right by `leftCut`, the bottom edge rises by
 * `botCut`, and the top-left corner is replaced by a 45° `cham` bevel. The
 * three non-cut corners use radius `r`.
 * Works on either a Shape or a Path (same method surface) so the frame outer,
 * the frame hole, and the felt can share one outline. All args in scene units.
 */
function traceCutRect<T extends Shape | Path>(
  p: T,
  w: number,
  h: number,
  r: number,
  leftCut: number,
  topCut: number,
  cham: number,
  botCut: number
): T {
  const xL = -w / 2 + leftCut;
  const xR = w / 2;
  const yT = h / 2 - topCut;
  const yB = -h / 2 + botCut;
  p.moveTo(xL + cham, yT);
  p.lineTo(xR - r, yT);
  p.quadraticCurveTo(xR, yT, xR, yT - r);
  p.lineTo(xR, yB + r);
  p.quadraticCurveTo(xR, yB, xR - r, yB);
  p.lineTo(xL + r, yB);
  p.quadraticCurveTo(xL, yB, xL, yB + r);
  p.lineTo(xL, yT - cham);
  p.lineTo(xL + cham, yT); // 45° bevel back to start
  return p;
}

export default function RouletteTable() {
  // Wooden collar ring around the wheel housing (same mat/height as frame).
  const RING_INNER = R.A + 0.08; // just outside the wheel rim
  const RING_OUTER = RING_INNER + FRAME_BORDER * MM;

  // Extruded ring with the same hard-faced 2·MM bevel as the frame. The circle
  // is traced as an explicit 96-gon (not a single full-circle absarc): the
  // EllipseCurve's coincident start/end vertex makes the bevel offset pinch at
  // θ=0, leaving a notch. A polygonal path bevels cleanly — BUT the closing
  // vertex must NOT be repeated: a duplicate first==last point gives the seam a
  // zero-length edge, so getBevelVec divides by zero (NaN spike). Stop at i<N
  // and let ExtrudeGeometry close the contour itself.
  const ringGeo = useMemo(() => {
    const N = 96;
    const ring = (path: Shape | Path, radius: number) => {
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius;
        i === 0 ? path.moveTo(x, y) : path.lineTo(x, y);
      }
    };
    const shape = new Shape();
    ring(shape, RING_OUTER);
    const hole = new Path();
    ring(hole, RING_INNER - 2.01);
    shape.holes.push(hole);
    return new ExtrudeGeometry(shape, {
      depth: FRAME_DEPTH,
      bevelEnabled: true,
      bevelThickness: 2 * MM,
      bevelSize: 2 * MM,
      bevelSegments: 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const frameGeo = useMemo(() => {
    const outer = traceCutRect(new Shape(), TABLE_W * MM, TABLE_H * MM, CORNER_R * MM, LEFT_CUT, TOP_CUT, CHAMFER, BOT_CUT);
    const innerR = Math.max((CORNER_R - FRAME_BORDER) * MM, 0.04);
    outer.holes.push(traceCutRect(new Path(), FELT_W * MM, FELT_H * MM, innerR, LEFT_CUT, TOP_CUT, CHAMFER, BOT_CUT));
    const g = new ExtrudeGeometry(outer, {
      depth: FRAME_DEPTH,
      bevelEnabled: true,
      bevelThickness: 2 * MM,
      bevelSize: 2 * MM,
      bevelSegments: 1,
    });
    return g;
  }, []);

  const feltGeo = useMemo(
    () =>
      new ShapeGeometry(
        traceCutRect(new Shape(), FELT_W * MM, FELT_H * MM, Math.max((CORNER_R - FRAME_BORDER) * MM, 0.04), LEFT_CUT, TOP_CUT, CHAMFER, BOT_CUT)
      ),
    []
  );

  const layoutTex = useMemo<CanvasTexture>(() => buildLayoutTexture(), []);
  const layoutGeo = useMemo(() => new PlaneGeometry(BETTING_W * MM, BETTING_H * MM), []);

  const woodMat = useMemo(() => {
    const map = makeDarkWoodTexture();
    map.repeat.set(2, 1);
    return new MeshStandardMaterial({ map, roughness: 0.5, metalness: 0.15 });
  }, []);
  const feltMat = useMemo(
    () => new MeshStandardMaterial({ color: FELT_HEX, roughness: 0.95, metalness: 0 }),
    []
  );
  const layoutMat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: layoutTex,
        transparent: true,
        roughness: 0.9,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    [layoutTex]
  );

  const chipMats = useMemo<Record<string, MeshStandardMaterial>>(
    () => ({
      [CHIP_RED]: new MeshStandardMaterial({ color: CHIP_RED, roughness: 0.5 }),
      [CHIP_BLACK]: new MeshStandardMaterial({ color: CHIP_BLACK, roughness: 0.5 }),
      [CHIP_WHITE]: new MeshStandardMaterial({ color: CHIP_WHITE, roughness: 0.5 }),
      [CHIP_VIOLET]: new MeshStandardMaterial({ color: CHIP_VIOLET, roughness: 0.5 }),
    }),
    []
  );

  const chipR = (CHIP_DIA / 2) * MM;

  return (
    <group position={[TX, FELT_Y - FELT_Z, TZ]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Walnut frame */}
      <RigidBody type="fixed" colliders="trimesh">
        <mesh geometry={frameGeo} material={woodMat} castShadow receiveShadow />
      </RigidBody>

      {/* Wooden ring collar around wheel housing — hull (not trimesh) avoids concave corner traps */}
      <RigidBody type="fixed" colliders="hull">
        <mesh
          geometry={ringGeo}
          material={woodMat}
          position={[WHEEL_POS.x * MM, WHEEL_POS.y * MM, 0]}
          castShadow
          receiveShadow
        />
      </RigidBody>

      {/* Felt */}
      <RigidBody type="fixed" colliders="trimesh">
        <mesh geometry={feltGeo} material={feltMat} position={[0, 0, FELT_Z]} receiveShadow />
      </RigidBody>

      {/* Printed betting layout */}
      <mesh
        geometry={layoutGeo}
        material={layoutMat}
        position={[LAYOUT_CENTER.x * MM, LAYOUT_CENTER.y * MM, LAYOUT_Z]}
      />

      {/* Chip cluster */}
      {CHIPS.map((c, i) => {
        const t = (c.tiltDeg * Math.PI) / 180;
        const [ax, , az] = c.tiltAxis;
        // Lift tilted chips so their bottom rim doesn't clip through the felt.
        // For a cylinder tilted by effective angle eff, the rim dips by
        // CHIP_H/2*(1-cos) + chipR*sin below center — raise by that amount.
        const eff = t * Math.sqrt(ax ** 2 + az ** 2);
        const zLift = CHIP_H / 2 * (1 - Math.cos(eff)) + chipR * Math.sin(eff);
        return (
          <RigidBody key={i} type="fixed" colliders="hull">
            <mesh
              material={chipMats[c.color]}
              position={[
                (CHIP_CLUSTER.x + c.dx) * MM,
                (CHIP_CLUSTER.y + c.dy) * MM,
                FELT_Z + CHIP_H / 2 + c.stack * CHIP_H + zLift,
              ]}
              rotation={[Math.PI / 2 + t * ax, 0, t * az]}
              castShadow
            >
              <cylinderGeometry args={[chipR, chipR, CHIP_H, 24]} />
            </mesh>
          </RigidBody>
        );
      })}
    </group>
  );
}
