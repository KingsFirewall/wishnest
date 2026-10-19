# Wishnest — build status

## Stack

Next.js 16.3.8 / React 19.2.9 on Vercel (Node 22.x). Supabase Postgres via the transaction pooler (`postgres` driver, bound parameters, checksummed SQL migrations), Supabase Auth (passwordless email link, verified with `getClaims()`), and a private Supabase Storage bucket served only through `/api/images/<uuid>`.

## Verified

- `npm test`: 20 tests pass, including the API against real Postgres (PGlite), atomic reservations, privacy, photo access, migrations, and RLS on every table.
- `npx tsc --noEmit` clean; `npm run lint` 0 errors (4 pre-existing image warnings); `npm run build` succeeds.
- Supabase project `wishnest` (us-east-1): schema and RLS applied, migration history recorded, private `wish-photos` bucket created, security advisor shows only the expected "RLS enabled, no policy" notices.

## Pending before launch

- Add environment variables in Vercel; set Supabase Auth redirect URLs and custom SMTP.
- Live test: sign in → create list → photo + link → guest reserve/extend/purchase/release in two browsers → owner sees "handled" → private list and photo return 404.

Known product limits: no purchase verification, payments, reminders, co-owners or invite-only lists; no per-user upload quota or IP-based reservation limits.
