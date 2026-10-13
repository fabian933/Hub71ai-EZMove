"use client";
import { communities } from "@/lib/data";
import { getState } from "@/lib/engine";
import { communityGroups } from "@/lib/hub71";
import { categoryStyles, descendants } from "@/lib/map";
import type { Step } from "@/lib/schema";
import Icon from "./Icon";

type Answer = { question: string; answer: string; stepId: string };

/** Plain answers built only from the step data, so nothing here is invented. */
function answersFrom(roadmap: readonly Step[]): Answer[] {
  const byId = new Map(roadmap.map((step) => [step.id, step]));
  const answers: Answer[] = [];
  const eid = byId.get("emirates_id");
  if (eid) {
    answers.push({ question: "What do I need for my Emirates ID?", stepId: eid.id, answer: eid.documents.length ? `Usually: ${eid.documents.join(", ").toLowerCase()}. Confirm with ${eid.provider}.` : `Confirm the documents with ${eid.provider}.` });
    const unlocks = [...descendants(eid.id, roadmap)].map((id) => byId.get(id)?.shortTitle).filter(Boolean);
    answers.push({ question: "Why does everything wait for Emirates ID?", stepId: eid.id, answer: `It unlocks ${unlocks.length} steps in your plan, including ${unlocks.slice(0, 4).join(", ").toLowerCase()}.` });
  }
  const before = roadmap.filter((step) => step.phase === "before" && step.category === "before_you_fly");
  if (before.length) answers.push({ question: "What should I do before I fly?", stepId: before[0].id, answer: `${before.map((step) => step.shortTitle).join(", ")}. Each has a do-by date in your plan.` });
  const doctor = byId.get("find_doctor");
  if (doctor) answers.push({ question: "How do I find a doctor?", stepId: doctor.id, answer: `After your health insurance card. Provider: ${doctor.provider}.` });
  const credit = byId.get("credit_history");
  if (credit) answers.push({ question: "How do I build a credit history?", stepId: credit.id, answer: `It follows your bank account. Provider: ${credit.provider}.` });
  return answers;
}

export default function LivingHere({ roadmap, completed, chosenArea, isFounder, trackSummary, onSelect, onOpenTrack }: {
  roadmap: readonly Step[]; completed: ReadonlySet<string>; chosenArea: string | null; isFounder: boolean;
  trackSummary: { done: number; total: number }; onSelect: (id: string) => void; onOpenTrack: () => void;
}) {
  const living = roadmap.filter((step) => step.phase === "living");
  const settled = completed.has("settled");
  const areas = [...communities].sort((a, b) => Number(b.id === chosenArea) - Number(a.id === chosenArea)).slice(0, 3);
  return <div className="view-page">
    <div className="view-inner">
      <header className="view-heading"><span className="eyebrow">PHASE 2 · LIVING HERE</span><h1>Staying well, once you’re settled.</h1>
        <p>{settled ? "You’re settled. Here’s what helps life feel like home." : "You can look ahead now. Most of this opens up once you’re settled in."}</p></header>

      <section className="view-section"><h2>Living well</h2>
        <div className="living-grid">{living.map((step) => {
          const state = getState(step, completed);
          return <button type="button" key={step.id} className={`living-card ${state}`} onClick={() => onSelect(step.id)}>
            <span className="living-card-top"><i style={{ background: categoryStyles[step.category].color }} />{categoryStyles[step.category].label}<span className="living-state">{state === "done" ? <><Icon name="check" size={12} />Done</> : state === "locked" ? <><Icon name="lock" size={12} />Later</> : "Ready"}</span></span>
            <strong>{step.title}</strong><small>{step.provider}</small>
          </button>;
        })}</div>
      </section>

      <section className="view-section"><h2>Benefits</h2>
        {isFounder ? <div className="benefit-card"><div><strong>Hub71 benefits track</strong><p>{trackSummary.done} of {trackSummary.total} done. What to complete, in order, to unlock Hub71’s full benefits.</p></div><button type="button" onClick={onOpenTrack}>Open track <Icon name="chevron" size={13} /></button></div>
          : <div className="benefit-card"><div><strong>Workplace benefits</strong><p>Ask your employer which relocation and health benefits apply to you.</p></div></div>}
      </section>

      <section className="view-section"><h2>Communities</h2>
        <div className="living-grid">{communityGroups.map((group) => <article key={group.id} className="group-card"><span className="living-card-top">{group.goodFor.join(" · ")}{group.illustrative && <span className="sample-tag">Sample</span>}</span><strong>{group.name}</strong><p>{group.summary}</p></article>)}</div>
        <h3 className="view-subhead">Neighbourhoods</h3>
        <div className="living-grid">{areas.map((area) => <article key={area.id} className="group-card"><span className="living-card-top">{area.goodFor.join(" · ")}{area.id === chosenArea && <span className="chosen-mini">Your area</span>}</span><strong>{area.name}</strong><p>{area.summary}</p></article>)}</div>
      </section>

      <section className="view-section"><h2>Answers</h2>
        <div className="answer-list">{answersFrom(roadmap).map((item) => <details key={item.question}><summary>{item.question}<Icon name="chevron" size={13} /></summary><p>{item.answer}</p><button type="button" onClick={() => onSelect(item.stepId)}>Open step <Icon name="chevron" size={12} /></button></details>)}</div>
        <p className="view-footnote">Answers come from the steps in your plan. Confirm details with the official provider.</p>
      </section>
    </div>
  </div>;
}
