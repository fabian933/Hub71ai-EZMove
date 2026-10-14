import { Baby, Banknote, BookOpenCheck, Building2, Car, FileSignature, HeartPulse, House, IdCard, Landmark, Plane, ShieldCheck, Smartphone, Stamp, Users, type LucideIcon } from "lucide-react";
import type { Step } from "@/lib/schema";

const byCategory: Record<Step["category"], LucideIcon> = {
  before_you_fly: Stamp, identity: IdCard, visa: Plane, housing: House, money: Banknote,
  family: Users, health: HeartPulse, transport: Car, hub71: Building2, life: BookOpenCheck,
};
const byId: Record<string, LucideIcon> = {
  acceptance_letter: FileSignature, adgm_licence: Landmark, business_bank_account: Banknote, safe_signing: FileSignature,
  uae_mobile_number: Smartphone, school_enrolment: Baby, school_records: Baby, settled: ShieldCheck,
};

export const stepIcon = (step: Step): LucideIcon => byId[step.id] ?? byCategory[step.category];
