import { Bot, CreditCard, House, Layers, ListChecks, MapPinned, MessageSquareText, Palette, Plug, Store, Users, Workflow, type LucideIcon } from "lucide-react";

export const DEMO_HREF = "/contact";

export const teamCards = [
  { title: "Every step in one view", text: "Clara, ADGM licence, visas, bank accounts and benefits, tracked per person." },
  { title: "Works with your partners", text: "Clara, banks and housing providers stay as they are. EZ Move sits on top." },
  { title: "Fewer 'what's next?' messages", text: "Employees get next steps and answers in the app. Your team handles the exceptions." },
  { title: "Numbers you can report", text: "Days to licence, days to Emirates ID, benefits used, people still on the ground." },
];

export const employeeCards = [
  { title: "One plan, start to finish", text: "Company and personal steps together, in the order they really happen." },
  { title: "Always know where you stand", text: "Every step shows done, to do, or what it's waiting on." },
  { title: "Built for your move", text: "Your nationality, family and move date shape the plan." },
  { title: "Help when you need it", text: "An assistant that answers from your company's guide and official sources." },
];

export const partnerTiles: { icon: LucideIcon; title: string; text: string; soon?: boolean }[] = [
  { icon: Workflow, title: "Connects your partners", text: "Clara, banks and housing providers feed one timeline." },
  { icon: MessageSquareText, title: "Less manual chasing", text: "Status updates in one place, not across email and WhatsApp." },
  { icon: Palette, title: "Your brand", text: "Run it under your company's name.", soon: true },
];

export type FeatureVisual = "checklist" | "homes" | "guides" | "assistant" | "marketplace" | "community" | "partners";
export const features: { icon: LucideIcon; name: string; text: string; visual?: FeatureVisual; soon?: boolean }[] = [
  { icon: ListChecks, name: "Checklists", text: "Every step of the move, in the order it really happens.", visual: "checklist" },
  { icon: House, name: "Home finding", text: "Homes matched to your budget and the areas that suit you.", visual: "homes" },
  { icon: MapPinned, name: "Neighbourhood guides", text: "Areas, schools and getting around, in one guide.", visual: "guides" },
  { icon: Bot, name: "AI assistant", text: "Answers from your company's guide and official sources.", visual: "assistant" },
  { icon: Store, name: "Marketplace", text: "The providers your company already covers, in one place.", visual: "marketplace" },
  { icon: Users, name: "Community", text: "Groups for people who have just arrived.", visual: "community" },
  { icon: Plug, name: "Partner connections", text: "Partners feed one timeline, so the next step is always clear.", visual: "partners" },
  { icon: CreditCard, name: "Payments", text: "Relocation costs paid and tracked in one place.", soon: true },
  { icon: Layers, name: "White-label", text: "Run it under your company's name.", soon: true },
];
