# Phase 2 Roadmap — Karachi Home Services Directory

Phase 1 (live now): browsable directory, area + category tagging, open reviews (name + rating + comment, no verification).

## Phase 2 — Trust & verification
- **Verified reviews**: require email or phone OTP before a review posts. Add `is_verified` flag (already in schema) and show a "Verified" badge — this field already exists in the `reviews` table, so this is UI + an OTP flow, not a schema change.
- **Business claim flow**: let a real service provider claim their existing sample/placeholder listing by verifying phone ownership.

## Phase 3 — Serviceman self-service accounts
- Auth (Supabase Auth: phone or email) for servicemen to log in and manage their own profile: photo, bio, service areas, pricing notes.
- Add `provider_id` (auth user) to `listings`, replacing the current admin-seeded model.

## Phase 4 — Job requests
- New `job_requests` table: customer posts a request (category, area, description, contact), servicemen in that area/category get notified, one accepts.
- Status flow: `open → accepted → completed/cancelled`.
- This is the leads-marketplace layer — the highest-monetization piece per the earlier niche research (lead gen / SaaS listing fees).

## Phase 5 — Identity & certification verification
- ID verification (CNIC) before a serviceman account goes live — manual review to start, automate later.
- Certification uploads (trade certificates, licenses) attached to a profile, shown as verified badges after admin review.
- New tables: `provider_documents` (id type, file ref, verified_at), `provider_certifications`.

## Phase 6 — Tiers & ranking
- Rating-based tiers (e.g. Bronze/Silver/Gold or Verified Pro) driven by: review count, average rating, completed job count, ID/certification status.
- Tiers affect search ranking and can later be tied to a paid "featured" placement — the direct monetization path identified in the niche research (paid listings outperform pure AdSense for local traffic).

## Suggested build order
1. Verified reviews (small — OTP + UI)
2. Serviceman login + profile self-editing
3. Job requests (the real marketplace mechanic)
4. ID/certification verification
5. Tiers + featured placement (monetization)

Each phase builds on the current schema without breaking it — `is_verified` on reviews and `status` on listings are already in place for exactly this purpose.
