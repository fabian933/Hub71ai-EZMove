import StatusPill from "@/components/ui/StatusPill";
import SourceTag from "@/components/ui/SourceTag";

const rows = [
  { company: "Northwind Robotics", step: "ADGM licence", status: <StatusPill status="in_progress" /> },
  { company: "Tidewater Health", step: "Entry permit", status: <StatusPill status="waiting" waitingOn="ADGM licence" /> },
  { company: "Brightline Pay", step: "Business bank", status: <StatusPill status="todo" alert alertLabel="Needs attention" /> },
  { company: "Cedar Grid", step: "Emirates ID", status: <StatusPill status="done" /> },
];

/** A simplified mock of the team view. Fictional companies, demo data only. */
export default function TeamMock() {
  return <div className="team-mock" role="img" aria-label="Preview of the team view (demo data)">
    <div className="team-mock-head"><span>Founders this cohort</span><SourceTag source="demo" /></div>
    <ul>{rows.map((row) => <li key={row.company}><span className="team-mock-name">{row.company}<small>{row.step}</small></span>{row.status}</li>)}</ul>
  </div>;
}
