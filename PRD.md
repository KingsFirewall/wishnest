# Wishnest — Product Requirements Document

**Status:** Discovery / build-ready product definition  
**Product:** Wishnest  
**Document type:** High-level PRD with UI and UX specification  
**Last updated:** October 17, 2026

---

## 1. Product summary

Wishnest is a universal celebration wishlist for birthdays, weddings, graduations, anniversaries, housewarmings, baby celebrations, holidays, and any personal milestone.

People make a beautiful, shareable celebration page and add things they genuinely want: a product link, a photo, a free-form wish, an experience, a charity contribution, or a contribution toward a larger goal. Guests can choose a suitable gift without duplication and without creating an account.

Wishnest is not a store and does not force people to shop in one place. It is the coordination layer between a recipient and the people who want to celebrate them.

### Positioning

> The universal registry for every celebration — gifts, group contributions, experiences, and zero duplicates.

### Core promise

Make it effortless to ask for what you want and equally effortless for someone to give it—without awkward group-chat coordination, duplicate gifts, or spoiled surprises.

---

## 2. Problem and opportunity

### Problems for recipients

- Existing registries are usually restricted to weddings, babies, one retailer, or one country.
- Explaining what they want individually to friends and family is awkward and repetitive.
- Product links get lost in chat threads and duplicate gifts are common.
- A simple list does not work for expensive gifts, non-product wishes, or guests in other countries.

### Problems for guests

- They do not know what to buy or what budget is appropriate.
- They cannot tell whether another person has already bought something.
- A claimed item may not actually have been purchased.
- They want to preserve the surprise while avoiding mistakes.

### Opportunity

Build a warm, occasion-neutral registry that supports both exact gifts and flexible ways of showing up. Its meaningful differentiator is **purchase integrity without adding checkout friction**.

---

## 3. Goals, non-goals, and success

### Product goals

1. A recipient can make and share a credible wishlist in under five minutes.
2. A guest can find, reserve, and buy a suitable gift in under two minutes without an account.
3. Wishnest substantially reduces duplicate gifts without pretending an unverified claim is a confirmed purchase.
4. Every list feels like a personal celebration page rather than an ecommerce grid.
5. The product works across retailers, gift types, devices, currencies, and occasions.

### First-release non-goals

- Becoming a marketplace or holding payment for every external product.
- Universal automated order confirmation for every retailer.
- Social-feed features, public discovery, or a recommendation network.
- Native mobile apps; the first release is responsive web.
- Complex split-payment accounting for external purchases.
- Full wedding planning, invitation management, or event ticketing.

### Primary success measures

| Metric | Definition | First target |
|---|---|---|
| List activation | A new list with at least three items added | 65%+ |
| Share activation | An activated list with a link shared | 60%+ |
| Guest conversion | A visitor who reserves, contributes, or marks a gift purchased | 20%+ |
| Duplicate prevention | Gifts reserved/confirmed before another guest selects them | 90%+ of completed gifts |
| Reservation recovery | Expired holds returned to available inventory | 95%+ |
| Recipient satisfaction | Post-event rating of the gifting experience | 4.5/5+ |

### Guardrails

- Never show a recipient that a specific guest bought a gift unless the guest opts in.
- Never describe self-reported purchase as “verified.”
- Do not require a guest account just to view, reserve, or buy an item.
- Do not sell personal or purchase data.

---

## 4. Users and roles

### Recipient / list owner
Creates a celebration, curates wishes, shares the link, and later sends thanks. May be an individual, a couple, or a household.

### Guest / giver
Views a shared celebration, selects a gift or contribution, reserves it, and optionally verifies purchase. A guest does not need a Wishnest account.

### Co-owner (post-MVP, design for it now)
Another trusted person who can edit a shared list, such as a partner, parent, or event organizer.

### System administrator (internal)
Handles suspected receipt abuse, content reports, retailer-import failures, and support requests.

### Key user stories

**Recipient**

