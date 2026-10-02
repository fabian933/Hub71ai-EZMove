"use client";
import { useMemo, useState } from "react";
import { communities, schools } from "@/lib/data";
import type { School } from "@/lib/schema";
import Icon from "./Icon";
const number = (value: number) => value.toLocaleString("en-AE");
const verify = <span className="verify-tag">verify</span>;
export default function SchoolSelection({ chosenArea, onSelect }: { chosenArea: string | null; onSelect: (id: string) => void }) {
  const [curriculum, setCurriculum] = useState("All");
  const area = communities.find((community) => community.id === chosenArea);
  const nearby = useMemo(() => schools.filter((school) => school.communityId === chosenArea), [chosenArea]);
  const curricula = ["All", ...new Set(nearby.map((school) => school.curriculum))];
  const visible = nearby.filter((school) => curriculum === "All" || school.curriculum === curriculum);
  return <section className="drawer-section school-section"><h3>Schools in {area?.name ?? "your area"}</h3>
    {!area ? <><p>Choose an area to see nearby schools.</p><button className="school-area-link" onClick={() => onSelect("lease_signing")}>Choose your area <Icon name="chevron" size={14} /></button></> : <>
      <p className="tiny-note">Supplied school data. Confirm availability, fees and ratings directly.</p>
      <div className="school-filters" aria-label="Filter schools by curriculum">{curricula.map((item) => <button key={item} className={curriculum === item ? "active" : ""} aria-pressed={curriculum === item} onClick={() => setCurriculum(item)}>{item}</button>)}</div>
      {visible.length ? visible.map((school: School) => <article className="school-card" key={school.id}><h4>{school.name}</h4><p>{school.curriculum}</p><div><span>ADEK {school.adekRating ?? verify}</span><span>{school.feeAED ? `Fees from AED ${number(school.feeAED.min)}/yr` : verify}</span></div>{school.website ? <a href={school.website} target="_blank" rel="noopener noreferrer">School website <Icon name="link" size={13} /></a> : verify}</article>) : <p>No school records match this curriculum. {verify}</p>}
    </>}
  </section>;
}
