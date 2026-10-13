# EZ Move — agent brief

**Your move. Made easy.**

## Product
EZ Move is for people who have already committed to moving to Abu Dhabi, starting with Hub71 founders and the hires they bring. We don't sell the UAE; we help people get settled, then live well.
Core insight: relocation steps depend on each other (Emirates ID unlocks bank, lease, UAE Pass, utilities, family visas), and some steps must be done before leaving home. Most people don't know the order. We show the right next steps, personalised from a very short intake.

## Two phases
1. **Settling in**: steps in the right order, including what to do before arriving.
2. **Living here**: staying well once settled. Communities, benefits and answers.

## Two lanes
Steps sit in two lanes that depend on each other:
- **Your company**: Hub71 and ADGM steps. Only for Hub71 founders.
- **You and your family**: visas, Emirates ID, housing, banking, schools, health.
Cross-lane dependencies are real (e.g. the founder's visa waits for the company's ADGM licence, and the business bank account waits for the founder's Emirates ID) and must be modelled, not hidden.

## Views
- The default view is a **card dashboard**: what to do now, what's next, and what's done, per lane.
- The bubble map stays as a secondary view called **"See how it connects"**.

## Team flow
A founder invites hires, each hire gets their own plan, and the founder sees their progress (sample data until there is a backend).

## Users
- Hub71 founders, solo or with family
- The hires they relocate, solo or with family
- Professionals with a job offer (still supported, not the focus)

## Principles
- Intake takes under 30 seconds: one sentence OR a few tap-chips. Never a long form.
- The dashboard is the product. Details open in a side drawer.
- Deterministic rules decide which steps apply. AI is only used to parse the intake sentence and explain steps, grounded in /data.
- Every data item has sourceUrl and lastVerified. Never invent fees, timings, laws, rules or links. If unknown, use null and show "Check with Hub71" (Hub71 steps) or "Verify" (everything else).
- Facts taken from Hub71's own onboarding guide are labelled "From Hub71's onboarding guide" on screen.
- Mock or sample data is labelled as such on screen.
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