- As a recipient, I can create a celebration page that matches my occasion and shares only what I am comfortable sharing.
- I can paste a product URL and have the image, title, store, and price filled in automatically.
- I can add wishes that do not have a product link.
- I can add a photo, notes, options such as size/color, a priority, and a price range.
- I can see which items are safely being handled without learning who chose them or ruining surprises.
- I can reopen an item if it was not received after the event.

**Guest**

- As a guest, I can identify an unclaimed gift within my budget quickly.
- I can reserve a gift before buying it so no one else does.
- I can buy from the original retailer without creating a Wishnest account.
- I can confirm I bought it and optionally provide private proof.
- I can contribute to a larger gift rather than needing to buy it alone.
- I can remain anonymous to the recipient until I choose otherwise.

---

## 5. Product scope

### V1: must ship

1. Account creation and owner dashboard.
2. Celebration creation using occasion templates.
3. Universal wishlist items: external product links, uploaded images, and manually created wishes.
4. Best-effort link metadata import: image, title, retailer, price, currency.
5. Public, unlisted, and invite-only sharing modes.
6. Guest view with category, budget, and availability filters.
7. Expiring gift reservation, purchase self-confirmation, and optional receipt/order-email proof.
8. Group contribution goals with contributions processed inside Wishnest.
9. Recipient-safe status handling and post-event received/not-received flow.
10. Email notifications and basic thank-you notes.
11. Responsive, accessible web interface.

### V1.1 / later

- Price-drop and out-of-stock alerts.
- Retailer APIs or affiliate-network order confirmation.
- Browser extension and mobile share-sheet capture.
- Couples, co-owners, and household-level permissions.
- Gift recommendations based on recipient preferences and a guest’s budget.
- Native mobile applications.
- Multi-language localization and deeper multi-currency support.

---

## 6. Core object model

### Celebration

| Field | Notes |
|---|---|
| id | Internal identifier |
| title | e.g. “Maya’s 30th Birthday” |
| occasion_type | Birthday, wedding, graduation, anniversary, baby, housewarming, holiday, other |
| date | Optional; used for countdown and lifecycle prompts |
| owner_id | Creator |
| co_owner_ids | Empty in V1 UI, supported in model |
| cover_image | Optional owner photo or visual cover |
| short_message | Personal note to guests |
| slug | Unique share URL |
| visibility | `public`, `unlisted`, or `invite_only` |
| access_rule | Open, password, or emailed one-time code for invite-only |
| default_currency | Display currency |
| status | Draft, active, event passed, archived |

### Wish item

| Field | Notes |
|---|---|
| id / celebration_id | Ownership |
| type | `product`, `experience`, `cash_goal`, `charity`, `surprise_idea`, `custom` |
| title | Required |
| description | Optional context / why it is wanted |
| product_url | Optional external purchase link |
| retailer | Inferred or owner-entered |
| image_url / uploaded_image | Optional but strongly encouraged |
| listed_price / currency | Price from URL or manual estimate |
| preferred_price_min/max | For flexible wishes |
| options | Size, colour, variant, shipping notes |
| category | Home, fashion, books, travel, etc. |
| priority | `would_love`, `top_pick`, `nice_to_have`; never displayed as a rank number |
| visibility | Inherits celebration by default; optional item private-to-invitees |
| fulfillment_state | See state machine below |
| availability_state | Active, paused, archived, out-of-stock |

### Reservation

| Field | Notes |
|---|---|
| item_id | One active reservation per single-purchase item |
| guest_session_id | Anonymous secure session or account ID |
| guest_email | Requested only to manage/resume a reservation and send reminders |
| guest_display_name | Optional, never revealed by default |
| expires_at | Required |
| extension_count | Max 1 in V1 |
| intent | Buying now, buying later, group organiser |
| purchase_state | Reserved, self-confirmed, proof-pending, verified, expired, released |

### Contribution goal

