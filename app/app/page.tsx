"use client";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useMove, firstName } from "@/lib/store";
import { laneSteps, nextMilestone, nextUpCards, settlingSteps, type Lane } from "@/lib/dashboard";
import { daysBetween } from "@/lib/engine";
import ProgressBar from "@/components/ui/ProgressBar";
import SourceTag from "@/components/ui/SourceTag";
import StepPill from "@/components/app/StepPill";
import StepRow from "@/components/app/StepRow";
import OpenLink from "@/components/app/OpenLink";
import type { Step } from "@/lib/schema";
import { formatDate } from "@/lib/format";

/** Up to four rows: the most recent done step for context, then what's next. */
function window4(steps: Step[], completed: ReadonlySet<string>): Step[] {
  const firstOpen = steps.findIndex((step) => !completed.has(step.id));
  if (firstOpen === -1) return steps.slice(-4);
  const start = Math.max(0, firstOpen - 1);
  return steps.slice(start, start + 4);
}

function MilestoneList({ lane, title }: { lane: Lane; title: string }) {
  const { roadmap, completed } = useMove();
  const steps = laneSteps(roadmap, lane);
  return <section className="app-section">
    <div className="section-head"><h2>{title}</h2><span>{steps.filter((step) => completed.has(step.id)).length} of {steps.length} done</span></div>
    <ul className="step-list">{window4(steps, completed).map((step) => <StepRow key={step.id} step={step} />)}</ul>
    {steps.length > 4 && <Link href={`/app/plan#${lane}`} className="see-all">See all<ArrowRight size={14} aria-hidden /></Link>}
  </section>;
}

export default function Home() {
  const { profile, roadmap, completed, moveDate, today, markDone, isDemo } = useMove();
  if (!profile || !moveDate) return null;
  const founder = profile.reason === "hub71_founder";
  const next = nextUpCards(roadmap, completed, moveDate, founder, 1)[0];
  const counted = settlingSteps(roadmap).filter((step) => step.id !== "settled");
  const milestone = nextMilestone(roadmap, completed);
  const days = today ? daysBetween(today, moveDate) : null;
  const name = firstName(profile);
  return <div className="app-page">
    <header className="home-head">
      <div><h1>{name ? `Hi ${name}` : "Hi there"}</h1>
        <p>{days !== null && days < 0 ? `Moved ${formatDate(moveDate)} · ${-days} days ago` : `Moving ${formatDate(moveDate)}${days === null ? "" : days === 0 ? " · today" : ` · ${days} days to go`}`}</p></div>
      <div className="home-head-side">{isDemo && <SourceTag source="demo" />}<Link href="/app/start" className="edit-link">Edit details</Link></div>
    </header>

    {next ? <section className="next-card" aria-labelledby="next-title">
      <span className="next-label">Your next step</span>
      <Link href={`/app/step/${next.id}`} className="next-title" id="next-title">{next.title}<ArrowRight size={18} aria-hidden /></Link>
      {next.why && <p className="next-why">{next.why}</p>}
      <div className="next-meta"><StepPill step={next} />{next.durationLabel && <span>{next.durationLabel}</span>}</div>
      {next.officialLink ? <OpenLink href={next.officialLink} light /> : <button type="button" className="btn btn-on-navy btn-full" onClick={() => markDone(next.id)}>Mark done<Check size={16} aria-hidden /></button>}
    </section> : <section className="next-card"><span className="next-label">Your next step</span><p className="next-title">Nothing waiting on you right now.</p></section>}

    <section className="app-section">
      <ProgressBar done={counted.filter((step) => completed.has(step.id)).length} total={counted.length}
        label={`${counted.filter((step) => completed.has(step.id)).length} of ${counted.length} steps done`} detail={milestone ? `Next milestone: ${milestone.shortTitle}` : undefined} />
    </section>

    {founder && <MilestoneList lane="company" title="Your company" />}
    <MilestoneList lane="personal" title="You and your family" />
  </div>;
}
