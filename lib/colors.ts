/** Distinct, legible ball tints. Cycles if there are more participants than colors. */
export const BALL_PALETTE: string[] = [
  "#ff5d5d", "#4dd2ff", "#ffd24d", "#7cfc8a", "#c98bff",
  "#ff9f43", "#5a8cff", "#ff7ae0", "#3be8c0", "#ffe066",
  "#8c9eff", "#ff8a5b", "#6be585", "#f06292", "#4fc3f7",
  "#ba68c8", "#aed581", "#ffb74d", "#4db6ac", "#e57373",
];

export function colorForIndex(i: number): string {
  return BALL_PALETTE[i % BALL_PALETTE.length];
}

export type PocketColor = "red" | "black" | "green";

export const POKET_PALETTE: Record<PocketColor, string> = {
  red: "#c62828",
  black: "#0a0a0a",
  green: "#026a3a",
};

