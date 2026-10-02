import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from "d3-force";
import { downstreamUnlockCounts } from "./engine";
import type { Step } from "./schema";

export const categoryStyles: Record<Step["category"], { label: string; color: string }> = {
  before_you_fly: { label: "Before you arrive", color: "#ecd4a8" },
  identity: { label: "Identity", color: "#a3ecd0" },
  visa: { label: "Visa", color: "#f3b7a4" },
  housing: { label: "Housing", color: "#accbf5" },
  money: { label: "Money", color: "#cdbaf3" },
  family: { label: "Family", color: "#f0b7d3" },
  health: { label: "Health", color: "#b4deb3" },
  transport: { label: "Transport", color: "#e9d991" },
  hub71: { label: "Hub71", color: "#bdc5ff" },
  life: { label: "Life", color: "#b6cec4" },
};

export type MapNode = SimulationNodeDatum & { id: string; step: Step; radius: number; targetX: number; targetY: number; x: number; y: number };
export type MapEdge = { source: MapNode; target: MapNode };
export function layoutMap(roadmap: readonly Step[]): { nodes: MapNode[]; edges: MapEdge[] } {
  const counts = downstreamUnlockCounts(roadmap);
  const categoryY: Record<Step["category"], number> = { before_you_fly: 0, identity: -90, visa: -40, housing: 165, money: -190, family: 350, health: -300, transport: -360, hub71: -210, life: 30 };
  const categoryX: Record<Step["category"], number> = { before_you_fly: -570, identity: 40, visa: -260, housing: 280, money: 200, family: 470, health: -90, transport: 470, hub71: -480, life: 660 };
  const groups = new Map<string, number>();
  const nodes: MapNode[] = roadmap.map((step, index) => {
    const ordinal = groups.get(step.category) ?? 0;
    groups.set(step.category, ordinal + 1);
    const targetX = step.id === "emirates_id" ? 0 : categoryX[step.category] + (ordinal % 2) * 80;
    const targetY = categoryY[step.category] + (ordinal - 1) * 86;
    const radius = 37 + Math.min(25, Math.sqrt(counts[step.id]) * 5) + (step.id === "emirates_id" ? 27 : step.id === "settled" ? 12 : 0);
    return { id: step.id, step, radius, targetX, targetY, x: targetX + Math.cos(index * 2.4) * 50, y: targetY + Math.sin(index * 2.4) * 50, ...(step.id === "emirates_id" ? { fx: 0, fy: 0 } : {}) };
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: MapEdge[] = nodes.flatMap((target) => target.step.prerequisites.map((id) => ({ source: byId.get(id)!, target })));
  const simulation = forceSimulation(nodes).stop()
    .force("link", forceLink<MapNode, MapEdge>(edges).id((node) => node.id).distance((edge) => edge.source.radius + edge.target.radius + 65).strength(0.12))
    .force("charge", forceManyBody().strength(-390))
    .force("collision", forceCollide<MapNode>().radius((node) => node.radius + 22).iterations(3))
    .force("x", forceX<MapNode>((node) => node.targetX).strength(0.11))
    .force("y", forceY<MapNode>((node) => node.targetY).strength(0.12));
  simulation.tick(360);
  simulation.stop();
  return { nodes, edges };
}

export function descendants(stepId: string, roadmap: readonly Step[]): Set<string> {
  const ids = new Set<string>();
  const queue = [stepId];
  for (let i = 0; i < queue.length; i++) {
    for (const step of roadmap) if (step.prerequisites.includes(queue[i]) && !ids.has(step.id)) {
      ids.add(step.id); queue.push(step.id);
    }
  }
  return ids;
}

/** Every ancestor required for settled, including parallel prerequisite branches. */
export function settlementSteps(roadmap: readonly Step[]): Set<string> {
  const byId = new Map(roadmap.map((step) => [step.id, step]));
  const required = new Set<string>();
  function visit(id: string) {
    if (required.has(id)) return;
    required.add(id);
    byId.get(id)?.prerequisites.forEach(visit);
  }
  visit("settled");
  return required;
}
