import Image from "next/image";
import { ArrowRight, Check, CalendarCheck, MapPin, SendHorizontal } from "lucide-react";
import type { FeatureVisual as Kind } from "./content";
import skyline from "@/public/images/abu-dhabi-skyline.jpg";

/** Small HTML/CSS mocks of our own UI for the features grid. Demo data, our palette only. */
export default function FeatureVisual({ kind }: { kind: Kind }) {
  return <div className={`fv fv-${kind}`} aria-hidden>{visuals[kind]()}</div>;
}

const visuals: Record<Kind, () => React.ReactNode> = {
  checklist: () => <div className="fv-checklist-card">
    <div className="fv-checklist-head"><span>Your checklist</span><b>3 / 6 done</b></div>
    <ul>
      {["Sign offer letter", "Upload documents", "Get a UAE mobile number"].map((item) => <li key={item} className="done"><span className="fv-tick"><Check size={11} strokeWidth={3} /></span>{item}</li>)}
      {["Company licence", "Visa and medical", "Open a bank account"].map((item) => <li key={item}><span className="fv-tick" />{item}</li>)}
    </ul>
  </div>,

  homes: () => <>
    <svg className="fv-map" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="220" fill="#E9F3FF" />
      <path d="M0 150 C60 135 90 165 150 150 S260 120 320 140 S380 150 400 145 V220 H0Z" fill="#F8F2EA" />
      <path d="M210 40 C250 25 300 35 315 60 S300 105 260 108 S195 90 192 68 S195 46 210 40Z" fill="#F8F2EA" />
      <path d="M70 55 C95 45 125 52 128 70 S110 98 85 96 S55 80 58 68 S62 58 70 55Z" fill="#F8F2EA" />
      <path d="M200 74 H320 M240 48 V104 M0 180 H400 M120 150 V220" stroke="#ECE6E8" strokeWidth="3" fill="none" />
    </svg>
    <span className="fv-pin"><MapPin size={22} strokeWidth={2} /></span>
    <div className="fv-listing">
      <div><strong>Al Reem Island</strong><span>2 bed · AED 120,000/yr</span></div>
      <span className="fv-mint-pill">In budget</span>
    </div>
  </>,

  guides: () => <>
    <div className="fv-tabs"><span className="active">Areas</span><span>Schools</span><span>Getting around</span></div>
    <div className="fv-guide-card">
      <Image src={skyline} alt="" fill sizes="(max-width: 860px) 90vw, 420px" className="fv-guide-photo" />
      <span className="fv-guide-title">Abu Dhabi guide</span>
    </div>
  </>,

  assistant: () => <div className="fv-chat">
    <div className="fv-chat-head"><strong>Relocation assistant</strong><span className="fv-mint-pill">Online</span></div>
    <p className="fv-bubble user">When can I open a bank account?</p>
    <p className="fv-bubble reply">Once your company licence and Emirates ID are issued.</p>
    <div className="fv-input"><span>Ask about your move…</span><SendHorizontal size={14} /></div>
  </div>,

  marketplace: () => <div className="fv-market">
    {[["Clara", "Company setup"], ["WeWork", "Office"], ["ADNIC", "Health insurance"], ["FAB", "Banking"]].map(([name, what]) => <div key={name} className="fv-provider">
      <span className="fv-provider-name"><span className="fv-provider-logo">{name.slice(0, 2)}</span><span><strong>{name}</strong><small>{what}</small></span></span>
      <span className="fv-covered">Covered by your company</span>
    </div>)}
  </div>,

  community: () => <div className="fv-groups">
    {[["New in Abu Dhabi", "Founders"], ["Saadiyat run club", "Saturdays 6am"]].map(([name, detail]) => <div key={name} className="fv-group">
      <div><strong>{name}</strong><span>{detail}</span></div>
      <span className="fv-join">Join</span>
    </div>)}
  </div>,

  partners: () => <div className="fv-partner-flow">
    <div className="fv-partner-col">{["Clara", "ADGM", "ICP", "TAMM", "Bank"].map((name) => <span key={name} className="fv-partner">{name}<ArrowRight size={12} /></span>)}</div>
    <div className="fv-next"><span className="fv-next-icon"><CalendarCheck size={18} /></span><span className="fv-next-label">Next step</span><strong>Book your medical</strong></div>
  </div>,
};
