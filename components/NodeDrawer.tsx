"use client";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { daysBetween, deadlineTone, getDoByDate, getState, moveDateOf } from "@/lib/engine";
import { categoryStyles } from "@/lib/map";
import { directUnlocks } from "@/lib/dashboard";
import type { Profile, Step } from "@/lib/schema";
import Icon from "./Icon";
import AreaSelection from "./AreaSelection";
import SchoolSelection from "./SchoolSelection";

const number = (value: number) => value.toLocaleString("en-AE");
const TAMM = "https://www.tamm.abudhabi";
const HUB71 = "https://www.hub71.com";
const siteNames: Record<string, string> = {
  "www.mofa.gov.ae": "MOFA", "www.adek.gov.ae": "ADEK", "mohap.gov.ae": "MOHAP", "www.moccae.gov.ae": "MOCCAE",
  "icp.gov.ae": "ICP", "www.seha.ae": "SEHA", "www.doh.gov.ae": "DoH", "uaepass.ae": "UAE Pass",
  "www.tamm.abudhabi": "TAMM", "www.hub71.com": "Hub71", "www.adgm.com": "ADGM", "visitabudhabi.ae": "Visit Abu Dhabi",
};
const siteName = (url: string) => { const host = new URL(url).hostname; return siteNames[host] ?? host.replace(/^www\./, ""); };
export default function NodeDrawer({ step, roadmap, profile, today, completed, chosenArea, onChooseArea, onClose, onDone, onSelect }: {
  step: Step; roadmap: Step[]; profile: Profile; today: string | null; completed: Set<string>; chosenArea: string | null;
  onChooseArea: (id: string) => void; onClose: () => void; onDone: (id: string) => void; onSelect: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const state = getState(step, completed);
  const byId = new Map(roadmap.map((item) => [item.id, item]));
  const unlocksNext = directUnlocks(step, roadmap);
  const deadline = getDoByDate(step, moveDateOf(profile));
  const isCompany = step.lane === "company";
  const checkLink = step.officialLink ?? (isCompany ? HUB71 : TAMM);
  // Hub71 steps send you to Hub71; company steps outside the guide (e.g. establishment card) are "verify".
  const askHub71 = isCompany && step.source !== "official";
  const checkLabel = (fallback: string) => askHub71 ? "Check with Hub71" : fallback;
  const tone = deadline && today && state !== "done" ? deadlineTone(deadline, today) : "upcoming";
  const daysLeft = deadline && today ? daysBetween(today, deadline) : null;
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
      <h2 id="drawer-title">{step.title}</h2><p className="drawer-provider">{isCompany ? "Your company · " : ""}{step.provider}</p>
      {step.source === "hub71_guide" ? <p className="source-badge guide">From Hub71’s onboarding guide</p> : step.source === "official" && isCompany ? <p className="source-badge">Not in Hub71’s onboarding guide · <span className="verify-tag">verify</span></p> : null}
      {!!step.warnings.length && <div className="warning-panel" role="note">{step.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
      {deadline && <div className={`deadline-panel ${tone}`}><span>{tone === "overdue" ? "OVERDUE" : "DO BY"}</span><strong>{new Date(`${deadline}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}{state !== "done" && daysLeft !== null && <small>{daysLeft < 0 ? ` · ${-daysLeft} ${daysLeft === -1 ? "day" : "days"} late` : daysLeft === 0 ? " · today" : ` · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}</small>}</strong><p>{step.leadTimeDays ?? 30} days before your move date. Verify the required lead time.</p></div>}
      {(step.why || unlocksNext.length > 0) && <section className="drawer-section why-section"><h3>Why it matters</h3>{step.why && <p>{step.why}</p>}
        {unlocksNext.length > 0 && <div className="unlocks-next"><span>Unlocks next:</span><div className="unlock-tags">{unlocksNext.map((item) => <button key={item.id} onClick={() => onSelect(item.id)}>{item.shortTitle}</button>)}</div></div>}</section>}
      <section className="drawer-section"><h3>Needs</h3>{step.prerequisites.length ? <div className="dependency-list">{step.prerequisites.map((id) => <button key={id} onClick={() => onSelect(id)}><span className={`dependency-status ${completed.has(id) ? "complete" : ""}`}><Icon name={completed.has(id) ? "check" : "lock"} size={13} /></span><span>{byId.get(id)?.shortTitle}{byId.get(id)?.lane !== step.lane && <small>{byId.get(id)?.lane === "company" ? "Your company" : "You"}</small>}</span></button>)}</div> : <p>No earlier steps. You can start here.</p>}</section>
      <section className="drawer-section"><h3>Usually needed, confirm with the provider</h3>{step.documents.length ? <ul>{step.documents.map((document) => <li key={document}>{document}</li>)}</ul> : <p>{askHub71 ? "Check the documents with Hub71." : "Verify required documents with the provider."}</p>}</section>
      <div className="drawer-metrics"><section><h3>Cost</h3><p>{step.costAED ? `AED ${number(step.costAED.min)}${step.costAED.max !== step.costAED.min ? `–${number(step.costAED.max)}` : ""}` : <a className="check-link" href={checkLink} target="_blank" rel="noopener noreferrer">{checkLabel("Check current fees")} <Icon name="link" size={12} /></a>}</p></section><section><h3>Time</h3><p>{step.durationDays ? `${step.durationDays.min}${step.durationDays.max !== step.durationDays.min ? `–${step.durationDays.max}` : ""} days` : step.durationLabel ?? <a className="check-link" href={checkLink} target="_blank" rel="noopener noreferrer">{checkLabel("Check processing time")} <Icon name="link" size={12} /></a>}</p></section></div>
      <section className="drawer-section"><h3>Official link</h3>{step.officialLink ? <a className="external-link" href={step.officialLink} target="_blank" rel="noopener noreferrer">Open {siteName(step.officialLink)} <Icon name="link" size={14} /></a> : (askHub71 ? <a className="check-link" href={HUB71} target="_blank" rel="noopener noreferrer">Check with Hub71 <Icon name="link" size={12} /></a> : <span className="verify-tag">verify</span>)}</section>
      {!!step.tips.length && <section className="drawer-section"><h3>Good to know</h3><ul>{step.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul></section>}
      {step.id === "lease_signing" && <AreaSelection profile={profile} chosenArea={chosenArea} onChooseArea={onChooseArea} />}
      {step.id === "school_enrolment" && <SchoolSelection chosenArea={chosenArea} onSelect={onSelect} />}
      <div className="drawer-action"><button className="build-button" disabled={state !== "available"} onClick={() => onDone(step.id)}>{state === "done" ? "Completed" : state === "locked" ? "Complete earlier steps first" : "Mark done"}<Icon name={state === "locked" ? "lock" : "check"} /></button>{state === "available" && <p>Your next steps will open up in your plan.</p>}</div>
    </motion.aside>
  </>;
}
