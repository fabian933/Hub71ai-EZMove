"use client";
import Link from "next/link";
import { getState } from "@/lib/engine";
import { hub71Track } from "@/lib/hub71";
import type { Step } from "@/lib/schema";
import Icon from "./Icon";

const siteName = (url: string) => ({ "www.hub71.com": "Hub71", "www.adgm.com": "ADGM" } as Record<string, string>)[new URL(url).hostname] ?? new URL(url).hostname;

export default function Hub71Track({ roadmap, completed, trackDone, teamHref, readOnly, onDone, onToggle, onSelect }: {
  roadmap: readonly Step[]; completed: ReadonlySet<string>; trackDone: ReadonlySet<string>; teamHref: string; readOnly: boolean;
  onDone: (stepId: string) => void; onToggle: (itemId: string) => void; onSelect: (stepId: string) => void;
}) {
  const byId = new Map(roadmap.map((step) => [step.id, step]));
  const items = hub71Track.filter((item) => !item.stepId || byId.has(item.stepId));
  const isDone = (item: (typeof items)[number]) => item.stepId ? completed.has(item.stepId) : trackDone.has(item.id);
  const doneCount = items.filter(isDone).length;
  return <div className="view-page">
    <div className="view-inner">
      <header className="view-heading"><span className="eyebrow">HUB71 BENEFITS TRACK</span><h1>Unlock Hub71’s full benefits.</h1>
        <p>{doneCount} of {items.length} done. Steps marked on your map are ticked here too.</p></header>
      <div className="sample-banner"><Icon name="spark" size={14} />Illustrative order. Confirm requirements, fees and benefits with Hub71.</div>
      <ol className="track-list">{items.map((item, index) => {
        const step = item.stepId ? byId.get(item.stepId)! : null;
        const done = isDone(item);
        const state = step ? getState(step, completed) : done ? "done" : "available";
        const waitingOn = step?.prerequisites.filter((id) => !completed.has(id)).map((id) => byId.get(id)?.shortTitle).filter(Boolean) ?? [];
        return <li key={item.id} className={`track-item ${state}`}>
          <span className="track-dot">{done ? <Icon name="check" size={13} /> : index + 1}</span>
          <div className="track-body">
            <div className="track-title"><strong>{item.title}</strong>{item.illustrative && <span className="sample-tag">Sample</span>}</div>
            <p>{item.detail}</p>
            {state === "locked" && <p className="track-wait">Needs {waitingOn.join(", ").toLowerCase()} first.</p>}
            <div className="track-actions">
              {step ? <>
                {!readOnly && state === "available" && <button type="button" className="track-primary" onClick={() => onDone(step.id)}>Mark done <Icon name="check" size={13} /></button>}
                <button type="button" onClick={() => onSelect(step.id)}>Details <Icon name="chevron" size={12} /></button>
              </> : item.id === "team_relocation" ? <>
                <Link href={teamHref} className="track-primary">Open team <Icon name="chevron" size={12} /></Link>
                {!readOnly && <button type="button" onClick={() => onToggle(item.id)}>{done ? "Mark not done" : "Mark done"}</button>}
              </> : !readOnly && <button type="button" className={done ? "" : "track-primary"} onClick={() => onToggle(item.id)}>{done ? "Mark not done" : <>Mark done <Icon name="check" size={13} /></>}</button>}
              {item.link ? <a href={item.link} target="_blank" rel="noopener noreferrer">Open {siteName(item.link)} <Icon name="link" size={12} /></a> : !step?.officialLink && item.id !== "team_relocation" && <span className="verify-tag">verify</span>}
            </div>
          </div>
        </li>;
      })}</ol>
    </div>
  </div>;
}
