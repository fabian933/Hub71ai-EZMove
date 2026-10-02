"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { criticalPath, daysBetween, deadlineTone, downstreamUnlockCounts, getDoByDate, getState, loadCompletedIds, moveDateOf, personalise, saveCompletedIds, todayISO, type DeadlineTone } from "@/lib/engine";
import { categoryStyles, descendants, layoutMap, settlementSteps, type MapNode } from "@/lib/map";
import { countryName } from "@/lib/profile";
import { loadChosenArea, saveChosenArea } from "@/lib/areas";
import type { Profile, Step } from "@/lib/schema";
import Icon from "./Icon";
import NodeDrawer from "./NodeDrawer";

type View = { x: number; y: number; scale: number };
type PhaseFilter = Step["phase"] | "all";
const phases: { value: PhaseFilter; label: string }[] = [{ value: "all", label: "All" }, { value: "before", label: "Before you arrive" }, { value: "landing", label: "Landed" }, { value: "settling", label: "Settling" }, { value: "living", label: "Living" }];
const badgeColors: Record<DeadlineTone, { fill: string; text: string }> = {
  upcoming: { fill: "#e5d3b1", text: "#3b3529" },
  soon: { fill: "#f1b955", text: "#3d2c0b" },
  overdue: { fill: "#e7786b", text: "#3a110c" },
};
const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
function countdown(days: number) {
  if (days > 1) return `${days} days to go`;
  if (days === 1) return "1 day to go";
  if (days === 0) return "Moving today";
  return `${-days} ${days === -1 ? "day" : "days"} ago`;
}
const phaseOrder: Record<Step["phase"], number> = { before: 0, landing: 1, settling: 2, living: 3 };
const SIGNED_IN_KEY = "ezmove.uaepass.v1";
function loadSignedIn(): string[] {
  try { const parsed: unknown = JSON.parse(window.localStorage.getItem(SIGNED_IN_KEY) ?? "[]"); return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []; }
  catch { return []; }
}
function saveSignedIn(ids: string[]) {
  try { if (ids.length) window.localStorage.setItem(SIGNED_IN_KEY, JSON.stringify(ids)); else window.localStorage.removeItem(SIGNED_IN_KEY); }
  catch { /* progress still works in memory */ }
}
/** Drops done steps whose prerequisites are no longer all done. */
function pruneCompleted(roadmap: readonly Step[], done: Set<string>): Set<string> {
  const next = new Set(done);
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of roadmap) if (next.has(step.id) && !step.prerequisites.every((id) => next.has(id))) { next.delete(step.id); changed = true; }
  }
  return next;
}
const clampScale = (value: number) => Math.min(2.8, Math.max(0.06, value));
function fittedView(nodes: readonly MapNode[], viewport: { width: number; height: number }): View {
  if (!nodes.length) return { x: viewport.width / 2, y: viewport.height / 2, scale: 1 };
  const minX = Math.min(...nodes.map((node) => node.x - node.radius - 36));
  const maxX = Math.max(...nodes.map((node) => node.x + node.radius + 36));
  const minY = Math.min(...nodes.map((node) => node.y - node.radius - 36));
  const maxY = Math.max(...nodes.map((node) => node.y + node.radius + 36));
  const scale = clampScale(Math.min((viewport.width - 32) / (maxX - minX), (viewport.height - 44) / (maxY - minY), 1.15));
  return { x: viewport.width / 2 - (minX + maxX) / 2 * scale, y: viewport.height / 2 - (minY + maxY) / 2 * scale, scale };
}

