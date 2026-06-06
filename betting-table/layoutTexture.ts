/**
 * Paints the printed betting layout onto a single transparent canvas texture.
 * One texture → one plane → no per-cell meshes (keeps the GPU object count low).
 * Client-only (uses document.createElement). Build once and memoize.
 */
import { CanvasTexture, SRGBColorSpace } from "three";
import {
  BETTING_CELLS,
  BETTING_H,
  BETTING_W,
  DIAMOND_H,
  DIAMOND_W,
  LINE_HEX,
  type Cell,
} from "./layout";

const P = 3.5; // px per mm
const LINE_MM = 2; // printed line thickness

function fontPx(c: Cell): number {
  const h = c.h * P;
  switch (c.kind) {
    case "number":
    case "zero":
      return Math.round(h * 0.5);
    case "dozen":
      return Math.round(h * 0.34);
    case "outside":
      return Math.round(h * 0.3);
    case "column":
      return Math.round(c.h * P * 0.24);
    default:
      return Math.round(h * 0.3);
  }
}

/** Cell rect in canvas px (y-flipped: betting +y is up, canvas +y is down). */
function rect(c: Cell) {
  return {
    left: c.x * P,
    top: (BETTING_H - (c.y + c.h)) * P,
    w: c.w * P,
    h: c.h * P,
  };
}

function drawHexZero(ctx: CanvasRenderingContext2D, c: Cell, lw: number) {
  const { left, top, w, h } = rect(c);
  const k = w * 0.45; // point inset
  const midY = top + h / 2;
  ctx.beginPath();
  ctx.moveTo(left, midY);
  ctx.lineTo(left + k, top);
  ctx.lineTo(left + w, top);
  ctx.lineTo(left + w, top + h);
  ctx.lineTo(left + k, top + h);
  ctx.closePath();
  if (c.fill) {
    ctx.fillStyle = c.fill;
    ctx.fill();
  }
  ctx.lineWidth = lw;
  ctx.strokeStyle = LINE_HEX;
  ctx.stroke();
}

function drawDiamond(ctx: CanvasRenderingContext2D, c: Cell) {
  const { left, top, w, h } = rect(c);
  const cx = left + w / 2;
  const cy = top + h / 2;
  const dw = (DIAMOND_W * P) / 2;
  const dh = (DIAMOND_H * P) / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - dh);
  ctx.lineTo(cx + dw, cy);
  ctx.lineTo(cx, cy + dh);
  ctx.lineTo(cx - dw, cy);
  ctx.closePath();
  ctx.fillStyle = c.diamondColor!;
  ctx.fill();
  ctx.lineWidth = LINE_MM * P * 0.7;
  ctx.strokeStyle = LINE_HEX;
  ctx.stroke();
}

function drawLabel(ctx: CanvasRenderingContext2D, c: Cell) {
  if (!c.label) return;
  const { left, top, w, h } = rect(c);
  const cx = left + w / 2;
  const cy = top + h / 2;
  const fs = fontPx(c);
  ctx.font = `bold ${fs}px Georgia, "Playfair Display", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.lineWidth = Math.max(2, fs * 0.09);
  ctx.strokeText(c.label, cx, cy);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(c.label, cx, cy);
}

export function buildLayoutTexture(): CanvasTexture {
  const W = Math.round(BETTING_W * P);
  const H = Math.round(BETTING_H * P);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  const lw = LINE_MM * P;
  const inset = 1.5 * P; // small felt gap so colored tiles read as separate

  for (const c of BETTING_CELLS) {
    if (c.kind === "zero") {
      drawHexZero(ctx, c, lw);
      drawLabel(ctx, c);
      continue;
    }

    const { left, top, w, h } = rect(c);

    // Solid fill (number tiles) inset slightly so the felt shows between tiles.
    if (c.fill) {
      ctx.fillStyle = c.fill;
      ctx.fillRect(left + inset, top + inset, w - 2 * inset, h - 2 * inset);
    }

    // White printed border.
    ctx.lineWidth = lw;
    ctx.strokeStyle = LINE_HEX;
    ctx.strokeRect(left + lw / 2, top + lw / 2, w - lw, h - lw);

    if (c.kind === "diamond") drawDiamond(ctx, c);
    drawLabel(ctx, c);
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}
