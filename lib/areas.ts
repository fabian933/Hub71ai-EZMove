import { communities } from "./data";
import type { Community, Profile } from "./schema";

export const CHOSEN_AREA_KEY = "ezmove.area.v1";
export const homeTypes = (profile: Profile): Array<keyof Community["rentAED"]> =>
  profile.household === "family" ? ["3br", "villa"] : ["1br", "2br"];

export function lowestRelevantRent(community: Community, profile: Profile): number | null {
  const prices = homeTypes(profile).map((type) => community.rentAED[type]?.min).filter((value): value is number => value !== undefined);
  return prices.length ? Math.min(...prices) : null;
}

/** Three relative price bands, calculated only from the supplied minimum rents. */
export function areaChoices(profile: Profile): Community[] {
  const byRent = [...communities].filter((community) => lowestRelevantRent(community, profile) !== null)
    .sort((a, b) => lowestRelevantRent(a, profile)! - lowestRelevantRent(b, profile)!);
  const bandIndex = { low: 0, mid: 1, high: 2 }[profile.budgetBand];
  return byRent.filter((_, index) => Math.min(2, Math.floor(index * 3 / byRent.length)) === bandIndex)
    .sort((a, b) => {
      const commuteA = a.commuteMinsToMaryah?.min;
      const commuteB = b.commuteMinsToMaryah?.min;
      if (commuteA !== undefined && commuteB !== undefined) return commuteA - commuteB || lowestRelevantRent(a, profile)! - lowestRelevantRent(b, profile)!;
      if (commuteA !== undefined) return -1;
      if (commuteB !== undefined) return 1;
      return lowestRelevantRent(a, profile)! - lowestRelevantRent(b, profile)!;
    });
}

export function loadChosenArea(): string | null {
  try {
    const id = window.localStorage.getItem(CHOSEN_AREA_KEY);
    return communities.some((community) => community.id === id) ? id : null;
  } catch { return null; }
}
export function saveChosenArea(id: string): boolean {
  if (!communities.some((community) => community.id === id)) return false;
  try { window.localStorage.setItem(CHOSEN_AREA_KEY, id); return true; }
  catch { return false; }
}
