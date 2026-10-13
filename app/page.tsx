import Intake from "@/components/Intake";
import MapPreview from "@/components/MapPreview";
import { moveDateIn, nextMoveDate } from "@/lib/profile";
import { decodeInvite } from "@/lib/team";
export const dynamic = "force-dynamic";
export default async function HomePage({ searchParams }: { searchParams: Promise<{ invite?: string | string[] }> }) {
  const params = await searchParams;
  const invite = decodeInvite(typeof params.invite === "string" ? params.invite : undefined);
  const moveDate = nextMoveDate();
  const demoMoveDate = moveDateIn(3);
  return <main className="home-page"><header className="home-nav"><a href="/" className="brand"><span className="brand-mark">e.</span>ez move<span className="brand-location">ABU DHABI</span></a><span className="nav-note">For Hub71 founders and their teams</span></header>
    <div className="home-grid"><section className="home-intro"><div className="eyebrow"><span /> YOUR STEP-BY-STEP PLAN</div><h1>Your move.<br /><em>Made easy.</em></h1><p className="home-description">A clear, step-by-step plan for founders and teams moving to Abu Dhabi.</p><MapPreview moveDate={moveDate} /></section><Intake moveDate={moveDate} demoMoveDate={demoMoveDate} invite={invite} /></div>
    <footer className="home-footer"><span>Built for Hub71 founders and the teams they bring.</span><span>Steps from Hub71’s onboarding guide and official sources.</span></footer>
  </main>;
}
