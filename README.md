# Wishnest

Gift wishlists for celebrations, built with Next.js 16.3.8, React 19.2.9 and TypeScript on Vercel, with **Supabase** for Postgres, sign-in (passwordless email links) and private photo storage.

## Local setup

Use Node **22.x**.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and fill it in. Keep secrets out of Git and chat.
3. Run `npm run db:migrate` against a development database.
4. Run `npm run dev`, then open http://localhost:3000.

The public homepage and sample render without credentials. Sign-in then shows a setup notice and owner access stays closed. There is no mock identity or insecure fallback.

## Environment variables

| Variable | Where to find it | Exposure |
| --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Supabase → Project Settings → Data API | Public |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Supabase → Project Settings → API Keys (`sb_publishable_…`) | Public |
| SUPABASE_SECRET_KEY | Supabase → Project Settings → API Keys (`sb_secret_…`) | **Server only** |
| DATABASE_URL | Supabase → Connect → **Transaction pooler** (port 6543) | **Server only** |

`NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (names set by Supabase's Vercel integration) are accepted as fallbacks. Redeploy after changing public variables because they are built into the page.

## Supabase setup

1. **Schema:** run `npm run db:migrate` once with the production `DATABASE_URL`. Migration `0001` turns on row level security with no policies, so Supabase's public Data API can never read or change app tables. The server connects as the table owner, which RLS does not restrict.
2. **Photo bucket:** create a **private** Storage bucket named `wish-photos` (2 MB limit; `image/jpeg`, `image/png`, `image/webp`) with **no** policies. Only the server, using the secret key, can read it.
3. **Auth → URL Configuration:** set Site URL to the production domain and add `https://<your-domain>/auth/confirm`, `https://*-<your-team>.vercel.app/auth/confirm` and `http://localhost:3000/auth/confirm` as redirect URLs.
4. **Auth → SMTP:** configure a custom SMTP provider (for example Resend or Postmark). Supabase's built-in email only reaches your own team's addresses and is heavily rate limited, so real users would not get sign-in links without this.

## Vercel setup

1. Import the GitHub repository with Framework Preset **Next.js** and Node **22.x**. Leave the build, install and output settings at their defaults.
2. Add the four environment variables above for Production and Preview.
3. Deploy, then test the full flow (below) before sharing the site.

Migrations are deliberately **not** part of the build, so preview builds can never change production data.

The schema source of truth is `db/migrations/*.sql`. Add a new, numbered file for each change and never edit an applied one. The runner takes an advisory lock and applies pending files plus checksum history in one transaction.

## Development commands

- `npm run dev`: local Next.js server.
- `npm run build` / `npm start`: production compilation and local production server.
- `npm run lint`: lint; existing image/navigation performance warnings are retained to avoid changing presentation.
- `npm test`: in-process PostgreSQL/PGlite tests; no external services required.
- `npx tsc --noEmit`: types.
- `npm run db:migrate`: apply committed migrations to DATABASE_URL.
- `npm audit --omit=dev`: audit deployed dependencies.

## Verification

The in-process tests run the actual API handler against the generated Postgres schema with injected test-only identity and storage adapters. The deployed route always imports the real adapters. There is no environment flag, request header, or URL that enables mocked authentication.

For HTTP smoke tests against `next dev`:

- `node tests/api-smoke.mjs --public-only` verifies public rendering, anonymous access rejection, strict Origin checks, legacy identity-header rejection and security headers without credentials.
- Sign in as a **disposable development user**, copy its `sb-<ref>-auth-token` cookie as `name=value` into `WISHNEST_TEST_AUTH_COOKIE`, then run `node tests/api-smoke.mjs`.
- Optional `WISHNEST_TEST_ORIGIN` defaults to http://127.0.0.1:3000. The runner refuses remote hosts, credentials embedded in URLs, non-HTTP schemes and redirects. It creates explicitly named test lists/photos; use disposable development resources.

Manual/preview acceptance still required: sign up → create list → add photo and HTTPS link → anonymous guest reserve/extend/purchase/release → second-guest conflict → owner masked state → private list and photo 404s. Check actual Vercel request origins and Secure cookies behind its proxy, plus the emailed sign-in link and sign-out. In-process tests do not prove deployed service configuration.

## Security and data

- Mutations require an Origin exactly equal to `new URL(request.url).origin`; missing Origin is rejected. Forwarded headers cannot override this decision.
- Guest cookies are HttpOnly/SameSite=Lax, last 90 days, and are Secure on Vercel, HTTPS and production. Only SHA-256 hashes enter the database; JSON never returns the raw credential.
- Reservation transitions and owner edits/pauses use conditional SQL updates. A transactional batch acquires a per-guest advisory lock before the conditional reservation update. Explicit read-committed isolation gives the update a fresh snapshot after acquiring the lock, protecting the ten-active-hold limit across concurrent requests. The cap is part of the UPDATE, not a JavaScript read-then-write.
- Recipients cannot reserve their own gifts. Reservation identity/timing is masked in owner/other-guest serializers.
- Private events are 404 to non-owners. An unlisted UUID link is not invitation authentication.
- Photos use random keys in a private Supabase Storage bucket with no access policies. The database records ownership. The API checks access **before** retrieving bytes and streams them with private/no-store and nosniff headers. It never exposes raw storage URLs.
- HTTPS-only links without embedded credentials; Zod input validation; 12,000-byte JSON cap and 2,000,000-byte photo cap checked against headers and streamed byte counts; JPEG/PNG/WebP signatures checked.
- Client errors are generic. Database exceptions, connection strings and credentials are not returned or logged.
- No payment or independent purchase-verification integration is implemented. “Purchased” remains self-confirmed.

## Migration history

This replaced the Cloudflare/vinext/ChatGPT Sites starter, then the interim Clerk/Neon/Vercel Blob setup, with Supabase. Each switch is a **fresh database**: earlier owner IDs are not Supabase user IDs, and no data or photos were carried over. Dependency manifests contain no Cloudflare, vinext or Wrangler packages.

Reference: [Supabase server-side auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs), [connection pooling](https://supabase.com/docs/guides/database/connecting-to-postgres), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).
