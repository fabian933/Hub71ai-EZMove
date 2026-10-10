import { z } from "zod";
import rawTrack from "@/data/hub71.json";
import rawLiving from "@/data/living.json";
import { steps } from "./data";

const text = z.string().trim().min(1);
const link = z.url().refine((value) => /^https?:\/\//.test(value), "Use an HTTP(S) URL").nullable();

export const TrackItemSchema = z.object({
  id: text, stepId: text.nullable(), title: text, detail: text, link,
  /** True when the item is a sample suggestion rather than a step from /data/steps.json. */
  illustrative: z.boolean(),
}).strict();
export const GroupSchema = z.object({ id: text, name: text, summary: text, goodFor: z.array(text), illustrative: z.boolean() }).strict();

export type TrackItem = z.infer<typeof TrackItemSchema>;
export type Group = z.infer<typeof GroupSchema>;

export const hub71Track = z.array(TrackItemSchema).parse(rawTrack);
export const communityGroups = z.object({ groups: z.array(GroupSchema) }).parse(rawLiving).groups;

const stepIds = new Set(steps.map((step) => step.id));
for (const item of hub71Track) {
  if (item.stepId && !stepIds.has(item.stepId)) throw new Error(`Hub71 track item ${item.id} points to unknown step ${item.stepId}`);
}

/** Track items that are not map steps keep their own progress on this device. */
export const TRACK_STORAGE_KEY = "ezmove.hub71.v1";
export function loadTrackDone(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(TRACK_STORAGE_KEY) ?? "[]");
    const known = new Set(hub71Track.map((item) => item.id));
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string" && known.has(id)) : []);
  } catch { return new Set(); }
}
export function saveTrackDone(done: ReadonlySet<string>): boolean {
  try { window.localStorage.setItem(TRACK_STORAGE_KEY, JSON.stringify([...done].sort())); return true; }
  catch { return false; }
}
