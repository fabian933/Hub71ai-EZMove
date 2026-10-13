import { deadlineTone, getDoByDate, getState, type CompletedIds, type DeadlineTone } from "./engine";
import { descendants } from "./map";
import type { Step } from "./schema";

export type Lane = Step["lane"];
export const laneTitles: Record<Lane, string> = { company: "Your company · Hub71 and ADGM", personal: "You and your family" };

/** Settling-in steps: everything before the Living here phase. */
export const settlingSteps = (roadmap: readonly Step[]) => roadmap.filter((step) => step.phase !== "living");

/** A lane's steps in dependency order: by depth in the graph (longest chain of prerequisites), then data order. */
export function laneSteps(roadmap: readonly Step[], lane: Lane): Step[] {
  const all = settlingSteps(roadmap);
  const byId = new Map(all.map((step) => [step.id, step]));
  const depth = new Map<string, number>();
  const depthOf = (step: Step): number => {
    const known = depth.get(step.id);
    if (known !== undefined) return known;
    const value = Math.max(-1, ...step.prerequisites.map((id) => byId.get(id)).filter((item): item is Step => !!item).map(depthOf)) + 1;
    depth.set(step.id, value);
    return value;
  };
  return all.map((step, index) => ({ step, index, depth: depthOf(step) }))
    .filter(({ step }) => step.lane === lane)
    .sort((a, b) => a.depth - b.depth || a.index - b.index)
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

/** One plain sentence on why a step matters, derived only from the graph. */
export function whyItMatters(step: Step, roadmap: readonly Step[]): string {
  const byId = new Map(roadmap.map((item) => [item.id, item]));
  if (step.id === "settled") return "The point where the essentials are in place.";
  const all = [...descendants(step.id, roadmap)].map((id) => byId.get(id)).filter((item): item is Step => !!item);
  const unlocks = all.filter((item) => item.id !== "settled");
  if (!all.length) return step.phase === "living" ? "Part of feeling at home once you're settled." : "One of the steps between you and feeling settled.";
  const crossLane = unlocks.find((item) => item.lane !== step.lane);
  const names = unlocks.slice(0, 3).map((item) => item.shortTitle).join(", ");
  if (!unlocks.length) return "The last step before you're settled.";
  return `Unlocks ${all.length} later ${all.length === 1 ? "step" : "steps"}, including ${names}.${crossLane ? ` It also holds up ${crossLane.shortTitle} in ${crossLane.lane === "company" ? "your company's" : "your personal"} plan.` : ""}`;
}
