# AsaanKarachi

Community-rated home services directory for Karachi — electricians, plumbers, AC/HVAC, solar, generator technicians and appliance repair, filtered by area.

**Live:** https://asaankarachi.pk (also asaankarachi.com)

## Stack

- `/site` — plain HTML/CSS/JS, no build step. Deployed on Netlify.
- Backend: Supabase (Postgres + RLS). Public anon key in `site/config.js` is intentionally client-side; write access is gated by Row-Level Security.
- `/site/admin.html` — owner admin panel (Supabase Auth).

## Docs

- `PROJECT_NOTES.md` — infrastructure, schema, and status notes
- `Phase2_Roadmap.md` — verified reviews, provider accounts, job requests, tiers
- `Admin_Panel_Plan.md` — admin panel design and build phases

## Deploy

Netlify publishes the `site/` directory. With the repo connected to Netlify, any push to `main` deploys automatically.
