import { ArrowRight } from "lucide-react";
import "./site.css";
import SiteNav from "@/components/site/SiteNav";
import PhoneMock from "@/components/site/PhoneMock";
import TeamMock from "@/components/site/TeamMock";
import PlanMock from "@/components/site/PlanMock";
import FeatureVisual from "@/components/site/FeatureVisual";
import SiteFooter from "@/components/site/SiteFooter";
import { DEMO_HREF, employeeCards, features, partnerTiles, teamCards } from "@/components/site/content";
import { ButtonLink } from "@/components/ui/Button";
import IconTile from "@/components/ui/IconTile";
import Badge from "@/components/ui/Badge";

function CardList({ cards }: { cards: { title: string; text: string }[] }) {
  return <ul className="side-cards">{cards.map((card) => <li key={card.title} className="card"><h4>{card.title}</h4><p>{card.text}</p></li>)}</ul>;
}

export default function Home() {
  return <div className="site">
    <SiteNav />
    <main>
      <section className="hero"><div className="container hero-inner">
        <div className="hero-copy">
          <h1>Your move. Made easy.</h1>
          <p className="hero-sub">One platform for the teams that bring people to Abu Dhabi, and for the people making the move.</p>
          <div className="hero-actions">
            <ButtonLink href="/app?demo=founder">See the employee view <ArrowRight size={16} aria-hidden /></ButtonLink>
            <ButtonLink href="/team" variant="secondary">See the team view</ButtonLink>
          </div>
        </div>
        <PhoneMock />
      </div></section>

      <section className="section section-white" aria-labelledby="two-views"><div className="container">
        <h2 id="two-views" className="section-title">One move, two views.</h2>
        <div id="teams" className="view-row">
          <div className="view-text">
            <span className="view-kicker">For teams</span>
            <p className="view-lead">See every employee&apos;s move in one place: licence, visa, bank and benefits. Spot who&apos;s stuck before they ask.</p>
            <CardList cards={teamCards} />
          </div>
          <TeamMock />
        </div>
        <div id="employees" className="view-row reverse">
          <div className="view-text">
            <span className="view-kicker employee">For employees</span>
            <p className="view-lead">A step-by-step plan built around your move, so you always know what&apos;s next.</p>
            <CardList cards={employeeCards} />
          </div>
          <PlanMock />
        </div>
      </div></section>

      <section className="section" aria-labelledby="on-top"><div className="container">
        <h2 id="on-top" className="section-title">Sits on top of what you already use.</h2>
        <ul className="tiles">{partnerTiles.map((tile) => <li key={tile.title} className="card tile">
          <IconTile icon={tile.icon} size={44} />
          <div><h3>{tile.title}{tile.soon && <Badge>Coming soon</Badge>}</h3><p>{tile.text}</p></div>
        </li>)}</ul>
      </div></section>

      <section id="features" className="section section-white" aria-labelledby="features-title"><div className="container">
        <h2 id="features-title" className="section-title">Platform features</h2>
        <ul className="feature-grid">{features.map((feature) => <li key={feature.name} className={`feature-card${feature.soon ? " soon" : ""}${feature.visual === "partners" ? " wide" : ""}`}>
          {feature.visual && <FeatureVisual kind={feature.visual} />}
          <div className="feature-copy">
            <h3><IconTile icon={feature.icon} size={32} />{feature.name}{feature.soon && <Badge>Coming soon</Badge>}</h3>
            <p>{feature.text}</p>
          </div>
        </li>)}</ul>
        <p className="feature-note">Visuals show demo data.</p>
      </div></section>

      <section className="cta"><div className="container cta-inner">
        <h2>Bring your next hires in with less chasing.</h2>
        <ButtonLink href={DEMO_HREF} className="btn-light">Book a demo</ButtonLink>
      </div></section>
    </main>
    <SiteFooter />
  </div>;
}
