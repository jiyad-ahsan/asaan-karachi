# Admin Panel Plan — Karachi Home Services Directory

A private admin panel so you can manage the directory yourself — no SQL, no Supabase dashboard needed.

## Approach

A single `admin.html` page inside the existing `/site` folder (deployed with the rest of the site, e.g. `handyman-pk.netlify.app/admin.html`). Same stack as the site: plain HTML/JS + Supabase — no server, no framework, no extra hosting cost.

Access control is enforced by the database, not the page. The page being publicly reachable doesn't matter: without an admin login, every write is rejected by Postgres itself.

### How security works

1. **Supabase Auth (email + password)** — you log in with your email. No public signup; the account is created once from the Supabase dashboard.
2. **`admin_users` table** — holds the auth user IDs that count as admins.
3. **RLS policies** — new policies on `listings`, `reviews`, `areas`, `categories`: `update/delete/insert allowed only if auth.uid() is in admin_users`. The public anon key keeps its current read-only (+ review insert) permissions, unchanged.

This means even if someone finds admin.html, they can see the login form and nothing else.

## Features

### 1. Dashboard (landing view)
- Counts: active listings, suspended listings, total reviews, reviews this week
- Latest 10 reviews with quick delete/verify buttons
- Listings with no phone number (flagged for completion)

### 2. Listings management
- Table of all listings (active + suspended + samples) with search and category/area/status filters
- Create new listing (form: name, category, phone, WhatsApp, description, experience, areas)
- Edit any field inline
- Suspend / restore (soft hide — what we used for the sample data)
- Permanent delete (with confirmation, cascades reviews)
- Toggle `is_sample`

### 3. Review moderation
- All reviews across listings, newest first, with listing name
- Delete spam/abusive reviews
- Toggle `is_verified` manually (until Phase 2 OTP verification exists)
- Filter: unverified only / by listing / by rating (e.g. show all 1-star)

### 4. Areas & categories
- Add/rename/delete areas and categories (e.g. expanding to Bahadurabad or adding "Painter")
- Deletion guarded: blocked if listings still reference it

### 5. Recommended additions (not in your list, worth having)
- **Review flagging**: a "Report" button on the public site writes to a `review_flags` table; flagged reviews surface on the dashboard for you to act on
- **Listing claim requests**: "Is this your business?" button on public listings writes to a `claim_requests` table (name, phone, message) — the pipeline for converting scraped listings into engaged providers, and a stepping stone to Phase 3 self-service accounts
- **Audit log**: simple `admin_actions` table recording each admin change — useful once there's more than one admin
- **CSV export**: download listings/reviews as CSV for backup or analysis

## Database changes required

```sql
-- new tables
admin_users (user_id uuid pk references auth.users)
review_flags (id, review_id fk, reason text, created_at)
claim_requests (id, listing_id fk, claimant_name, claimant_phone, message, status, created_at)

-- new RLS policies (existing public policies unchanged)
listings/reviews/areas/categories: insert/update/delete for admin_users members
review_flags: public insert, admin read/delete
claim_requests: public insert, admin read/update
```

## Build order

1. **Core (one session):** auth setup + admin_users + RLS policies + admin.html with login, listings management, review moderation. This alone covers "manage/delete listings and reviews."
2. **Second pass:** dashboard stats, areas/categories management, CSV export.
3. **Third pass:** review flagging + claim requests (adds the public-site buttons too).

Step 1 is the meaningful chunk; 2 and 3 are small increments on top.

## Out of scope (belongs to later phases)

- OTP-verified reviews (Phase 2) — the admin panel's manual verify toggle is the interim tool
- Serviceman self-service logins (Phase 3) — admin panel is owner-only
- Job requests (Phase 4)
