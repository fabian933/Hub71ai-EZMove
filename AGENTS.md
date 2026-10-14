# EZ Move — agent brief (v2)

**Your move. Made easy.**

## Product
EZ Move is a relocation platform with two sides:
- **Employer side (`/team`)**: HR and mobility teams, starting with Hub71's operations team. They see every employee's move in one place.
- **Employee side (`/app`)**: the founder or hire making the move. Phone-first web.
- Plus a **marketing site (`/`)**.

The positioning is enterprise mobility. Hub71 is the first customer.

## Copy
- Marketing and UI copy stays company-generic: speak to companies and their employees. No "Hub71", "cohort", "programme" or founder-only wording in the marketing site or shared UI.
- Keep UAE process terms: Clara, ADGM, licence, visa, Emirates ID, TAMM.
- Hub71-specific facts live only in the data (e.g. `source: "hub71_guide"` steps and the company lane), and are shown only when a profile belongs to that company.

## Design rules
- Calm and clear. One idea per screen section. Short copy: one sentence per item at most, no paragraphs inside the app.
- Every screen must answer "what do I do next?" within 5 seconds.
- Status is always one of: **Done** / **In progress** / **Waiting on [X]**, shown as a small pill.
- Colours, as CSS variables:
  - `--green: #236A59` (primary, buttons, headers)
  - `--mint: #B0FFEB` (highlights, icon tiles)
  - `--cream: #F8F2EA` and `--white: #FEFEFE` (backgrounds)
  - `--navy: #0D498B` and `--blue-light: #E9F3FF` (employee-side accents)
  - `--coral: #FF6144` (status and alerts only)
  - `--grey: #ECE6E8` (borders, muted)
- No purple, no gradients, no heavy shadows.
- Fonts: Manrope for headings, Inter for body, from Google Fonts.
- Icons: one outline icon set (lucide-react).

## Data rules
- All steps, fees, documents, timings, links and rules come from `/data/*.json`. Never invent facts. If unknown, use null and show **"Check with Hub71"** (company-lane, Hub71 steps) or **"Verify"** (everything else).
- Facts from Hub71's 2026 onboarding guide are labelled **"From Hub71's onboarding guide"** (`source: "hub71_guide"`). Official-source facts use `source: "official"`.
- Every data item has `sourceUrl` and `lastVerified` (null when unknown).
- Anything illustrative or sample is labelled as such on screen.
- Deterministic rules decide which steps apply. AI is only used to parse the intake sentence and explain steps, grounded in `/data`.

## Steps data and engine
- `data/steps.json`, validated by `lib/schema.ts` (zod). Each step has a `lane` (`company`: Hub71 and ADGM, only for `hub71_founder`; `personal`: you and your family), a `phase` (before, landing, settling, living), `prerequisites`, `why`, `warnings`, `durationLabel`, `source`, optional `milestone`, and per-reason `overrides`.
- Lanes depend on each other (e.g. the founder's visa waits for the ADGM licence; the business bank account waits for the Emirates ID).
- `lib/engine.ts` personalises the steps for a profile and works out state (done / available / locked), do-by dates and next steps. `lib/dashboard.ts` orders lanes and picks next steps and milestones.
- `npm run check:graph` checks ids, edges, cycles, phase order and lane rules. Run it after any data change.

## Stack
Next.js (App Router), TypeScript, Tailwind, d3-force, framer-motion, zod, lucide-react.
OpenAI via the official `openai` npm package (Responses API, structured outputs), model from env OPENAI_MODEL.
Deployed on Vercel. No database: data lives in /data/*.json, user progress in localStorage, profile shareable via URL param.

## Done means
`npm run check:graph` and `npm run build` pass, no TypeScript errors, works at 390px mobile width.
