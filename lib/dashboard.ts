import { deadlineTone, getDoByDate, getState, nextUpSteps, type CompletedIds, type DeadlineTone } from "./engine";
import type { Step } from "./schema";

export type Lane = Step["lane"];
export const laneTitles: Record<Lane, string> = { company: "Your company · Hub71 and ADGM", personal: "You and your family" };

/** Settling-in steps: everything before the Living here phase. */
export const settlingSteps = (roadmap: readonly Step[]) => roadmap.filter((step) => step.phase !== "living");

/** Depth of each settling-in step: the longest chain of prerequisites before it. */
function depths(roadmap: readonly Step[]): Map<string, number> {
  const all = settlingSteps(roadmap);
  const byId = new Map(all.map((step) => [step.id, step]));
  const memo = new Map<string, number>();
  const depthOf = (step: Step): number => {
    const known = memo.get(step.id);
    if (known !== undefined) return known;
    const value = Math.max(-1, ...step.prerequisites.map((id) => byId.get(id)).filter((item): item is Step => !!item).map(depthOf)) + 1;
    memo.set(step.id, value);
    return value;
  };
  all.forEach(depthOf);
  return memo;
}

/** A lane's steps in dependency order: by depth in the graph, then data order. */
export function laneSteps(roadmap: readonly Step[], lane: Lane): Step[] {
  const depth = depths(roadmap);
  return settlingSteps(roadmap).map((step, index) => ({ step, index }))
    .filter(({ step }) => step.lane === lane)
    .sort((a, b) => depth.get(a.step.id)! - depth.get(b.step.id)! || a.index - b.index)
    .map(({ step }) => step);
}

export type CardStatus =
  | { kind: "done" }
  | { kind: "now"; label: string | null; tone: DeadlineTone | null }
  | { kind: "waiting"; on: Step; otherLane: boolean };

const shortDate = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function cardStatus(step: Step, roadmap: readonly Step[], completed: CompletedIds, moveDate: string, today: string | null): CardStatus {
  const state = getState(step, completed);
  if (state === "done") return { kind: "done" };
  if (state === "available") {
    const doBy = getDoByDate(step, moveDate);
    const tone = doBy && today ? deadlineTone(doBy, today) : null;
    if (doBy) return { kind: "now", label: tone === "overdue" ? `Overdue · was due ${shortDate(doBy)}` : `Do by ${shortDate(doBy)}`, tone };
    return { kind: "now", label: step.durationLabel, tone: null };
  }
  // The first unfinished prerequisite, following the chain back to something that can be started.
  const done = new Set(completed);
  const byId = new Map(roadmap.map((item) => [item.id, item]));
  const on = step.prerequisites.map((id) => byId.get(id)).find((item): item is Step => !!item && !done.has(item.id))!;
  return { kind: "waiting", on, otherLane: on.lane !== step.lane };
}

/** The steps this one directly unlocks in this person's plan. */
export function directUnlocks(step: Step, roadmap: readonly Step[]): Step[] {
  return roadmap.filter((item) => item.prerequisites.includes(step.id));
}

/** The nearest milestone that isn't done yet, by depth in the graph. */
export function nextMilestone(roadmap: readonly Step[], completed: CompletedIds): Step | null {
  const done = new Set(completed);
  const depth = depths(roadmap);
  return settlingSteps(roadmap).filter((step) => step.milestone && !done.has(step.id))
    .sort((a, b) => (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0))[0] ?? null;
}

/** Next up: for founders the next company step always leads (it's the critical path), then the earliest do-by dates. */
export function nextUpCards(roadmap: readonly Step[], completed: CompletedIds, moveDate: string, includeCompany: boolean, count = 3): Step[] {
  const company = includeCompany ? laneSteps(roadmap, "company").find((step) => getState(step, completed) === "available") : undefined;
  const rest = nextUpSteps(settlingSteps(roadmap), completed, moveDate, count + 1).map(({ step }) => step).filter((step) => step.id !== company?.id);
  return [...(company ? [company] : []), ...rest].slice(0, count);
}
