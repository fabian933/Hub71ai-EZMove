"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Clock4, Gift, MapPin, TriangleAlert, Users, X } from "lucide-react";
import { demoPeople, personRow, teamSummary, type PersonRow } from "@/lib/demoTeam";
import { countryName } from "@/lib/profile";
import StatusPill from "@/components/ui/StatusPill";
import ProgressBar from "@/components/ui/ProgressBar";
import SourceTag from "@/components/ui/SourceTag";
import IconTile from "@/components/ui/IconTile";
import PersonPanel from "./PersonPanel";

type Filter = "all" | "attention" | "on_track" | "settled";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" }, { value: "attention", label: "Needs attention" }, { value: "on_track", label: "On track" }, { value: "settled", label: "Settled" },
];
const matches = (row: PersonRow, filter: Filter) => filter === "all" || (filter === "attention" ? row.needsAttention : filter === "settled" ? row.settled : !row.settled && !row.needsAttention);
const household = (row: PersonRow) => row.profile.household === "solo" ? "Solo" : row.profile.household === "couple" ? "With partner" : "Family";

function CurrentStep({ row }: { row: PersonRow }) {
  if (row.settled) return <span className="current-step"><span>Settled</span><StatusPill status="done" /></span>;
  if (!row.current || !row.currentStatus) return <span className="muted">—</span>;
  const days = row.currentStepDays !== null ? `Day ${row.currentStepDays}` : null;
  return <span className="current-step">
    <span>{row.current.shortTitle}{days && <small>{days}</small>}</span>
    <span className="pill-stack">
      <StatusPill status={row.currentStatus.status} waitingOn={row.currentStatus.waitingOn?.shortTitle} />
      {row.needsAttention && <StatusPill status="waiting" alert alertLabel="Needs attention" />}
    </span>
  </span>;
}

export default function TeamDashboard() {
  // Built on the client so relative move dates use the viewer's own date.
  const [rows, setRows] = useState<PersonRow[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  useEffect(() => { setRows(demoPeople.map((person) => personRow(person))); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2600); return () => clearTimeout(timer); }, [toast]);
  const close = useCallback(() => setOpenId(null), []);
  if (!rows) return <div className="team-loading">Loading relocations…</div>;
  const summary = teamSummary(rows);
  const visible = rows.filter((row) => matches(row, filter));
  const open = rows.find((row) => row.id === openId);

  return <>
    <section className="team-stats" aria-label="Summary">
      <div className="stat"><IconTile icon={Users} size={36} /><b>{summary.people}</b><span>People relocating</span></div>
      <div className="stat"><IconTile icon={CheckCircle2} size={36} /><b>{summary.onTrack}</b><span>On track</span></div>
      <div className={`stat${summary.needsAttention ? " alert" : ""}`}><span className="icon-tile alert-tile" style={{ width: 36, height: 36 }}><TriangleAlert size={18} aria-hidden /></span><b>{summary.needsAttention}</b><span>Needs attention</span></div>
      <div className="stat"><IconTile icon={Clock4} size={36} /><b>{summary.avgDaysToLicence ?? "—"}<small> days</small></b><span>Avg days to licence</span></div>
    </section>

    <section className="team-card" aria-labelledby="people-title">
      <div className="team-card-head">
        <h2 id="people-title">People</h2>
        <div className="chip-row" role="group" aria-label="Filter people">
          {filters.map((item) => <button key={item.value} type="button" className={`team-chip${filter === item.value ? " active" : ""}`} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}
        </div>
      </div>
      <div className="people-table">
        <div className="people-row head" aria-hidden>
          <span>Person and company</span><span>Current step</span><span>Progress</span><span>Hires</span><span>Next action</span><span />
        </div>
        <ul className="people-list" aria-label="People relocating">{visible.map((row) => <li key={row.id}><button type="button" className={`people-row${row.needsAttention ? " attention" : ""}`} onClick={() => setOpenId(row.id)} aria-label={`${row.name}, ${row.company}. ${row.settled ? "Settled" : row.current?.shortTitle ?? ""}${row.needsAttention ? ", needs attention" : ""}. Open details`}>
          <span className="person-cell"><span className="avatar" aria-hidden>{row.name.split(" ").map((part) => part[0]).join("")}</span>
            <span><strong>{row.name}</strong><small>{row.company} · {countryName(row.profile.nationality)} · {household(row)}</small></span></span>
          <span data-label="Current step"><CurrentStep row={row} /></span>
          <span data-label="Progress" className="progress-cell"><ProgressBar done={row.done} total={row.total} label={`${row.done} of ${row.total}`} /></span>
          <span data-label="Hires" className="hires-cell">{row.hires}</span>
          <span data-label="Next action" className="action-cell">{row.nextAction}</span>
          <ChevronRight size={18} className="row-chevron" aria-hidden />
        </button></li>)}</ul>
        {!visible.length && <p className="empty-row">No one here right now.</p>}
      </div>
    </section>

    <section className="insights" aria-label="Insights">
      <div className="insight"><IconTile icon={TriangleAlert} size={32} /><span>Most common blocker</span><b>{summary.commonBlocker ?? "None"}</b></div>
      <div className="insight"><IconTile icon={Gift} size={32} /><span>Benefits unlocked</span><b>{summary.benefitsUnlocked} of {summary.people}</b></div>
      <div className="insight"><IconTile icon={MapPin} size={32} /><span>On the ground</span><b>{summary.onGround} of {summary.people}</b></div>
    </section>

    {open && <PersonPanel row={open} onClose={close} onRemind={() => setToast("Reminder sent")} />}
    {toast && <div className="team-toast" role="status"><CheckCircle2 size={16} aria-hidden />{toast}<button type="button" aria-label="Dismiss" onClick={() => setToast("")}><X size={14} aria-hidden /></button></div>}
  </>;
}

export function TeamHeader() {
  return <header className="team-top"><div className="team-top-inner">
    <Link href="/" className="team-logo" aria-label="EZ Move home"><span className="team-logo-mark">ez</span>EZ Move</Link>
    <span className="team-top-label">Team view</span>
  </div></header>;
}

export function TeamTitle() {
  return <div className="team-title"><h1>Relocations</h1><SourceTag source="demo" /></div>;
}
