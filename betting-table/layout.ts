/**
 * Spec-driven data for the full roulette table. Everything here is in
 * MILLIMETRES (the units of the supplied spec). Table.tsx multiplies by `MM`
 * to convert to scene units, anchored so the spec's 760 mm wheel ring matches
 * the existing wheel (rim Ø = 2 * R.A).
 *
 * Two coordinate spaces:
 *   - Table-local (spec): origin = table center, +x right, +y forward. Used for
 *     frame / felt / wheel / layout / chip PLACEMENT.
 *   - Betting-local: origin = bottom-left of the betting bounding box, +x right,
 *     +y up. Used to lay out the printed betting cells. The betting plane is
 *     centered on LAYOUT_CENTER in table-local space.
 */
import { colorForNumber } from "@/lib/rouletteOrder";
import { POKET_PALETTE } from "@/lib/colors";
import { R } from "@/lib/profile";

/** Scene units per mm — spec 760 mm wheel ring ↔ existing wheel rim Ø (2·R.A). */
export const MM = (2 * R.A) / 760; // ≈ 0.010476

// ── Colors ──────────────────────────────────────────────────────────────────
export const FELT_HEX = "#0a5c36"; // casino green
export const FRAME_HEX = "#3a1d0e"; // dark walnut (matches wheel rim)
export const LINE_HEX = "#e8e6d8"; // faded printed white

// ── Table body (spec §§2-3) ───────────────────────────────────────────────────
export const TABLE_W = 2400;
export const TABLE_H = 1400;
export const TABLE_THICK = 110;
export const CORNER_R = 120;
export const FRAME_BORDER = 90;

export const FELT_W = 2220;
export const FELT_H = 1220;
export const FELT_INSET = 20; // felt sits this far below the frame top

// ── Placement (table-local mm) ────────────────────────────────────────────────
export const WHEEL_POS = { x: -760, y: 360 }; // spec §4
export const LAYOUT_CENTER = { x: 370, y: 120 }; // spec §6
export const CHIP_CLUSTER = { x: -268, y: -60 }; // between wheel right edge (-380) and grid left (-156)

// ── Betting layout geometry (spec §§7-8), betting-local mm ────────────────────
const CELL = 74; // number cell edge
const ZERO_W = 90; // zero hexagon width
const GRID_X0 = ZERO_W; // number grid starts right of the zero
const GRID_Y0 = 220; // number rows start above dozens+outside (110+110)
const ROW_H = 110; // dozens / outside row height
const DOZEN_W = 296; // 888 / 3
const OUT_W = 148; // 888 / 6

export const BETTING_W = ZERO_W + 12 * CELL + CELL; // zero + grid + 2-to-1 = 1052
export const BETTING_H = GRID_Y0 + 3 * CELL; // 220 + 222 = 442

export type CellKind =
  | "number"
  | "zero"
  | "column"
  | "dozen"
  | "outside"
  | "diamond";

export interface Cell {
  kind: CellKind;
  /** Bottom-left corner + size, betting-local mm. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Solid fill (number tiles / zero); null = let the felt show through. */
  fill: string | null;
  label?: string;
  diamondColor?: string;
}

function build(): Cell[] {
  const cells: Cell[] = [];

  // Zero — tall hexagon spanning the 3 number rows, far left.
  cells.push({
    kind: "zero",
    x: 0,
    y: GRID_Y0,
    w: ZERO_W,
    h: 3 * CELL,
    fill: POKET_PALETTE.green,
    label: "0",
  });

  // Number grid: column c (1..12) → bottom 3c-2, mid 3c-1, top 3c.
  for (let c = 1; c <= 12; c++) {
    const x = GRID_X0 + (c - 1) * CELL;
    const rows = [
      { y: GRID_Y0, n: 3 * c - 2 }, // bottom
      { y: GRID_Y0 + CELL, n: 3 * c - 1 }, // mid
      { y: GRID_Y0 + 2 * CELL, n: 3 * c }, // top
    ];
    for (const { y, n } of rows) {
      cells.push({
        kind: "number",
        x,
        y,
        w: CELL,
        h: CELL,
        fill: POKET_PALETTE[colorForNumber(n)],
        label: String(n),
      });
    }
  }

  // 2 TO 1 — three column-bet cells right of column 12.
  const colX = GRID_X0 + 12 * CELL;
  for (const y of [GRID_Y0, GRID_Y0 + CELL, GRID_Y0 + 2 * CELL]) {
    cells.push({ kind: "column", x: colX, y, w: CELL, h: CELL, fill: null, label: "2 TO 1" });
  }

  // Dozens — each 296 mm, directly below the grid.
  const dozY = ROW_H;
  ["1ST 12", "2ND 12", "3RD 12"].forEach((label, i) => {
    cells.push({ kind: "dozen", x: GRID_X0 + i * DOZEN_W, y: dozY, w: DOZEN_W, h: ROW_H, fill: null, label });
  });

  // Outside row — six 148 mm cells; positions 2 & 3 are diamonds.
  const outDefs: { label?: string; diamond?: string }[] = [
    { label: "1 TO 18" },
    { label: "EVEN" },
    { diamond: POKET_PALETTE.red },
    { diamond: POKET_PALETTE.black },
    { label: "ODD" },
    { label: "19 TO 36" },
  ];
  outDefs.forEach((d, i) => {
    cells.push({
      kind: d.diamond ? "diamond" : "outside",
      x: GRID_X0 + i * OUT_W,
      y: 0,
      w: OUT_W,
      h: ROW_H,
      fill: null,
      label: d.label,
      diamondColor: d.diamond,
    });
  });

  return cells;
}

export const BETTING_CELLS = build();

export const DIAMOND_W = 60;
export const DIAMOND_H = 45;

// ── Chips (spec §9), offsets from CHIP_CLUSTER in table-local mm ───────────────
export const CHIP_DIA = 55;
export const CHIP_THICK = 5;

export interface ChipSpec {
  dx: number; // offset from cluster center (mm)
  dy: number;
  stack: number; // how many chips already under it (z lift = stack * thickness)
  color: string;
  tiltDeg: number; // small tilt for a casual look
  tiltAxis: [number, number, number];
}

export const CHIP_RED = "#c0212f";
export const CHIP_BLACK = "#1a1a1a";
export const CHIP_WHITE = "#e8e8e8";
export const CHIP_VIOLET = "#7c3aed"; //used for debugging

export const CHIPS: ChipSpec[] = [
  { dx: -40, dy: 30, stack: 0, color: CHIP_BLACK, tiltDeg: 0, tiltAxis: [1, 0, 0] },
  { dx: -40, dy: 30, stack: 1, color: CHIP_RED, tiltDeg: 0, tiltAxis: [1, 0, 0] },
  { dx: 60, dy: 5, stack: 0, color: CHIP_WHITE, tiltDeg: 0, tiltAxis: [1, 0, 0] },
  { dx: 80, dy: -15, stack: 0, color: CHIP_RED, tiltDeg: 12, tiltAxis: [1, 0.4, -.5] },
  { dx: -15, dy: -36, stack: 0, color: CHIP_BLACK, tiltDeg: 8, tiltAxis: [0.5, 0, 1] },
  { dx: 5, dy: -5, stack: 0, color: CHIP_RED, tiltDeg: 0, tiltAxis: [1, 0, 0] },
  { dx: -70, dy: 0, stack: 0, color: CHIP_WHITE, tiltDeg: 15, tiltAxis: [1, 0, 0.3] },
];
