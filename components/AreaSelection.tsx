"use client";
import { areaChoices, homeTypes } from "@/lib/areas";
import { schools } from "@/lib/data";
import type { Profile } from "@/lib/schema";
import Icon from "./Icon";

const number = (value: number) => value.toLocaleString("en-AE");
const unitName: Record<string, string> = { "1br": "1 bedroom", "2br": "2 bedrooms", "3br": "3 bedrooms", villa: "Villa" };
const verify = <span className="verify-tag">verify</span>;
export default function AreaSelection({ profile, chosenArea, onChooseArea }: {
  profile: Profile; chosenArea: string | null; onChooseArea: (id: string) => void;
}) {
  const choices = areaChoices(profile);
  const units = homeTypes(profile);
  return <section className="drawer-section community-section">
    <h3>Choose your area</h3>
    {profile.budgetAED
      ? <p className="budget-fit"><b>{choices.length} {choices.length === 1 ? "area fits" : "areas fit"} your budget</b> · AED {number(profile.budgetAED)}/yr</p>
      : null}
    <p className="tiny-note">{profile.budgetAED ? "Starting rents at or under your budget, from the supplied data." : `${profile.budgetBand[0].toUpperCase() + profile.budgetBand.slice(1)} budget · grouped by relative starting rents from the supplied data.`} Sorted by commute, or rent where commute is unknown. Verify current listings.</p>
    {choices.length ? choices.map((community) => {
      const nearby = profile.household === "family" ? schools.filter((school) => school.communityId === community.id) : [];
      return <article className={`area-card ${chosenArea === community.id ? "chosen" : ""}`} key={community.id}>
        <div className="area-card-heading"><div><h4>{community.name}</h4><p>{community.summary}</p></div>{chosenArea === community.id && <span className="chosen-tag"><Icon name="check" size={12} />Chosen</span>}</div>
        <div className="goodfor-tags">{community.goodFor.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="rent-list">{units.map((unit) => <div key={unit}><span>{unitName[unit]}</span><b>{community.rentAED[unit] ? `from AED ${number(community.rentAED[unit]!.min)}/yr` : verify}</b></div>)}</div>
        <div className="area-commute">To Al Maryah Island: {community.commuteMinsToMaryah ? `${community.commuteMinsToMaryah.min} min` : verify}</div>
        {profile.household === "family" && <div className="nearby-schools"><h5>Nearby schools</h5>{nearby.length ? nearby.map((school) => <div key={school.id}><span>{school.name}<small>{school.curriculum}</small></span><span>ADEK: {school.adekRating ?? verify}<small>{school.feeAED ? `Fees from AED ${number(school.feeAED.min)}/yr` : verify}</small></span></div>) : <p>No school data for this area yet. {verify}</p>}</div>}
        <div className="area-actions"><button type="button" onClick={() => onChooseArea(community.id)} className={chosenArea === community.id ? "area-saved" : "area-choose"}>{chosenArea === community.id ? "Area saved" : "Choose this area"}</button>{community.listingLink ? <a href={community.listingLink} target="_blank" rel="noopener noreferrer" className="area-listings">View listings <Icon name="link" size={13} /></a> : verify}</div>
      </article>;
    }) : <p>{profile.budgetAED ? "No area in the supplied data starts at or under this budget." : "No matching rent data for this budget band."} {verify}</p>}
  </section>;
}
