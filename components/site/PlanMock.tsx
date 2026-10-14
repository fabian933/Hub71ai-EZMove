import StatusPill from "@/components/ui/StatusPill";
import SourceTag from "@/components/ui/SourceTag";

const lanes = [
  { title: "Your company", steps: [
    { name: "Clara KYC", pill: <StatusPill status="done" /> },
    { name: "ADGM licence", pill: <StatusPill status="in_progress" /> },
  ] },
  { title: "You and your family", steps: [
    { name: "UAE mobile number", pill: <StatusPill status="todo" /> },
    { name: "Entry permit", pill: <StatusPill status="waiting" waitingOn="ADGM licence" /> },
  ] },
];

/** A simplified mock of the employee Plan screen. Demo data only. */
export default function PlanMock() {
  return <div className="plan-mock" role="img" aria-label="Preview of the employee plan (demo data)">
    <div className="team-mock-head plan-mock-head"><span>Your plan</span><SourceTag source="demo" /></div>
    {lanes.map((lane) => <div key={lane.title} className="plan-mock-lane">
      <span className="mock-label">{lane.title}</span>
      <ul>{lane.steps.map((step) => <li key={step.name}><span>{step.name}</span>{step.pill}</li>)}</ul>
    </div>)}
  </div>;
}
