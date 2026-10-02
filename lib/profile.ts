import { iso2Codes, ProfileSchema, type Profile } from "./schema";

/** YYYY-MM-DD for the same day of the month, clamped to the month's last day. */
export function moveDateIn(monthsAhead: number, now = new Date()): string {
  const year = now.getUTCFullYear(); const month = now.getUTCMonth() + monthsAhead;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(now.getUTCDate(), lastDay))).toISOString().slice(0, 10);
}

export function nextMoveDate(now = new Date()): string { return moveDateIn(1, now); }

export function budgetBandFor(budgetAED: number): Profile["budgetBand"] {
  return budgetAED < 90_000 ? "low" : budgetAED <= 150_000 ? "mid" : "high";
}

/** Keeps the derived fields (moveMonth, budgetBand) in step with moveDate and budgetAED. */
export function normaliseProfile(profile: Profile): Profile {
  const { budgetAED, moveDate, ...rest } = profile;
  return {
    ...rest,
    ...(moveDate ? { moveDate, moveMonth: moveDate.slice(0, 7) } : {}),
    ...(budgetAED ? { budgetAED, budgetBand: budgetBandFor(budgetAED) } : {}),
  };
}

export function defaultProfile(moveDate = nextMoveDate()): Profile {
  return { nationality: "IN", household: "solo", kids: 0, reason: "job", moveDate, moveMonth: moveDate.slice(0, 7), budgetBand: "mid", hasPets: false, drives: false };
}

export function encodeProfile(profile: Profile): string {
  return btoa(JSON.stringify(normaliseProfile(ProfileSchema.parse(profile)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeProfile(value: string | undefined): Profile | null {
  if (!value || value.length > 2000 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const parsed = ProfileSchema.safeParse(JSON.parse(atob(padded)));
    return parsed.success ? normaliseProfile(parsed.data) : null;
  } catch { return null; }
}

const names = new Intl.DisplayNames(["en"], { type: "region" });
export const nationalities = [...iso2Codes].map((code) => ({ code, name: names.of(code) ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name));
export const countryName = (code: string) => names.of(code) ?? code;
export const featuredNationalities = ["GB", "US", "FR", "CN", "IN"] as const;
