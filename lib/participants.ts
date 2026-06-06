export const DEFAULT_PARTICIPANTS: string[] = [
  "Alex",
  "Bri",
  "Carlos",
  "Dana",
  "Ezra",
  "Fatima",
  "Gabe",
  "Hana",
  "Iker",
  "Jules",
  "Kira",
];

const STORAGE_KEY = "roulette-participants";

export function loadParticipants(): string[] {
  if (typeof window === "undefined") return DEFAULT_PARTICIPANTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PARTICIPANTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return parsed.length ? parsed : DEFAULT_PARTICIPANTS;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return DEFAULT_PARTICIPANTS;
}

export function saveParticipants(names: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch {
    /* storage may be unavailable */
  }
}
