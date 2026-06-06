"use client";

import { useRef, useState } from "react";
import { colorForIndex } from "@/lib/colors";
import type { Phase } from "@/roulette/RouletteCanvas";
import type { SectionKey } from "@/lib/profile";
import { BouncinessSlider, SpawnRangeSlider } from "@/roulette/Sliders";

export default function Sidebar({
  names,
  setNames,
  onSpin,
  phase,
  ballRestitution,
  setBallRestitution,
  spawnSections,
  setSpawnSections,
  onEggUnlock,
  wheelVersion,
}: {
  names: string[];
  setNames: (n: string[]) => void;
  onSpin: () => void;
  phase: Phase;
  ballRestitution: number;
  setBallRestitution: (v: number) => void;
  spawnSections: SectionKey[];
  setSpawnSections: (s: SectionKey[]) => void;
  onEggUnlock?: () => void;
  wheelVersion: "v1" | "v2";
}) {
  const [draft, setDraft] = useState("");
  const busy = phase === "dropping" || phase === "settling";
  const titleClicksRef = useRef<number[]>([]);

  const toTitleCase = (s: string) =>
    s.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  const add = () => {
    const newNames = draft
      .split(",")
      .map((n) => toTitleCase(n.trim()))
      .filter((n) => n.length > 0);
    if (newNames.length === 0) return;
    setNames([...names, ...newNames]);
    setDraft("");
  };

  const edit = (i: number, v: string) => {
    const next = names.slice();
    next[i] = v;
    setNames(next);
  };

  const remove = (i: number) => setNames(names.filter((_, idx) => idx !== i));

  const handleTitleClick = () => {
    const now = Date.now();
    titleClicksRef.current = titleClicksRef.current.filter((t) => now - t <= 1000);
    titleClicksRef.current.push(now);
    if (titleClicksRef.current.length >= 5) {
      titleClicksRef.current = [];
      localStorage.setItem("wheelVersion", wheelVersion === "v1" ? "v2" : "v1");
      window.location.reload();
    }
  };

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col gap-4 border-r border-gold/20 bg-black/35 p-5 backdrop-blur-md">
      <div>
        <h1
          className="cursor-default font-display text-2xl font-black tracking-wide text-gold"
          onClick={handleTitleClick}
        >
          Standup Roulette
        </h1>
        <p className="mt-1 text-xs text-white/60">
          Drop a ball per teammate. Highest pocket wins. And good luck!
        </p>
      </div>

      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/50">
        <span>Roster</span>
        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-gold">
          {names.length}
        </span>
      </div>

      <div className="roster-scroll flex-1 space-y-2 overflow-y-auto pr-1">
        {names.map((name, i) => (
          <div
            key={i}
            className="group flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/30"
              style={{ background: colorForIndex(i) }}
            />
            <input
              value={name}
              onChange={(e) => edit(i, e.target.value)}
              disabled={busy}
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-60"
            />
            <button
              onClick={() => remove(i)}
              disabled={busy}
              aria-label={`Remove ${name}`}
              className="shrink-0 rounded px-1.5 text-white/40 opacity-0 transition hover:text-roulette-red group-hover:opacity-100 disabled:hidden"
            >
              ✕
            </button>
          </div>
        ))}
        {names.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-white/40">
            Add some teammates to spin.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          disabled={busy}
          placeholder="Add name…"
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-gold/60 disabled:opacity-60"
        />
        <button
          onClick={add}
          disabled={busy}
          className="rounded-lg bg-gold/20 px-3 text-lg font-bold text-gold transition hover:bg-gold/30 disabled:opacity-40"
        >
          +
        </button>
      </div>

      <button
        onClick={onSpin}
        disabled={busy || names.length < 2}
        className="rounded-xl bg-gradient-to-b from-roulette-red to-[#8c1822] py-3 font-display text-lg font-bold tracking-wide text-white shadow-glow transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Spinning…" : "SPIN"}
      </button>

      <div className="space-y-4 border-t border-gold/20 pt-4">
        <BouncinessSlider
          key={wheelVersion}
          value={ballRestitution}
          onChange={setBallRestitution}
          disabled={busy}
          onEggUnlock={onEggUnlock}
        />
        {wheelVersion === "v2" && (
          <SpawnRangeSlider
            value={spawnSections}
            onChange={setSpawnSections}
            disabled={busy}
          />
        )}
      </div>
    </aside>
  );
}
