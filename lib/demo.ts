import { normaliseProfile } from "./profile";
import type { Profile } from "./schema";

/** Demo founder for /app?demo=founder. Fictional person and company; shown with a "Demo data" tag. */
export function demoFounder(now = new Date()): { profile: Profile; completed: string[]; started: string[] } {
  const move = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 56));
  const moveDate = move.toISOString().slice(0, 10);
  return {
    profile: normaliseProfile({
      name: "Sara Lindqvist", company: "Northwind Robotics", nationality: "SE", household: "family", kids: 2,
      reason: "hub71_founder", moveDate, moveMonth: moveDate.slice(0, 7), budgetBand: "high", budgetAED: 180_000, hasPets: false, drives: true,
    }),
    // Acceptance letter and Clara KYC done; the ADGM licence is with Clara (in progress).
    completed: ["acceptance_letter", "clara_kyc", "degree_attestation", "marriage_cert_attestation"],
    started: [],
  };
}