| Field | Notes |
|---|---|
| target_amount / currency | Required |
| current_amount | Sum of successful payments only |
| fulfillment_destination | Recipient cash balance, hosted gift card, or approved merchant checkout |
| contributor_visibility | Anonymous or named-to-recipient |
| close_rule | Close at target, close on event date, or owner-controlled |

### Proof record

Store only what is necessary: proof type, encrypted attachment/reference, validation result, created time, and deletion date. Do not expose proofs to recipients.

---

## 7. Gift integrity and state machine

### Principle

A reservation is an intention. It is not a purchase. A gift reaches **verified** only through reliable evidence.

### Single-item states

```text
Available
  → Reserved (temporary hold)
  → Self-confirmed purchased (guest says they bought it)
  → Proof pending (optional verification submitted)
  → Verified purchase
  → Received / Closed

Reserved or self-confirmed → Released / Available (expiry, cancellation, or non-receipt)
```

### What each person sees

| Internal state | Guest | Other guests | Recipient |
|---|---|---|---|
| Available | “Available” | “Available” | Visible in editor |
| Reserved | “Reserved by you until…” | “Someone is considering this” | “Someone is taking care of this” |
| Self-confirmed | “You marked this purchased” | “Gift in progress” | “Someone is taking care of this” |
| Verified | “Purchase verified” | “Taken” | “Someone is taking care of this” |
| Received | “Thank you / delivered” | “Taken” | “Received” in private owner dashboard |

### Reservation policy

- Default reservation: 24 hours.
- A guest can release it immediately.
- One extension of 24 hours is available, with an explanation optional.
- Reminder email: 4 hours before expiry and immediately at expiry.
- When expired, the item returns to Available automatically and is not publicly attributed to the prior guest.
- Owners cannot see guest identity or proof while the celebration is active; support staff may only access data under controlled support procedures.

### Verification methods and trust tiers

| Tier | Method | Trust | V1 implementation |
|---|---|---:|---|
| 1 | Wishnest processes the contribution payment | Highest | Required for group funds |
| 2 | Retailer/API/webhook order confirmation | High | Architecture-ready; later rollout |
| 3 | Validated order-confirmation email or receipt | Medium-high | Optional V1 proof flow |
| 4 | Guest says “I bought it” | Intent only | Required confirmation action; not labelled verified |

### Proof UX

After a guest clicks “I bought it,” show two clear choices:

1. **Confirm without proof** — keeps the gift unavailable, but may be followed up after the event.
2. **Verify privately** — forward an order email to a unique secure address, upload a receipt, or connect a participating retailer. Explain that the recipient never sees the receipt, price paid, address, or order number.

Receipt validation should extract retailer, item title, order date, amount, and order identifier; redact delivery address and payment details before storage. A suspicious or unreadable receipt is marked “couldn’t verify,” never automatically treated as fraud.

### Post-event reconciliation

Seven days after the event (configurable), the owner receives a private checklist: “Did you receive this?” with **Yes**, **Not yet**, and **No / reopen item**. A “No” sends a tactful message to the guest: “Just checking whether you still plan to give this gift. If plans changed, release it so another guest can help.” No accusation and no recipient identity disclosure.

---

## 8. Primary journeys and UX specification

### A. Create a celebration

**Entry points:** Homepage primary CTA, dashboard “Create celebration,” or duplicated past celebration.

**Flow:**

1. Select occasion tile or “Something else.”
2. Enter title, date (optional), and recipient(s).
3. Choose a visual style; optionally upload a cover/photo.
4. Add a short note and choose default currency.
5. Select privacy: unlisted is preselected; public and invite-only are explained plainly.
6. Land in the editable list with an onboarding checklist.

**Onboarding checklist:** Add first wish, add three wishes, customise your page, share your link. It must be dismissible.

**Completion target:** First item added in less than 90 seconds.

### B. Add a wish

The owner opens a single **Add a wish** sheet with five large choices:

- Link to a product
- Add a photo / item manually
- Group gift or cash goal
- Experience or activity
- Donation / charity

