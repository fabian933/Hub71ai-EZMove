"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Minus, Plus, Sparkles } from "lucide-react";
import { useMove } from "@/lib/store";
import { defaultProfile, featuredNationalities, nationalities, nextMoveDate, normaliseProfile } from "@/lib/profile";
import { ProfileSchema, type Profile } from "@/lib/schema";

const chipNames: Record<string, string> = { GB: "UK", US: "USA", FR: "France", CN: "China", IN: "India" };
const reasons: { value: Profile["reason"]; label: string }[] = [
  { value: "job", label: "New job" }, { value: "hub71_founder", label: "Setting up a company" },
  { value: "startup_hire", label: "Joining a startup" }, { value: "other", label: "Other" },
];

function Chips<T extends string | boolean>({ legend, value, items, onChange }: { legend: string; value: T; items: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <fieldset className="field"><legend>{legend}</legend><div className="chip-row">
    {items.map((item) => <button key={String(item.value)} type="button" className={`chip${value === item.value ? " active" : ""}`} aria-pressed={value === item.value} onClick={() => onChange(item.value)}>{item.label}</button>)}
  </div></fieldset>;
}

export default function Start() {
  const router = useRouter();
  const move = useMove();
  const [profile, setProfile] = useState<Profile>(() => move.profile ?? defaultProfile(nextMoveDate()));
  const [other, setOther] = useState(() => !(featuredNationalities as readonly string[]).includes(profile.nationality));
  const [sentence, setSentence] = useState("");
  const [status, setStatus] = useState("");
  const [parsing, setParsing] = useState(false);
  const version = useRef(0);
  const update = (changes: Partial<Profile>) => { version.current++; setParsing(false); setProfile((current) => normaliseProfile({ ...current, ...changes })); };

  async function readSentence() {
    if (!sentence.trim() || parsing) return;
    const mine = ++version.current;
    setParsing(true); setStatus("Reading your move…");
    try {
      const response = await fetch("/api/parse-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sentence, profile }) });
      const result = await response.json();
      if (mine !== version.current) return;
      const parsed = ProfileSchema.safeParse(result.profile);
      if (parsed.success) {
        setProfile(normaliseProfile(parsed.data));
        setOther(!(featuredNationalities as readonly string[]).includes(parsed.data.nationality));
        setStatus("Filled in. Check the details below.");
      } else setStatus("Choose your details below.");
    } catch { if (mine === version.current) setStatus("Choose your details below."); }
    finally { if (mine === version.current) setParsing(false); }
  }
  function save() {
    const parsed = ProfileSchema.safeParse(profile);
    if (!parsed.success) { setStatus("Check your move date and budget."); return; }
    move.setProfile(parsed.data);
    router.push("/app");
  }

  return <div className="app-page start-page">
    <header className="start-head"><span className="eyebrow">EZ Move</span><h1>Tell us about your move</h1><p>About 30 seconds. You can change this later.</p></header>

    <div className="field">
      <label htmlFor="sentence">In one sentence</label>
      <div className="sentence-box">
        <textarea id="sentence" rows={3} maxLength={1200} value={sentence} onChange={(event) => setSentence(event.target.value)} placeholder="I'm setting up a company and moving with my wife and 2 kids in March." />
        <button type="button" className="sentence-go" onClick={readSentence} disabled={!sentence.trim() || parsing} aria-label="Fill in details from my sentence"><Sparkles size={17} aria-hidden /></button>
      </div>
      <p className="field-status" role="status">{status}</p>
    </div>

    <div className="field"><label htmlFor="name">Name</label><input id="name" className="text-input" value={profile.name ?? ""} maxLength={60} autoComplete="given-name" onChange={(event) => update({ name: event.target.value.trim() ? event.target.value : undefined })} placeholder="Your name" /></div>

    <Chips legend="Why you're moving" value={profile.reason === "own_business" ? "hub71_founder" : profile.reason} items={reasons} onChange={(reason) => update({ reason })} />

    <fieldset className="field"><legend>Nationality</legend><div className="chip-row">
      {featuredNationalities.map((code) => <button key={code} type="button" className={`chip${!other && profile.nationality === code ? " active" : ""}`} aria-pressed={!other && profile.nationality === code} onClick={() => { setOther(false); update({ nationality: code }); }}>{chipNames[code]}</button>)}
      <button type="button" className={`chip${other ? " active" : ""}`} aria-pressed={other} onClick={() => setOther(true)}>Other</button>
    </div>
      {other && <select className="text-input" aria-label="Choose your nationality" value={profile.nationality} onChange={(event) => update({ nationality: event.target.value })}>
        {nationalities.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}
      </select>}
    </fieldset>

    <Chips legend="Moving with" value={profile.household} items={[{ value: "solo", label: "Just me" }, { value: "couple", label: "Partner" }, { value: "family", label: "Family" }]} onChange={(household) => update(household === "family" ? { household, kids: Math.max(1, profile.kids) } : { household, kids: 0 })} />
    {profile.household === "family" && <div className="field"><span className="field-label">Children</span><div className="stepper">
      <button type="button" aria-label="Fewer children" disabled={profile.kids <= 0} onClick={() => update({ kids: Math.max(0, profile.kids - 1) })}><Minus size={16} aria-hidden /></button>
      <span aria-live="polite">{profile.kids}</span>
      <button type="button" aria-label="More children" onClick={() => update({ kids: Math.min(12, profile.kids + 1) })}><Plus size={16} aria-hidden /></button>
    </div></div>}

    <div className="field-pair">
      <div className="field"><label htmlFor="move-date">Move date</label><input id="move-date" type="date" className="text-input" value={profile.moveDate ?? ""} onChange={(event) => event.target.value && update({ moveDate: event.target.value })} /></div>
      <div className="field"><label htmlFor="budget">Rent budget (AED/yr)</label><input id="budget" className="text-input" inputMode="numeric" placeholder="120,000" value={profile.budgetAED ? profile.budgetAED.toLocaleString("en-US") : ""}
        onChange={(event) => { const digits = event.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 8); update({ budgetAED: digits ? Number(digits) : undefined }); }} /></div>
    </div>

    <div className="field-pair">
      <Chips legend="Pets?" value={profile.hasPets} items={[{ value: false, label: "No" }, { value: true, label: "Yes" }]} onChange={(hasPets) => update({ hasPets })} />
      <Chips legend="Will you drive?" value={profile.drives} items={[{ value: false, label: "No" }, { value: true, label: "Yes" }]} onChange={(drives) => update({ drives })} />
    </div>

    <button type="button" className="btn btn-primary btn-full" onClick={save} disabled={parsing}>See my plan<ArrowRight size={16} aria-hidden /></button>
    <p className="start-foot">Saved on this device only. <Link href="/app?demo=founder" onClick={() => move.loadDemo()}>Try the demo</Link></p>
  </div>;
}
