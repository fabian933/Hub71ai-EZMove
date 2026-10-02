"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { countryName, defaultProfile, encodeProfile, nationalities } from "@/lib/profile";
import { ProfileSchema, type Profile } from "@/lib/schema";
import Icon from "./Icon";

function Choices<T extends string | number | boolean>({ label, value, items, onChange }: {
  label: string; value: T; items: readonly { value: T; label: string }[]; onChange: (value: T) => void;
}) {
  return <fieldset className="chip-field"><legend>{label}</legend><div className="chips">
    {items.map((item) => <button type="button" key={String(item.value)} className={`chip ${value === item.value ? "selected" : ""}`} aria-pressed={value === item.value} onClick={() => onChange(item.value)}>{item.label}</button>)}
  </div></fieldset>;
}

export default function Intake({ moveMonth, demoMoveMonth }: { moveMonth: string; demoMoveMonth: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(() => defaultProfile(moveMonth));
  const [sentence, setSentence] = useState("");
  const [parsing, setParsing] = useState(false);
  const [message, setMessage] = useState("Start with a sentence, or choose your details below.");
  const [manualOnly, setManualOnly] = useState(false);
  const requestVersion = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    requestVersion.current++;
    requestController.current?.abort();
    setParsing(false);
    setProfile((previous) => ({ ...previous, [key]: value }));
  };
  const demos: { label: string; profile: Profile }[] = [
    { label: "Solo Indian professional", profile: { ...defaultProfile(demoMoveMonth), nationality: "IN" } },
    { label: "British couple + 2 kids", profile: { ...defaultProfile(demoMoveMonth), nationality: "GB", household: "family", kids: 2 } },
    { label: "Nigerian Hub71 founder", profile: { ...defaultProfile(demoMoveMonth), nationality: "NG", reason: "hub71_founder" } },
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
        setProfile(parsed.data);
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
    if (!parsed.success) { setMessage("Check your nationality and move month."); return; }
    router.push(`/map?p=${encodeProfile(parsed.data)}`);
  }
  return <div className="intake-wrap">
    <div className="intake-card">
      <div className="card-heading"><span className="mini-label">YOUR MOVE, YOUR MAP</span><span className="time-label">About 30 seconds</span></div>
      {!manualOnly && <div className="sentence-area">
        <label htmlFor="sentence">Tell us in one sentence</label>
        <div className="sentence-input"><textarea id="sentence" rows={3} maxLength={1200} value={sentence} onChange={(event) => { requestVersion.current++; requestController.current?.abort(); setParsing(false); setSentence(event.target.value); }} placeholder="I'm a Pakistani founder moving with my wife and 2 kids in March." />
          <button type="button" aria-label="Fill details from sentence" className="parse-button" onClick={parseSentence} disabled={parsing || !sentence.trim()}><Icon name={parsing ? "spark" : "arrow"} /></button>
        </div>
      </div>}
      <p role="status" className="parse-message">{parsing ? "Reading your move…" : message}</p>
      <div className="profile-fields">
        <fieldset className="chip-field"><legend>Nationality</legend><div className="chips">
          {["IN", "GB", "PK", "NG"].map((code) => <button type="button" key={code} className={`chip ${profile.nationality === code ? "selected" : ""}`} aria-pressed={profile.nationality === code} onClick={() => update("nationality", code)}>{countryName(code)}</button>)}
          <select aria-label="All nationalities" className="chip country-select" value={profile.nationality} onChange={(event) => update("nationality", event.target.value)}>{nationalities.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}</select>
        </div></fieldset>
        <div className="field-pair">
          <Choices label="Moving with" value={profile.household} items={[{ value: "solo", label: "Just me" }, { value: "couple", label: "Partner" }, { value: "family", label: "Family" }]} onChange={(value) => update("household", value)} />
          <fieldset className="chip-field"><legend>Children</legend><div className="kids-control"><button aria-label="Fewer children" type="button" disabled={!profile.kids} onClick={() => update("kids", Math.max(0, profile.kids - 1))}><Icon name="minus" size={14} /></button><input aria-label="Number of children" type="number" min="0" max="99" value={profile.kids} onChange={(event) => update("kids", Math.max(0, Math.min(99, Math.floor(Number(event.target.value) || 0))))} /><button aria-label="More children" type="button" onClick={() => update("kids", Math.min(99, profile.kids + 1))}><Icon name="plus" size={14} /></button></div></fieldset>
        </div>
        <Choices label="Reason for moving" value={profile.reason} items={[{ value: "job", label: "New job" }, { value: "hub71_founder", label: "Hub71 founder" }, { value: "own_business", label: "Own business" }]} onChange={(value) => update("reason", value)} />
        <div className="field-pair"><fieldset className="chip-field"><legend>Move month</legend><input className="month-input" type="month" aria-label="Move month" value={profile.moveMonth} onChange={(event) => update("moveMonth", event.target.value)} /></fieldset>
          <Choices label="Budget" value={profile.budgetBand} items={[{ value: "low", label: "Low" }, { value: "mid", label: "Mid" }, { value: "high", label: "High" }]} onChange={(value) => update("budgetBand", value)} /></div>
        <div className="field-pair"><Choices label="Bringing pets?" value={profile.hasPets} items={[{ value: false, label: "No pets" }, { value: true, label: "Yes" }]} onChange={(value) => update("hasPets", value)} />
          <Choices label="Will you drive?" value={profile.drives} items={[{ value: false, label: "No" }, { value: true, label: "Yes" }]} onChange={(value) => update("drives", value)} /></div>
      </div>
      <button className="build-button" type="button" disabled={parsing} onClick={buildMap}>Build my map <Icon name="arrow" size={20} /></button>
      <p className="privacy-note">No account needed. Your progress stays on this device.</p>
    </div>
    <div className="demo-row"><span>Try a demo</span>{demos.map((demo) => <button type="button" key={demo.label} onClick={() => { requestVersion.current++; requestController.current?.abort(); setParsing(false); setProfile(demo.profile); setMessage(`${demo.label}. Ready to build your map.`); }}><Icon name="spark" size={13} />{demo.label}</button>)}</div>
    <motion.div className="intake-footnote" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>A few details. A clear starting point. A home in Abu Dhabi.</motion.div>
  </div>;
}
