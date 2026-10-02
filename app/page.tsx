import Intake from "@/components/Intake";
import MapPreview from "@/components/MapPreview";
import { nextMoveMonth } from "@/lib/profile";
export const dynamic = "force-dynamic";
export default function HomePage() {
  const moveMonth = nextMoveMonth();
  return <main className="home-page"><header className="home-nav"><a href="/" className="brand"><span className="brand-mark">e.</span>ez move<span className="brand-location">ABU DHABI</span></a><span className="nav-note">A new city. A clear plan.</span></header>
    <div className="home-grid"><section className="home-intro"><div className="eyebrow"><span /> YOUR NEXT CHAPTER STARTS HERE</div><h1>Your move.<br /><em>Made clear.</em></h1><p className="home-description">From the first document to the day you feel settled. A personalised roadmap for your life in Abu Dhabi.</p><div className="intro-benefits"><span>Know the order</span><span>Unlock your next step</span><span>Feel at home</span></div><MapPreview moveMonth={moveMonth} /></section><Intake moveMonth={moveMonth} /></div>
    <footer className="home-footer"><span>Built for people, families &amp; Hub71 founders.</span><span>Small steps. Big beginnings.</span></footer>
  </main>;
}
