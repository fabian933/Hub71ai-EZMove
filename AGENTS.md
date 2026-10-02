# EZ Move — agent brief

## Product
EZ Move is a relocation roadmap for people, families and Hub71 founders moving to Abu Dhabi.
Core insight: relocation steps depend on each other (Emirates ID unlocks bank, lease, UAE Pass, utilities, family visas), and some steps must be done before leaving home. Most people don't know the order. We show it as an interactive "unlock tree" bubble map, personalised from a very short intake.

## Users
- Professionals with a job offer, solo or with family
- Hub71 founders, and the hires they relocate

## Principles
- Intake takes under 30 seconds: one sentence OR a few tap-chips. Never a long form.
- The bubble map is the product. Everything else is a tooltip or side drawer.
- Deterministic rules decide which steps apply. AI is only used to parse the intake sentence and explain steps, grounded in /data.
- Every data item has sourceUrl and lastVerified. Never invent fees, laws or links. If unknown, use null and show "verify".
- UI copy is short and plain. No hype, no emoji-heavy text.

## Stack
Next.js (App Router), TypeScript, Tailwind, d3-force, framer-motion, zod.
OpenAI via the official `openai` npm package (Responses API, structured outputs), model from env OPENAI_MODEL.
Deployed on Vercel. No database: data lives in /data/*.json, user progress in localStorage, profile shareable via URL param.

## Structure
/data        steps.json, communities.json, schools.json, realestate.json, nationalities.json
/lib         schema.ts (zod), engine.ts (personalisation + unlock logic), profile.ts
/app         page.tsx (intake), map/page.tsx (bubble map), api/parse-profile, api/ask
/components  Intake, BubbleMap, NodeDrawer, etc.

## Done means
`npm run build` passes, no TypeScript errors, works at 390px mobile width.
