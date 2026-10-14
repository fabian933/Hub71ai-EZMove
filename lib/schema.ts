import { z } from "zod";

export const iso2Codes = new Set(
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" "),
);
const text = z.string().trim().min(1);
const id = text.regex(/^[a-z][a-z0-9_-]*$/);
const household = z.enum(["solo", "couple", "family"]);
/** hub71_founder = "Setting up a company" in the UI; startup_hire = "Joining a startup" (treated like a job). */
const reason = z.enum(["job", "hub71_founder", "own_business", "other", "startup_hire"]);
const range = z.object({ min: z.number().finite().nonnegative(), max: z.number().finite().nonnegative() })
  .strict().refine(({ min, max }) => max >= min, "max must be at least min");
const link = z.url().refine((value) => /^https?:\/\//.test(value), "Use an HTTP(S) URL").nullable();
const provenance = {
  sourceUrl: link,
  lastVerified: z.iso.date().nullable().optional(),
};

export const ProfileSchema = z.object({
  nationality: z.enum([...iso2Codes], { error: "Use an uppercase ISO 3166-1 alpha-2 code" }),
  household,
  kids: z.number().int().nonnegative(),
  reason,
  moveMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM"),
  /** Exact move date. moveMonth is derived from it; older shared links only have moveMonth. */
  moveDate: z.iso.date().optional(),
  budgetBand: z.enum(["low", "mid", "high"]),
  /** Annual rent budget. budgetBand is derived from it when set. */
  budgetAED: z.number().int().positive().max(100_000_000).optional(),
  hasPets: z.boolean(),
  drives: z.boolean(),
  /** Company name when the person arrived through a founder's team invite. */
  invitedBy: z.string().trim().min(1).max(60).optional(),
  /** The person's name; the app greets them by the first word. */
  name: z.string().trim().min(1).max(60).optional(),
  /** The person's company, for founders. */
  company: z.string().trim().min(1).max(60).optional(),
}).strict();

/** Extra facts that only apply to some move reasons, e.g. Hub71 founders. */
const StepOverrideSchema = z.object({
  reasons: z.array(reason).min(1),
  addPrerequisites: z.array(id).optional(),
  documents: z.array(text).optional(),
  addTips: z.array(text).optional(),
  addWarnings: z.array(text).optional(),
  provider: text.optional(),
  source: z.enum(["hub71_guide", "official"]).optional(),
}).strict();

export const StepSchema = z.object({
  id,
  title: text,
  shortTitle: text.refine((value) => value.split(/\s+/).length <= 3, "Use at most three words"),
  category: z.enum(["before_you_fly", "identity", "visa", "housing", "money", "family", "health", "transport", "hub71", "life"]),
  phase: z.enum(["before", "landing", "settling", "living"]),
  /** "company" steps are Hub71/ADGM steps and only apply to Hub71 founders. */
  lane: z.enum(["company", "personal"]),
  prerequisites: z.array(id),
  appliesIf: z.object({
    household: z.array(household).min(1).optional(),
    minKids: z.number().int().nonnegative().optional(),
    reasons: z.array(reason).min(1).optional(),
    hasPets: z.boolean().optional(),
    drives: z.boolean().optional(),
  }).strict(),
  mustDoBeforeFlying: z.boolean(),
  leadTimeDays: z.number().int().nonnegative().nullable(),
  documents: z.array(text),
  costAED: range.nullable(),
  durationDays: range.nullable(),
  /** One plain sentence on why the step matters, using only facts already in the step's data. */
  why: text.nullable(),
  /** A step worth calling out as the next milestone in the header. */
  milestone: z.boolean().optional(),
  /** Handled by a third party once started (e.g. the ADGM licence via Clara): shown as In progress when ready. */
  thirdParty: z.boolean().optional(),
  /** Plain-language timing from a source, e.g. "Usually 30–60 days". */
  durationLabel: text.nullable(),
  provider: text,
  officialLink: link,
  tips: z.array(text),
  warnings: z.array(text),
  /** Where the step's facts come from. hub71_guide = Hub71's 2026 onboarding guide. */
  source: z.enum(["hub71_guide", "official"]).nullable(),
  overrides: z.array(StepOverrideSchema).optional(),
  ...provenance,
}).strict();

export const CommunitySchema = z.object({
  id, name: text, summary: text, goodFor: z.array(text),
  rentAED: z.object({ "1br": range.nullable(), "2br": range.nullable(), "3br": range.nullable(), villa: range.nullable() }).strict(),
  commuteMinsToMaryah: range.nullable(), listingLink: link, ...provenance,
}).strict();

export const SchoolSchema = z.object({
  id, name: text, curriculum: text, adekRating: text.nullable(), communityId: id,
  feeAED: range.nullable(), website: link, ...provenance,
}).strict();

export const ProviderSchema = z.object({
  id, name: text, category: z.enum(["company_setup", "office", "health", "bank", "housing"]), categoryLabel: text,
  /** Steps where this provider is shown in context. */
  steps: z.array(id),
  /** Placeholder until partners are confirmed. */
  placeholder: z.boolean(),
}).strict();

export type Profile = z.infer<typeof ProfileSchema>;
export type Provider = z.infer<typeof ProviderSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Community = z.infer<typeof CommunitySchema>;
export type School = z.infer<typeof SchoolSchema>;
