import "./team.css";
import TeamDashboard, { TeamHeader, TeamTitle } from "@/components/team/TeamDashboard";

export const metadata = { title: "Relocations · EZ Move" };

export default function TeamView() {
  return <div className="team-page">
    <TeamHeader />
    <main className="team-main">
      <TeamTitle />
      <TeamDashboard />
    </main>
  </div>;
}
