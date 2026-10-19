# Wishnest — Vercel migration

## Preserved product

Existing wishlist and celebration UI, colors, CSS, artwork, homepage, guest gift finder, owner budget-balance tool, demo, filters, and form layout remain intact. Header authentication controls and sign-in/up pages are the only required new UI surfaces. Minor framework lint/hydration fixes do not alter presentation.

## Infrastructure implemented

- Standard Next.js 16.3.8 / React 19.2.9, Node 22.x.
- Lazy Neon HTTP client and versioned SQL migrations; bigint millisecond timestamps.
- Private Blob image proxy and database-backed ownership.
- Clerk session authentication, protected owner dashboard and server-side checks.
- Strict request origin validation, bounded request bodies, generic errors and security headers.
- Atomic reservations, owner updates and pauses; transaction-serialized ten-hold limit.
- PGlite API/reservation/privacy/photo tests and a credential-dependent localhost HTTP runner.

## Verification

20 tests pass, including PostgreSQL API/reservation/privacy/photo checks, migration repeatability/checksum/rollback checks, and the Neon HTTP batch transport contract. TypeScript is clean; lint has zero errors and four retained presentation/performance warnings. The anonymous localhost HTTP smoke test passes. The production dependency audit is recorded in the PR.

The standard local Turbopack build is blocked by this host's process/port permissions. A webpack production build succeeds and produces the route manifest; this is a diagnostic only and the checked-in build command remains `next build`. Local checks use the available Node 26 runtime. A clean Node 22 default-build verification remains pending. No credential-dependent verification is claimed.

## Pending before launch

- Configure Neon, private Blob, Clerk and run migrations against the intended fresh database.
- Real sign-up/sign-in, database, photo storage and cookie testing with deployed credentials.
- Vercel Preview Origin/proxy checks, two-guest browser flow and physical-device/cross-browser acceptance.
- Verify a clean install and the default production build on Node 22 in Vercel Preview or CI. The connected GitHub token lacks workflow-write scope, so no Actions workflow has been added.

The user explicitly required zero legacy-platform names even in lockfile metadata. The ORM and its migration generator were therefore replaced by direct parameterized Neon queries and checksummed SQL migrations. Dependency manifests meet the literal zero-name requirement; see README for the approved stack adjustment.

Existing product limitations remain: no independent purchase verification, payments, email reminders/recovery, automatic product metadata import, invite-only lists, co-owners, or full production abuse/storage-quota controls.
