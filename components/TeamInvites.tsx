"use client";
import { useEffect, useState } from "react";
import type { Profile } from "@/lib/schema";
import { encodeInvite, loadInvites, saveInvites, type SentInvite } from "@/lib/team";
import Icon from "./Icon";

const households: { value: Profile["household"]; label: string }[] = [{ value: "solo", label: "Solo" }, { value: "couple", label: "With partner" }, { value: "family", label: "Family" }];

export default function TeamInvites() {
  const [invites, setInvites] = useState<SentInvite[]>([]);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [household, setHousehold] = useState<Profile["household"]>("solo");
  const [kids, setKids] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);
  const [warning, setWarning] = useState("");
  useEffect(() => { setInvites(loadInvites()); }, []);
  const linkFor = (invite: SentInvite) => `${window.location.origin}/?invite=${encodeInvite({ name: invite.name, company: invite.company, household: invite.household, kids: invite.kids })}`;
  async function copy(invite: SentInvite) {
    try { await navigator.clipboard.writeText(linkFor(invite)); setCopied(invite.id); }
    catch { setWarning("Copy failed. Open the invite and copy the address from your browser."); }
  }
  function invite() {
    if (!name.trim() || !company.trim()) { setWarning("Add a first name and your company."); return; }
    const sent: SentInvite = { id: `${Date.now()}`, name: name.trim().slice(0, 60), company: company.trim().slice(0, 60), household, kids: household === "family" ? kids : 0, createdAt: new Date().toISOString() };
    const next = [sent, ...invites];
    setInvites(next); setName(""); setWarning(saveInvites(next) ? "" : "Invites are kept for this visit only. Browser storage is unavailable.");
    void copy(sent);
  }
  function remove(id: string) { const next = invites.filter((item) => item.id !== id); setInvites(next); saveInvites(next); }
  return <section className="team-card invite-card">
    <h2>Invite a hire</h2>
    <p>They get a link that starts their own plan. No account needed.</p>
    <div className="invite-form">
      <label>First name<input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="Alex" /></label>
      <label>Company<input value={company} maxLength={60} onChange={(event) => setCompany(event.target.value)} placeholder="Your startup" /></label>
      <fieldset><legend>Moving</legend><div className="chips">{households.map((item) => <button type="button" key={item.value} className={`chip ${household === item.value ? "selected" : ""}`} aria-pressed={household === item.value} onClick={() => setHousehold(item.value)}>{item.label}</button>)}</div></fieldset>
      {household === "family" && <label className="kids-field">Children<input type="number" min={0} max={20} value={kids} onChange={(event) => setKids(Math.max(0, Math.min(20, Math.floor(Number(event.target.value) || 0))))} /></label>}
    </div>
    <button type="button" className="build-button" onClick={invite}>Create invite link <Icon name="arrow" size={18} /></button>
    {warning && <p className="invite-warning" role="status">{warning}</p>}
    {invites.length > 0 && <ul className="sent-invites">{invites.map((item) => <li key={item.id}>
      <span><strong>{item.name}</strong><small>Invited · not started yet</small></span>
      <span className="sent-actions"><button type="button" onClick={() => copy(item)}><Icon name={copied === item.id ? "check" : "link"} size={13} />{copied === item.id ? "Copied" : "Copy link"}</button><a href={linkFor(item)} target="_blank" rel="noopener noreferrer">Open</a><button type="button" aria-label={`Remove ${item.name}`} onClick={() => remove(item.id)}><Icon name="close" size={12} /></button></span>
    </li>)}</ul>}
  </section>;
}