**Product URL flow:** Paste URL → display import loading state → show an editable preview (image, title, price, shop) → add personal notes and options → Save. If import fails, preserve the URL and offer manual entry rather than showing an error dead-end.

**Manual item flow:** title, image, estimated price/price range, description, preferred store/link (optional), category, options, priority.

**Flexible wish flow:** Capture the idea, price range, and boundaries: “I love ceramics in warm colours; no mugs, please.” These items cannot be automatically purchase-verified and must say that to the owner in editor copy.

### C. Share a celebration

The owner selects **Share** from the dashboard or celebration editor.

- Prominent copy-link button with the actual page URL.
- Native mobile share action when supported.
- Optional prewritten message: “I made a Wishnest for my birthday—no pressure at all. If you’d like to celebrate with me, here are a few ideas.”
- Controls: pause sharing, regenerate link, change privacy, set an event date, preview guest view.
- Warn an owner before making an invite-only list public.

### D. Guest finds and reserves a gift

1. Guest opens shared URL; no sign-in wall.
2. Guest sees a warm celebration page and can filter by budget, category, and available items.
3. Selecting an item opens a detail drawer/page with product image, notes, options, price, retailer, and status.
4. Guest selects **Reserve this gift**. Explain the 24-hour hold before confirmation.
5. Collect email only after reserve click, with the reason: “We’ll use this to send your private link and remind you before the reservation ends.” Name optional.
6. On success, show a private reservation screen: retailer CTA, time remaining, release button, and “I bought it” action.
7. The guest purchases directly from the retailer. Wishnest never inserts itself into that external checkout.

### E. Guest contributes to a group gift

1. Guest opens a contribution item and sees the target, current progress, end date, and what happens with the money.
2. Choose amount or use preset chips.
3. Pay in Wishnest using a regulated payment processor.
4. Show receipt, progress update, and optional name/message visibility setting.
5. Owner can never withdraw funds without satisfying the disclosed payout rules; details depend on legal/payment-market requirements.

### F. Post-event thank-you

The owner sees a calm post-event workspace with received items, optional uploaded photos, contributors, and a draft thank-you note. They can send an individual thank-you, a group note, or leave it for later. Nothing is sent automatically without owner review.

---

## 9. Information architecture

### Public / guest area

- Home / marketing
- Celebration page
- Item detail
- Reserve / contribution flow
- Guest reservation manager (secure link from email)
- Thank-you page (if public or guest-authorized)

### Owner area

- Authentication
- Dashboard: celebrations
- Celebration editor
  - Wishes
  - Appearance
  - Sharing & privacy
  - Activity / integrity status
  - Thank-yous
  - Settings / archive
- Account settings

### Navigation

**Guest desktop:** Logo → celebration context (not a heavy global nav) → Help.  
**Owner desktop:** Wishnest logo, Celebrations, Create celebration, profile.  
**Mobile:** compact top bar; persistent bottom action only on editor pages: Add wish / Share.

---

## 10. UI design specification

### Design personality

Warm, modern, generous, and calm. It should feel like a thoughtful invitation, not a wedding-industry template or a checkout funnel. The visual system must be flexible enough for a graduation, a newborn, a casual birthday, and a formal wedding.

### Visual principles

- Lead with a human moment: recipient name, occasion, short note, and cover image or subtle illustration.
- Use generous whitespace and editorial typography.
- Gift cards are clear, tactile, and photo-forward—not dense commerce tiles.
- Availability is obvious but never alarming; avoid red “sold out” language.
- Never rely on colour alone for status.

### Suggested baseline design system

| Token | Recommendation |
|---|---|
| Typeface | Friendly editorial display face plus highly legible sans-serif body face |
| Base font size | 16px minimum; body line-height 1.5+ |
| Spacing | 4px base scale; 16/24/32px common intervals |
| Radius | 12px cards, 999px chips/buttons where appropriate |
| Shadow | Soft, low-contrast elevation only |
| Palette | Warm neutral base, charcoal text, a confident terracotta/coral primary, celebration accents selected per template |
| Motion | 150–220ms; respect `prefers-reduced-motion` |

