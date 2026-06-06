# Standup Roulette 🎰

A 3D physics roulette that picks one winner for daily standup. Each teammate is
dropped onto a spinning casino roulette wheel as an independent labeled ball:
**the ball that settles in the highest-numbered pocket wins.**

Built with Next.js 15, React Three Fiber, drei, and Rapier physics. Handles any
number of participants. Deploys to Vercel with zero config.

## How it works

- Spin → one ball per teammate drops from above with **crypto-seeded** random
  spawn positions and velocities, while the wheel spins (decaying speed).
- Rapier simulates the bounces; balls scatter into the 37 European pockets
  (0–36, red/black/green).
- When the wheel stops and balls rest, each ball's pocket is read by angle and
  the **highest number wins**.
- Ties (two balls in the same top pocket) or messy settles (no ball pocketed)
  are broken with crypto RNG, so a spin always resolves to exactly one winner.

> Fairness note: the outcome is *emergent physics* with randomized, crypto-seeded
> inputs. It feels fair and looks fair, but it is not a mathematically provable
> uniform draw like a plain RNG pick.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

The VSCode "roulette" launch config (`.claude/launch.json`) runs dev on port 3017.

## Build / run production

```bash
npm run build
npm run start
```

## Deploy to Vercel

Push to a Git repo and import it in Vercel — the Next.js preset is detected
automatically. Or:

```bash
npm i -g vercel
vercel
```

Rapier's WASM is bundled client-side via `@react-three/rapier` (the canvas is a
`"use client"` component, dynamically imported with `ssr: false`).

## Controls

The left sidebar edits the roster, fires the spin, and exposes two tuning sliders:
**Bounciness** (ball restitution) and **Spawn range** (which wheel sections balls
drop into — v2 only). Roster persists to `localStorage`.

**Easter egg:** click the sidebar title 5× within a second to toggle the wheel
between **v2** (the handcrafted wheel) and **v1** (Claude's first iteration). The
choice is stored in `localStorage` and read by `lib/config.ts`.

## Geometry

The wheel profile (sections A–J, radii, slopes) is defined once in `lib/profile.ts`
and documented in **[roulette/WHEEL_PROFILE.md](./roulette/WHEEL_PROFILE.md)**. Read
that before touching any geometry.

## Key files

- `app/page.tsx` — state machine (`idle → dropping → settling → resolved`), roster, v1/v2 dynamic import.
- `lib/Sidebar.tsx` — roster editor, spin button, sliders, title easter egg.
- `roulette/RouletteCanvas.tsx` — Canvas + Physics + spin/settle controller (rotor decay, rest detection).
- `roulette/RouletteWheel.tsx` — spinning rotor (`Frets.tsx` separators, `Turret.tsx` center spindle).
- `roulette/RouletteBowl.tsx` — static outer bowl (D/C/B/A sections, deflectors, rim).
- `roulette/Sliders.tsx` — sidebar slider controls.
- `roulette_v1/` — Claude's first wheel iteration, reachable via the easter egg.
- `betting-table/` — the full table around the wheel: frame, felt, betting layout, chips.
- `lib/profile.ts` / `lib/scene.ts` — geometry source of truth + derived scene constants.
- `lib/rouletteOrder.ts` — European pocket sequence + colors.
- `lib/settle.ts` — maps resting balls → pockets by angle, resolves the winner.
- `lib/spin.ts` — crypto RNG (rejection-sampled) + tie-break.
- `lib/config.ts` — wheel version, spawn sections, restitution, camera mode.
