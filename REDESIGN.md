# Wishnest — Electric optimism

October 18, 2026. This revision supersedes the first implementation's warm, serif-led visual direction. The original PRD remains the long-term functional plan; this document specifies the implemented redesign.

## The correction

The first release followed the reference too closely. This revision replaces its page composition, color system, typography, brand mark, imagery, celebration header, and owner guidance. It introduces two functional decision tools rather than claiming differentiation from styling alone.

## Visual system

- Ink #14182E; electric blue #304DFF; acid lime #DDFA78; cool white #F6F7FB; pale periwinkle #DFE5FF.
- Heavy sans-serif editorial headings, neutral sans body text, monospace labels. No serif display typography.
- Broad masthead and photographic stage, followed by a live interactive product canvas. No tilted miniature list hero or generic three-step strip.
- W-shaped brand mark and matching favicon. Angular arrow accents; restrained 8–16px radii.
- Event pages use a title/date/monogram header, gift finder, then full lineup.
- Existing theme storage keys remain peach/sage/lavender for compatibility. Their user-facing names are Electric blue, Acid lime, Ultraviolet; the palette values have changed. No data migration is needed.

## Gift finder — implemented

Guest inputs: budget ceiling and gift type. Only unpaused, available wishes match. Expired reservations re-enter the results. Reserved, purchased, received and handled wishes are excluded. Unknown prices are excluded when a budget is set, but allowed with Any budget.

Results sort by the recipient's priority first, then price, and give explicit reasons. This is deterministic wishlist matching, not an AI or sponsored recommendation claim. Currency-specific starting budgets are configurable UI suggestions, not exchange rates. The full list retains category, price, availability and sort controls.

Selecting a result opens that actual wish's reservation dialog. The homepage uses clearly labelled sample data and deep-links to the selected sample wish. The sample never modifies real data.

## Wishlist balance — implemented

Owners choose an affordable-gift target and see three price bands, counts, unknown-price notices, and an actionable suggestion. Hidden wishes are excluded. Reservation/purchase states do not influence any count or suggestion, so changing guest activity cannot reveal a surprise. The target is a session-local display preference, not a saved event setting.

The homepage lets visitors switch between guest matching and owner balance using the sample list.

## Trust boundary

Reservations and purchases remain distinct. Holds expire after 24 hours, with one extension. A guest's “I bought it” is self-confirmation only. Retailer/evidence verification, receipts, payments, email recovery and reminders remain pending; none is represented as available.

## Original visual asset

- Built-in image-generation tool, one original output; not sourced from the reference.
- Runtime asset: public/images/wishnest-still-life.png.
- Original: /Users/kingsfirewall/.codex/generated_images/01a14b90-500b-7313-93de-f137fe870763/exec-78031dbd-24a0-44b5-af07-3512776d9a78.png.
- Prompt: “Create an original premium editorial still-life photograph for a modern wishlist platform named Wishnest, with no text or logos. Wide landscape 3:2 composition. On a vibrant saturated electric cobalt blue seamless studio floor/background, a playful sculptural arrangement of tangible gifts: oversized shiny chrome ribbon loops arching over a matte pale lavender gift box, a bright acid yellow-green/lime gift box, a pair of stylish silver over-ear headphones in foreground, and a small cobalt ribbon tail. Objects cluster at center-right with generous negative space at left and top. Strong directional studio light, crisp sophisticated shadows, tactile matte paper and highly reflective brushed chrome, realistically photographed, polished design magazine art direction. Palette strictly electric cobalt blue, deep navy, silver chrome, very pale lavender, acid lime. No peach, terracotta, cream, flowers, beige, brown. No writing, no watermarks, no interface, no collage, no repeated boxes. Confident contemporary composition.”
- Existing product SVGs were updated natively to match the palette; the pottery experience now shows pottery instead of a beach. User-uploaded product images still take precedence.

## Acceptance checks

- TypeScript and production build.
- Five new automated finder/balance tests, plus eight reservation/privacy tests.
- Real local API smoke test of CRUD, authorization, reservation races, purchase, release and privacy.
- Browser interaction: budget ceiling, no-match state, configurable owner balance, selected-wish deep link, reserve, self-confirm purchase, release, and removal from finder after reservation.
- Desktop and 390px responsive inspection. No claim of physical-device or full cross-browser certification.
