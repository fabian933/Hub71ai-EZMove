import { z } from "zod";

export const iso2Codes = new Set(
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" "),
);
const text = z.string().trim().min(1);
const id = text.regex(/^[a-z][a-z0-9_-]*$/);
const household = z.enum(["solo", "couple", "family"]);
const reason = z.enum(["job", "hub71_founder", "own_business"]);
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
  budgetBand: z.enum(["low", "mid", "high"]),
  hasPets: z.boolean(),
  drives: z.boolean(),
}).strict();

export const StepSchema = z.object({
  id,
  title: text,
  shortTitle: text.refine((value) => value.split(/\s+/).length <= 3, "Use at most three words"),
  category: z.enum(["before_you_fly", "identity", "visa", "housing", "money", "family", "health", "transport", "hub71", "life"]),
  phase: z.enum(["before", "landing", "settling", "living"]),
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
  provider: text,
  officialLink: link,
  tips: z.array(text),
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

export type Profile = z.infer<typeof ProfileSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Community = z.infer<typeof CommunitySchema>;
export type School = z.infer<typeof SchoolSchema>;
