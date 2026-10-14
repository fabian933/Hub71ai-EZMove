import { daysBetween, getDoByDate, getState } from "./engine";
import type { Status } from "@/components/ui/StatusPill";
import type { Step } from "./schema";

export type StepStatus = { status: Status; waitingOn?: Step; overdue: boolean; doBy: string | null };

/**
 * Done / In progress / To do / Waiting on X.
 * In progress only once the person taps "I've started", or for third-party steps (e.g. the ADGM licence) once ready.
 * Overdue (coral) when a do-by date has passed and the step isn't done.
 */
export function stepStatus(step: Step, roadmap: readonly Step[], completed: ReadonlySet<string>, started: ReadonlySet<string>, moveDate: string, today: string | null): StepStatus {
  const state = getState(step, completed);
  const doBy = getDoByDate(step, moveDate);
  const overdue = state !== "done" && !!doBy && !!today && daysBetween(today, doBy) < 0;
  if (state === "done") return { status: "done", overdue: false, doBy };
  if (state === "locked") {
    const byId = new Map(roadmap.map((item) => [item.id, item]));
    const waitingOn = step.prerequisites.map((id) => byId.get(id)).find((item) => item && !completed.has(item.id));
    return { status: "waiting", waitingOn, overdue, doBy };
  }
  return { status: started.has(step.id) || step.thirdParty ? "in_progress" : "todo", overdue, doBy };
}
