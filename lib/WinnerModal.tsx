"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { colorForNumber } from "@/lib/rouletteOrder";
import { POKET_PALETTE } from "@/lib/colors";
import type { SpinResult } from "@/lib/settle";

export default function WinnerModal({
  result,
  onSpinAgain,
  onClose,
}: {
  result: SpinResult;
  onSpinAgain: () => void;
  onClose: () => void;
}) {
  const { winner, byTiebreak } = result;

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

  const numberColor =
    winner.number !== null ? POKET_PALETTE[colorForNumber(winner.number)] : "#888";

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-pop-in flex w-[min(90vw,420px)] flex-col items-center gap-5 rounded-2xl border border-gold/40 bg-gradient-to-b from-[#0c2417] to-[#04130b] p-8 text-center shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs uppercase tracking-[0.3em] text-gold/70">
          {byTiebreak ? "Tie-break winner" : "The winner is"}
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