The initial implementation should define semantic design tokens (`surface`, `surface-muted`, `text-primary`, `text-secondary`, `accent`, `success`, `warning`, `danger`, `focus`) rather than hardcoding individual colours into components.

### Responsive layouts

| Viewport | Celebration page |
|---|---|
| Mobile < 640px | Single-column hero, 2-column compact gift grid or one-column large cards depending on image ratio, sticky Filter/Share affordance |
| Tablet 640–1023px | Two-column gift grid, inline filter bar |
| Desktop ≥ 1024px | Centered max-width container, spacious two-to-three-column gift grid, filters beside or above the grid |

### Core components

| Component | Required behavior |
|---|---|
| Celebration hero | Cover/gradient, occasion label, title, date/countdown, personal note, optional owner avatar(s) |
| Wish card | Image, title, price/range, category, muted preference note, availability badge; entire card opens details |
| Wish detail | Large image, full notes/options, original shop, price, primary action, discreet reporting link |
| Status badge | Text plus icon: Available, Reserved, In progress, Verified, Received; adapt visibility by role |
| Budget filter | Preset chips and custom min/max; does not hide flexible items without a price—offers a toggle |
| Add wish sheet | Modal on desktop, full-screen sheet on mobile; preserves partially entered content |
| Reservation timer | Plain-language expiry plus progress bar; never creates false urgency for an immediate gift purchase |
| Contribution card | Progress bar with exact amount optional based on owner privacy setting; target, deadline, CTA |
| Empty state | Friendly illustration/icon, one helpful sentence, one primary action |
| Toast | Concise confirmation with undo where safe, e.g. after releasing a reservation |

### Screen requirements

#### 1. Marketing homepage

- Hero: “Give what they actually want.”
- Two CTAs: Create a wishlist; See how it works.
- Show a believable celebration-page preview, not a generic product grid.
- Explain universal items, no duplicate gifts, privacy, and free guest access.
- Include trust/footer links: privacy, terms, support, accessibility.

#### 2. Owner dashboard

- Header: greeting, Create celebration.
- Celebration cards: cover, title, date, status, item count, share status, and a lightweight activity summary.
- Empty state begins the create flow.
- Never display raw guest email or proof content in the default dashboard.

#### 3. Celebration editor

- Page title with Draft/Active status.
- Main grid/list of wishes; drag-and-drop reordering on desktop and accessible move controls everywhere.
- Sticky actions: Add wish and Share.
- Preview toggle shows recipient-safe guest view.
- Item overflow: edit, duplicate, pause, archive; destructive actions require confirmation.

#### 4. Guest celebration page

- Hero tells the visitor whose celebration this is and why they are invited.
- Search is optional; show only once lists are large enough (12+ items).
- Filter and sorting: Available first by default; price/category; no “popularity” ranking in V1.
- Hidden/handled items are either softly visible as “Taken” or omitted based on the owner’s display preference. Default: softly visible so guests understand that options changed.

#### 5. Reservation and proof screens

- Use a focused, distraction-free layout.
- State duration, privacy, and cancellation rules before collecting email.
- Make “Continue to shop” visually primary after a successful reservation.
- Keep proof truly optional for ordinary external purchases, but explain its benefit.

#### 6. Thank-you workspace

- Group items by status: Received, Awaiting, Contributions.
- Each card offers photo, note, send later, and mark as resolved.
- Thank-you wording must be personalizable; no automated generic public posts.

### UX copy conventions

- Say **Reserve this gift**, not “claim,” before purchase.
- Say **Someone is taking care of this**, not “claimed,” to recipients.
- Say **Verify privately**, not “upload proof,” in primary user-facing language.
- Say **Release this gift** rather than “cancel claim.”
- Avoid guilt: “No pressure at all” and “If plans changed, that’s okay.”

---

## 11. Functional requirements

### Authentication and authorization

