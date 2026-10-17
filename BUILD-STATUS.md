# Wishnest — Redesigned early-access release

This implementation starts the product described in PRD.md. It is an early-access vertical slice, not the completed V1.

## Implemented

- Original electric-blue/ink/lime identity, editorial homepage, generated still-life imagery, redesigned event pages and owner workspace. See REDESIGN.md for the revised UI/UX specification.
- Functional guest gift finder with budget/type matching, priority ranking, availability checks and direct wish selection.
- Owner wishlist-balance tool with configurable price bands and recommendations independent of guest reservation activity.
- Interactive, clearly labelled sample celebration at `/demo`; sample changes reset on reload and never affect real data.
- Owner authentication through the hosting platform’s ChatGPT identity, with server-side ownership checks.
- Persistent D1 celebrations and wishes, owner dashboard, occasion/date/currency/theme settings.
- Private or unlisted list visibility; private reads and reservations are blocked server-side.
- Manual wishes with optional external HTTPS product link, image upload, notes, estimated price, category, priority, and illustration.
- R2 photos: browser resizing and re-encoding remove source metadata; server checks file signatures and size; access respects list visibility.
- Real guest list URLs, category/budget/availability filters, sorting, and search for larger lists.
- Atomic 24-hour reservations, one 24-hour extension, purchase self-confirmation, release, and received/reopen actions.
- Reservation authorization via an HttpOnly cookie. The database stores its SHA-256 hash. Owner and other guest responses exclude tokens and private hold details.
- Graceful error, loading, empty, and conflict states. Native modal dialogs provide focus containment and Escape dismissal.

## Review decisions and corrections to the PRD

1. A receipt upload alone is not verified evidence. No implemented action sets a purchase to verified. Independent verification remains future work.
2. Self-confirmed purchases remain blocked until release/reconciliation. Only temporary reservations expire.
3. Reservation expiry uses server time, in UTC. Reads calculate availability and atomic updates reclaim expired holds without needing a background job. Reminder delivery is a separate future service.
4. A recipient cannot self-reserve. Owner serializers mask reservation versus purchase state and suppress giver identity.
5. Editing or pausing an actively handled gift is blocked until released, avoiding silent variant changes without a notification service.
6. “Unlisted” is not invitation authentication. Only Private/Unlisted are exposed in this release; invite-only and indexed public discovery are not presented as implemented.
7. Money figures are stored as integer minor units. A target amount is never represented as received money without payment confirmation.

## Verification completed

- TypeScript type check: passed.
- Production Worker build: passed.
- Thirteen automated tests: eight reservation/state/privacy invariants and five gift-finder/list-balance tests.
- Real local D1 API smoke test: passed (CRUD, URL validation, authorization, cross-origin rejection, simultaneous reservations, private serialization, extension limit, purchase, release, pause, and private lists).
- Browser check: homepage at desktop and 390px width; guest dialog reservation, self-confirmed purchase wording, and release flow. A mobile heading adjustment followed this check.
- Not yet verified across Safari/Firefox/Edge or on physical devices. Hosted owner sign-in and photo upload need continued acceptance testing.

## Explicitly pending

- Transactional email, reminders, email-based guest recovery, and durable guest management links.
- Receipt intake, retention/review/redaction service, retailer confirmation, refunds/cancellations, and delivery tracking.
- Contributions, payment processing, payouts, and launch-market choices. There are no working payment controls or fake checkout confirmations.
- Automatic retailer metadata import; links are preserved and the owner supplies details manually.
- Invite-only access, co-owners, upload quotas/orphan cleanup, stronger anonymous-abuse protection, audit/event history, reorder controls, archive/delete/export, and thank-you sending.
- Full browser/device and accessibility audit. The UI uses accessible native controls and reduced-motion styles but is not certified WCAG compliant.

## Access and deployment

The Sites project was created during the prior build attempt and remains owner-private. Even an unlisted celebration link cannot bypass that site-level access. The guest application route does not itself require an account; external guest use requires an explicit site-audience change in a later step.

The active development checkout is `/Users/kingsfirewall/Documents/ChatGPT/Wishnest`. The user-designated project archive is `/Users/kingsfirewall/Documents/WIshnest.io/`; a source copy excluding runtime data, dependencies, and secrets is saved there after validation.

## Development

Use Node 22.13+ (Node 26 used for this build), install with the bundled Sites dependency helper, and generate migrations with `npm run db:generate` after schema changes. Build with the Sites build helper. Apply generated SQL to the local D1 database using the commands in README.md, then run `npm run start` for local preview with storage. Deployed owner identity is supplied by the hosting platform; local API tests supply fixture identity headers to the localhost server only.

Run invariants with `node --test tests/reservations.test.mjs tests/gift-finder.test.mjs`. Run type checks with `node node_modules/typescript/bin/tsc --noEmit`. Real APIs must never accept identity headers from an untrusted publicly exposed origin; hosting dispatch is the trusted identity boundary.
