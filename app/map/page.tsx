import Link from "next/link";
import BubbleMap from "@/components/BubbleMap";
import { decodeProfile } from "@/lib/profile";
export default async function MapPage({ searchParams }: { searchParams: Promise<{ p?: string | string[] }> }) {
  const params = await searchParams;
  const profile = decodeProfile(typeof params.p === "string" ? params.p : undefined);
  if (!profile) return <main className="missing-profile"><span className="brand-mark">e.</span><h1>Let’s make this your map.</h1><p>Choose a few details about your move to see the steps that apply to you.</p><Link href="/" className="build-button">Build my map →</Link></main>;
  return <BubbleMap profile={profile} />;
}
