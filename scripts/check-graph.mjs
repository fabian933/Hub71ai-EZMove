// Checks data/steps.json as a dependency graph. Run with `npm run check:graph`.
import { readFileSync } from "node:fs";

const steps = JSON.parse(readFileSync(new URL("../data/steps.json", import.meta.url), "utf8"));
const errors = [];
const byId = new Map();
for (const step of steps) {
  if (byId.has(step.id)) errors.push(`Duplicate id: ${step.id}`);
  byId.set(step.id, step);
}

const phaseRank = { before: 0, landing: 1, settling: 2, living: 3 };
const reasons = ["job", "hub71_founder", "own_business", "other"];
const edgesOf = (step) => [...step.prerequisites, ...(step.overrides ?? []).flatMap((override) => override.addPrerequisites ?? [])];

for (const step of steps) {
  for (const id of edgesOf(step)) {
    const prerequisite = byId.get(id);
    if (!prerequisite) { errors.push(`${step.id} needs unknown step ${id}`); continue; }
    if (phaseRank[prerequisite.phase] > phaseRank[step.phase]) errors.push(`Backward edge: ${id} (${prerequisite.phase}) -> ${step.id} (${step.phase})`);
  }
  if (step.lane === "company") {
    const only = step.appliesIf.reasons;
    if (!only || only.length !== 1 || only[0] !== "hub71_founder") errors.push(`Company lane step ${step.id} must apply only to hub71_founder`);
    if (!step.source) errors.push(`Company lane step ${step.id} needs a source`);
  }
  if (step.costAED === null && step.durationDays === null && step.durationLabel && /\d/.test(step.durationLabel) && !step.source) {
    errors.push(`${step.id} has a timing without a source`);
  }
  for (const override of step.overrides ?? []) {
    for (const reason of override.reasons) if (!reasons.includes(reason)) errors.push(`${step.id} override has unknown reason ${reason}`);
  }
}

// Cycles, including edges added by overrides.
const state = new Map();
function visit(id, path) {
  if (state.get(id) === "done") return;
  if (state.get(id) === "visiting") { errors.push(`Cycle: ${[...path, id].join(" -> ")}`); return; }
  state.set(id, "visiting");
  for (const next of edgesOf(byId.get(id)).filter((dep) => byId.has(dep))) visit(next, [...path, id]);
  state.set(id, "done");
}
for (const step of steps) visit(step.id, []);

// Per reason: which steps apply, and no personal step may wait on a company step outside the founder plan.
for (const reason of reasons) {
  const applies = steps.filter((step) => !step.appliesIf.reasons || step.appliesIf.reasons.includes(reason === "other" ? "job" : reason));
  const ids = new Set(applies.map((step) => step.id));
  const company = applies.filter((step) => step.lane === "company");
  if (reason !== "hub71_founder" && company.length) errors.push(`${reason} should have no company lane, has ${company.map((step) => step.id).join(", ")}`);
  if (!ids.has("settled")) errors.push(`${reason} plan has no settled milestone`);
  console.log(`${reason.padEnd(14)} ${String(applies.length).padStart(2)} steps (${company.length} company)`);
}

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`\nGraph OK: ${steps.length} steps.`);
