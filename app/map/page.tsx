import Link from "next/link";
import BubbleMap, { type HireViewer } from "@/components/BubbleMap";
import { todayISO } from "@/lib/engine";
import { decodeProfile, encodeProfile } from "@/lib/profile";
import { sampleHireProfile, sampleTeam } from "@/lib/team";
export const dynamic = "force-dynamic";
export default async function MapPage({ searchParams }: { searchParams: Promise<{ p?: string | string[]; hire?: string | string[]; from?: string | string[] }> }) {
  const params = await searchParams;
  const hire = typeof params.hire === "string" ? sampleTeam.find((item) => item.id === params.hire) : undefined;
  const founder = decodeProfile(typeof params.from === "string" ? params.from : undefined);
  if (hire) {
    const viewer: HireViewer = { name: hire.name, completed: hire.completed, backHref: founder ? `/team?p=${encodeProfile(founder)}` : "/team" };
    return <BubbleMap key={hire.id} profile={sampleHireProfile(hire, todayISO())} viewer={viewer} />;
  }
  const profile = decodeProfile(typeof params.p === "string" ? params.p : undefined);
  if (!profile) return <main className="missing-profile"><span className="brand-mark">e.</span><h1>Let’s make this your map.</h1><p>Choose a few details about your move to see the steps that apply to you.</p><Link href="/" className="build-button">Build my map →</Link></main>;
  return <BubbleMap profile={profile} />;
}
