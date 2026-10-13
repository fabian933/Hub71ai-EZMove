import Link from "next/link";
import TeamInvites from "@/components/TeamInvites";
import Icon from "@/components/Icon";
import { todayISO } from "@/lib/engine";
import { countryName, decodeProfile, encodeProfile } from "@/lib/profile";
import { hireProgress, sampleHireProfile, sampleTeam } from "@/lib/team";
export const dynamic = "force-dynamic";

const shortDate = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const household = (value: string, kids: number) => value === "solo" ? "Solo" : value === "couple" ? "With partner" : `Family · ${kids} kids`;

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ p?: string | string[] }> }) {
  const params = await searchParams;
  const founder = decodeProfile(typeof params.p === "string" ? params.p : undefined);
  const encodedFounder = founder ? encodeProfile(founder) : null;
  const today = todayISO();
  const rows = sampleTeam.map((hire) => {
    const profile = sampleHireProfile(hire, today);
    return { hire, profile, progress: hireProgress(profile, hire.completed, today) };
  });
  const needsAttention = rows.filter(({ progress }) => progress.overdue.length || progress.dueSoon.length).length;
  return <main className="team-page">
    <header className="home-nav team-nav"><Link href="/" className="brand"><span className="brand-mark">e.</span>ez move</Link>
      {encodedFounder ? <Link href={`/map?p=${encodedFounder}`} className="team-back"><Icon name="chevron" size={13} style={{ transform: "rotate(180deg)" }} />My map</Link> : <Link href="/" className="team-back">Build my map</Link>}</header>
    <section className="team-intro"><span className="eyebrow"><span /> YOUR TEAM</span><h1>Everyone’s move, in one place.</h1>
      <p>Each hire gets their own plan. You see where they are, and what needs attention.</p></section>
    <div className="sample-banner light"><Icon name="spark" size={14} />Sample data. These hires are fictional, to show how team progress will look.</div>
    <div className="team-stats"><div><b>{rows.length}</b><span>hires moving</span></div><div><b>{rows.filter(({ progress }) => progress.daysToMove <= 0).length}</b><span>already arrived</span></div><div className={needsAttention ? "attention" : ""}><b>{needsAttention}</b><span>need attention</span></div></div>
    <div className="team-grid">
      <section className="team-card"><h2>Your hires</h2>
        <ul className="hire-list">{rows.map(({ hire, profile, progress }) => <li key={hire.id}>
          <div className="hire-top"><span className="hire-avatar">{hire.name[0]}</span><div><strong>{hire.name} <span className="sample-tag">Sample</span></strong><small>{hire.role} · {countryName(profile.nationality)} · {household(profile.household, profile.kids)}</small></div><b className="hire-percent">{progress.percent}%</b></div>
          <div className="progress-track light" role="progressbar" aria-label={`${hire.name}'s progress to settled`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><div style={{ width: `${progress.percent}%` }} /></div>
          <div className="hire-meta">
            <span>{progress.daysToMove > 0 ? `Moving ${shortDate(progress.moveDate)} · ${progress.daysToMove} days to go` : progress.daysToMove === 0 ? "Moving today" : `Arrived ${shortDate(progress.moveDate)}`}</span>
            {progress.next && <span>Next: <b>{progress.next.shortTitle}</b></span>}
          </div>
          {(progress.overdue.length > 0 || progress.dueSoon.length > 0) && <div className="hire-flags">
            {progress.overdue.map((step) => <span key={step.id} className="flag overdue">Overdue · {step.shortTitle}</span>)}
            {progress.dueSoon.map((step) => <span key={step.id} className="flag soon">Due soon · {step.shortTitle}</span>)}
          </div>}
          <Link className="hire-open" href={`/map?hire=${hire.id}${encodedFounder ? `&from=${encodedFounder}` : ""}`}>View {hire.name}’s plan <Icon name="chevron" size={12} /></Link>
        </li>)}</ul>
      </section>
      <TeamInvites />
    </div>
  </main>;
}
