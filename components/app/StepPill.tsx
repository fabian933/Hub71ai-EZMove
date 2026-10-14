"use client";
import StatusPill from "@/components/ui/StatusPill";
import { stepStatus } from "@/lib/status";
import { useMove } from "@/lib/store";
import type { Step } from "@/lib/schema";

/** The step's status pill: coral "Overdue" only when a do-by date has passed. */
export default function StepPill({ step }: { step: Step }) {
  const { roadmap, completed, started, moveDate, today } = useMove();
  const status = stepStatus(step, roadmap, completed, started, moveDate!, today);
  return <StatusPill status={status.status} waitingOn={status.waitingOn?.shortTitle} alert={status.overdue} alertLabel="Overdue" />;
}
