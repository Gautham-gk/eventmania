@AGENTS.md

# NewFind — Brand & Design System

> **This file loads automatically when you touch anything under `apps/web/`, and nowhere else.**
> That is the point: these rules govern every pixel of the web app and are worth nothing on a
> backend or docs task, so they are here rather than in the repo-root `CLAUDE.md`.
>
> **⚠️ Budget: 16 KB.** Over it, move the *reasoning* to `DESIGN_NOTES.md` (repo root) and **keep
> the rule here** — a session needs the rule without asking, and the reasoning only when it argues.
>
> Repo-root docs referenced below (`DESIGN_NOTES.md`, `COMPONENTS.md`, `HANDOVER.md`) live three
> levels up, beside the code they describe.

Clean, minimal, premium — inspired by functionhealth.com (aesthetic) and austoentertainment.com
(palette). **User-friendliness, simplicity and consistency are the top priorities. Do not add
unnecessary complexity, decorations, or features.**

## ⚠️ Consistency is a requirement, not a preference

**The same thing must look and behave the same way everywhere.** A user moving from home to an event
page to a community page should never notice that two different people built them. **This outranks
matching a mockup pixel-for-pixel** — if a mockup conflicts with an established pattern, say so and
ask before diverging.

Before you build any UI:

1. **Search for the pattern before you write it.** If a share button, heart, date row, price chip, badge or empty state exists, **import it**. A second version is a bug, even when it looks fine on its own.
2. **One control = one component.** If a control needs to look different on a new surface, add a **prop** — do not fork the file.
3. **One icon per concept.** A calendar is the same glyph everywhere.
4. **Consistent ≠ identical behaviour by accident.** If two surfaces share a look, they must share the code. Copy-paste is how drift starts.
5. **If you find an inconsistency, report it.** Do not quietly work around it, and do not unilaterally restyle a shared surface — flag it and let Gautham decide, because a "fix" in one place changes every other place.

## Colour

**`globals.css` is the source of truth.** Every brand colour is a `--brand-*` CSS variable defined
once there (light in `:root`, dark in `:root[data-theme="dark"]`). **Do not reintroduce raw brand
hexes in components**, and do not restate the palette in this file — read `globals.css`.

