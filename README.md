# EZ Move

A personalised relocation roadmap for people, families and Hub71 founders moving to Abu Dhabi.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm install
cp .env.example .env.local
npm run dev
```

The intake is at `/`. Choose chips, use a demo or describe your move in one sentence. Set `OPENAI_API_KEY` and `OPENAI_MODEL` on Vercel to enable sentence parsing with the Responses API and Zod structured outputs. If either setting is missing or parsing fails, the intake falls back to chips. Unmentioned details retain the visible chip values, which you can review before building the map.

```sh
npm run build
npm start
```

## Data layer

- `lib/schema.ts`: strict Zod schemas and exported Profile, Step, Community and School types. ISO2 nationalities use uppercase codes; step household conditions are arrays. Source metadata follows `AGENTS.md`.
- `lib/data.ts`: loads JSON, validates schemas, unique IDs, prerequisite references, cycles, the settled milestone and school/community references. Invalid data fails the build when `/map` is generated.
- `data/steps.json`: the requested dependency graph. All unverified costs, durations, lead times, URLs and verification dates are `null`. Documents and tips are empty until sourced. This graph is a planning model and has not been verified as immigration guidance.
- `data/communities.json` and `data/schools.json`: supplied records, with the requested ID, array and unknown commute fixes. No other data values were changed. Hyphenated IDs are accepted. Missing `lastVerified` is accepted without inserting a date into the supplied data.

## Engine

```ts
import { personalise, getState, downstreamUnlockCounts, criticalPath, doByDates,
  loadCompletedIds, saveCompletedIds } from "@/lib/engine";
import type { Profile } from "@/lib/schema";

const profile: Profile = {
  nationality: "GB", household: "solo", kids: 0, reason: "job",
  moveMonth: "2027-03", budgetBand: "mid", hasPets: false, drives: false,
};
const roadmap = personalise(profile);
const completed = loadCompletedIds();
const state = getState(roadmap[0], completed);
const counts = downstreamUnlockCounts(roadmap, completed);
const path = criticalPath(roadmap, completed);
const deadlines = doByDates(profile, roadmap);
completed.add(roadmap[0].id);
saveCompletedIds(completed);
```

Personalisation removes non-applicable steps and their prerequisite edges, including school enrolment from the settled milestone where it does not apply. Dependant ID shares the family-visa household condition. General entry permits remain for every reason; the founder prerequisite only remains for Hub71 founders.

`getState` uses explicitly completed IDs. Descendant counts include all unique unfinished downstream steps, including the milestone; they do not imply that one completion satisfies other prerequisites. `criticalPath` returns the longest remaining chain by number of steps, including the settled milestone, with ties resolved in JSON prerequisite order. It is a structural path rather than a time estimate because durations are unverified. Parallel branches are still required.

Before-fly deadlines use the first day of `moveMonth` in UTC minus `leadTimeDays`, with a 30-day planning default for null lead times. They are planning reminders, not verified legal deadlines.

The fullscreen `/map?p=<base64url profile>` is an SVG force graph using d3-force and framer-motion. Drag to pan, scroll or pinch to zoom, or use the zoom and fit buttons. On the map canvas, arrow keys pan, +/- zoom and 0 fits the visible steps; each bubble is keyboard accessible. Phase filters focus their steps. Hover highlights descendants; the drawer shows prerequisite and downstream steps, provider details and source links. Housing and school steps expose the supplied records; all rent displays use only `min`, as `from AED X/yr`.

The Critical path toggle shows the longest remaining dependency chain. Progress to Settled counts all required ancestors, including parallel branches; completing the final required ancestor automatically completes the milestone.

Progress is stored under `ezmove.completed.v1`. Storage helpers are safe during server rendering, discard unknown IDs and malformed storage, and accept an optional storage adapter. Saving returns false if storage is unavailable. The map loads and saves through these helpers; if browser storage is unavailable, progress remains in memory for the visit.

`npm run build` uses Next.js’s supported webpack builder for compatibility with environments that block Turbopack local ports. Tests remain omitted as requested.
