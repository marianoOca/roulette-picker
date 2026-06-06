import type { SectionKey } from "./profile";

/*
Refference
 _                         _
| |                       | |
|  \                     /  |
|   \         _         /   |
|    \       | |       /    |
|     \     /   \     /     |
|      \   /     \   /      |
|       |_|       |_|       |
AAABCDEFFGHHIJJJIHHGFFEDCBAAA

A — OUTER WALL
B — GOLDEN CHAMFER
C — OUTER WOOD AREA (WITH DIAMONDS)
D — GOLDEN RING
E — NUMBER BAND
F — INNER GOLD RING
G — POCKETS
H — INNER GOLD RING
I — INNER WOODEN CONE
J — CENTER TOWER / SPINDLE BASE
*/

/**
 * App-level configuration. Edit this file to change behaviour.
 */
const config = {
  /**
   * Which wheel version to render.
   *   "v2" — fine beautiful handcrafted wheel
   *   "v1" — Claude's first iteration
   * Runtime: reads localStorage so the title-click easter egg persists across reloads.
   */
  get wheelVersion(): "v1" | "v2" {
    if (typeof window === "undefined") return "v2";
    return (localStorage.getItem("wheelVersion") as "v1" | "v2") || "v2";
  },

  /**
   * Sections where balls are allowed to spawn (any subset of B–J).
   * The spawner takes the union → one contiguous radial band.
   * Examples: ["C"]  |  ["B", "C", "D"]  |  ["G", "H", "I"]
   */
  spawnSections: ["J"] as SectionKey[],

  /**
   * Ball bounciness (coefficient of restitution).
   * 0 = dead thud, 1 = perfectly elastic.
   * Rapier uses max(ball, surface); surface is ~0.1, so values below that have no effect.
   * Sweet spot: 0.1 (sluggish) → 0.4 (lively) → 0.8 (chaotic)
   */
  ballRestitution: 0.5,

  /**
   * Camera / orbit mode.
   *   "prod" — locked above the wheel, restricted zoom, can't peek underneath
   *   "dev"  — free orbit, full zoom range
   */
  viewMode: "prod" as "dev" | "prod",
};

export default config;
