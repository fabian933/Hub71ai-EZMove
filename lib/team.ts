import { z } from "zod";
import rawTeam from "@/data/team.sample.json";
import { daysBetween, getDoByDate, nextUpSteps, personalise, settlementSteps } from "./engine";
import { defaultProfile, normaliseProfile } from "./profile";
import { ProfileSchema, type Profile, type Step } from "./schema";

const text = z.string().trim().min(1).max(60);
const SampleHireSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_-]*$/), name: text, role: text,
  profile: ProfileSchema.omit({ moveMonth: true, moveDate: true, budgetBand: true }),
  /** Move date relative to today, so the sample never goes stale. */
  moveInDays: z.number().int(),
  completed: z.array(z.string()),
}).strict();
export type SampleHire = z.infer<typeof SampleHireSchema>;
export const sampleTeam = z.array(SampleHireSchema).parse(rawTeam);

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function sampleHireProfile(hire: SampleHire, today: string): Profile {
  const moveDate = addDays(today, hire.moveInDays);
  return normaliseProfile({ ...defaultProfile(moveDate), ...hire.profile, moveDate });
}

export type HireProgress = {
  percent: number; settled: boolean; moveDate: string; daysToMove: number;
  next: Step | null; overdue: Step[]; dueSoon: Step[];
};

export function hireProgress(profile: Profile, completed: readonly string[], today: string): HireProgress {
  const roadmap = personalise(profile);
  const done = new Set(completed.filter((id) => roadmap.some((step) => step.id === id)));
  const required = [...settlementSteps(roadmap)].filter((id) => id !== "settled");
  const moveDate = profile.moveDate ?? `${profile.moveMonth}-01`;
  const pending = roadmap.filter((step) => !done.has(step.id));
  const withDoBy = pending.map((step) => ({ step, doBy: getDoByDate(step, moveDate) })).filter((item): item is { step: Step; doBy: string } => !!item.doBy);
  return {
    percent: required.length ? Math.round(required.filter((id) => done.has(id)).length / required.length * 100) : 100,
    settled: done.has("settled"),
    moveDate,
    daysToMove: daysBetween(today, moveDate),
    next: nextUpSteps(roadmap.filter((step) => step.phase !== "living"), done, moveDate, 1)[0]?.step ?? null,
    overdue: withDoBy.filter(({ doBy }) => daysBetween(today, doBy) < 0).map(({ step }) => step),
    dueSoon: withDoBy.filter(({ doBy }) => { const days = daysBetween(today, doBy); return days >= 0 && days <= 14; }).map(({ step }) => step),
  };
}

/** An invite travels in the URL, like the profile. It holds no personal data beyond a first name. */
export const InviteSchema = z.object({
  name: text, company: text,
  household: ProfileSchema.shape.household, kids: z.number().int().min(0).max(20),
}).strict();
export type Invite = z.infer<typeof InviteSchema>;

const toBase64Url = (value: string) => btoa(unescape(encodeURIComponent(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromBase64Url = (value: string) => decodeURIComponent(escape(atob(value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "="))));

export function encodeInvite(invite: Invite): string { return toBase64Url(JSON.stringify(InviteSchema.parse(invite))); }
export function decodeInvite(value: string | undefined): Invite | null {
  if (!value || value.length > 600 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try { const parsed = InviteSchema.safeParse(JSON.parse(fromBase64Url(value))); return parsed.success ? parsed.data : null; }
  catch { return null; }
}

/** Invites the founder has sent from this device. */
export const INVITES_STORAGE_KEY = "ezmove.invites.v1";
export type SentInvite = Invite & { id: string; createdAt: string };
export function loadInvites(): SentInvite[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(INVITES_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.flatMap((item) => {
      const invite = InviteSchema.safeParse({ name: item?.name, company: item?.company, household: item?.household, kids: item?.kids });
      return invite.success && typeof item.id === "string" && typeof item.createdAt === "string" ? [{ ...invite.data, id: item.id, createdAt: item.createdAt }] : [];
    }) : [];
  } catch { return []; }
}
export function saveInvites(invites: SentInvite[]): boolean {
  try { window.localStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(invites)); return true; }
  catch { return false; }
}
