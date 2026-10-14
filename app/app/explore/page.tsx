"use client";
import { useState } from "react";
import { ExternalLink, GraduationCap, House, MapPinned, Store, Users } from "lucide-react";
import { useMove } from "@/lib/store";
import { areaChoices, homeTypes, lowestRelevantRent } from "@/lib/areas";
import { communities, communityGroups, providers, schools } from "@/lib/data";
import { getState } from "@/lib/engine";
import { formatAED } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import IconTile from "@/components/ui/IconTile";
import SourceTag from "@/components/ui/SourceTag";
import StepPill from "@/components/app/StepPill";
import ProviderTile from "@/components/app/ProviderTile";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

function SectionHead({ icon, title, tag }: { icon: LucideIcon; title: string; tag?: React.ReactNode }) {
  return <div className="explore-head"><IconTile icon={icon} size={32} /><h2>{title}</h2>{tag}</div>;
}

export default function Explore() {
  const { profile, roadmap, completed } = useMove();
  const [allHomes, setAllHomes] = useState(false);
  if (!profile) return null;
  const homes = areaChoices(profile);
  const unit = homeTypes(profile)[0] === "3br" ? "3 bed or villa" : "1–2 bed";
  const living = roadmap.filter((step) => step.phase === "living");
  const kidsSchools = profile.kids > 0 ? [...schools].sort((a, b) => (a.feeAED?.min ?? Infinity) - (b.feeAED?.min ?? Infinity)).slice(0, 6) : [];
  const areaName = new Map(communities.map((community) => [community.id, community.name]));
  return <div className="app-page">
    <PageHeader title="Explore" description="Homes, schools and life in Abu Dhabi." />

    <section className="app-section">
      <SectionHead icon={House} title="Homes" />
      <p className="section-note">{profile.budgetAED ? `${homes.length} areas fit your budget of ${formatAED(profile.budgetAED)}/yr.` : `Areas for a ${unit} home.`}</p>
      <ul className="card-list">{(allHomes ? homes : homes.slice(0, 4)).map((area) => <li key={area.id} className="info-card">
        <div className="info-card-top"><strong>{area.name}</strong><span>from {formatAED(lowestRelevantRent(area, profile)!)}/yr</span></div>
        {area.listingLink ? <a href={area.listingLink} target="_blank" rel="noopener noreferrer" className="text-link">View listings<ExternalLink size={13} aria-hidden /></a> : <span className="unknown">Verify</span>}
      </li>)}</ul>
      {homes.length > 4 && <button type="button" className="see-all as-button" onClick={() => setAllHomes(!allHomes)}>{allHomes ? "Show fewer" : `Show all ${homes.length}`}</button>}
    </section>

    {kidsSchools.length > 0 && <section className="app-section">
      <SectionHead icon={GraduationCap} title="Schools" />
      <ul className="card-list">{kidsSchools.map((school) => <li key={school.id} className="info-card">
        <div className="info-card-top"><strong>{school.name}</strong><span>{school.feeAED ? `from ${formatAED(school.feeAED.min)}/yr` : <span className="unknown">Verify</span>}</span></div>
        <p>{school.curriculum} · ADEK {school.adekRating ?? "rating: Verify"} · {areaName.get(school.communityId)}</p>
      </li>)}</ul>
    </section>}

    <section className="app-section">
      <SectionHead icon={MapPinned} title="Neighbourhoods" />
      <ul className="card-list">{communities.map((area) => <li key={area.id} className="info-card">
        <strong>{area.name}</strong><p>{area.summary}</p>
        <div className="tag-row">{area.goodFor.map((tag) => <span key={tag} className="badge">{tag}</span>)}</div>
      </li>)}</ul>
    </section>

    <section className="app-section">
      <SectionHead icon={Users} title="Community and things to do" />
      <ul className="card-list">{living.map((step) => <li key={step.id}><Link href={`/app/step/${step.id}`} className="info-card linked">
        <div className="info-card-top"><strong>{step.title}</strong></div><StepPill step={step} />
      </Link></li>)}</ul>
      <div className="explore-subhead"><h3>Groups</h3><SourceTag source="demo" /></div>
      <ul className="card-list">{communityGroups.map((group) => <li key={group.id} className="info-card"><strong>{group.name}</strong><p>{group.summary}</p></li>)}</ul>
      {!completed.has("arrive") && living.some((step) => getState(step, completed) === "locked") && <p className="section-note">Most of these open up once you arrive.</p>}
    </section>

    <section className="app-section">
      <SectionHead icon={Store} title="Marketplace" tag={<SourceTag source="demo" />} />
      <div className="provider-grid">{providers.map((provider) => <ProviderTile key={provider.id} provider={provider} />)}</div>
    </section>
  </div>;
}
