# EZ Move — agent brief

## Product
EZ Move is a relocation platform for Hub71 founders and the teams they bring to Abu Dhabi.
Users have already committed to moving, so we don't sell the UAE to them. We help them get settled, then live well.
Core insight: relocation steps depend on each other (Emirates ID unlocks bank, lease, UAE Pass, utilities, family visas), and some steps must be done before leaving home. Most people don't know the order. We show it as an interactive "unlock tree" bubble map, personalised from a very short intake.

## Two phases
1. **Settling in**: the unlock map. Steps in the right order, including what to do before arriving.
2. **Living here**: staying well once settled. Communities, benefits and answers.

## Two new pieces
- **Hub71 benefits track**: what a founder must do to unlock Hub71's full benefits, in order.
- **Team flow**: a founder invites hires, each hire gets their own map, and the founder sees their progress.

## Users
- Hub71 founders, solo or with family
- The hires they relocate, solo or with family
- Professionals with a job offer (still supported, no longer the focus)

## Principles
- Intake takes under 30 seconds: one sentence OR a few tap-chips. Never a long form.
- The bubble map is the product. Everything else is a tooltip or side drawer.
- Deterministic rules decide which steps apply. AI is only used to parse the intake sentence and explain steps, grounded in /data.
- Every data item has sourceUrl and lastVerified. Never invent fees, laws or links. If unknown, use null and show "verify".
- UI copy is short and plain. No hype, no emoji-heavy text.

## Demo branch (michael-demo)
This branch is a demo for a founder design partner.
- Mock data is fine, but label anything illustrative on screen (e.g. "Sample data").
- Never invent official fees, rules, eligibility criteria or deadlines, even in mock data. Use null and show "verify" or link to the official source.
- Mock people, companies and team members must be clearly fictional.

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
