"use client";
import { useState } from "react";
import { useMove } from "@/lib/store";
import { laneSteps, laneTitles, type Lane } from "@/lib/dashboard";
import StepRow from "@/components/app/StepRow";
import PageHeader from "@/components/ui/PageHeader";

type Filter = "all" | "todo" | "done";
const filters: { value: Filter; label: string }[] = [{ value: "all", label: "All" }, { value: "todo", label: "To do" }, { value: "done", label: "Done" }];
const titles: Record<Lane, string> = { company: "Your company", personal: laneTitles.personal };

export default function Plan() {
  const { profile, roadmap, completed } = useMove();
  const [filter, setFilter] = useState<Filter>("all");
  if (!profile) return null;
  const lanes: Lane[] = profile.reason === "hub71_founder" ? ["company", "personal"] : ["personal"];
  return <div className="app-page">
    <PageHeader title="Your plan" description="Every step, in the order it happens." />
    <div className="chip-row" role="group" aria-label="Filter steps">
      {filters.map((item) => <button key={item.value} type="button" className={`chip${filter === item.value ? " active" : ""}`} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}
    </div>
    {lanes.map((lane) => {
      const steps = laneSteps(roadmap, lane).filter((step) => filter === "all" || (filter === "done" ? completed.has(step.id) : !completed.has(step.id)));
      return <section key={lane} id={lane} className="app-section">
        <div className="section-head"><h2>{titles[lane]}</h2><span>{steps.length} {steps.length === 1 ? "step" : "steps"}</span></div>
        {steps.length ? <ul className="step-list">{steps.map((step) => <StepRow key={step.id} step={step} />)}</ul> : <p className="empty">{filter === "done" ? "Nothing done here yet." : "All done here."}</p>}
      </section>;
    })}
  </div>;
}
