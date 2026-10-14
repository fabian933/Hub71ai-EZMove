import { z } from "zod";
import rawTeam from "@/data/demo-team.json";
import { personalise } from "./engine";
import { nextUpCards, settlingSteps } from "./dashboard";
import { normaliseProfile } from "./profile";
import { uiStep } from "./copy";
import { stepStatus, type StepStatus } from "./status";
import { ProfileSchema, type Profile, type Step } from "./schema";

const PersonSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/), name: z.string().min(1), company: z.string().min(1), hires: z.number().int().nonnegative(),
  profile: ProfileSchema.omit({ moveMonth: true, moveDate: true, budgetBand: true, name: true, company: true }),
  /** Move date relative to today, so the demo never goes stale. */
  moveInDays: z.number().int(),
  completed: z.union([z.array(z.string()), z.literal("all_settling")]),
  started: z.array(z.string()),
  /** Days spent on the current step so far. */
  currentStepDays: z.number().int().nonnegative().nullable(),
  /** Days from acceptance to ADGM licence, once issued. */
  daysToLicence: z.number().int().positive().nullable(),
}).strict();
export type DemoPerson = z.infer<typeof PersonSchema>;
export const demoPeople = z.object({ note: z.string(), people: z.array(PersonSchema) }).parse(rawTeam).people;

const addDays = (date: Date, days: number) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days)).toISOString().slice(0, 10);

/** Profile and progress for one demo person. Throws if the demo contradicts the step graph. */
export function demoPlan(person: DemoPerson, now = new Date()): { profile: Profile; completed: string[]; started: string[] } {
  const moveDate = addDays(now, person.moveInDays);
  const profile = normaliseProfile({ ...person.profile, name: person.name, company: person.company, moveDate, moveMonth: moveDate.slice(0, 7), budgetBand: "mid" });
  const roadmap = personalise(profile);
  const ids = new Set(roadmap.map((step) => step.id));
  const completed = person.completed === "all_settling" ? settlingSteps(roadmap).map((step) => step.id) : person.completed;
  const done = new Set(completed);
  for (const id of [...completed, ...person.started]) if (!ids.has(id)) throw new Error(`Demo ${person.id}: ${id} is not in their plan`);
  for (const step of roadmap) if (done.has(step.id) && !step.prerequisites.every((id) => done.has(id))) throw new Error(`Demo ${person.id}: ${step.id} is done before its prerequisites`);
  for (const id of person.started) { const step = roadmap.find((item) => item.id === id)!; if (!step.prerequisites.every((pid) => done.has(pid))) throw new Error(`Demo ${person.id}: ${id} started before its prerequisites`); }
  return { profile, completed, started: person.started };
}

/** /app?demo=founder is Sara; /app?demo=<id> opens any demo person's plan. */
export function demoPersonById(id: string): DemoPerson | undefined {
  return demoPeople.find((person) => person.id === (id === "founder" ? "sara" : id));
}

/** Longest usual duration in a label like "Usually 30–60 days", or null. */
const usualMaxDays = (label: string | null) => {
  const days = label?.match(/(\d+)\s*(?:–|-)?\s*(\d+)?\s*(working )?days?/i);
  return days ? Number(days[2] ?? days[1]) : null;
};
/** A step needs attention when it has waited over 14 days, or longer than its usual duration when the data gives one. */
export const ATTENTION_DAYS = 14;

export type PersonRow = DemoPerson & {
  profile: Profile; roadmap: Step[]; completedSet: Set<string>; startedSet: Set<string>; today: string;
  current: Step | null; currentStatus: StepStatus | null; done: number; total: number;
  settled: boolean; needsAttention: boolean; onGround: boolean; benefitsUnlocked: boolean; nextAction: string;
};

export function personRow(person: DemoPerson, now = new Date()): PersonRow {
  const { profile, completed, started } = demoPlan(person, now);
  const roadmap = personalise(profile).map(uiStep);
  const completedSet = new Set(completed);
  const startedSet = new Set(started);
  const today = now.toISOString().slice(0, 10);
  const counted = settlingSteps(roadmap).filter((step) => step.id !== "settled");
  const settled = completedSet.has("settled");
  const current = settled ? null : roadmap.find((step) => startedSet.has(step.id)) ?? nextUpCards(roadmap, completedSet, profile.moveDate!, profile.reason === "hub71_founder", 1)[0] ?? null;
  const currentStatus = current ? stepStatus(current, roadmap, completedSet, startedSet, profile.moveDate!, today) : null;
  const limit = Math.max(ATTENTION_DAYS, usualMaxDays(current?.durationLabel ?? null) ?? 0);
  const needsAttention = !settled && (person.currentStepDays ?? 0) > limit;
  const nextAction = settled ? "Nothing to do"
    : !current ? "Check in"
    : needsAttention ? `Follow up on ${current.shortTitle.toLowerCase()}`
    : current.thirdParty ? `No action · ${current.durationLabel?.toLowerCase() ?? "with a partner"}`
    : currentStatus?.status === "in_progress" ? `Check in on ${current.shortTitle.toLowerCase()}`
    : `Nudge: ${current.shortTitle.toLowerCase()}`;
  return {
    ...person, profile, roadmap, completedSet, startedSet, today, current, currentStatus,
    done: counted.filter((step) => completedSet.has(step.id)).length, total: counted.length,
    settled, needsAttention, onGround: completedSet.has("arrive"), benefitsUnlocked: completedSet.has("incentives_agreement"), nextAction,
  };
}

export function teamSummary(rows: PersonRow[]) {
  const licence = rows.map((row) => row.daysToLicence).filter((days): days is number => days !== null);
  const blockers = rows.filter((row) => row.needsAttention && row.current).map((row) => row.current!.shortTitle);
  const pool = blockers.length ? blockers : rows.filter((row) => row.current).map((row) => row.current!.shortTitle);
  const counts = new Map<string, number>();
  for (const name of pool) counts.set(name, (counts.get(name) ?? 0) + 1);
  return {
    people: rows.length,
    onTrack: rows.filter((row) => !row.settled && !row.needsAttention).length,
    needsAttention: rows.filter((row) => row.needsAttention).length,
    settled: rows.filter((row) => row.settled).length,
    avgDaysToLicence: licence.length ? Math.round(licence.reduce((sum, days) => sum + days, 0) / licence.length) : null,
    commonBlocker: [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    benefitsUnlocked: rows.filter((row) => row.benefitsUnlocked).length,
    onGround: rows.filter((row) => row.onGround).length,
  };
}
