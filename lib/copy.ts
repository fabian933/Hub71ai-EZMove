import type { Step } from "./schema";

/**
 * UI copy stays company-generic (AGENTS.md). Step data keeps Hub71's own wording;
 * these rewrites apply only when text is shown in the app or sent to the assistant.
 * Specific phrases first, then a generic fallback.
 */
const rewrites: [RegExp, string][] = [
  [/Join the Hub71 founders WhatsApp group once onboarded\./g, "Join your company's founder group once onboarded."],
  [/Sign your Hub71 acceptance letter/g, "Sign your acceptance letter"],
  [/Sign the Hub71 incentives agreement/g, "Sign the company benefits agreement"],
  [/Incentives agreement/g, "Benefits agreement"],
  [/Hub71 incentives/gi, "Company benefits"],
  [/Sign the Hub71 SAFE/g, "Sign your SAFE"],
  [/Your Hub71 SAFE/g, "Your SAFE"],
  [/Signed by Hub71's CEO and you, it opens the Hub71 portal/g, "Signed by you and the company's CEO, it opens the company portal"],
  [/Signed by Hub71's CEO and the founder\(s\)\./g, "Signed by the company's CEO and the founder(s)."],
  [/Unlocks Hub71 portal access/g, "Unlocks portal access"],
  [/Covered by Hub71 through ADNIC\./g, "Covered by your company through ADNIC."],
  [/\bincentives\b/g, "benefits"],
  [/Hub71’s|Hub71's/g, "your company's"],
  [/\bHub71\b/g, "your company"],
  [/\bcohort\b/gi, "group"],
  [/\bprogramme\b/gi, "company"],
];

export function uiText(text: string): string {
  const out = rewrites.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
  // Capitalise when a rewrite lands at the start of a sentence.
  return out.replace(/(^|[.!?]\s+)(your company)/g, (_, start: string, phrase: string) => start + phrase[0].toUpperCase() + phrase.slice(1));
}

/** A step with every user-facing string made company-generic. */
export function uiStep(step: Step): Step {
  return {
    ...step,
    title: uiText(step.title),
    shortTitle: uiText(step.shortTitle),
    why: step.why ? uiText(step.why) : null,
    provider: uiText(step.provider),
    documents: step.documents.map(uiText),
    tips: step.tips.map(uiText),
    warnings: step.warnings.map(uiText),
    durationLabel: step.durationLabel ? uiText(step.durationLabel) : null,
  };
}

const siteNames: Record<string, string> = {
  "www.mofa.gov.ae": "MOFA", "www.adek.gov.ae": "ADEK", "mohap.gov.ae": "MOHAP", "www.moccae.gov.ae": "MOCCAE",
  "icp.gov.ae": "ICP", "www.seha.ae": "SEHA", "www.doh.gov.ae": "DoH", "uaepass.ae": "UAE Pass",
  "www.tamm.abudhabi": "TAMM", "www.adgm.com": "ADGM", "visitabudhabi.ae": "Visit Abu Dhabi",
  "www.hub71.com": "company site",
};
export function siteName(url: string): string {
  const host = new URL(url).hostname;
  return siteNames[host] ?? host.replace(/^www\./, "");
}

/** What to show when a cost or time isn't in the data. */
export const unknownLabel = (step: Step) => step.lane === "company" && step.source !== "official" ? "Check with your company" : "Verify";
