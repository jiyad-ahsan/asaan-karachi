# AsaanKarachi — Project Notes

Brand: **AsaanKarachi** ("Easy Karachi" — renamed 2026-07-12 after HandymanPK; chosen for room to expand beyond home services). Domains owned: **asaankarachi.pk** (primary, canonical) and **asaankarachi.com** (redirect). Page titles keep keyword-rich descriptors like "Home Services in Karachi". Logo: `site/logo.svg` (house + bolt, green/gold — name-agnostic).

Positioning: home services directory first; may expand to a broader Karachi directory (restaurants, gyms, catering) later — win the vertical before going horizontal.

## Live site
https://asaankarachi.netlify.app/ (new Netlify site, deployed 2026-07-12 with full rebrand)
Custom domains: https://asaankarachi.pk (primary, DNS propagating) + https://asaankarachi.com (redirect). Canonical/OG URLs point to asaankarachi.pk.
Admin panel: /admin.html (noindex; Supabase Auth gated).
NOTE: old Netlify site handyman-pk.netlify.app should be deleted (stale duplicate of the pre-rebrand build).

## Backend
Supabase project: `karachi-home-services-directory`
Project ref: `qfblxaoudbtgvxmnxgee`
URL: https://qfblxaoudbtgvxmnxgee.supabase.co
Org: Backyard Grill (jxuiunxpafbyvifaasfa)

### Schema
- `areas` — 16 Karachi areas (expanded 2026-07-12): North Nazimabad, Gulshan-e-Iqbal, DHA, Clifton, Gulistan-e-Johar, PECHS, Bahadurabad, Nazimabad, North Karachi, Gulshan-e-Maymar, Malir, Malir Cantt, Korangi, Federal B Area, Saddar, Bahria Town. Citywide providers are tagged to all areas; genuinely local ones (Sajan, Master Services, Junaid) keep limited tags.
- `categories` — Electrician, Plumber, AC/HVAC Technician, Generator Technician, Appliance Repair
- `listings` — service providers. 16 real providers (`is_sample = false`, compiled from public sources July 2026). The original 10 sample entries and their fake reviews were permanently deleted on 2026-07-12.
- `listing_areas` — many-to-many join between listings and areas (a provider can serve multiple areas)
- `reviews` — reviewer_name, rating (1-5), comment, is_verified (currently all open submissions, no verification — that's phase 2)
- `listing_ratings` — view that computes avg_rating and review_count per listing

Row-level security: public can read everything active; public can insert reviews (open review phase). No auth/write access for listings yet — those are admin-seeded via SQL.

The publishable (anon) key is embedded client-side in `site/config.js` — this is expected/safe, it only has the public read/insert permissions defined by RLS above.

## Site files
`/site` — plain HTML/CSS/JS, no build step, no framework. Deploys as-is to any static host.
- `index.html` — browse/filter page
- `listing.html` — provider profile + reviews + review submission form
- `admin.html` — owner admin panel (login required): dashboard stats, listings CRUD with area assignment, suspend/restore/delete, review moderation (verify/delete), change password
- `styles.css`, `app.js`, `config.js` — shared

## Admin panel
URL after deploy: https://handyman-pk.netlify.app/admin.html
Login: jiyad.ahsan29@gmail.com — temp password was shared in chat on 2026-07-12; change it via the panel's Account tab.
Security: Supabase Auth + `admin_users` table + RLS. The `is_admin()` function gates all write policies; the public anon key remains read-only (+ review insert). The page being public is fine — without an admin login every write is rejected by Postgres.
To add another admin later: create the user in Supabase Auth, then `insert into admin_users (user_id) values ('<their-user-id>');`

## To redeploy after edits
Drag the `/site` folder onto https://app.netlify.com/drop, or drag it into the existing project at https://app.netlify.com/projects/karachi-home-services-directory.

## Other files in this folder
- `Directory_Niche_Research.docx` — niche research/comparison that led to picking this idea (local home services vs. global/AI-tool directories, AdSense requirements, monetization models)
- `Phase2_Roadmap.md` — planned next phases: verified reviews (email/phone), serviceman self-service login, job request/accept flow, ID + certification verification, rating tiers
- `Admin_Panel_Plan.md` — plan for an owner admin panel (admin.html + Supabase Auth + RLS): listings CRUD, review moderation, areas/categories management, review flagging, claim requests

## Status as of 2026-07-12
- 16 real Karachi providers inserted (all 5 categories), sample listings suspended. Contact details came from the providers' public websites — worth a quick phone spot-check before heavy marketing.
- Site updates (need a Netlify redeploy of `/site` to go live): dark mode toggle (persists, follows system preference), search box, call/WhatsApp buttons on cards, rating-based sorting, SEO/OG meta tags, mobile tweaks, demo banner replaced with a public-sources disclaimer.
- Admin panel core built (admin.html + auth + RLS policies). Needs the same Netlify redeploy to go live.
- Next steps: redeploy site → change admin temp password → admin panel extras (flagging, claim requests, CSV export per Admin_Panel_Plan.md) → Phase 2 verified reviews.
