"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SectionKey } from "@/lib/profile";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ── Spawn range slider ──────────────────────────────────────────────
 * Dual-handle slider over 6 stops, outer (Rim) → center. Selecting a band
 * returns the union of every stop's sections; both handles on one stop is
 * allowed (e.g. only J).
 */
const STOPS: SectionKey[][] = [
  ["B"],            // 0 — Rim (outer)
  ["C"],            // 1
  ["D", "E", "F"],  // 2
  ["G"],            // 3
  ["H", "I"],       // 4
  ["J"],            // 5 — Center
];
const LAST = STOPS.length - 1;

function sectionsToRange(value: SectionKey[]): [number, number] {
  const hit = STOPS.map((stop, i) => (stop.some((s) => value.includes(s)) ? i : -1)).filter(
    (i) => i >= 0
  );
  if (hit.length === 0) return [LAST, LAST]; // fallback: J (config default)
  return [Math.min(...hit), Math.max(...hit)];
}

export function SpawnRangeSlider({
  value,
  onChange,
  disabled,
}: {
  value: SectionKey[];
  onChange: (s: SectionKey[]) => void;
  disabled?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragHandle = useRef<"lo" | "hi" | null>(null);
  // Initialize from the incoming value once; the slider is the source of truth after.
  const [[lo, hi], setRange] = useState<[number, number]>(() => sectionsToRange(value));

  const apply = (nextLo: number, nextHi: number) => {
    setRange([nextLo, nextHi]);
    onChange(STOPS.slice(nextLo, nextHi + 1).flat());
  };

  const idxFromEvent = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return Math.round(ratio * LAST);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragHandle.current) return;
    if (e.buttons === 0) { dragHandle.current = null; return; }
    const idx = idxFromEvent(e.clientX);
    if (dragHandle.current === "lo") {
      apply(Math.min(idx, hi), hi);
    } else {
      if (idx < lo) {
        // hi dragged below lo — lo moves, hi anchors at old lo
        apply(idx, lo);
        dragHandle.current = "lo";
      } else {
        apply(lo, idx);
      }
    }
  };

  const startDrag = (handle: "lo" | "hi") => (e: React.PointerEvent) => {
    if (disabled) return;
    dragHandle.current = handle;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const endDrag = (e: React.PointerEvent) => {
    dragHandle.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const pct = (i: number) => `${(i / LAST) * 100}%`;

  return (
    <div className={disabled ? "opacity-40" : undefined}>
      <div className="text-xs uppercase tracking-widest text-white/50">
        <span>Spawn band</span>
      </div>

      <div className="mt-3 px-1">
        <div ref={trackRef} className="relative h-1 rounded-full bg-white/10">
          {/* selected band */}
          <div
            className="absolute top-0 h-1 rounded-full bg-gold/40"
            style={{ left: pct(lo), right: `${100 - (hi / LAST) * 100}%` }}
          />
          {/* thumbs */}
          {(["lo", "hi"] as const).map((h) => (
            <button
              key={h}
              onPointerDown={startDrag(h)}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              disabled={disabled}
              aria-label={h === "lo" ? "Outer edge of spawn band" : "Inner edge of spawn band"}
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full bg-gold shadow-glow ring-2 ring-black/40 transition-transform active:cursor-grabbing active:scale-110 disabled:cursor-not-allowed"
              style={{ left: pct(h === "lo" ? lo : hi) }}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-white/40">
        <span>Rim</span>
        <span>Center</span>
      </div>
    </div>
  );
}

/* ── Bounciness slider ───────────────────────────────────────────────
 * Track = exactly 1 unit wide (0 at left edge, 1 at right edge — never moves).
 * pxPerUnit = trackWidth, so value 5 sits 5× as far as value 1 (proportional)
 * and drag sensitivity is uniform. The single thumb always renders in a portal
 * at fixed viewport coords (one dot, grabbable, never clipped by the sidebar's
 * backdrop-blur stacking context). Easter egg: hold past the right edge → 2s
 * vibrate → 5s breakthrough → max unlocks 1→5.
 */
const HOLD_START = 2000;
const BREAK_AT = 5000;
const JITTER_AMP = 6;
const STEP = 0.1;

export function BouncinessSlider({
  value,
  onChange,
  disabled,
  onEggUnlock,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  onEggUnlock?: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStartValue = useRef(0);
  const overpullStart = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [jitter, setJitter] = useState<[number, number]>([0, 0]);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Measure the track in viewport coords; keep fresh on resize.
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) setRect(trackRef.current.getBoundingClientRect());
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const stopRaf = () => {
    if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    rafId.current = null;
  };

  const resetOverpull = () => {
    overpullStart.current = null;
    stopRaf();
    setJitter([0, 0]);
  };

  useEffect(() => stopRaf, []);

  const tick = () => {
    if (overpullStart.current === null) return;
    const elapsed = performance.now() - overpullStart.current;
    if (elapsed >= BREAK_AT) {
      setUnlocked(true);
      onEggUnlock?.();
      resetOverpull();
      return;
    }
    if (elapsed >= HOLD_START) {
      const vibe = (elapsed - HOLD_START) / (BREAK_AT - HOLD_START);
      const amp = vibe * JITTER_AMP;
      setJitter([(Math.random() * 2 - 1) * amp, (Math.random() * 2 - 1) * amp]);
    }
    rafId.current = requestAnimationFrame(tick);
  };

  const max = unlocked ? 5 : 1;

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    if (e.buttons === 0) { dragging.current = false; resetOverpull(); return; }
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return;
    const v = clamp(Math.round(((e.clientX - r.left) / r.width) / STEP) * STEP, 0, max);
    onChange(v);

    // Over-pull (pre-unlock only): pointer past the right edge while pinned at 1.
    // Requires drag to have started inside the track — prevents re-grab-at-edge triggering it.
    const pastEdge = !unlocked && e.clientX > r.right && v >= 1 && dragStartValue.current <= 1;
    if (pastEdge) {
      if (overpullStart.current === null) {
        overpullStart.current = performance.now();
        rafId.current = requestAnimationFrame(tick);
      }
    } else if (overpullStart.current !== null) {
      resetOverpull();
    }
  };

  const startDrag = (e: React.PointerEvent) => {
    if (disabled) return;
    dragging.current = true;
    dragStartValue.current = value;
    const r = trackRef.current?.getBoundingClientRect();
    if (r) setRect(r);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const endDrag = (e: React.PointerEvent) => {
    dragging.current = false;
    resetOverpull();
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // The whole gold fill + thumb live in one portal at fixed viewport coords —
  // a single continuous bar (no seam at the sidebar edge). Dimmed with the frame
  // when disabled (spinning).
  const thumbX = rect ? rect.left + value * rect.width : 0;
  const thumbY = rect ? rect.top + rect.height / 2 : 0;
  const portal =
    rect &&
    createPortal(
      <div style={{ opacity: disabled ? 0.4 : 1 }}>
        {/* continuous gold fill: track left → thumb */}
        <div
          style={{
            position: "fixed",
            top: thumbY - 2,
            left: rect.left,
            width: Math.max(0, thumbX - rect.left),
            height: 4,
            background: "rgba(212,175,55,0.4)",
            borderRadius: 2,
            pointerEvents: "none",
            zIndex: 9999,
          }}
        />
        <button
          onPointerDown={startDrag}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          disabled={disabled}
          aria-label="Bounciness"
          style={{
            position: "fixed",
            top: thumbY + jitter[1],
            left: thumbX + jitter[0],
            transform: "translate(-50%, -50%)",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#d4af37",
            boxShadow: "0 0 40px rgba(212,175,55,0.45)",
            outline: "2px solid rgba(0,0,0,0.4)",
            cursor: disabled ? "not-allowed" : "grab",
            touchAction: "none",
            zIndex: 9999,
          }}
        />
      </div>,
      document.body
    );

  return (
    <div className={disabled ? "opacity-40" : undefined}>
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/50">
        <span>Bounciness</span>
        <span className="text-gold">{value.toFixed(1)}</span>
      </div>

      <div className="mt-3 px-1">
        {/* base track only; gold fill is drawn in the portal for continuity */}
        <div ref={trackRef} className="relative h-1 rounded-full bg-white/10" />
      </div>

      {portal}
    </div>
  );
}
