import { uiStep } from "./copy";
import { personalise } from "./engine";
import type { Profile, Step } from "./schema";

export const UNSURE = "Check with your company or the official site.";

/** The plan as compact JSON context for the assistant, in company-generic wording. */
export function planContext(profile: Profile): string {
  const roadmap = personalise(profile).map(uiStep);
  const byId = new Map(roadmap.map((step) => [step.id, step]));
  return JSON.stringify(roadmap.map((step) => ({
    id: step.id, title: step.title, lane: step.lane === "company" ? "your company" : "you and your family", phase: step.phase,
    needs: step.prerequisites.map((id) => byId.get(id)?.title), documents: step.documents, why: step.why, tips: step.tips, warnings: step.warnings,
    time: step.durationLabel ?? (step.durationDays ? `${step.durationDays.min}-${step.durationDays.max} days` : null),
    cost: step.costAED ? `AED ${step.costAED.min}-${step.costAED.max}` : null, provider: step.provider, link: step.officialLink,
  })));
}

const topics: [RegExp, string[]][] = [
  [/\bbank/i, ["business_bank_account", "bank_account"]],
  [/\bvisa\b|entry permit/i, ["entry_permit"]],
  [/family|spouse|wife|husband|kids|children|sponsor/i, ["family_visa"]],
  [/emirates id|\beid\b/i, ["emirates_id"]],
  [/licen[cs]e|adgm/i, ["adgm_licence", "licence_conversion"]],
  [/lease|rent|home|apartment|flat|house/i, ["lease_signing"]],
  [/school/i, ["school_enrolment"]],
  [/medical|health/i, ["medical_fitness", "health_insurance_card"]],
  [/mobile|phone|sim/i, ["uae_mobile_number", "mobile_plan"]],
];

/** "Passport copy" → "passport copy", but "UAE number" and "ADGM licence" stay as they are. */
const properNouns = new Set(["Emirates", "Tawtheeq", "Clara", "Darb", "Mawaqif", "Golden", "Abu"]);
const lowerFirst = (text: string) => /^[A-Z][a-z]/.test(text) && !properNouns.has(text.split(" ")[0]) ? text[0].toLowerCase() + text.slice(1) : text;
const joinAnd = (items: string[]) => items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/** Without an API key: a plain answer from the step data, at most three sentences. */
export function offlineAnswer(question: string, profile: Profile): { answer: string; stepId: string | null } {
  const roadmap = personalise(profile).map(uiStep);
  const byId = new Map(roadmap.map((step) => [step.id, step]));
  const asked = question.match(/"([^"]+)"/)?.[1];
  const step: Step | undefined = (asked && roadmap.find((item) => item.title === asked))
    || topics.filter(([pattern]) => pattern.test(question)).flatMap(([, ids]) => ids).map((id) => byId.get(id)).find(Boolean);
  if (!step) return { answer: UNSURE, stepId: null };
  const sentences: string[] = [];
  const needs = step.prerequisites.map((id) => byId.get(id)?.shortTitle).filter((title): title is string => !!title);
  sentences.push(needs.length ? `${step.title} waits on ${joinAnd(needs.map(lowerFirst))}.` : `${step.title} doesn't wait on any earlier step.`);
  if (step.warnings[0]) sentences.push(step.warnings[0]);
  else if (step.documents.length) sentences.push(`You'll usually need ${joinAnd(step.documents.slice(0, 4).map(lowerFirst))}.`);
  else if (step.why) sentences.push(step.why);
  if (step.id === "family_visa" && profile.household === "solo") sentences.push("Your plan is set up for moving alone; change it in your profile if your family is coming.");
  return { answer: sentences.slice(0, 3).join(" "), stepId: step.id };
}
