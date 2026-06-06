"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/lib/Sidebar";
import WinnerModal from "@/lib/WinnerModal";
import type { Phase, Participant } from "@/roulette/RouletteCanvas";
import { DEFAULT_PARTICIPANTS, loadParticipants, saveParticipants } from "@/lib/participants";
import { colorForIndex } from "@/lib/colors";
import type { SpinResult } from "@/lib/settle";
import type { SectionKey } from "@/lib/profile";
import config from "@/lib/config";

// Three.js + Rapier are client-only; skip SSR.
const RouletteCanvas = dynamic(
  () =>
    config.wheelVersion === "v1"
      ? import("@/roulette_v1/RouletteCanvas")
      : import("@/roulette/RouletteCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-gold/60">
        Loading the wheel…
      </div>
    ),
  }
);

export default function Home() {
  const [names, setNames] = useState<string[]>(DEFAULT_PARTICIPANTS);
  const [spinId, setSpinId] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<SpinResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [ballRestitution, setBallRestitution] = useState(config.ballRestitution);
  const [spawnSections, setSpawnSections] = useState<SectionKey[]>(config.spawnSections);
  const [eggUnlocked, setEggUnlocked] = useState(false);
  const [wheelVersion, setWheelVersion] = useState<"v1" | "v2">("v2");

  // Sync wheelVersion from localStorage after mount to avoid SSR hydration mismatch.
  useEffect(() => {
    setWheelVersion(config.wheelVersion);
  }, []);

  // Load persisted roster after mount (avoids SSR mismatch).
  useEffect(() => {
    setNames(loadParticipants());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveParticipants(names);
  }, [names, hydrated]);

  const participants: Participant[] = useMemo(
    () =>
      names
        .map((name, i) => ({ id: `slot-${i}`, name: name.trim(), color: colorForIndex(i) }))
        .filter((p) => p.name.length > 0),
    [names]
  );

  const handleSpin = () => {
    if (participants.length < 2) return;
    setResult(null);
    setPhase("dropping");
    setSpinId((s) => s + 1);
  };

  const handleResolved = (r: SpinResult) => {
    setResult(r);
    setPhase("resolved");
  };

  const handlePhaseChange = (p: Phase) => {
    setPhase((cur) => (cur === "dropping" && p === "settling" ? "settling" : cur));
  };

  const handleClose = () => setPhase("idle");

  const highlightId = phase === "resolved" && result ? result.winner.id : null;

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        names={names}
        setNames={setNames}
        onSpin={handleSpin}
        phase={phase}
        ballRestitution={ballRestitution}
        setBallRestitution={setBallRestitution}
        spawnSections={spawnSections}
        setSpawnSections={setSpawnSections}
        onEggUnlock={() => setEggUnlocked(true)}
        wheelVersion={wheelVersion}
      />

      <div className="relative flex-1">
        <RouletteCanvas
          participants={participants}
          spinId={spinId}
          phase={phase}
          onResolved={handleResolved}
          onPhaseChange={handlePhaseChange}
          highlightId={highlightId}
          ballRestitution={ballRestitution}
          spawnSections={spawnSections}
          eggUnlocked={eggUnlocked}
        />
        {phase === "resolved" && result && (
          <WinnerModal
            result={result}
            onSpinAgain={handleSpin}
            onClose={handleClose}
          />
        )}
      </div>
    </main>
  );
}
