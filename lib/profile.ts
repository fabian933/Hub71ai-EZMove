import { iso2Codes, ProfileSchema, type Profile } from "./schema";

export function nextMoveMonth(now = new Date()): string {
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return month.toISOString().slice(0, 7);
}

export function defaultProfile(moveMonth = nextMoveMonth()): Profile {
  return { nationality: "IN", household: "solo", kids: 0, reason: "job", moveMonth, budgetBand: "mid", hasPets: false, drives: false };
}

export function encodeProfile(profile: Profile): string {
  return btoa(JSON.stringify(ProfileSchema.parse(profile))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeProfile(value: string | undefined): Profile | null {
  if (!value || value.length > 2000 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const parsed = ProfileSchema.safeParse(JSON.parse(atob(padded)));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

const names = new Intl.DisplayNames(["en"], { type: "region" });
export const nationalities = [...iso2Codes].map((code) => ({ code, name: names.of(code) ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name));
export const countryName = (code: string) => names.of(code) ?? code;
