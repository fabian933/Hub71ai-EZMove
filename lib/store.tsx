"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getState, loadCompletedIds, moveDateOf, personalise, saveCompletedIds, todayISO } from "./engine";
import { decodeProfile, normaliseProfile } from "./profile";
import { demoFounder } from "./demo";
import { uiStep } from "./copy";
import { ProfileSchema, type Profile, type Step } from "./schema";

const PROFILE_KEY = "ezmove.profile.v2";
const STARTED_KEY = "ezmove.started.v1";
const DOCS_KEY = "ezmove.docs.v1";
const DEMO_KEY = "ezmove.demo.v1";

function read<T>(key: string, fallback: T): T {
  try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) {
  try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* in-memory only */ }
}

type Move = {
  ready: boolean;
  profile: Profile | null;
  isDemo: boolean;
  /** Personalised steps with company-generic copy. */
  roadmap: Step[];
  completed: Set<string>;
  started: Set<string>;
  docs: Record<string, string[]>;
  moveDate: string | null;
  today: string | null;
  setProfile: (profile: Profile) => void;
  markDone: (id: string) => void;
  undoDone: (id: string) => void;
  markStarted: (id: string) => void;
  toggleDoc: (stepId: string, doc: string) => void;
  loadDemo: () => void;
};

const MoveContext = createContext<Move | null>(null);

/** Drops done steps whose prerequisites are no longer all done. */
function prune(roadmap: readonly Step[], done: Set<string>): Set<string> {
  const next = new Set(done);
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of roadmap) if (next.has(step.id) && !step.prerequisites.every((id) => next.has(id))) { next.delete(step.id); changed = true; }
  }
  return next;
}

export function MoveProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [started, setStarted] = useState<Set<string>>(new Set());
  const [docs, setDocs] = useState<Record<string, string[]>>({});
  const [today, setToday] = useState<string | null>(null);

  const applyDemo = useCallback(() => {
    const demo = demoFounder();
    setProfileState(demo.profile); setCompleted(new Set(demo.completed)); setStarted(new Set(demo.started)); setDocs({}); setIsDemo(true);
    write(PROFILE_KEY, demo.profile); saveCompletedIds(demo.completed); write(STARTED_KEY, demo.started); write(DOCS_KEY, {}); write(DEMO_KEY, true);
  }, []);

  useEffect(() => {
    setToday(todayISO());
    const params = new URLSearchParams(window.location.search);
    const fromLink = decodeProfile(params.get("p") ?? undefined);
    if (params.get("demo") === "founder") applyDemo();
    else {
      const stored = ProfileSchema.safeParse(read(PROFILE_KEY, null));
      const next = fromLink ?? (stored.success ? normaliseProfile(stored.data) : null);
      if (fromLink) { write(PROFILE_KEY, fromLink); write(DEMO_KEY, null); }
      setProfileState(next);
      setIsDemo(!fromLink && read(DEMO_KEY, false));
      setCompleted(loadCompletedIds());
      setStarted(new Set(read<string[]>(STARTED_KEY, [])));
      setDocs(read(DOCS_KEY, {}));
    }
    if (params.has("demo") || params.has("p")) window.history.replaceState(null, "", window.location.pathname);
    setReady(true);
  }, [applyDemo]);

  const roadmap = useMemo(() => profile ? personalise(profile).map(uiStep) : [], [profile]);
  const value = useMemo<Move>(() => ({
    ready, profile, isDemo, roadmap, completed, started, docs, today,
    moveDate: profile ? moveDateOf(profile) : null,
    setProfile(next) {
      const normalised = normaliseProfile(next);
      setProfileState(normalised); write(PROFILE_KEY, normalised);
      setIsDemo(false); write(DEMO_KEY, null);
    },
    markDone(id) {
      const step = roadmap.find((item) => item.id === id);
      if (!step || getState(step, completed) !== "available") return;
      const next = new Set(completed).add(id);
      const settled = roadmap.find((item) => item.id === "settled");
      if (settled && getState(settled, next) === "available") next.add("settled");
      setCompleted(next); saveCompletedIds(next);
    },
    undoDone(id) {
      const removed = new Set(completed); removed.delete(id);
      const next = prune(roadmap, removed);
      setCompleted(next); saveCompletedIds(next);
    },
    markStarted(id) {
      const next = new Set(started).add(id);
      setStarted(next); write(STARTED_KEY, [...next]);
    },
    toggleDoc(stepId, doc) {
      const current = new Set(docs[stepId] ?? []);
      if (current.has(doc)) current.delete(doc); else current.add(doc);
      const next = { ...docs, [stepId]: [...current] };
      setDocs(next); write(DOCS_KEY, next);
    },
    loadDemo: applyDemo,
  }), [ready, profile, isDemo, roadmap, completed, started, docs, today, applyDemo]);

  return <MoveContext.Provider value={value}>{children}</MoveContext.Provider>;
}

export function useMove(): Move {
  const move = useContext(MoveContext);
  if (!move) throw new Error("useMove must be used inside MoveProvider");
  return move;
}

export const firstName = (profile: Profile | null) => profile?.name?.split(/\s+/)[0] ?? null;