- Owners authenticate via email magic link, OAuth, or passkey-compatible account flow.
- Guests can reserve without an account, using a secure signed session plus email confirmation link.
- Secure guest links must be single-purpose, revocable, and expire after a sensible period.
- Permissions are server-enforced; hiding UI controls is not authorization.

### Product link import

- Fetch metadata server-side with SSRF protection, URL validation, rate limiting, caching, and a timeout.
- Prefer Open Graph and structured product data; let owner edit all imported fields.
- Imported price must include a “last checked” time and cannot be treated as current checkout price.
- On failure, keep the URL and offer manual entry.
- Never scrape or store retailer checkout pages, credentials, or card data.

### Sharing and privacy

- `public`: indexable only if an owner explicitly opts in; default robots policy should be non-indexed even for link-accessible pages.
- `unlisted`: anyone with link can view; default selection.
- `invite_only`: guest enters a password or completes an emailed one-time code.
- Owner can pause access, regenerate an unlisted URL, or archive a celebration at any time.
- Provide a clear preview of exactly what a visitor, guest, and recipient can see.

### Item rules

- One active reservation at a time for exact single-product items.
- Flexible wishes permit a configurable quantity or remain open-ended; label them clearly.
- Cash/group goals accept multiple contributions until close conditions are met.
- A recipient can pause an item (e.g., item became unavailable) without deleting history.
- Item updates after a reservation should notify the active guest if material: URL, size, price, or availability change.

### Notifications

| Trigger | Audience | Channel |
|---|---|---|
| Reservation created | Guest | Email with secure management link |
| Reservation nearing expiry | Guest | Email |
| Reservation expired/released | Guest | Email |
| Proof verified / could not verify | Guest | Email and manager page |
| New contribution | Owner | Email/digest, without violating contributor anonymity choice |
| Event follow-up | Owner | Email |
| Item marked not received | Active guest | Email, tactful and private |

Notification preferences must allow owners and guests to opt out of non-essential reminders while retaining transactional messages.

---

## 12. Privacy, trust, safety, and compliance

### Privacy requirements

- Collect the minimum data: owner profile email; guest email only when reserving/contributing; optional guest display name.
- Encrypt proof attachments and sensitive records at rest; access them through audited, restricted paths.
- Automatically delete receipt images and raw email content after the verification retention period (recommend 90 days) unless lawfully required longer.
- Redact shipping address, payment-card details, and unnecessary order contents before long-term storage.
- Never expose buyer identity, proof, payment amount, or address to a recipient by default.
- Publish transparent privacy and retention policies before launch.

### Abuse prevention

- Rate-limit anonymous reservations, imports, emails, and receipt uploads.
- Use CAPTCHA/risk checks only when abuse signals warrant it; do not add it to normal guest flow.
- Validate uploaded file type, size, malware scan, and signed upload URL.
- Support recipient/guest reporting for abusive list content or impersonation.
- Offer account deletion, celebration archive, and data-export processes.

### Payments

Group contribution handling requires legal, tax, chargeback, KYC/KYB, payout, and regional compliance review before implementation. Integrate a payment provider that supports marketplace/platform payments; never build card handling directly.

---

## 13. Accessibility and quality bar

- Meet WCAG 2.2 AA for contrast, focus, keyboard navigation, semantic structure, labels, and error messages.
- Every interactive control has an accessible name and visible focus state.
- Drag/reordering has keyboard alternatives.
- Image upload includes alt-text guidance; imported product images use meaningful fallback text.
- Reservation timers never expire while a person is actively completing a form; warn before timeout.
- Test current Chrome, Safari, Firefox, and Edge on desktop; Safari and Chrome on current iOS/Android mobile browsers.
- Target fast perceived load: hero/content visible promptly on average mobile connections; image lazy-loading below the fold.

---

## 14. Analytics and event taxonomy

Track privacy-conscious product events. Do not place third-party ad tracking on private celebration pages.

