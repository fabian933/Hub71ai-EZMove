import { Bot, CreditCard, House, Layers, ListChecks, MapPinned, MessageSquareText, Palette, Plug, Store, Users, Workflow, type LucideIcon } from "lucide-react";

export const DEMO_MAILTO = "mailto:?subject=EZ%20Move%20demo";

export const teamCards = [
  { title: "Every step in one view", text: "Clara, ADGM licence, visas, bank accounts and incentives, tracked per founder." },
  { title: "Works with your partners", text: "Clara, banks and housing providers stay as they are. EZ Move sits on top." },
  { title: "Fewer 'what's next?' messages", text: "Founders get next steps and answers in the app. Your team handles the exceptions." },
  { title: "Numbers you can report", text: "Days to licence, days to Emirates ID, incentives unlocked, founders still on the ground." },
];

export const employeeCards = [
  { title: "One plan, start to finish", text: "Company and personal steps together, in the order they really happen." },
  { title: "Always know where you stand", text: "Every step shows done, to do, or what it's waiting on." },
  { title: "Built for your move", text: "Your nationality, family and move date shape the plan." },
  { title: "Help when you need it", text: "An assistant that answers from Hub71's guide and official sources." },
];

export const partnerTiles: { icon: LucideIcon; title: string; text: string; soon?: boolean }[] = [
  { icon: Workflow, title: "Connects your partners", text: "Clara, banks and housing providers feed one timeline." },
  { icon: MessageSquareText, title: "Less manual chasing", text: "Status updates in one place, not across email and WhatsApp." },
  { icon: Palette, title: "Your brand", text: "Run it under your programme's name.", soon: true },
];

export const features: { icon: LucideIcon; name: string; soon?: boolean }[] = [
  { icon: ListChecks, name: "Checklists" },
  { icon: House, name: "Home finding" },
  { icon: MapPinned, name: "Neighbourhood guides" },
  { icon: Bot, name: "AI assistant" },
  { icon: Store, name: "Marketplace" },
  { icon: Users, name: "Community" },
  { icon: Plug, name: "Partner connections" },
  { icon: CreditCard, name: "Payments", soon: true },
  { icon: Layers, name: "White-label", soon: true },
];
