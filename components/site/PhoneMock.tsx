import { ArrowRight, BookOpen } from "lucide-react";
import StatusPill from "@/components/ui/StatusPill";
import SourceTag from "@/components/ui/SourceTag";

/** A simplified mock of our own Home screen. Demo data only. */
export default function PhoneMock() {
  return <div className="phone" aria-label="Preview of the employee Home screen (demo data)" role="img">
    <div className="phone-screen">
      <div className="phone-top"><span>Your move</span><SourceTag source="demo" /></div>
      <div className="mock-next">
        <span className="mock-label">Next step</span>
        <strong>Get your ADGM licence</strong>
        <div className="mock-row-meta"><StatusPill status="in_progress" /><span>Usually 30–60 days</span></div>
        <span className="mock-guide"><BookOpen size={12} aria-hidden />From your company’s guide</span>
        <span className="mock-cta">See what you need <ArrowRight size={14} aria-hidden /></span>
      </div>
      <span className="mock-label">Milestones</span>
      <ul className="mock-milestones">
        <li><span>Acceptance letter</span><StatusPill status="done" /></li>
        <li><span>ADGM licence</span><StatusPill status="in_progress" /></li>
        <li><span>Entry permit</span><StatusPill status="waiting" waitingOn="ADGM licence" /></li>
      </ul>
    </div>
  </div>;
}
