# Show Signup — PPEC

A compact event sign-up tool for the Phantom Peak Explorers Club, from **09:00 to midnight (UK time)**.

- PPEC logo with purple, gold and cream branding.
- Expandable **9am–2pm**, **2pm–7pm** and **7pm–midnight** sections.
- Available and taken half-hour slots, with counts in each section.
- Contributors enter their name/handle, show name and premise, then select 30 or 60 minutes.
- Everyone sees the shared schedule; it refreshes every 15 seconds.
- Atomic database writes prevent overlapping bookings.
- Contributors can withdraw bookings from the browser they used to submit.

## Deployment status

The source is uploaded here. **A live public event site has not been deployed.** This app uses a Cloudflare Worker and D1 database. GitHub Pages alone cannot execute the database API. Hosting and the shared database must be connected before collecting real sign-ups. No event date was supplied; the schedule represents one event day.

## Development

Requires Node 22.13+ and npm.

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_magenta_carnage.sql
npm run dev
```

Run the migration once per local database, then use the URL printed by the development server. Local D1 data is separate from production.

## Hosting

The logical database binding is `DB`. Provision a production Cloudflare D1 database, apply the SQL migration in `drizzle/`, and deploy the built Worker with that database binding. The Vite setup uses a placeholder database identifier for local development; replace it with the host-provided production binding before deploying. `.openai/hosting.json` intentionally contains no staging project identity.

## Main files

- `app/page.tsx` — schedule, sections and sign-up form.
- `app/globals.css` — compact PPEC styling.
- `app/api/shows/route.ts` — shared schedule API and booking validation.
- `db/schema.ts` and `drizzle/` — database schema and migration.

## Verification

TypeScript checks and production build passed. In the local browser, a 60-minute booking persisted after reload, occupied both half-hours, disappeared from available start times and was successfully withdrawn.

## Booking ownership

The withdrawal token is stored locally on the contributor's browser; clearing browser storage loses that browser's withdrawal ability. The schedule's names and show details are public to site visitors.
