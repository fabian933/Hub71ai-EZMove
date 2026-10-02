import { z } from "zod";
import { steps } from "./data";
import { ProfileSchema, type Profile, type Step } from "./schema";

export type StepState = "done" | "available" | "locked";
export type CompletedIds = ReadonlySet<string> | readonly string[];
const completedSet = (ids: CompletedIds) => new Set(ids);

export function personalise(profile: Profile): Step[] {
  const parsed = ProfileSchema.parse(profile);
  const reason = parsed.reason === "other" ? "job" : parsed.reason;
  const selected = steps.filter(({ appliesIf: rule }) =>
    (!rule.household || rule.household.includes(parsed.household)) &&
    (rule.minKids === undefined || parsed.kids >= rule.minKids) &&
    (!rule.reasons || rule.reasons.includes(reason)) &&
    (rule.hasPets === undefined || parsed.hasPets === rule.hasPets) &&
    (rule.drives === undefined || parsed.drives === rule.drives),
  );
  const ids = new Set(selected.map((step) => step.id));
  return selected.map((step) => ({
    ...step,
    prerequisites: step.prerequisites.filter((id) => ids.has(id)),
    appliesIf: { ...step.appliesIf },
    documents: [...step.documents],
    tips: [...step.tips],
  }));
}

export function getState(step: Step, completed: CompletedIds = []): StepState {
  const done = completedSet(completed);
  if (done.has(step.id)) return "done";
  return step.prerequisites.every((id) => done.has(id)) ? "available" : "locked";
}

/** Number of unique unfinished descendants, including the settled milestone. */
export function downstreamUnlockCount(stepId: string, roadmap: readonly Step[], completed: CompletedIds = []): number {
  const done = completedSet(completed);
  const descendants = new Set<string>();
  const queue = [stepId];
  for (let index = 0; index < queue.length; index++) {
    for (const step of roadmap) {
      if (step.id !== stepId && step.prerequisites.includes(queue[index]) && !descendants.has(step.id)) {
        descendants.add(step.id);
        queue.push(step.id);
      }
    }
  }
  return [...descendants].filter((id) => !done.has(id)).length;
}

export function downstreamUnlockCounts(roadmap: readonly Step[], completed: CompletedIds = []): Record<string, number> {
  return Object.fromEntries(roadmap.map((step) => [step.id, downstreamUnlockCount(step.id, roadmap, completed)]));
}

/** Longest remaining dependency chain to the target, by step count.
 * Unknown durations are not turned into invented duration estimates.
 * Other parallel prerequisite branches still need to be completed.
 */
export function criticalPath(roadmap: readonly Step[], completed: CompletedIds = [], targetId = "settled"): Step[] {
  const done = completedSet(completed);
  const byId = new Map(roadmap.map((step) => [step.id, step]));
  const memo = new Map<string, Step[]>();
  const visiting = new Set<string>();
  function longest(id: string): Step[] {
    const step = byId.get(id);
    if (!step) throw new Error(`Unknown critical path step: ${id}`);
    if (done.has(id)) return [];
    const cached = memo.get(id);
    if (cached) return cached;
    if (visiting.has(id)) throw new Error(`Cyclic critical path at ${id}`);
    visiting.add(id);
    const parentPath = step.prerequisites.map(longest).reduce<Step[]>(
      (best, candidate) => candidate.length > best.length ? candidate : best, [],
    );
    visiting.delete(id);
    const path = [...parentPath, step];
    memo.set(id, path);
    return path;
  }
  return longest(targetId);
}

/** YYYY-MM-DD. Older profiles without a move date fall back to the first day of the move month. */
export function moveDateOf(profile: Pick<Profile, "moveDate" | "moveMonth">): string {
  return profile.moveDate ?? `${ProfileSchema.shape.moveMonth.parse(profile.moveMonth)}-01`;
}

/** Today's date in the viewer's local time zone, as YYYY-MM-DD. */
export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Whole days from one YYYY-MM-DD date to another. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Move date minus the step's lead time, as YYYY-MM-DD in UTC. */
export function getDoByDate(step: Step, moveDate: string): string | null {
  if (!step.mustDoBeforeFlying) return null;
  const date = new Date(`${z.iso.date().parse(moveDate)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - (step.leadTimeDays ?? 30));
  return date.toISOString().slice(0, 10);
}

export type DeadlineTone = "upcoming" | "soon" | "overdue";
export function deadlineTone(doBy: string, today: string): DeadlineTone {
  const days = daysBetween(today, doBy);
  return days < 0 ? "overdue" : days <= 14 ? "soon" : "upcoming";
}

export function doByDates(profile: Profile, roadmap: readonly Step[] = personalise(profile)): Record<string, string> {
  return Object.fromEntries(roadmap.filter((step) => step.mustDoBeforeFlying)
    .map((step) => [step.id, getDoByDate(step, moveDateOf(profile))!]));
}

export const COMPLETED_STORAGE_KEY = "ezmove.completed.v1";
export type ProgressStorage = Pick<Storage, "getItem" | "setItem">;
function browserStorage(): ProgressStorage | undefined {
  try { return typeof window === "undefined" ? undefined : window.localStorage; }
  catch { return undefined; }
}

export function loadCompletedIds(storage: ProgressStorage | undefined = browserStorage()): Set<string> {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(COMPLETED_STORAGE_KEY) ?? "[]");
    const known = new Set(steps.map((step) => step.id));
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string" && known.has(id)) : []);
  } catch { return new Set(); }
}

/** Returns false when storage is unavailable; the caller can keep progress in memory. */
export function saveCompletedIds(completed: CompletedIds, storage: ProgressStorage | undefined = browserStorage()): boolean {
  if (!storage) return false;
  try {
    const known = new Set(steps.map((step) => step.id));
    storage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify([...completedSet(completed)].filter((id) => known.has(id)).sort()));
    return true;
  } catch { return false; }
}
