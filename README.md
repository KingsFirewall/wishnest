# Wishnest

Gift wishlists for celebrations, built with Next.js 16.3.8, React 19.2.9, TypeScript, Neon Postgres over HTTP, Clerk, and private Vercel Blob storage. The existing design, illustrations, wishlist tools and reservation behaviour are preserved.

## Local setup

Use Node **22.x** (22.18+ recommended for stable native TypeScript stripping in tests).

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local`. Keep secrets out of Git and chat.
3. Configure a Clerk development instance, a development Postgres database, and a **private** Blob store. Use separate development/preview resources, not production data.
4. Run `npm run db:migrate` against that development database.
5. Run `npm run dev -- --hostname 127.0.0.1`, then open http://127.0.0.1:3000.

The public homepage and sample can render before credentials are configured. Sign-in then shows an explicit setup notice; owner access stays closed. No mock identity or insecure fallback is enabled.

## Environment variables

| Variable | Purpose |
| --- | --- |
| DATABASE_URL | Neon Postgres connection URL, preferably the pooled endpoint |
| BLOB_READ_WRITE_TOKEN | Token for a **private** Vercel Blob store |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk application's publishable key |
| CLERK_SECRET_KEY | Matching Clerk application's secret key; server only |
| NEXT_PUBLIC_CLERK_SIGN_IN_URL | /sign-in |
| NEXT_PUBLIC_CLERK_SIGN_UP_URL | /sign-up |

Set the two Clerk URL variables as shown. Configure Clerk's permitted domains/redirects for local development, Preview and Production. Redeploy after changing public environment variables because they are included at build time.

## Vercel setup

1. Import the GitHub repository. Choose Framework Preset **Next.js** and Node **22.x**. Clear earlier build/install/output overrides; leave all three at their defaults. Build is `next build`, output is `.next/`.
2. Storage → add **Neon Postgres** from the Marketplace and connect it to the project. Confirm `DATABASE_URL` is available.
3. Storage → create a **Blob** store with **private** access and connect it. Confirm `BLOB_READ_WRITE_TOKEN` is available. Do not substitute a public store.
4. Add Clerk keys and sign-in/sign-up URL variables for Production and Preview. Use a Clerk development instance for testing. Consider separate preview database/storage resources.
5. Run `npm run db:migrate` once with the intended production `DATABASE_URL` before opening the app. The command loads `.env.local` using the framework's environment loader. Double-check the target database first.
6. Deploy the branch as a preview, finish the acceptance checks below, then review/merge the PR. Do not open guest access until these checks pass.

Migrations are deliberately **not** in the build command: automatically migrating on every preview build can accidentally mutate shared production data and race other deployments. If adding automation later, run a separately authorized migration step against the correct database/environment.

The schema source of truth is `db/migrations/*.sql`. Add a new, monotonically numbered file such as `0001_descriptive_name.sql` for each schema change; never modify an applied file. There is no ORM schema generator. The runner takes an advisory lock and applies the ordered migration set and checksum history in one transaction. A failed statement or changed checksum rolls back the batch. SQL files are trusted developer-owned DDL, not user-provided content. Test the committed migration set with `npm test` before applying it. Existing databases are not upgraded from the old schema.

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
- Set `WISHNEST_TEST_SESSION_TOKEN` in your shell to a **short-lived Clerk session JWT for a disposable development user**, then run `node tests/api-smoke.mjs`. Configure all service credentials first. A Clerk bot-protection testing token alone is **not** an authenticated session.
- Optional `WISHNEST_TEST_ORIGIN` defaults to http://127.0.0.1:3000. The runner refuses remote hosts, credentials embedded in URLs, non-HTTP schemes and redirects. It creates explicitly named test lists/photos; use disposable development resources.

Manual/preview acceptance still required: sign up → create list → add photo and HTTPS link → anonymous guest reserve/extend/purchase/release → second-guest conflict → owner masked state → private list and photo 404s. Check actual Vercel request origins and Secure cookies behind its proxy, plus the configured Clerk sign-in/sign-out flow. In-process tests do not prove deployed service configuration.

## Security and data

- Mutations require an Origin exactly equal to `new URL(request.url).origin`; missing Origin is rejected. Forwarded headers cannot override this decision.
- Guest cookies are HttpOnly/SameSite=Lax, last 90 days, and are Secure on Vercel, HTTPS and production. Only SHA-256 hashes enter the database; JSON never returns the raw credential.
- Reservation transitions and owner edits/pauses use conditional SQL updates. A Neon HTTP transactional batch acquires a per-guest advisory lock before the conditional reservation update. Explicit read-committed isolation gives the update a fresh snapshot after acquiring the lock, protecting the ten-active-hold limit across concurrent requests. The cap is part of the UPDATE, not a JavaScript read-then-write.
- Recipients cannot reserve their own gifts. Reservation identity/timing is masked in owner/other-guest serializers.
- Private events are 404 to non-owners. An unlisted UUID link is not invitation authentication.
- Photos use random keys in a private Blob store. The database records ownership. The API checks access **before** retrieving bytes and streams them with private/no-store and nosniff headers. It never exposes raw storage URLs.
- HTTPS-only links without embedded credentials; Zod input validation; 12,000-byte JSON cap and 2,000,000-byte photo cap checked against headers and streamed byte counts; JPEG/PNG/WebP signatures checked.
- Client errors are generic. Database exceptions, connection strings and credentials are not returned or logged.
- No payment or independent purchase-verification integration is implemented. “Purchased” remains self-confirmed.

## Migration history and dependency note

This replaces the Cloudflare/vinext/ChatGPT Sites starter. The old build, Worker bindings, connectors and trusted `oai-authenticated-*` header path have been removed. This is a **fresh database**: old ChatGPT owner IDs are not Clerk user IDs, and no existing data/photos are being migrated.

The user's follow-up requires **literal zero Cloudflare names in dependencies and the lockfile**, including optional metadata. Therefore both node-postgres (which includes `pg-cloudflare`) and Drizzle (which declares an optional `@cloudflare/workers-types` peer) have been removed. The approved infrastructure adjustment uses Neon's HTTP driver directly, bound SQL parameters, and versioned SQL migrations. No upstream metadata is patched or hidden. `package.json` and `package-lock.json` contain zero Cloudflare, Vinext or Wrangler names.

Reference documentation: [Clerk middleware](https://clerk.com/docs/reference/nextjs/clerk-middleware), [private Blob storage](https://vercel.com/docs/vercel-blob/private-storage), [Neon transactional HTTP queries](https://neon.com/docs/serverless/serverless-driver).
