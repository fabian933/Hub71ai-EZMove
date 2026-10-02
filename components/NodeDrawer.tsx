"use client";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getDoByDate, getState } from "@/lib/engine";
import { categoryStyles, descendants } from "@/lib/map";
import type { Profile, Step } from "@/lib/schema";
import Icon from "./Icon";
import AreaSelection from "./AreaSelection";
import SchoolSelection from "./SchoolSelection";

const number = (value: number) => value.toLocaleString("en-AE");
export default function NodeDrawer({ step, roadmap, profile, completed, chosenArea, onChooseArea, onClose, onDone, onSelect }: {
  step: Step; roadmap: Step[]; profile: Profile; completed: Set<string>; chosenArea: string | null;
  onChooseArea: (id: string) => void; onClose: () => void; onDone: (id: string) => void; onSelect: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const state = getState(step, completed);
  const byId = new Map(roadmap.map((item) => [item.id, item]));
  const downstream = descendants(step.id, roadmap);
  const deadline = getDoByDate(step, profile.moveMonth);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const focusables = [...(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, [tabindex="0"]') ?? [])];
        const first = focusables[0]; const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [onClose]);
  useEffect(() => { ref.current?.scrollTo({ top: 0 }); }, [step.id]);
  return <>
    <motion.div className="drawer-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.aside ref={ref} className="node-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" initial={{ x: reduced ? 0 : "100%" }} animate={{ x: 0 }} exit={{ x: reduced ? 0 : "100%" }} transition={{ type: "spring", damping: 32, stiffness: 280 }}>
      <div className="drawer-top"><span className="drawer-category"><i style={{ background: categoryStyles[step.category].color }} />{categoryStyles[step.category].label}</span><button ref={closeRef} className="icon-button" aria-label="Close step details" onClick={onClose}><Icon name="close" /></button></div>
      <div className={`drawer-state ${state}`}>{state === "done" ? <Icon name="check" size={14} /> : state === "locked" ? <Icon name="lock" size={14} /> : <span className="status-dot" />}{state === "done" ? "Completed" : state === "available" ? "Ready when you are" : "A few steps come first"}</div>
      <h2 id="drawer-title">{step.title}</h2><p className="drawer-provider">{step.provider}</p>
      {deadline && <div className="deadline-panel"><span>DO BY</span><strong>{new Date(`${deadline}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</strong><p>Planning reminder based on the first day of your move month. Verify the required lead time.</p></div>}
      <section className="drawer-section"><h3>Needs</h3>{step.prerequisites.length ? <div className="dependency-list">{step.prerequisites.map((id) => <button key={id} onClick={() => onSelect(id)}><span className={`dependency-status ${completed.has(id) ? "complete" : ""}`}><Icon name={completed.has(id) ? "check" : "lock"} size={13} /></span><span>{byId.get(id)?.shortTitle}</span><Icon name="chevron" size={14} /></button>)}</div> : <p>No earlier steps. You can start here.</p>}</section>
      <section className="drawer-section"><h3>Unlocks <span>{downstream.size}</span></h3>{downstream.size ? <div className="unlock-tags">{[...downstream].map((id) => <button key={id} onClick={() => onSelect(id)}>{byId.get(id)?.shortTitle}</button>)}</div> : <p>{step.id === "settled" ? "Welcome to your next chapter." : "One more part of your move, taken care of."}</p>}{downstream.size > 0 && <p className="tiny-note">Downstream steps may also need other prerequisites.</p>}</section>
      <section className="drawer-section"><h3>Documents</h3>{step.documents.length ? <ul>{step.documents.map((document) => <li key={document}>{document}</li>)}</ul> : <p>Verify required documents with the provider.</p>}</section>
      <div className="drawer-metrics"><section><h3>Cost</h3><p>{step.costAED ? `AED ${number(step.costAED.min)}${step.costAED.max !== step.costAED.min ? `–${number(step.costAED.max)}` : ""}` : <span className="verify-tag">verify</span>}</p></section><section><h3>Time</h3><p>{step.durationDays ? `${step.durationDays.min}${step.durationDays.max !== step.durationDays.min ? `–${step.durationDays.max}` : ""} days` : <span className="verify-tag">verify</span>}</p></section></div>
      <section className="drawer-section"><h3>Official link</h3>{step.officialLink ? <a className="external-link" href={step.officialLink} target="_blank" rel="noopener noreferrer">Visit official provider <Icon name="link" size={14} /></a> : <span className="verify-tag">verify</span>}</section>
      {!!step.tips.length && <section className="drawer-section"><h3>Good to know</h3><ul>{step.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul></section>}
      {step.id === "lease_signing" && <AreaSelection profile={profile} chosenArea={chosenArea} onChooseArea={onChooseArea} />}
      {step.id === "school_enrolment" && <SchoolSelection chosenArea={chosenArea} onSelect={onSelect} />}
      <div className="drawer-action"><button className="build-button" disabled={state !== "available"} onClick={() => onDone(step.id)}>{state === "done" ? "Completed" : state === "locked" ? "Complete earlier steps first" : "Mark done"}<Icon name={state === "locked" ? "lock" : "check"} /></button>{state === "available" && <p>Your next steps will light up on the map.</p>}</div>
    </motion.aside>
  </>;
}