| Event | Key properties |
|---|---|
| celebration_created | occasion, privacy, date-present |
| item_added | item type, import success, price present |
| celebration_shared | share mechanism, privacy |
| guest_viewed | anonymous, celebration visibility |
| filter_used | filter type |
| reservation_started / completed | item type, duration |
| reservation_expired / released | duration, extension count |
| purchase_self_confirmed | proof offered/used |
| proof_verified / rejected | proof type, reason category |
| contribution_started / succeeded | amount bucket, currency |
| item_received / reopened | post-event duration |
| thank_you_sent | item/contribution, delivery type |

Use anonymized or hashed identifiers where possible. Analytics must never record receipt contents, product addresses, or payment data.

---

## 15. Recommended implementation approach

This is guidance for the build agent, not a locked technology mandate.

### Architecture

- Responsive web application with server-rendered public celebration pages for speed and share previews.
- Backend/API enforces permissions, state transitions, reservation expiry, link import, notifications, and payment webhooks.
- Relational database for celebration, item, reservation, contribution, and audit records.
- Object storage for cover images and receipt attachments using private buckets and signed URLs.
- Job queue/scheduler for expiry jobs, emails, metadata fetching, and post-event follow-up.
- Transactional email provider for magic links and guest reservation management.
- Payment processor designed for platform/marketplace contribution flows.

### State-transition requirements

- Reservation creation must be atomic: two simultaneous guests cannot successfully reserve the same item.
- Expiry and release must be idempotent.
- Payment and retailer webhook handling must verify signatures and be idempotent.
- Record an immutable audit event for status changes, without leaking it to the recipient.
- Time zones: display dates in owner-selected/event time zone; store timestamps in UTC.

### Recommended build order

1. Design system, authentication, dashboard, celebration model, and public read-only page.
2. Add/edit/manual/photo wishes, URL metadata import, privacy, and sharing.
3. Guest browsing, atomic reservations, secure guest links, expiry worker, and email reminders.
4. Purchase self-confirmation, proof upload/validation placeholder, recipient-safe status views, and post-event reconciliation.
5. Group contribution payments, payout/legal review, thank-you workspace, and analytics.
6. Advanced retailer confirmation, price alerts, browser capture, co-owner features, and recommendations.

### Definition of done for V1

- A new owner can create an unlisted birthday list, add three URL/manual wishes, and share it from mobile or desktop.
- A guest with no account can find an available item, reserve it, receive a private management link, release it, and observe it become available again.
- A second guest cannot reserve the same item during an active hold.
- A recipient never sees the guest’s email, proof, receipt, or purchase amount by default.
- An owner can complete post-event reconciliation without exposing private guest data.
- Public and private flows meet the accessibility and quality requirements above.

---

## 16. Open product decisions

Resolve these before or during design sprint; do not block the core list/reservation experience.

1. **Name and brand:** Confirm Wishnest is final and check domain/trademark availability.
2. **Geographic launch:** Start with one market/currency for legal clarity, or support multi-currency display but defer cross-border payouts.
3. **Contribution payout:** Is funding delivered as cash, selected retailer gift card, or a purchase managed by a designated organiser?
4. **Verification standard:** Which receipt signals qualify as verified in V1, and is human review available?
5. **Recipient status visibility:** Should a recipient distinguish “reserved” and “purchased,” or only see the reassuring generic state? Recommendation: generic state.
6. **Public discovery:** Recommendation: do not offer searchable/discoverable lists at launch; privacy and safety are more valuable.
7. **Revenue model:** Affiliate commission when available; optional premium customisation/household features later; never charge guests a surprise fee.

---

## 17. Product principles to preserve

1. **Celebration first, commerce second.**
2. **Guest friction should be proportional to trust required.** Browsing and reserving are easy; processing money or verifying requires more care.
3. **Privacy protects the surprise.**
4. **Honest states build trust.** A claim is not a purchase.
5. **Universal means more than product links.** Experiences, contributions, charity, and flexible ideas matter.
6. **No shame, no pressure.** Every reminder and error state should be gracious.

