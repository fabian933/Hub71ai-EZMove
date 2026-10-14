"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, CircleAlert, MessageCircle, Play, RotateCcw } from "lucide-react";
import { useMove } from "@/lib/store";
import { getDoByDate, getState } from "@/lib/engine";
import { directUnlocks } from "@/lib/dashboard";
import { unknownLabel } from "@/lib/copy";
import { formatAED, formatDate } from "@/lib/format";
import { providers } from "@/lib/data";
import StepPill from "@/components/app/StepPill";
import OpenLink from "@/components/app/OpenLink";
import ProviderTile from "@/components/app/ProviderTile";
import SourceTag from "@/components/ui/SourceTag";

const range = (value: { min: number; max: number }, unit: (n: number) => string) => value.min === value.max ? unit(value.min) : `${unit(value.min)}–${unit(value.max)}`;

export default function StepDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { roadmap, completed, started, docs, moveDate, markDone, undoDone, markStarted, toggleDoc } = useMove();
  const step = roadmap.find((item) => item.id === id);
  if (!step || !moveDate) return <div className="app-page"><p className="empty">This step isn&apos;t in your plan.</p><Link href="/app/plan" className="see-all">Back to your plan</Link></div>;
  const state = getState(step, completed);
  const byId = new Map(roadmap.map((item) => [item.id, item]));
  const waiting = step.prerequisites.map((pid) => byId.get(pid)!).filter((item) => !completed.has(item.id));
  const unlocks = directUnlocks(step, roadmap);
  const ticked = new Set(docs[step.id] ?? []);
  const inContext = providers.filter((provider) => provider.steps.includes(step.id));
  const time = step.durationDays ? range(step.durationDays, (n) => `${n} days`).replace(/ days–/, "–") : step.durationLabel;
  const cost = step.costAED ? range(step.costAED, formatAED) : null;
  const doBy = getDoByDate(step, moveDate);
  const askHref = `/app/ask?q=${encodeURIComponent(`What do I need to know about "${step.title}"?`)}`;
  return <div className="app-page step-page">
    <button type="button" className="back-link" onClick={() => router.back()}><ArrowLeft size={16} aria-hidden />Back</button>
    <header className="step-head">
      <span className="step-lane">{step.lane === "company" ? "Your company" : "You and your family"}</span>
      <h1>{step.title}</h1>
      <div className="step-head-meta"><StepPill step={step} />{step.source === "hub71_guide" ? <SourceTag source="hub71_guide" /> : step.source === "official" ? <SourceTag source="verify" /> : null}</div>
      {step.why && <p className="step-why">{step.why}</p>}
    </header>

    {step.warnings.map((warning) => <p key={warning} className="warning-note"><CircleAlert size={16} aria-hidden />{warning}</p>)}

    {waiting.length > 0 && <section className="app-section">
      <h2>Waiting on</h2>
      <ul className="link-list">{waiting.map((item) => <li key={item.id}><Link href={`/app/step/${item.id}`}><span>{item.title}{item.lane !== step.lane && <small>{item.lane === "company" ? "Your company" : "You and your family"}</small>}</span><ChevronRight size={16} aria-hidden /></Link></li>)}</ul>
    </section>}

    <section className="app-section">
      <h2>You&apos;ll need</h2>
      {step.documents.length ? <ul className="doc-list">{step.documents.map((doc) => <li key={doc}><label><input type="checkbox" checked={ticked.has(doc)} onChange={() => toggleDoc(step.id, doc)} /><span>{doc}</span></label></li>)}</ul>
        : <p className="empty">{unknownLabel(step) === "Verify" ? "Verify the documents with the provider." : "Check the documents with your company."}</p>}
    </section>

    <section className="app-section facts">
      <div><h2>Time</h2><p>{time ?? <span className="unknown">{unknownLabel(step)}</span>}</p></div>
      <div><h2>Cost</h2><p>{cost ?? <span className="unknown">{unknownLabel(step)}</span>}</p></div>
      {doBy && <div className="wide"><h2>Do by</h2><p>{formatDate(doBy)} · before you fly</p></div>}
    </section>

    {step.tips.length > 0 && <section className="app-section"><h2>Good to know</h2><ul className="tip-list">{step.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul></section>}

    {inContext.length > 0 && <section className="app-section"><div className="section-head"><h2>Providers</h2><SourceTag source="demo" /></div><div className="provider-grid">{inContext.map((provider) => <ProviderTile key={provider.id} provider={provider} />)}</div></section>}

    {unlocks.length > 0 && <section className="app-section"><h2>Unlocks next</h2><div className="chip-row">{unlocks.map((item) => <Link key={item.id} href={`/app/step/${item.id}`} className="chip">{item.shortTitle}</Link>)}</div></section>}

    <div className="step-actions">
      {step.officialLink && <OpenLink href={step.officialLink} />}
      {state === "available" && !started.has(step.id) && !step.thirdParty && <button type="button" className="btn btn-secondary btn-full" onClick={() => markStarted(step.id)}><Play size={15} aria-hidden />I&apos;ve started</button>}
      {state === "available" && <button type="button" className={`btn ${step.officialLink ? "btn-secondary" : "btn-primary"} btn-full`} onClick={() => markDone(step.id)}><Check size={16} aria-hidden />Mark done</button>}
      {state === "done" && <button type="button" className="btn btn-secondary btn-full" onClick={() => undoDone(step.id)}><RotateCcw size={15} aria-hidden />Mark not done</button>}
      <Link href={askHref} className="ask-link"><MessageCircle size={16} aria-hidden />Ask about this step</Link>
    </div>
  </div>;
}
