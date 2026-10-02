import { z } from "zod";
import rawSteps from "@/data/steps.json";
import rawCommunities from "@/data/communities.json";
import rawSchools from "@/data/schools.json";
import { CommunitySchema, SchoolSchema, StepSchema } from "./schema";

function assertUniqueIds(items: { id: string }[], label: string) {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`Duplicate ${label} id: ${item.id}`);
    ids.add(item.id);
  }
}

export const steps = z.array(StepSchema).parse(rawSteps);
export const communities = z.array(CommunitySchema).parse(rawCommunities);
export const schools = z.array(SchoolSchema).parse(rawSchools);
assertUniqueIds(steps, "step");
assertUniqueIds(communities, "community");
assertUniqueIds(schools, "school");

const byId = new Map(steps.map((step) => [step.id, step]));
const visiting = new Set<string>();
const visited = new Set<string>();
function visit(id: string) {
  if (visiting.has(id)) throw new Error(`Cyclic step prerequisites at ${id}`);
  if (visited.has(id)) return;
  const step = byId.get(id);
  if (!step) throw new Error(`Unknown step prerequisite: ${id}`);
  visiting.add(id);
  if (new Set(step.prerequisites).size !== step.prerequisites.length) {
    throw new Error(`Duplicate prerequisites for ${id}`);
  }
  step.prerequisites.forEach(visit);
  visiting.delete(id);
  visited.add(id);
}
steps.forEach((step) => visit(step.id));
if (!byId.has("settled")) throw new Error("Missing settled milestone");
const communityIds = new Set(communities.map((community) => community.id));
for (const school of schools) {
  if (!communityIds.has(school.communityId)) throw new Error(`Unknown school community: ${school.communityId}`);
}

export const data = { steps, communities, schools };