Tokens: `--brand-green`, `--brand-green-hover`, `--brand-on-green` (text/icons **on** a green fill),
`--brand-bg` (page), `--brand-surface` (cards/navbar/inputs), `--brand-text`, `--brand-border`,
`--brand-nav-border`, `--brand-control-border`, `--brand-hint`, `--brand-muted`,
`--brand-terracotta` (+ `-hover`, `--brand-on-terracotta`), `--brand-logo`, `--brand-hero-frame` (the hero photo's frame — green in dark, **transparent in light**, which is how that border is made dark-only).

**Naming convention — what Gautham means:**
- **"green" / "green shade"** → always `#184E4A` (`--brand-green`). Never another green, never Tailwind `green-*`.
- **"white" / "white shade"** → always linen `#F2EFEA`. Pure `#FFFFFF` is only for text on dark or coloured backgrounds.

*(Those two hexes are the only ones stated here, because the rule is meaningless without them.)*

**Three token traps:**
- **`--brand-hint` is NOT gray** and must not be "restored" to one. It is full-contrast text in light, linen in dark.
- **`--brand-muted` is the only genuinely-gray token** — form placeholders and muted *fills* only. Never for ordinary secondary text; it would paint a near-black button in light mode.
- **`--brand-control-border` is for controls, `--brand-border` for non-controls.** Do not "simplify" a control onto `--brand-nav-border` — that's the navbar/card token and far too pale.

Usage: `style={{ color: "var(--brand-text)" }}`, or the `BRAND` string map from `@/lib/theme`, or
Tailwind arbitrary values (`text-[var(--brand-hint)]`). **Alpha tints need
`color-mix(in srgb, var(--brand-green) N%, transparent)`** — a CSS var can't take a hex-alpha suffix.

**Intentionally not themed:** `Footer.tsx`, the `HeroCarousel` letterbox, and semantic accents (badge
colours, star gold, error red, status green/amber, Google/Facebook brand colours).

Theme plumbing: `providers/theme-provider.tsx`, persisted to `eventmind-theme`, with a no-flash
`<head>` script in `layout.tsx`. A neutral dark-gray alternate sits commented out in `globals.css` —
uncomment to switch, no component edits needed.

Rationale for all of the above: `DESIGN_NOTES.md` §7.

## Typography

**One font, one place.** The whole app uses a single font (currently **Roboto**) loaded once in
`layout.tsx` and exposed as `--font-app`; `globals.css` maps it to `body` and Tailwind's
`--font-sans`. **There are no per-component font declarations** — do not re-import a font in a
component or set `fontFamily` inline.

**To swap the font:** change only the two marked lines in `layout.tsx` (the `next/font/google` import
and the loader call). Keep `variable: "--font-app"`. Nothing else touches.

**Font-size floor: 15px.** One rule in `globals.css` raises `text-xs`, `text-sm` and arbitrary
`text-[9px]`…`text-[14px]` to 15px. **Do not add new sub-15px sizes.** Opt out with
`data-keep-type` on an element (and its subtree) whose small type is deliberate.

**Prominent copy above the floor:** page subtitle 18px; empty-state heading 18px with a 16px helper
line. Follow this on new pages. See `DESIGN_NOTES.md` §8.

## ⚠️ The type scale — one scale, whole app

**The console had its own** until 2026-08-22 (everything at the 15px floor, plus 11px uppercase
micro-labels), and that — more than any colour — is what made it read as a different product. It is
now on the scale below, and **so is anything new.** Sizes come from `EventsCarousel`'s card and
`/event/[id]`'s body; the console runs one step quieter where a table genuinely needs it.

| Role | Size | Reference |
|---|---|---|
| Section / page heading | `clamp(…)` **extrabold**, `tracking-[-0.5px]` | `EventsCarousel`'s "Events in {city}"; the console `h1` |
| Card or row title | **20px bold** | the event card's title; a console table row |
| Big figure | **32px extrabold**, `-0.5px` | `StatTile`; the earnings hero goes to 44 |
| Body, table cells | **17–18px** | card meta row 18px; console cells 17px |
| Controls | buttons **18px bold**, filter tabs **20px semibold** | the card's "View details" CTA |
| Labels, counts, sub-lines | **15px** — the floor | `MicroLabel`, `CountBadge` |

**Do not add a `data-keep-type` to squeeze a label in.** If a label competes with its figure, the
figure is too small — that is the mistake the console's 11px labels were compensating for. The only
live opt-out left in the app is `EventCard.tsx` (dead code) and one comment in `FeatureBand`.

## Shape

**⚠️ Every button, chip, toggle and filter control is a rounded rectangle. `rounded-full` is not a
button shape.** The reference is the category chip on the event card — `rounded-lg`, the silhouette
exported as `TAG_SHAPE`.

- **Small controls** (filter chips, category chips, date presets, segmented items): `rounded-lg`. Inside a bordered track, the track is `rounded-lg` and its items `rounded-md` so the inner radius nests.
  - **⚠️ The FILTER TAB is the standing exception, and there are now three of them on one silhouette:** `EventsCarousel`'s two tab rows, the card's "View details" CTA, and the organiser console's `Tabs` + `FilterSelect` — all `rounded-xl` (Gautham, 2026-08-21 and 2026-08-22). **Move them together or not at all, and do not "correct" any of them to `rounded-lg`.**
- **Standard buttons** (CTAs, form submits, search/city/sort controls): `rounded-xl` or `rounded-2xl`.
- **The only legitimate `rounded-full` elements** are things that aren't buttons-with-labels: the round icon controls in `EventActions.tsx`, avatars, count badges, carousel dots, and a toggle switch's knob + track. **Do not add to this list without asking.**

## Borders

**Outline controls on a linen/gray background use `2px solid var(--brand-control-border)`.**

- **⚠️ Bump the ACTIVE state to 2px too.** Most of these swap to a green border when selected; if only the inactive state is 2px, **the control changes size when you click it.**
- `--brand-border` is still correct for **non-controls**: card/panel borders, dividers, `border-t`/`border-b` rules, and form text inputs inside a card. **Do not sweep those to 2px.**
- **⚠️ A CARD is not a control.** The `SeeAllTile` in the carousels sits in the same grid as the event cards and must look identical to them — `2px solid transparent` at rest, green on hover, the transparent border holding the space so it never resizes. It must read as a card, not as a big button.
  - **⚠️ The `/event/[id]` HERO ROW is the one place the token itself changes** (Gautham, 2026-08-31): every control there — Back, wishlist, share, edit, duplicate, cancel, the status chip, the view toggle, Publish — wears `2px var(--brand-hint)` via `EventActions`' exported `HERO_EDGE`, so the edge is brand-black in light and brand-white in dark. `--brand-control-border` is a mid tone in both and reads as no edge at all over a photograph. **Approved and scoped to that row — do not sweep it onto outline controls elsewhere, and do not "correct" it back.** ⚠️ That edge also **greens under the pointer**, on every control in the row — the status chip and the view toggle's track included (`HERO_EDGE_HOVER`, and `hoverEdge` for the round ones, whose ring follows the glyph's tone and so goes *terracotta* on the destructive one).
  - **Two standing exceptions**, both approved and both because a 1px `--brand-border` read as no border at all: `/explore`'s filter sidebar and `FeatureBand`'s cards carry `2px --brand-control-border` at rest. This is not licence to sweep card borders generally — a card that sits in a grid *beside event cards* still follows the `SeeAllTile` rule above.
- **First choice is not to hand-write a border at all.** There is no shared Button component, which is why this treatment had to be applied in ~20 places across 12 files. If you add another outline control, **copy an existing one rather than inventing a third width.**

Dark theme is deliberately not lifted — the blending problem is light-only. See `DESIGN_NOTES.md` §7.

## Hover, spacing, tone

- **Hover:** background → green, text/icon → linen. Used throughout the navbar, dropdowns and cards. Maintain it for new interactive elements. **One approved exception:** `FeatureBand`'s four **organiser** tiles hover **terracotta**, because each half of that band is skinned by one accent and terracotta is the organisers' (Gautham, 2026-08-19). Participant tiles still hover green. Do not sweep the organiser tiles back to green.
  - **⚠️ A TABLE ROW takes an 8% green WASH, not the solid fill** (`.nf-console-row` in `globals.css`) — a row carries status pills and a progress bar, which a solid ground would swallow. Its controls still take the full rule. **The trap that made this necessary: an inline `style` colour BEATS a `hover:` rule**, so the console's every control was inert to the pointer until its tones moved to classes. Third time this has bitten — see also `FeatureBand`'s audience badge and `FilterSelect`'s menu items. **Colour anything that hovers with CLASSES.**
- **Navbar** 72px tall. **Page content and navbar share the same horizontal padding** — import `GUTTERS`.
- **Cards** `rounded-2xl`. **Buttons** `rounded-xl` / `rounded-2xl`.
- **Copy:** conversational but professional. Avoid jargon, keep labels short — "Claim Free Ticket", not "Register for Free Event".

## Responsiveness

**Verified by measurement, not by eye** — `document.scrollWidth === clientWidth` on `/`, `/explore`,
`/event/[id]` and `/community/[slug]` at **320 · 375 · 414 · 768 · 1024 · 1100 · 1280 · 1440 ·
1920**. This had *not* been true before: the claim sat in the docs while eleven surfaces carried a
flat `px-12`. **Re-run that sweep after any layout change — 1024px especially, where the navbar
breaks first.**

> ⚠️ **A wider breakpoint does NOT automatically beat a narrower one in this Tailwind v4 build.** Both arbitrary (`min-[1400px]:`) and custom registered (`band:`) media variants are emitted **before** the built-in screens, so `band:grid-cols-7 lg:grid-cols-4` on one element renders **four** columns at 1600px — both match, and `lg` is later in the stylesheet. **Fix by making the ranges disjoint, not by reordering the class string:** bound every narrower step with `max-band:` (`max-band:lg:grid-cols-4 band:grid-cols-7`). `FeatureBand` is the worked example, `--breakpoint-band: 1400px` is registered in `globals.css`, and the trap is written up beside it. This shipped once and read as a layout bug. **Verify in the compiled CSS — do not assume the sort order.**

Standard patterns:

- **Grids:** `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` — all built-in screens, which do sort by width among themselves; only mixing in a custom or arbitrary breakpoint hits the trap above.
- **Horizontal padding:** import `GUTTERS`. Never hand-write the trio.
- **Two-column bodies:** `grid-cols-1 lg:grid-cols-[Nfr_1fr]`, never a bare `gridTemplateColumns` — a hard `fr` ratio has no narrow layout, it just squeezes the sidebar until it overflows.
- **Form rows:** `grid-cols-1 sm:grid-cols-N`. A bare `grid-cols-3` puts three ~100px cells on a phone.
- **Wide tables:** keep the width, wrap in `overflow-x-auto` with `min-w-[720px]`. Six columns have no honest narrow layout; scrolling beats crushing.
- **Full-bleed hero titles:** one line via `heroTitleSize()` on `lg+`; below `lg` the `.hero-title` rule in `globals.css` lets it wrap to 3 lines instead.
- When stacked, `/event/[id]` orders the **booking card above the description** so price/date/Book Now are visible without scrolling past the reviews.
