"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { colorForNumber } from "@/lib/rouletteOrder";
import { POKET_PALETTE } from "@/lib/colors";
import type { LeaderboardEntry, SpinResult } from "@/lib/settle";

/** Seconds the winner shows before the card expands into the leaderboard. */
const EXPAND_DELAY_MS = 1500;
/** Above this many other balls, lay the list out in two columns. */
const TWO_COL_THRESHOLD = 14;

/** Right-aligned label describing where a ball ended up. */
function LandingLabel({ entry }: { entry: LeaderboardEntry }) {
  if (entry.tier === 1 && entry.number !== null) {
    return (
      <span
        className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1 text-xs font-bold text-white ring-1 ring-white/20"
        style={{ background: POKET_PALETTE[colorForNumber(entry.number)] }}
      >
        {entry.number}
      </span>
    );
  }
  const text =
    entry.tier === 2 ? "on the wheel" : entry.tier === 3 ? "on the table" : "off the table";
  return <span className="shrink-0 text-xs text-white/40">{text}</span>;
}

export default function WinnerModal({
  result,
  onSpinAgain,
  onClose,
}: {
  result: SpinResult;
  onSpinAgain: () => void;
  onClose: () => void;
}) {
  const { winner, byTiebreak, leaderboard } = result;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fire = (particleRatio: number, opts: confetti.Options) =>
      confetti({
        origin: { y: 0.6 },
        particleCount: Math.floor(220 * particleRatio),
        ...opts,
      });
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  // Reveal the winner briefly, then expand into the leaderboard.
  useEffect(() => {
    const t = setTimeout(() => setExpanded(true), EXPAND_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const numberColor =
    winner.number !== null ? POKET_PALETTE[colorForNumber(winner.number)] : "#888";

  const others = leaderboard.filter((e) => e.id !== winner.id);
  const twoCol = others.length > TWO_COL_THRESHOLD;
  const cardWidth = expanded && twoCol ? "w-[min(90vw,560px)]" : "w-[min(90vw,420px)]";
  const colsClass = twoCol ? "grid-cols-2" : "grid-cols-1";

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`${cardWidth} animate-pop-in flex max-h-[85vh] flex-col items-center gap-5 rounded-2xl border border-gold/40 bg-gradient-to-b from-[#0c2417] to-[#04130b] p-8 text-center shadow-glow transition-[max-width] duration-500`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-display text-2xl font-black tracking-wide text-gold">
          {byTiebreak ? "Tie-break winner" : "Next Standup host will be"}
        </span>

        <h2 className="font-display text-4xl font-black text-white drop-shadow">
          {winner.name}
        </h2>

        {winner.number !== null ? (
          <div className="flex items-center gap-3 text-white/80">
            <span className="text-sm">landed on</span>
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white ring-2 ring-white/30"
              style={{ background: numberColor }}
            >
              {winner.number}
            </span>
          </div>
        ) : (
          <p className="text-sm text-white/60">picked by tie-break</p>
        )}

        {/* Leaderboard — expands open after the reveal (grid-rows 0fr → 1fr). */}
        {others.length > 0 && (
          <div
            className="grid w-full transition-all duration-500"
            style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
          >
            <div className="min-h-0 overflow-hidden">
              {/* dir=rtl moves the scrollbar to the LEFT (off the pocket dots);
                  inner dir=ltr keeps the grid order and content normal. */}
              <div
                dir="rtl"
                className="roster-scroll max-h-[40vh] overflow-y-auto border-t border-white/10 pt-4"
              >
              <ul dir="ltr" className={`grid ${colsClass} gap-x-6 gap-y-0.5 pl-1 text-left`}>
                {others.map((e, i) => (
                  <li
                    key={e.id}
                    className={`flex items-center gap-2 py-1 ${expanded ? "animate-row-in" : "opacity-0"}`}
                    style={{ animationDelay: `${Math.min(i, 12) * 0.045}s` }}
                  >
                    <span className="w-5 shrink-0 text-right text-xs tabular-nums text-white/40">
                      {e.place}
                    </span>
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: e.color }}
                    />
                    <span className="flex-1 truncate text-base text-white/85">{e.name}</span>
                    <LandingLabel entry={e} />
                  </li>
                ))}
              </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mt-2 flex w-full gap-3">
          <button
            onClick={onSpinAgain}
            className="flex-1 rounded-xl bg-gradient-to-b from-roulette-red to-[#8c1822] py-3 font-display font-bold tracking-wide text-white transition hover:brightness-110"
          >
            Spin again
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/20 px-5 py-3 text-sm text-white/70 transition hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