export default function BubbleMap({ profile }: { profile: Profile }) {
  const reducedMotion = useReducedMotion();
  const roadmap = useMemo(() => personalise(profile), [profile]);
  const layout = useMemo(() => layoutMap(roadmap), [roadmap]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState<PhaseFilter>("all");
  const [showCritical, setShowCritical] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Set<string>>(new Set());
  const [announcement, setAnnouncement] = useState("");
  const [size, setSize] = useState({ width: 1200, height: 800 });
  const [view, setView] = useState<View>({ x: 600, y: 400, scale: 0.75 });
  const [storageWarning, setStorageWarning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [chosenArea, setChosenArea] = useState<string | null>(null);
  const [showPassDemo, setShowPassDemo] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [signedIn, setSignedIn] = useState<string[]>([]);
  // Set after mount so the countdown and badges use the viewer's own date.
  const [today, setToday] = useState<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const viewRef = useRef(view);
  const sizeRef = useRef(size);
  const hasSized = useRef(false);
  const firstPhase = useRef(true);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; view: View; distance: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoCancelled = useRef(false);
  const updateView = useCallback((next: View) => { viewRef.current = next; setView(next); }, []);
  const counts = useMemo(() => downstreamUnlockCounts(roadmap, completed), [roadmap, completed]);
  const criticalIds = useMemo(() => new Set(criticalPath(roadmap, completed).map((step) => step.id)), [roadmap, completed]);
  const downstream = useMemo(() => hovered ? descendants(hovered, roadmap) : new Set<string>(), [hovered, roadmap]);
  const required = useMemo(() => settlementSteps(roadmap), [roadmap]);
  const requiredSteps = roadmap.filter((step) => required.has(step.id) && step.id !== "settled");
  const progressCount = requiredSteps.filter((step) => completed.has(step.id)).length;
  const progress = requiredSteps.length ? Math.round(progressCount / requiredSteps.length * 100) : 100;
  const visible = useMemo(() => layout.nodes.filter((node) => phase === "all" || node.step.phase === phase), [layout, phase]);
  const visibleIds = new Set(visible.map((node) => node.id));
  const selectedStep = roadmap.find((step) => step.id === selected);
  const hoverStep = roadmap.find((step) => step.id === hovered);
  const hoverUnlocks = [...downstream].filter((id) => !completed.has(id)).map((id) => roadmap.find((step) => step.id === id)?.shortTitle);
  const closeDrawer = useCallback(() => setSelected(null), []);
  const categories = [...new Set(roadmap.map((step) => step.category))];
  const moveDate = moveDateOf(profile);
  const nextUp = roadmap.filter((step) => getState(step, completed) === "available")
    .map((step, index) => ({ step, index, doBy: getDoByDate(step, moveDate) }))
    .sort((a, b) => (a.doBy && b.doBy ? a.doBy.localeCompare(b.doBy) : a.doBy ? -1 : b.doBy ? 1 : 0)
      || phaseOrder[a.step.phase] - phaseOrder[b.step.phase] || a.index - b.index)
    .slice(0, 3);
  const daysToMove = today ? daysBetween(today, moveDate) : null;

  useEffect(() => { setCompleted(loadCompletedIds()); setChosenArea(loadChosenArea()); setToday(todayISO()); setSignedIn(loadSignedIn()); setLoaded(true); }, []);
  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = { width: entry.contentRect.width, height: entry.contentRect.height };
      const previousSize = sizeRef.current;
      sizeRef.current = next;
      setSize(next);
      const current = viewRef.current;
      if (!hasSized.current) {
        hasSized.current = true;
        updateView(fittedView(layout.nodes, next));
      } else {
        updateView({ ...current, x: current.x + (next.width - previousSize.width) / 2, y: current.y + (next.height - previousSize.height) / 2 });
      }
    });
    observer.observe(stage.current);
    return () => observer.disconnect();
  // The observer owns viewport changes; the initial size is intentionally captured once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateView, layout]);
  useEffect(() => {
    demoCancelled.current = false;
    return () => { demoCancelled.current = true; if (flashTimer.current) clearTimeout(flashTimer.current); };
  }, []);
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = element.getBoundingClientRect();
      const x = event.clientX - bounds.left; const y = event.clientY - bounds.top;
      const current = viewRef.current;
      const scale = clampScale(current.scale * Math.exp(-event.deltaY * 0.002));
      const ratio = scale / current.scale;
      updateView({ x: x - (x - current.x) * ratio, y: y - (y - current.y) * ratio, scale });
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [updateView]);
  function fitMap() { updateView(fittedView(visible, sizeRef.current)); }
  useEffect(() => {
    if (firstPhase.current) { firstPhase.current = false; return; }
    fitMap();
  // Fit only when the chosen phase changes, not on pointer movement.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  function zoom(factor: number) {
    const current = viewRef.current;
    const scale = clampScale(current.scale * factor); const ratio = scale / current.scale;
    updateView({ x: size.width / 2 - (size.width / 2 - current.x) * ratio, y: size.height / 2 - (size.height / 2 - current.y) * ratio, scale });
  }
  function point(event: ReactPointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }
  function beginGesture() {
    const points = [...pointers.current.values()];
    if (!points.length) { gesture.current = null; return; }
    const center = points.length > 1 ? { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 } : points[0];
    gesture.current = { ...center, view: viewRef.current, distance: points.length > 1 ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) : 0, moved: false };
  }
  function pointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    pointers.current.set(event.pointerId, point(event));
    suppressClick.current = false;
    beginGesture();
  }
  function pointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, point(event));
    const points = [...pointers.current.values()]; const start = gesture.current;
    const center = points.length > 1 ? { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 } : points[0];
    const distance = points.length > 1 ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) : 0;
    if (Math.hypot(center.x - start.x, center.y - start.y) > 5 || Math.abs(distance - start.distance) > 4) {
      suppressClick.current = true; start.moved = true; setHovered(null);
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    }
    const scale = start.distance && distance ? clampScale(start.view.scale * distance / start.distance) : start.view.scale;
    const ratio = scale / start.view.scale;
    updateView({ x: center.x - (start.x - start.view.x) * ratio, y: center.y - (start.y - start.view.y) * ratio, scale });
  }
  function pointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    beginGesture();
  }
  function selectNode(id: string) {
    if (suppressClick.current || demoRunning) return;
    setHovered(null); setSelected(id);
  }
  function markDone(id: string) {
    if (demoRunning) return;
    const step = roadmap.find((item) => item.id === id);
    if (!step || getState(step, completed) !== "available") return;
    const next = new Set(completed); next.add(id);
    const lightingUp = roadmap.filter((item) => getState(item, completed) === "locked" && getState(item, next) === "available");
    const settled = roadmap.find((item) => item.id === "settled")!;
    if (id !== "settled" && getState(settled, next) === "available") next.add("settled");
    setCompleted(next); setNewlyUnlocked(new Set(lightingUp.map((item) => item.id)));
    setStorageWarning(!saveCompletedIds(next));
    setSelected(null); setHovered(null);
    setAnnouncement(next.has("settled") && !completed.has("settled") ? "You’re settled. Welcome to Abu Dhabi." : `${step.shortTitle} complete. ${lightingUp.length ? `${lightingUp.length} new ${lightingUp.length === 1 ? "step is" : "steps are"} ready.` : "Progress saved."}`);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setNewlyUnlocked(new Set()), 3200);
  }
  function chooseArea(id: string) {
    setChosenArea(id);
    setStorageWarning(!saveChosenArea(id));
    setAnnouncement("Area saved. School suggestions now follow your choice.");
  }
  async function completePassDemo() {
    setShowPassDemo(false);
    setDemoRunning(true);
    setSelected(null);
    setAnnouncement("Demo is lighting up your arrival steps…");
    const byId = new Map(roadmap.map((step) => [step.id, step]));
    const selectedIds = new Set<string>();
    const addWithPrerequisites = (id: string) => {
      const step = byId.get(id);
      if (!step || selectedIds.has(id)) return;
      selectedIds.add(id);
      step.prerequisites.forEach(addWithPrerequisites);
    };
    roadmap.filter((step) => step.phase === "before" || step.phase === "landing").forEach((step) => addWithPrerequisites(step.id));
    addWithPrerequisites("emirates_id");
    addWithPrerequisites("uae_pass");
    const ordered: Step[] = [];
    const visited = new Set<string>();
    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const step = byId.get(id);
      step?.prerequisites.filter((prerequisite) => selectedIds.has(prerequisite)).forEach(visit);
      if (step && selectedIds.has(id)) ordered.push(step);
    };
    selectedIds.forEach(visit);
    let next = new Set(completed);
    const added: string[] = [];
    for (const step of ordered) {
      if (demoCancelled.current) break;
      if (next.has(step.id)) continue;
      const previous = next;
      next = new Set(next);
      next.add(step.id);
      added.push(step.id);
      setCompleted(next);
      setStorageWarning(!saveCompletedIds(next));
      const lightingUp = roadmap.filter((item) => getState(item, previous) === "locked" && getState(item, next) === "available");
      setNewlyUnlocked(new Set([step.id, ...lightingUp.map((item) => item.id)]));
      if (!reducedMotion) await new Promise((resolve) => setTimeout(resolve, 140));
    }
    setDemoRunning(false);
    const allSignedIn = [...new Set([...signedIn, ...added])];
    setSignedIn(allSignedIn); saveSignedIn(allSignedIn);
    setAnnouncement("UAE Pass demo complete. Your next steps are ready.");
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setNewlyUnlocked(new Set()), 3200);
  }
  function signOut() {
    const removed = new Set(signedIn);
    const next = pruneCompleted(roadmap, new Set([...completed].filter((id) => !removed.has(id))));
    setCompleted(next); setStorageWarning(!saveCompletedIds(next));
    setSignedIn([]); saveSignedIn([]);
    setNewlyUnlocked(new Set()); setSelected(null);
    setAnnouncement("Signed out of UAE Pass. Steps marked by sign-in are cleared.");
  }
  function resetProgress() {
    if (!window.confirm("Clear all completed steps on this device?")) return;
    const next = new Set<string>();
    setCompleted(next); setStorageWarning(!saveCompletedIds(next));
    setSignedIn([]); saveSignedIn([]);
    setNewlyUnlocked(new Set()); setSelected(null);
    setAnnouncement("Progress reset.");
  }
  async function shareMap() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); }
    catch { setAnnouncement("Copy the address in your browser to share this map."); }
  }
  function isDimmed(id: string) { return (hovered && id !== hovered && !downstream.has(id)) || (showCritical && !criticalIds.has(id)); }
  return <main className="map-page">
    <header className="map-header"><div className="map-brand-row"><Link className="brand map-brand" href="/"><span className="brand-mark">e.</span><span>ez move</span></Link><span className="map-header-divider" /><div className="map-person"><strong>Your Abu Dhabi roadmap</strong><span>{countryName(profile.nationality)} · {profile.household === "solo" ? "Solo move" : profile.household === "couple" ? "Moving with a partner" : `Family${profile.kids ? ` · ${profile.kids} kids` : ""}`}</span><span className="move-countdown">Moving {formatDate(moveDate)}{daysToMove !== null && ` · ${countdown(daysToMove)}`}</span></div>{profile.reason === "hub71_founder" && <span className="hub71-badge">Hub71 founder</span>}</div><div className="map-header-actions">{signedIn.length ? <button className="uae-pass-button signed-in" disabled={demoRunning} onClick={signOut}>Signed in · Sign out</button> : <button className="uae-pass-button" disabled={demoRunning} onClick={() => setShowPassDemo(true)}>Sign in with UAE Pass</button>}<Link href="/" className="edit-profile">Edit profile</Link><button type="button" className="edit-profile reset-progress" disabled={demoRunning || !completed.size} onClick={resetProgress}>Reset progress</button><button className="share-button" onClick={shareMap}><Icon name={copied ? "check" : "link"} size={15} /><span>{copied ? "Copied" : "Share map"}</span></button></div></header>
    <div className="map-toolbar"><div className="phase-filters" aria-label="Filter by phase">{phases.map((item) => <button key={item.value} className={phase === item.value ? "active" : ""} aria-pressed={phase === item.value} onClick={() => { setPhase(item.value); setHovered(null); }}>{item.label}</button>)}</div><div className="toolbar-right"><button className={`critical-toggle ${showCritical ? "active" : ""}`} aria-pressed={showCritical} onClick={() => setShowCritical(!showCritical)}><Icon name="spark" size={14} />Critical path</button><div className="settlement-progress"><div><span>{completed.has("settled") ? "Settled" : "To settled"}</span><b>{progress}%</b></div><div className="progress-track" role="progressbar" aria-label="Progress to settled" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><motion.div animate={{ width: `${progress}%` }} transition={{ duration: reducedMotion ? 0 : 0.6 }} /></div></div></div></div>
    {nextUp.length > 0 && <nav className="next-up" aria-label="Next up"><span>Next up</span>{nextUp.map(({ step, doBy }) => {
      const tone = doBy && today ? deadlineTone(doBy, today) : null;
      return <button type="button" key={step.id} onClick={() => setSelected(step.id)}><i style={{ background: categoryStyles[step.category].color }} />{step.shortTitle}{doBy && <small className={tone ?? ""}>{tone === "overdue" ? "Overdue" : `by ${new Date(`${doBy}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}`}</small>}</button>;
    })}</nav>}
    <div className="map-stage" ref={stage}>
      <div className="map-caption"><span className="eyebrow">YOUR MOVE, CONNECTED</span><h1>{phase === "all" ? "One step opens the next." : phases.find((item) => item.value === phase)?.label}</h1><p>{showCritical ? "Your longest remaining route to settled." : "Tap a bubble to see what comes next."}</p></div>
      <svg ref={svg} className="bubble-svg" width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`} role="group" aria-label="Interactive relocation map. Drag to pan, pinch or scroll to zoom. Use Tab to focus steps and Enter to open details." tabIndex={0} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "+" || event.key === "=") { event.preventDefault(); zoom(1.25); }
        else if (event.key === "-") { event.preventDefault(); zoom(0.8); }
        else if (event.key === "0") { event.preventDefault(); fitMap(); }
        else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); updateView({ ...viewRef.current, x: viewRef.current.x + (event.key === "ArrowLeft" ? 70 : event.key === "ArrowRight" ? -70 : 0), y: viewRef.current.y + (event.key === "ArrowUp" ? 70 : event.key === "ArrowDown" ? -70 : 0) }); }
      }}>
        <defs><radialGradient id="hub-background"><stop stopColor="#68c8a1" stopOpacity=".08" /><stop offset="1" stopColor="#68c8a1" stopOpacity="0" /></radialGradient><filter id="bubble-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8" /></filter></defs>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          <circle cx="0" cy="0" r="330" fill="url(#hub-background)" pointerEvents="none" /><circle r="245" className="map-orbit" pointerEvents="none" /><circle r="450" className="map-orbit" pointerEvents="none" />
          {layout.edges.filter((edge) => visibleIds.has(edge.source.id) && visibleIds.has(edge.target.id)).map((edge) => {
            const highlighted = hovered ? (edge.source.id === hovered || downstream.has(edge.source.id)) && downstream.has(edge.target.id) : showCritical && criticalIds.has(edge.source.id) && criticalIds.has(edge.target.id);
            return <motion.line key={`${edge.source.id}-${edge.target.id}`} x1={edge.source.x} y1={edge.source.y} x2={edge.target.x} y2={edge.target.y} stroke={highlighted ? "#a3ecd0" : "#819a91"} strokeWidth={highlighted ? 2 : 1} animate={{ opacity: isDimmed(edge.source.id) || isDimmed(edge.target.id) ? 0.09 : highlighted ? 0.8 : 0.32 }} transition={{ duration: 0.18 }} pointerEvents="none" />;
          })}
          {visible.map((node) => {
            const state = getState(node.step, completed); const color = categoryStyles[node.step.category].color;
            const words = node.step.shortTitle.split(" ");
            const lines = words.length === 3 ? [words[0], `${words[1]} ${words[2]}`] : words.length === 2 ? words : words;
            const deadline = getDoByDate(node.step, moveDate);
            const tone = deadline && today && state !== "done" ? deadlineTone(deadline, today) : "upcoming";
            const flash = newlyUnlocked.has(node.id);
            return <motion.g key={node.id} initial={{ opacity: 0 }} animate={{ opacity: isDimmed(node.id) ? 0.17 : 1 }} transition={{ duration: reducedMotion ? 0 : 0.35 }}>
              <g transform={`translate(${node.x} ${node.y})`} role="button" tabIndex={selected ? -1 : 0} aria-label={`${node.step.shortTitle}, ${state}, unlocks ${counts[node.id]} steps`} className="bubble-node" data-step-id={node.id} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(node.id)} onBlur={() => setHovered(null)} onClick={() => selectNode(node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); suppressClick.current = false; selectNode(node.id); } }}>
                <title>{`Unlocks ${counts[node.id]} steps: ${[...descendants(node.id, roadmap)].filter((id) => !completed.has(id)).map((id) => roadmap.find((step) => step.id === id)?.shortTitle).join(", ") || "none"}`}</title>
                {state === "available" && <motion.circle className="availability-halo" r={node.radius + 6} fill={color} filter="url(#bubble-glow)" initial={{ opacity: 0.1 }} animate={reducedMotion ? { opacity: 0.13 } : { opacity: [0.08, 0.23, 0.08], r: [node.radius + 3, node.radius + 12, node.radius + 3] }} transition={{ duration: 3.2, repeat: Infinity, delay: (node.radius % 5) / 3 }} />}
                {flash && <motion.circle r={node.radius + 8} fill="none" stroke={color} strokeWidth="3" initial={{ r: node.radius, opacity: 1 }} animate={{ r: node.radius + 50, opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 1.15, repeat: 2 }} />}
                <motion.circle r={node.radius} animate={{ fill: node.id === "emirates_id" ? "#b7f3da" : state === "done" ? color : state === "available" ? "#213b34" : "#20312c", stroke: color, strokeOpacity: node.id === "emirates_id" ? 1 : state === "locked" ? 0.22 : 0.8 }} transition={{ duration: reducedMotion ? 0 : 0.5 }} strokeWidth={node.id === "emirates_id" ? 2 : 1.3} />
                {node.id === "emirates_id" && <circle r={node.radius - 7} fill="none" stroke={color} strokeOpacity=".13" />}
                {state === "locked" && <g transform={`translate(${node.radius * 0.69} ${-node.radius * 0.69})`} pointerEvents="none"><circle r="12" fill="#193328" stroke={color} strokeWidth="1.5" /><g transform="translate(-7 -7)" style={{ color }}><Icon name="lock" size={14} /></g></g>}
                {state === "done" && <g transform={`translate(${node.radius * 0.69} ${-node.radius * 0.69})`} pointerEvents="none"><circle r="12" fill="#193328" stroke={color} strokeWidth="1.5" /><g transform="translate(-7 -7)" style={{ color }}><Icon name="check" size={14} /></g></g>}
                <text textAnchor="middle" fill={node.id === "emirates_id" || state === "done" ? "#18362b" : state === "locked" ? "#a0b3a9" : color} fontSize={node.id === "emirates_id" ? 23 : node.radius > 53 ? 15 : 13} fontWeight={node.id === "emirates_id" ? 600 : 500} pointerEvents="none">{lines.map((line, index) => <tspan key={index} x="0" y={(index - (lines.length - 1) / 2) * (node.id === "emirates_id" ? 28 : 18) + 5}>{line}</tspan>)}</text>
                {node.id === "emirates_id" && <text textAnchor="middle" y="51" fontSize="10" letterSpacing="1.2" fill="#315949">YOUR CENTRAL HUB</text>}
                {deadline && <g transform={`translate(-49 ${node.radius - 5})`} pointerEvents="none"><rect width="98" height="22" rx="11" fill={badgeColors[tone].fill} /><text x="49" y="14.5" textAnchor="middle" fontSize="9.5" fontWeight={tone === "upcoming" ? 400 : 600} fill={badgeColors[tone].text}>{tone === "overdue" ? "Overdue" : `do by ${new Date(`${deadline}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}`}</text></g>}
              </g>
            </motion.g>;
          })}
        </g>
      </svg>
      {hoverStep && <div role="tooltip" className="map-tooltip"><strong>{hoverStep.shortTitle}</strong><span>Unlocks {counts[hoverStep.id]} steps: {hoverUnlocks.slice(0, 5).join(", ") || "none"}{hoverUnlocks.length > 5 ? `, +${hoverUnlocks.length - 5} more` : ""}</span></div>}
      <div className="map-controls"><button aria-label="Zoom in" onClick={() => zoom(1.25)}><Icon name="plus" /></button><button aria-label="Zoom out" onClick={() => zoom(0.8)}><Icon name="minus" /></button><span /><button aria-label="Fit all visible steps" onClick={fitMap}><Icon name="fit" size={17} /></button></div>
      <div className="map-bottom-note"><span>Drag to explore · Pinch to zoom</span><button onClick={() => setListOpen(true)}>View steps as list <Icon name="chevron" size={12} /></button></div>
      <AnimatePresence>{announcement && <motion.div key={announcement} className="map-toast" role="status" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}><Icon name="check" size={16} /><span>{announcement}</span><button aria-label="Dismiss message" onClick={() => setAnnouncement("")}><Icon name="close" size={13} /></button></motion.div>}</AnimatePresence>
    </div>
    <footer className="map-legend"><div className="category-legend">{categories.map((category) => <span key={category}><i style={{ background: categoryStyles[category].color }} />{categoryStyles[category].label}</span>)}</div><div className="state-legend"><span><i className="legend-done" />Done</span><span><i className="legend-ready" />Available</span><span><Icon name="lock" size={11} />Locked</span></div></footer>
    {storageWarning && <div className="storage-warning" role="status">Progress is kept for this visit. Browser storage is unavailable.</div>}
    {!loaded && <span className="sr-only">Loading saved progress</span>}
    <AnimatePresence>{selectedStep && <NodeDrawer key="step-drawer" step={selectedStep} roadmap={roadmap} profile={profile} today={today} completed={completed} chosenArea={chosenArea} onChooseArea={chooseArea} onClose={closeDrawer} onDone={markDone} onSelect={setSelected} />}</AnimatePresence>
    <AnimatePresence>{showPassDemo && <motion.div className="pass-demo-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPassDemo(false)}><motion.div className="pass-demo-modal" role="dialog" aria-modal="true" aria-labelledby="pass-demo-title" initial={{ y: 20, scale: .97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: .97 }} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === "Escape") setShowPassDemo(false); }}><div className="pass-demo-icon"><Icon name="check" size={25} /></div><span className="eyebrow">IDENTITY DEMO</span><h2 id="pass-demo-title">Demo — production uses UAE Pass OAuth</h2><p>This preview marks your arrival and identity steps complete, then lights up what they unlock. No credentials are requested.</p><div className="pass-demo-actions"><button onClick={() => setShowPassDemo(false)}>Cancel</button><button autoFocus onClick={completePassDemo}>Continue demo <Icon name="chevron" size={14} /></button></div></motion.div></motion.div>}</AnimatePresence>
    <AnimatePresence>{listOpen && <><motion.div className="drawer-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setListOpen(false)} /><motion.aside className="node-drawer step-list" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}><div className="drawer-top"><h2>Your steps</h2><button className="icon-button" aria-label="Close step list" onClick={() => setListOpen(false)}><Icon name="close" /></button></div>{visible.map((node) => <button className="step-list-item" key={node.id} onClick={() => { setListOpen(false); setSelected(node.id); }}><i style={{ background: categoryStyles[node.step.category].color }} /><span>{node.step.shortTitle}<small>{getState(node.step, completed)}</small></span><Icon name="chevron" size={15} /></button>)}</motion.aside></>}</AnimatePresence>
  </main>;
}
