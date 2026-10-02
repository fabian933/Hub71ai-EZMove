"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { countryName, defaultProfile, encodeProfile, featuredNationalities, nationalities, normaliseProfile } from "@/lib/profile";
import { ProfileSchema, type Profile } from "@/lib/schema";
import Icon from "./Icon";

const chipNames: Record<(typeof featuredNationalities)[number], string> = { GB: "United Kingdom", US: "USA", FR: "France", CN: "China", IN: "India" };
const isFeatured = (code: string) => (featuredNationalities as readonly string[]).includes(code);

function Choices<T extends string | number | boolean>({ label, value, items, onChange }: {
  label: string; value: T; items: readonly { value: T; label: string }[]; onChange: (value: T) => void;
}) {
  return <fieldset className="chip-field"><legend>{label}</legend><div className="chips">
    {items.map((item) => <button type="button" key={String(item.value)} className={`chip ${value === item.value ? "selected" : ""}`} aria-pressed={value === item.value} onClick={() => onChange(item.value)}>{item.label}</button>)}
  </div></fieldset>;
}

/** Searchable list of every nationality, shown when "Other" is chosen. */
function CountrySearch({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [query, setQuery] = useState(isFeatured(value) ? "" : countryName(value));
  const [open, setOpen] = useState(isFeatured(value));
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!isFeatured(value)) { setQuery(countryName(value)); setOpen(false); } }, [value]);
  useEffect(() => { if (isFeatured(value)) input.current?.focus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const needle = query.trim().toLowerCase();
  const matches = nationalities.filter(({ code, name }) => !needle || name.toLowerCase().includes(needle) || code.toLowerCase() === needle);
  function choose(code: string) { onChange(code); setQuery(countryName(code)); setOpen(false); }
  return <div className="country-search">
    <input ref={input} type="text" role="combobox" aria-label="Search all countries" aria-expanded={open} aria-controls="country-options" aria-autocomplete="list" autoComplete="off" placeholder="Search countries" value={query}
      onFocus={(event) => { event.currentTarget.select(); setOpen(true); setActive(0); }}
      onBlur={() => setTimeout(() => setOpen(false), 120)}
      onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(0); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive((index) => Math.min(matches.length - 1, index + 1)); }
        else if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => Math.max(0, index - 1)); }
        else if (event.key === "Enter" && open && matches[active]) { event.preventDefault(); choose(matches[active].code); }
        else if (event.key === "Escape") setOpen(false);
      }} />
    {open && <ul id="country-options" role="listbox" className="country-options">
      {matches.length ? matches.map(({ code, name }, index) => <li key={code} role="option" aria-selected={code === value} className={`${index === active ? "active" : ""} ${code === value ? "selected" : ""}`} onMouseDown={(event) => { event.preventDefault(); choose(code); }}>{name}</li>)
        : <li className="empty">No country found</li>}
    </ul>}
  </div>;
}

