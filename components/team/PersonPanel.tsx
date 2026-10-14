"use client";
import { useEffect, useRef } from "react";
import { BellRing, ExternalLink, X } from "lucide-react";
import { StaticMoveProvider } from "@/lib/store";
import { laneSteps, type Lane } from "@/lib/dashboard";
import { countryName } from "@/lib/profile";
import StepRow from "@/components/app/StepRow";
import ProgressBar from "@/components/ui/ProgressBar";
import StatusPill from "@/components/ui/StatusPill";
import type { PersonRow } from "@/lib/demoTeam";

const household = (row: PersonRow) => row.profile.household === "solo" ? "Solo" : row.profile.household === "couple" ? "With partner" : `Family · ${row.profile.kids} kids`;
const lanes: { lane: Lane; title: string }[] = [{ lane: "company", title: "Their company" }, { lane: "personal", title: "Them and their family" }];

/** Read-only view of one person's plan, reusing the employee app's milestone rows. */
export default function PersonPanel({ row, onClose, onRemind }: { row: PersonRow; onClose: () => void; onRemind: () => void }) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [onClose]);
  const founder = row.profile.reason === "hub71_founder";
  return <>
    <div className="panel-scrim" onClick={onClose} />
    <aside ref={panel} className="person-panel" role="dialog" aria-modal="true" aria-labelledby="panel-title">
      <header className="panel-head">
        <div><h2 id="panel-title">{row.name}</h2><p>{row.company} · {countryName(row.profile.nationality)} · {household(row)} · {row.hires} {row.hires === 1 ? "hire" : "hires"}</p></div>
        <button ref={close} type="button" className="icon-btn" aria-label="Close" onClick={onClose}><X size={18} aria-hidden /></button>
      </header>
      {row.needsAttention && <StatusPill status="waiting" alert alertLabel={`Needs attention · ${row.current?.shortTitle} for ${row.currentStepDays} days`} />}
      <ProgressBar done={row.done} total={row.total} label={`${row.done} of ${row.total} steps done`} />
      <div className="panel-actions">
        <button type="button" className="btn btn-primary" onClick={onRemind}><BellRing size={16} aria-hidden />Send reminder</button>
        <a className="btn btn-secondary" href={`/app?demo=${row.id === "sara" ? "founder" : row.id}`} target="_blank" rel="noopener noreferrer">Open their plan<ExternalLink size={15} aria-hidden /></a>
      </div>
      <StaticMoveProvider profile={row.profile} completed={row.completedSet} started={row.startedSet} today={row.today}>
        {lanes.filter(({ lane }) => lane === "personal" || founder).map(({ lane, title }) => {
          const steps = laneSteps(row.roadmap, lane);
          return <section key={lane} className="panel-section">
            <div className="panel-section-head"><h3>{title}</h3><span>{steps.filter((step) => row.completedSet.has(step.id)).length} of {steps.length} done</span></div>
            <ul className="step-list">{steps.map((step) => <StepRow key={step.id} step={step} readOnly />)}</ul>
          </section>;
        })}
      </StaticMoveProvider>
    </aside>
  </>;
}
