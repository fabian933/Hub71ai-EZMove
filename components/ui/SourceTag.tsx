import { BookOpen, FlaskConical, ShieldCheck } from "lucide-react";

/** Where a fact comes from. "verify" is for facts we could not source; "demo" marks mock data. */
export default function SourceTag({ source }: { source: "hub71_guide" | "official" | "verify" | "demo" }) {
  if (source === "hub71_guide") return <span className="source-tag"><BookOpen size={12} aria-hidden />From Hub71’s onboarding guide</span>;
  if (source === "official") return <span className="source-tag"><ShieldCheck size={12} aria-hidden />Official source</span>;
  if (source === "demo") return <span className="source-tag source-tag-demo"><FlaskConical size={12} aria-hidden />Demo data</span>;
  return <span className="source-tag source-tag-verify">Verify</span>;
}
