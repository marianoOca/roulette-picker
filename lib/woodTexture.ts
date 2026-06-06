/**
 * Procedural wood textures generated on a 2D canvas at runtime — no external
 * asset files. Burl gets a swirly, blotchy figure; the dark rim gets straight
 * grain. Both are SRGB color maps meant for clearcoat ("varnished") materials.
 *
 * Client-only (uses document.createElement). Build once and memoize.
 */

import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  return [c, ctx];
}

function finish(c: HTMLCanvasElement, repeat = 1): CanvasTexture {
  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.colorSpace = SRGBColorSpace;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  return tex;
}

/** Reddish-orange figured burl with eyes and swirls. */
export function makeBurlTexture(): CanvasTexture {
  const size = 1024;
  const [c, ctx] = canvas(size);

  // Warm base gradient so it's not flat.
  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, "#7c3c16");
  base.addColorStop(0.5, "#8c4a20");
  base.addColorStop(1, "#6e3413");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Layered soft blobs — the burl mottle.
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 6 + Math.random() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const light = Math.random() > 0.45;
    const a = 0.03 + Math.random() * 0.09;
    g.addColorStop(0, light ? `rgba(176,104,46,${a})` : `rgba(56,24,9,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dark "eyes" / knots scattered through the figure.
  for (let i = 0; i < 340; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.8 + Math.random() * 3.2;
    ctx.fillStyle = `rgba(38,16,6,${0.25 + Math.random() * 0.45})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return finish(c, 2);
}

/** Straight-grained dark polished hardwood for the rim. */
export function makeDarkWoodTexture(): CanvasTexture {
  const size = 1024;
  const [c, ctx] = canvas(size);

  ctx.fillStyle = "#3a1d0e";
  ctx.fillRect(0, 0, size, size);

  // Long horizontal grain streaks.
  for (let i = 0; i < 900; i++) {
    const y = Math.random() * size;
    const len = size * (0.3 + Math.random() * 0.7);
    const x = Math.random() * size;
    const w = 0.5 + Math.random() * 2.2;
    const light = Math.random() > 0.5;
    ctx.strokeStyle = light
      ? `rgba(92,52,26,${0.06 + Math.random() * 0.12})`
      : `rgba(20,9,3,${0.08 + Math.random() * 0.16})`;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x + len * 0.33, y + (Math.random() - 0.5) * 6,
      x + len * 0.66, y + (Math.random() - 0.5) * 6,
      x + len, y + (Math.random() - 0.5) * 4
    );
    ctx.stroke();
  }

  return finish(c, 3);
}
