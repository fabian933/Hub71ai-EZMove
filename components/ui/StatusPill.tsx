import { Check, CircleDashed, Clock, Lock, TriangleAlert } from "lucide-react";

export type Status = "done" | "in_progress" | "todo" | "waiting";
const labels: Record<Exclude<Status, "waiting">, string> = { done: "Done", in_progress: "In progress", todo: "To do" };
const icons = { done: Check, in_progress: Clock, todo: CircleDashed, waiting: Lock };

/** One of four states. `alert` (overdue or needs attention) is the only use of coral. */
export default function StatusPill({ status, waitingOn, alert, alertLabel }: {
  status: Status; waitingOn?: string; alert?: boolean; alertLabel?: string;
}) {
  const Icon = alert ? TriangleAlert : icons[status];
  const label = alert && alertLabel ? alertLabel : status === "waiting" ? `Waiting on ${waitingOn ?? "an earlier step"}` : labels[status];
  return <span className={`pill pill-${alert ? "alert" : status}`}><Icon size={12} strokeWidth={2.2} aria-hidden />{label}</span>;
}
