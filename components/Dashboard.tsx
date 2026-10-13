"use client";
import { getState, nextUpSteps } from "@/lib/engine";
import { cardStatus, laneSteps, laneTitles, settlingSteps, type Lane } from "@/lib/dashboard";
import type { Step } from "@/lib/schema";
import Icon from "./Icon";

function StepCard({ step, roadmap, completed, moveDate, today, onSelect }: {
  step: Step; roadmap: readonly Step[]; completed: ReadonlySet<string>; moveDate: string; today: string | null; onSelect: (id: string) => void;
}) {
  const status = cardStatus(step, roadmap, completed, moveDate, today);
  return <button type="button" className={`step-card ${status.kind}`} onClick={() => onSelect(step.id)}>
    <span className="step-card-title">{step.title}{step.source === "hub71_guide" && <span className="guide-tag">Hub71 guide</span>}</span>
    {status.kind === "done" ? <span className="step-status done"><Icon name="check" size={13} />Done</span>
      : status.kind === "now" ? <span className={`step-status now ${status.tone ?? ""}`}><span className="status-dot" />{status.label ? `Do now · ${status.label}` : "Do now"}</span>
      : <span className="step-status waiting"><Icon name="lock" size={12} />Waiting on {status.on.shortTitle}{status.otherLane && <em>{status.on.lane === "company" ? "Your company" : "You"}</em>}</span>}
  </button>;
}

function LaneColumn({ lane, roadmap, completed, moveDate, today, onSelect, onOpenTrack }: {
  lane: Lane; roadmap: readonly Step[]; completed: ReadonlySet<string>; moveDate: string; today: string | null;
  onSelect: (id: string) => void; onOpenTrack?: () => void;
}) {
  const steps = laneSteps(roadmap, lane);
  const groups = { now: steps.filter((step) => getState(step, completed) === "available"), later: steps.filter((step) => getState(step, completed) === "locked"), done: steps.filter((step) => completed.has(step.id)) };
  const card = (step: Step) => <StepCard key={step.id} step={step} roadmap={roadmap} completed={completed} moveDate={moveDate} today={today} onSelect={onSelect} />;
  return <section className={`lane lane-${lane}`} aria-labelledby={`lane-${lane}`}>
    <header className="lane-heading"><h2 id={`lane-${lane}`}>{laneTitles[lane]}</h2><span>{groups.done.length} of {steps.length} done</span>
      {onOpenTrack && <button type="button" className="lane-link" onClick={onOpenTrack}>Benefits track <Icon name="chevron" size={11} /></button>}</header>
    {groups.now.length > 0 && <div className="lane-group"><h3>Do now</h3>{groups.now.map(card)}</div>}
    {groups.later.length > 0 && <div className="lane-group"><h3>Coming up</h3>{groups.later.map(card)}</div>}
    {groups.done.length > 0 && <details className="lane-group lane-done"><summary><h3>Done <span>{groups.done.length}</span></h3><Icon name="chevron" size={12} /></summary>{groups.done.map(card)}</details>}
    {!groups.now.length && !groups.later.length && <p className="lane-empty">All done in this lane.</p>}
  </section>;
}

export default function Dashboard({ roadmap, completed, moveDate, today, isFounder, onSelect, onOpenTrack }: {
  roadmap: readonly Step[]; completed: ReadonlySet<string>; moveDate: string; today: string | null; isFounder: boolean;
  onSelect: (id: string) => void; onOpenTrack: () => void;
}) {
  const nextUp = nextUpSteps(settlingSteps(roadmap), completed, moveDate);
  return <div className="view-page dashboard">
    <div className="dashboard-inner">
      <section className="next-up-row" aria-labelledby="next-up-title">
        <h2 id="next-up-title">Next up</h2>
        {nextUp.length ? <div className="next-up-cards">{nextUp.map(({ step }) => <div key={step.id} className="next-up-card">
          <span className="next-up-lane">{step.lane === "company" ? "Your company" : "You and your family"}</span>
          <StepCard step={step} roadmap={roadmap} completed={completed} moveDate={moveDate} today={today} onSelect={onSelect} />
        </div>)}</div> : <p className="lane-empty">Nothing waiting on you right now.</p>}
      </section>
      <div className={`lanes ${isFounder ? "two" : "one"}`}>
        {isFounder && <LaneColumn lane="company" roadmap={roadmap} completed={completed} moveDate={moveDate} today={today} onSelect={onSelect} onOpenTrack={onOpenTrack} />}
        <LaneColumn lane="personal" roadmap={roadmap} completed={completed} moveDate={moveDate} today={today} onSelect={onSelect} />
      </div>
    </div>
  </div>;
}