export default function Intake({ moveDate, demoMoveDate }: { moveDate: string; demoMoveDate: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(() => defaultProfile(moveDate));
  const [otherNationality, setOtherNationality] = useState(false);
  const [sentence, setSentence] = useState("");
  const [parsing, setParsing] = useState(false);
  const [message, setMessage] = useState("Start with a sentence, or choose your details below.");
  const [manualOnly, setManualOnly] = useState(false);
  const requestVersion = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const cancelParse = () => { requestVersion.current++; requestController.current?.abort(); setParsing(false); };
  const applyProfile = (next: Profile) => { setProfile(normaliseProfile(next)); setOtherNationality(!isFeatured(next.nationality)); };
  const update = (changes: Partial<Profile>) => {
    cancelParse();
    setProfile((previous) => normaliseProfile({ ...previous, ...changes }));
  };
  const demos: { label: string; profile: Profile }[] = [
    { label: "Solo Indian professional", profile: { ...defaultProfile(demoMoveDate), nationality: "IN", budgetAED: 80_000 } },
    { label: "British couple + 2 kids", profile: { ...defaultProfile(demoMoveDate), nationality: "GB", household: "family", kids: 2, budgetAED: 160_000 } },
    { label: "Nigerian Hub71 founder", profile: { ...defaultProfile(demoMoveDate), nationality: "NG", reason: "hub71_founder", budgetAED: 110_000 } },
  ];
  async function parseSentence() {
    if (!sentence.trim() || parsing) return;
    const version = ++requestVersion.current;
    const controller = new AbortController();
    requestController.current?.abort();
    requestController.current = controller;
    setParsing(true);
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const response = await fetch("/api/parse-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sentence, profile }), signal: controller.signal });
      const result = await response.json();
      if (version !== requestVersion.current) return;
      const parsed = ProfileSchema.safeParse(result.profile);
      if (parsed.success) {
        applyProfile(parsed.data);
        setMessage("Your details are filled in. Make any changes, then build your map.");
      } else {
        setManualOnly(true);
        setMessage("Choose your details below to build your map.");
      }
    } catch {
      if (version === requestVersion.current) {
        setManualOnly(true);
        setMessage("Choose your details below to build your map.");
      }
    } finally {
      clearTimeout(timeout);
      if (version === requestVersion.current) setParsing(false);
    }
  }
  function buildMap() {
    const parsed = ProfileSchema.safeParse(profile);
    if (!parsed.success) { setMessage("Check your nationality, move date and budget."); return; }
    router.push(`/map?p=${encodeProfile(parsed.data)}`);
  }
  const showCountrySearch = otherNationality || !isFeatured(profile.nationality);
  return <div className="intake-wrap">
    <div className="intake-card">
      <div className="card-heading"><span className="mini-label">YOUR MOVE, YOUR MAP</span><span className="time-label">About 30 seconds</span></div>
      {!manualOnly && <div className="sentence-area">
        <label htmlFor="sentence">Tell us in one sentence</label>
        <div className="sentence-input"><textarea id="sentence" rows={3} maxLength={1200} value={sentence} onChange={(event) => { cancelParse(); setSentence(event.target.value); }} placeholder="I'm a USA founder moving with my wife and 2 kids in December 2026." />
          <button type="button" aria-label="Fill details from sentence" className="parse-button" onClick={parseSentence} disabled={parsing || !sentence.trim()}><Icon name={parsing ? "spark" : "arrow"} /></button>
        </div>
      </div>}
      <div className="demo-row"><span>Try a demo</span>{demos.map((demo) => <button type="button" key={demo.label} onClick={() => { cancelParse(); applyProfile(demo.profile); setMessage(`${demo.label}. Ready to build your map.`); }}><Icon name="spark" size={13} />{demo.label}</button>)}</div>
      <p role="status" className="parse-message">{parsing ? "Reading your move…" : message}</p>
      <div className="profile-fields">
        <fieldset className="chip-field"><legend>Nationality</legend><div className="chips">
          {featuredNationalities.map((code) => <button type="button" key={code} className={`chip ${!showCountrySearch && profile.nationality === code ? "selected" : ""}`} aria-pressed={!showCountrySearch && profile.nationality === code} onClick={() => { setOtherNationality(false); update({ nationality: code }); }}>{chipNames[code]}</button>)}
          <button type="button" className={`chip ${showCountrySearch ? "selected" : ""}`} aria-pressed={showCountrySearch} onClick={() => setOtherNationality(true)}>Other</button>
        </div>
          {showCountrySearch && <CountrySearch value={profile.nationality} onChange={(code) => update({ nationality: code })} />}
        </fieldset>
        <div className="field-pair">
          <Choices label="Moving with" value={profile.household} items={[{ value: "solo", label: "Just me" }, { value: "couple", label: "Partner" }, { value: "family", label: "Family" }]} onChange={(value) => update(value === "family" ? { household: value } : { household: value, kids: 0 })} />
          {profile.household === "family" && <fieldset className="chip-field"><legend>Children</legend><div className="kids-control"><button aria-label="Fewer children" type="button" disabled={!profile.kids} onClick={() => update({ kids: Math.max(0, profile.kids - 1) })}><Icon name="minus" size={14} /></button><input aria-label="Number of children" type="number" min="0" max="99" value={profile.kids} onChange={(event) => update({ kids: Math.max(0, Math.min(99, Math.floor(Number(event.target.value) || 0))) })} /><button aria-label="More children" type="button" onClick={() => update({ kids: Math.min(99, profile.kids + 1) })}><Icon name="plus" size={14} /></button></div></fieldset>}
        </div>
        <Choices label="Reason for moving" value={profile.reason} items={[{ value: "job", label: "New job" }, { value: "own_business", label: "Own business" }, { value: "hub71_founder", label: "Hub71 founder" }, { value: "other", label: "Other" }]} onChange={(value) => update({ reason: value })} />
        <div className="field-pair">
          <fieldset className="chip-field"><legend>Move date</legend><input className="text-input" type="date" aria-label="Move date" required value={profile.moveDate ?? ""} onChange={(event) => { if (event.target.value) update({ moveDate: event.target.value }); }} /></fieldset>
          <fieldset className="chip-field"><legend><label htmlFor="budget">Annual rent budget (AED)</label></legend><input id="budget" className="text-input" type="text" inputMode="numeric" autoComplete="off" placeholder="120,000" value={profile.budgetAED ? profile.budgetAED.toLocaleString("en-US") : ""} onChange={(event) => {
            const digits = event.target.value.replace(/[^\d]/g, "").replace(/^0+/, "").slice(0, 8);
            update({ budgetAED: digits ? Number(digits) : undefined });
          }} /></fieldset>
        </div>
        <div className="field-pair"><Choices label="Bringing pets?" value={profile.hasPets} items={[{ value: false, label: "No pets" }, { value: true, label: "Yes" }]} onChange={(value) => update({ hasPets: value })} />
          <Choices label="Will you drive?" value={profile.drives} items={[{ value: false, label: "No" }, { value: true, label: "Yes" }]} onChange={(value) => update({ drives: value })} /></div>
      </div>
      <button className="build-button" type="button" disabled={parsing} onClick={buildMap}>Build my map <Icon name="arrow" size={20} /></button>
      <p className="privacy-note">No account needed. Your progress stays on this device.</p>
    </div>
  </div>;
}
