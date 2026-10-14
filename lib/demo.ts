import { demoPersonById, demoPlan } from "./demoTeam";

/** Demo plan for /app?demo=founder (Sara) or /app?demo=<person id>. Fictional; shown with a "Demo data" tag. */
export function demoFor(id: string, now = new Date()) {
  const person = demoPersonById(id);
  return person ? demoPlan(person, now) : null;
}
