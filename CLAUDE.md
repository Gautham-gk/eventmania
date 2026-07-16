# NewFind (EventMind) — Project Handover for Claude

> You are picking up an active project. Read this file fully before making any changes.
> When you make a meaningful contribution, update this file and save any new reference documents to `Eventmind_files/`.

> **⚠️ Folder name has a space:** The parent folder is called `Event mind` (with a space). Always wrap paths in quotes in the terminal, e.g. `cd "c:\...\Event mind\eventmind"`. Forgetting the quotes will break commands silently.

---

## Execution Rules (read before every task)

- Before starting any task, identify the exact files needed. Open **only** those files.
- Do **not** explore the full project structure unless explicitly asked.
- Do **not** read `node_modules`, `.next`, `.venv`, `.dart_tool`, or any build/cache directories.
- Do **not** re-read files you have already read in this session.
- If a task touches only one component, open only that component file.
- Always run `pnpm --filter @eventmind/web type-check` after any TypeScript changes. Do not report a task done if type-check fails.
- After completing a task, list only the files you modified.
- **Before building anything complex, state your interpretation of the task and ask Gautham to confirm before proceeding.** This is especially important when: an image or asset is uploaded (do not hand-draw or reconstruct it — ask how to use it), the request is ambiguous, or the implementation could go several different ways. A brief "Here's what I'm planning — does that sound right?" prevents wasted effort.

---

## What Is NewFind?

NewFind (formerly EventMind internally) is an AI-powered event discovery platform — think Eventbrite meets Meetup, with an AI layer for personalised recommendations and community matching. Users can discover events, register, buy tickets, and chat with other attendees. Organisers can create and manage events.

The project is mid-build. The frontend is a React/Next.js web app (`frontend_react/`). It was originally migrated from a Flutter Web prototype; that Flutter app has since been **deleted** and no longer exists in the repo.

> **Important:** This is React/Next.js — NOT React Native. React Native is a mobile framework. This project is a Next.js web app. Do not confuse the two.

---

## Repository Layout

```
Event mind/
└── eventmind/
    ├── frontend_react/        ← React/Next.js (the frontend)
    │   ├── apps/web/          ← Next.js app
    │   └── packages/          ← shared types, store, api
    ├── backend/               ← FastAPI microservices
    │   ├── gateway/           ← API gateway (port 8000)
    │   ├── services/          ← auth, event, chat, payment, community, etc.
    │   └── scripts/           ← shadow_runner.py, seed_events.py
    ├── start.bat              ← Windows launcher (replaces shadow_runner.py — see below)
    └── CLAUDE.md              ← this file

Eventmind_files/               ← all project documents live here
    ├── eventmind_prd.md       ← full Product Requirements Document
    ├── competitor_analysis.md
    └── REACT_MIGRATION.md     ← React frontend technical handover (read this too)
```

**Important:** All project documentation goes into `Eventmind_files/`, not inside `eventmind/`. Keep those folders separate.

---

## Project Structure

Run this once to map the project (Windows PowerShell). Update this section whenever new files are added.

```powershell
Get-ChildItem -Recurse -File | Where-Object {
  $_.FullName -notmatch 'node_modules|\.next|\.git|\.venv|__pycache__|\.dart_tool|build'
} | Resolve-Path -Relative | Sort-Object
```

Current snapshot (last updated this session):

```
frontend_react/apps/web/src/
├── app/
│   ├── auth/page.tsx
│   ├── chat/[roomId]/page.tsx
│   ├── checkout/[id]/page.tsx
│   ├── communities/page.tsx            ← community listing page (fully built)
│   ├── community/[slug]/page.tsx       ← community detail page (fully built)
│   ├── community/create/page.tsx       ← create community page (fully built)
│   ├── dashboard/page.tsx
│   ├── event/[id]/page.tsx
│   ├── explore/page.tsx                ← explore/browse page
│   ├── globals.css
│   ├── layout.tsx
│   ├── organizer/create/page.tsx
│   ├── organizer/my-events/page.tsx    ← organiser's own events list
│   ├── organizer/onboarding/page.tsx   ← organiser onboarding flow
│   ├── organizer/page.tsx
│   └── page.tsx                        ← home / discovery page (fully API-driven)
├── components/
│   ├── CityPicker.tsx                  ← city selector dropdown
│   ├── EventCard.tsx                   ← card used in the main events grid (API-driven)
│   ├── EventChatWidget.tsx             ← AI chat widget on event detail page
│   ├── EventsCarousel.tsx              ← main grid + online events section (API-driven)
│   ├── CommunityCarousel.tsx           ← community cards carousel (API-driven)
│   ├── Footer.tsx                      ← site footer (green bg, brand links, social icons)
│   ├── HeroCarousel.tsx                ← rotating hero banner
│   └── navbar/Navbar.tsx
├── lib/
│   ├── api-config.ts
│   ├── card-adapters.ts               ← toCarouselEvent() + toCommunityItem() adapters
│   ├── data-source.ts                 ← DUMMY (fixtures) vs REAL (live API) switch — see below
│   └── fixtures/                      ← dummy events.ts + communities.ts (API-shaped)
└── providers/query-provider.tsx

frontend_react/packages/
├── api/src/        ← Axios client + per-service API functions
│   ├── communities.ts     ← communitiesApi: search/get/create with full fields (used by home page)
│   ├── community.ts       ← communityApi: organizer CRUD + getBySlug (used by /communities pages)
│   ├── events.ts          ← eventsApi
│   ├── auth.ts            ← authApi
│   ├── organizer.ts       ← organizerApi
│   ├── payments.ts        ← paymentsApi
│   ├── recommendations.ts ← recommendationsApi incl. ingestCity() + generateEventsForCity()
│   └── reviews.ts         ← reviewsApi
├── store/src/      ← Zustand stores
│   ├── auth-store.ts
│   ├── tickets-store.ts
│   ├── wishlist-store.ts  ← wishlist (fully functional, persisted as "eventmind-wishlist")
│   └── location-store.ts  ← city picker state, CITIES list, DEFAULT_CITY=New York. CITIES[0] is the "Online" pseudo-city (country "", lat/lng 0,0); use exported isOnlineCity(city) to detect it and switch queries to category="online" instead of a geo radius.
└── types/src/      ← shared TypeScript interfaces

backend/
├── gateway/main.py                     ← API gateway (port 8000)
├── scripts/shadow_runner.py            ← starts all services (alternative to start.bat)
├── scripts/seed_events.py              ← seeds SQLite with dummy events + communities
└── services/
    ├── auth/           (port 8001)
    ├── community/      (port 8011)     ← ⚠️ MUST start before user service (see below)
    ├── user/           (port 8002)
    ├── event/          (port 8003)
    ├── ticketing/      (port 8004)
    ├── payment/        (port 8005)
    ├── notification/   (port 8006)
    ├── chat/           (port 8007)
    ├── recommendation/ (port 8008)
    ├── review/         (port 8009)
    └── agents/         (port 8010)
```

---

## Prerequisites

Install these before doing anything else. If you already have them, skip ahead.

| Tool | Required version | How to check |
|---|---|---|
| Python | 3.10 or higher | `python --version` |
| Node.js | 20 or higher (project uses 24.16.0, see `.nvmrc`) | `node --version` |
| pnpm | any recent version | `pnpm --version` |

**Install pnpm** (if not already installed):
```powershell
npm install -g pnpm
```

Git must also be installed. Everything else is handled by the setup steps below.

---

## How to Run

There are two parts to run: the **backend** (Python) and the **React frontend** (Node.js). Run them in separate terminals. Both must be running for the app to work.

---

### Backend — First-Time Setup

Do this once when you first clone the project.

**Step 1 — Create a virtual environment**

A virtual environment keeps the project's Python packages isolated from your system. Run this from inside the `eventmind/` folder:

```powershell
cd "c:\Users\...\Event mind\eventmind"   # navigate to the eventmind folder
python -m venv .venv
```

This creates a `.venv` folder inside `eventmind/`. You only do this once.

**Step 2 — Activate the virtual environment**

Every time you open a new terminal to work on the backend, activate it first:

```powershell
.\.venv\Scripts\Activate.ps1
```

You'll see `(.venv)` appear at the start of your terminal prompt. That means it's active.

> If PowerShell blocks the script with an "execution policy" error, run this first (one time only):
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

**Step 3 — Install all backend dependencies**

With the venv activated, run the installer script. It walks through every service and installs all required packages:

```powershell
python backend\scripts\install_all.py
```

This may take a few minutes the first time. You only need to re-run it if new packages are added to any `requirements.txt`.

> **Python version note:** Some contributors have needed to manually bump certain package versions in the `requirements.txt` files to match their Python version (e.g. Python 3.12 or 3.13). If you get a dependency error during install or startup, open the `requirements.txt` of the failing service and upgrade the version of the conflicting package.

---

### Backend — Everyday Use

**Option A (recommended on Windows) — double-click `start.bat`**

`start.bat` is in the `eventmind/` root. Double-click it — it opens a separate terminal window for each service with all environment variables pre-set (API keys, database path, mock flags). It uses the `.venv` Python automatically.

**To stop the backend:** in the main `start.bat` window, press any key — it kills all uvicorn services and closes their windows. If you lost that window (e.g. closed it with X), run `stop.bat` (also in `eventmind/` root) to kill all services. Closing the service windows with the X icon individually leaves no orphaned ports, but is tedious. Note: stopping the backend does **not** stop the frontend dev server (port 3000) — that is a separate Node process; Ctrl+C its own terminal.

> ⚠️ `start.bat` contains real API keys — it is in `.gitignore` and must never be committed to git. Each developer keeps their own local copy.

**Option B — shadow_runner.py (cross-platform alternative)**

```powershell
cd "eventmind/"
.\.venv\Scripts\Activate.ps1
python backend\scripts\shadow_runner.py
```

Both options start all services on SQLite with mocked Kafka and Redis — no Docker needed:

| Service | Port | Notes |
|---|---|---|
| API Gateway | 8000 | |
| Auth | 8001 | |
| Community | 8011 | ⚠️ Must start BEFORE User service |
| User | 8002 | |
| Event | 8003 | |
| Ticketing | 8004 | |
| Payment | 8005 | |
| Notification | 8006 | |
| Chat (WebSocket) | 8007 | |
| Recommendation | 8008 | |
| Review | 8009 | |
| Agents | 8010 | |

> **⚠️ Community service MUST start before User service.** Both services define a `communities` table in SQLAlchemy. The community service (port 8011) has the full schema (`location`, `member_count`, `price`, `status`, `next_event_date`). The user service (port 8002) has a simpler schema. SQLAlchemy's `create_all` only creates the table once — whichever service starts first wins. `start.bat` and `shadow_runner.py` both start community before user for this reason. If you ever change startup order, seeding will fail with missing column errors.

> **Known manual startup issue (Windows):** If starting a service manually (not via start.bat or shadow_runner.py), set these env vars first:
> ```powershell
> $env:PYTHONPATH = "C:\...\Event mind\eventmind"
> $env:DATABASE_URL = "sqlite:///C:\...\Event mind\eventmind\backend\platform_dev.db"
> $env:JWT_SECRET = "<value from .env>"
> $env:MOCK_KAFKA = "TRUE"
> $env:REDIS_HOST = "MOCK"
> ```

**Step 4 (first time only) — Seed the database with dummy events**

The database starts empty. Without seeding, the discovery page will show "No events found." Run this once after the backend is up for the first time:

```powershell
# In a new terminal, with venv activated, from the eventmind/ folder:
python backend\scripts\seed_events.py
```

This seeds **dummy/fake events** for NYC, London, SF, Berlin, Amsterdam, Brussels, Thiruvananthapuram, and online — plus communities for Thiruvananthapuram. These are not real events; they exist only so the UI has something to display during development.

You only need to do this once per fresh database. The data persists across restarts. If you delete `platform_dev.db` and restart, re-run the seed script.

**Step 5 (optional) — Populate real events from Ticketmaster**

To fill the catalogue with real, ticketed events (concerts, sports, theatre) for the launch cities, sync from the Ticketmaster Discovery API:

```powershell
# One-time: add your free key to the project-root .env (see .env.example)
#   TICKETMASTER_API_KEY=your_key_here   (get one at developer.ticketmaster.com)

# One-time: add the provenance columns to an existing dev DB
python backend\scripts\migrate_add_source_columns.py

# Sync (full backend must be running — gateway + recommendation service).
python backend\scripts\sync_ticketmaster.py
python backend\scripts\sync_ticketmaster.py --city London --radius 150
```

**How aggregated events work:**
- There is **one** Ticketmaster pipeline. The fetch + normalisation logic lives in `backend/services/recommendation/app/services/ticketmaster_ingestion.py`, exposed as `POST /recommendation/ingest-city?city=&lat=&lng=&radius=` (the frontend city picker calls this on-demand). `backend/scripts/sync_ticketmaster.py` is just a thin launcher that calls that endpoint for each launch city — it does not duplicate any logic.
- Every `events` row now carries `source` (`"native"` for organiser events, `"ticketmaster"` for synced), `external_id` (provider id), and `image_url`.
- Ingestion is idempotent — the pipeline upserts via `POST /event/ingest` on `(source, external_id)`, so re-running updates rather than duplicates. Cron the launcher (every 30–60 min) for continuous refresh; Celery is not needed at this stage.
- Aggregated events are **discover-and-redirect**: the frontend should send users to the event's `event_website` ("Buy on Ticketmaster") rather than into the native checkout/chat flow. Treat them as top-of-funnel; native organiser events remain the long-term value. Respect Ticketmaster's API terms on caching/retention before production.
- The Discovery API caps any single query at 1,000 results, so the pipeline slices by classification segment and paginates within each. Ticketmaster segments are mapped onto EventMind categories (Music→Creative, Sports→Networking, …) so aggregated events sit alongside native ones.

---

### React Frontend — First-Time Setup

You need Node.js (v20+) and pnpm installed. If you don't have pnpm:

```powershell
npm install -g pnpm
```

Then install all frontend dependencies (once):

```powershell
cd "eventmind/frontend_react"
pnpm install
```

Make sure `apps/web/.env.local` exists with:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
(There is an `.env.local.example` file you can copy and rename.)

### React Frontend — Everyday Use

```powershell
cd "eventmind/frontend_react"
pnpm --filter @eventmind/web dev:webpack
# Opens at http://localhost:3000
```

#### Dummy vs Real data mode (frontend without a backend)

Events & communities can be sourced from **local fixtures** (no backend needed) or the **live backend**, toggled by `NEXT_PUBLIC_DATA_MODE` in `apps/web/.env.local`:

```
NEXT_PUBLIC_DATA_MODE=dummy   # local fixtures — beautify/UI work, no backend running
NEXT_PUBLIC_DATA_MODE=real    # live backend via the gateway (default when unset)
```

- Implemented in [`src/lib/data-source.ts`](frontend_react/apps/web/src/lib/data-source.ts): pages import `eventsSource` / `communitiesSource` / `communitySource` instead of `eventsApi` / `communitiesApi` / `communityApi`. Same method shapes + `{ data }` envelope, so call sites are identical. Only **read** paths switch; mutations (create/pay) always hit the real API.
- Dummy data lives in [`src/lib/fixtures/`](frontend_react/apps/web/src/lib/fixtures/) as API-shaped `Event[]` / `Community[]` (dates computed relative to now so badges stay live). In dummy mode geo/city/price/date filters are ignored so the UI is always populated; only online-vs-offline (category `"online"`), a loose text query, and `limit` are honoured.
- `NEXT_PUBLIC_*` vars are inlined at dev-server start — **restart the dev server after changing the mode.**
- Switched surfaces: home (`/`), `/explore`, `/event/[id]`, `/checkout/[id]`, `/community/[slug]`. In dummy mode the home page also skips the Ticketmaster auto-ingest.

> **⚠️ On low-RAM (8 GB) machines, use `dev:webpack`, NOT plain `dev`.**
> The default `pnpm --filter @eventmind/web dev` uses **Turbopack**, which spawns a large
> parallel worker pool to compile routes. On an 8 GB machine that exhausts physical RAM, so
> Windows starts swapping to disk and the **entire laptop hangs** (unresponsive mouse/windows —
> that's disk thrashing, not a crash). The workers then die with `Zone Allocation failed /
> JavaScript heap out of memory`, leaving orphaned `node` processes that pile up across runs.
> `--max-old-space-size` does NOT help (the limit is physical RAM, not the heap).
>
> **Always run the webpack dev server instead** — it spawns ~3 workers instead of hundreds:
> ```powershell
> pnpm --filter @eventmind/web dev:webpack
> ```
>
> Note: whether the laptop hangs has **nothing to do with the backend**. The frontend dev server
> uses the same memory with or without the backend running — a missing backend only makes API
> calls fail *inside the page*, it does not hang the machine.

---

## Architecture

### Backend
Microservices architecture. All API calls from the frontend go through the gateway at port 8000, which routes to the appropriate service. Do not call individual service ports directly from the frontend.

Gateway routing pattern: `GET /event/search` → `http://localhost:8003/events/search`

### React Frontend (Turborepo monorepo)
```
frontend_react/
├── apps/web/                  ← Next.js 16, App Router, TypeScript, Tailwind v4
└── packages/
    ├── types/                 ← shared TypeScript interfaces
    ├── store/                 ← Zustand stores (persisted to localStorage)
    └── api/                   ← Axios client + per-service API functions
```

All pages are in `apps/web/src/app/`. Shared logic goes into `packages/` so it can later be reused by the mobile app (planned).

Auth state and tickets are stored in Zustand, persisted to localStorage under the keys `eventmind-auth` and `eventmind-tickets`. If something looks wrong with login or ticket state, clear those keys in DevTools → Application → Local Storage.

The JWT access token payload contains `sub` (user UUID), `email`, and `role`. The `sub` field is used as the organiser ID when creating events.

**Adding a new npm package** to the web app:
```powershell
pnpm --filter @eventmind/web add <package-name>
# or to a shared package:
pnpm --filter @eventmind/api add <package-name>
```

Environment variable — create `apps/web/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Component Registry

Keep this updated as components are created or significantly changed.

| File | Purpose | Notes |
|---|---|---|
| `components/EventsCarousel.tsx` | Main events grid + online events section | API-driven via `toCarouselEvent()`. Exports `CarouselEvent` type **and `EventCardItem`** — the card actually used by home, `/explore` and `/community/[slug]` (not `EventCard.tsx`). Accepts `events`, `isLoading`, `onBookNow`, `locationSlot` props. Share/wishlist come from `EventActions.tsx`; it no longer defines its own. |
| `components/CommunityCarousel.tsx` | Community cards carousel on the home page | API-driven via `toCommunityItem()`. Exports `CommunityItem` type. |
| `components/EventBadges.tsx` | **The** event tags — both families. **Status tags** (Free / Selling Fast / This Week / Today / Recommended / Sold Out): `BadgeType`, `BADGE_CONFIG`, `EventBadge`, `EventBadges`. **Category tag** (Music / Arts & Culture / …): `CategoryBadge`, `categoryColor`. | **Import these — never re-declare BADGE_CONFIG or pick your own category colour.** Used by the cards (`EventsCarousel`) AND the `/event/[id]` hero. `EventBadges` renders nothing for an empty/absent list, so callers need no length check. All colours are fixed semantic accents (same in light + dark) — the tags render on the hero's dark photo scrim, which is dark in both themes. **Which** status tags an event gets is decided in ONE place: `toCarouselEvent()` in `lib/card-adapters.ts` — a `BADGE_CONFIG` entry that nothing emits is dead (see "Known design inconsistencies"). **Category colours:** one fixed colour per category, looked up case-insensitively in `CATEGORY_COLORS`; an unlisted category hashes onto the same palette so it still gets one stable colour. Deliberately a *softer* family than the status pills (translucent tint + pale text, vs. solid fill + linen text) because the two sit at either end of one row on `/event/[id]`. |
| `components/EventActions.tsx` | **The** round event controls: `EventShareButton`, `EventWishlistButton`, `EventBackButton`. | **Import these — never hand-roll another share/heart/back.** Used by the cards (`EventsCarousel`) AND the `/event/[id]` hero, so the two cannot drift. Share + wishlist take a `CarouselEvent` (call `toCarouselEvent(event)` if you hold an API `Event`), so a wishlist save is identical from any surface. All three share one chrome: linen circle, muted icon that goes **green on hover**, hover label pill. Props: `labelSide` ('left' \| 'right') puts the hover label on the side away from the anchored edge; `size` ('sm' = 32px, the card overlay default \| 'lg' = 48px, for standalone surfaces like the event hero). `EventBackButton` also takes `onClick` — it is a dumb button, the caller decides where "back" goes; its label says "Go back" (not a named destination) because `/event/[id]` passes `router.back()`. **Need a variant? Add a prop here — do not fork the file.** |
| `components/EventCard.tsx` | ⚠️ **DEAD CODE — nothing imports it.** The real card is `EventCardItem` in `EventsCarousel.tsx`. | Kept only to avoid an unrequested deletion; see "Known design inconsistencies". Uses `@eventmind/types Event` (different from `CarouselEvent`). |
| `components/HeroCarousel.tsx` | Auto-rotating hero banner at the top of the home page | 5 image-only slides (no text overlay), diagonal clip-path wipe animation, 16:9 aspect ratio (maxHeight 85vh). Images are local PNGs in `apps/web/public/hero/` (`hero-2,3,4,5,7.png`); update the `IMAGES` array to add/remove. Uses `<img>` (not `next/image`) because the wipe relies on `clip-path`. |
| `components/CityPicker.tsx` | City selector dropdown | Uses `useLocationStore`. CITIES list includes NYC, London, Berlin, etc. Default city is New York. |
| `components/EventChatWidget.tsx` | AI chat widget on event detail page | Allows attendees to chat with an AI about the event. The floating launcher button is **terracotta** (`--brand-terracotta`), not green — so it reads as a distinct accent instead of competing with the green Book Now / booking card CTAs. The panel internals (send button, user bubbles) remain green. |
| `components/Footer.tsx` | Site footer, rendered on the home page | Green (#184E4A) background, linen text, link columns (Discover / For Organisers / Company), social icons. |
| `components/navbar/Navbar.tsx` | Sticky top navigation | Desktop nav on `lg+`, hamburger mobile menu on `<lg`. Search bar with inline city picker, Events + Communities dropdowns, notification bell (no-op), auth-aware avatar menu (My Dashboard, My Wishlist, My Organised Events [org only], Organiser Console, Settings, Log Out). Detects organizer status via `organizerApi.get()` (5-min React Query cache). Includes the sun/moon **theme toggle** (desktop: after "Help"; mobile: a row in the hamburger panel) via `useTheme()`. |
| `lib/card-adapters.ts` | Type adapters from API shapes to card component shapes | `toCarouselEvent(Event → CarouselEvent)`, `toCommunityItem(Community → CommunityItem)`. Uses `picsum.photos/seed/<id>` for placeholder images. |
| `components/brand/*` | Official NewFind logo/wordmark/loader, built from the assets in `eventmind/logo_and_wordmark/`. | Inline SVG so they tint via `currentColor`: `BrandMark` (face glyph, fixed terracotta dot), `Wordmark` (Lobster Two "NewFind" — exact master paths, injected via `dangerouslySetInnerHTML`), `BrandLogo` (horizontal lockup = mark + wordmark), `BrandLoader` ("breathing aura" loading state). Colour is driven by the theme-aware `--brand-logo` var (green in light, linen in dark); set `color` on a wrapper to re-tint. Used by Navbar, Footer (fixed linen), `/auth` hero, and `app/loading.tsx`. Loader keyframes (`nf-aura/nf-breathe/nf-blink`) live in `globals.css` and respect `prefers-reduced-motion`. Favicon/PWA/OG assets are in `public/brand/` + `public/manifest.webmanifest`, referenced from `layout.tsx` metadata. |
| `components/ShareButton.tsx` | ⚠️ **Effectively dead** — its only importer is the dead `EventCard.tsx`. Use `EventActions.tsx` instead. | Opens the native share sheet with the generated **story image** (`navigator.share({ files })`) on supported devices; otherwise pops `ShareModal`. Props: `event`, `className` (size/position), `iconClassName`, `stopPropagation`. |
| `components/ShareModal.tsx` | Desktop fallback for the share flow. | Previews the 9:16 story card and offers **Download image** + **Copy link**. Shown only when the native share sheet is unavailable (i.e. **not** on Chrome/Edge on Windows, which do support Web Share — you'll get the OS share sheet there instead). **Portalled to `<body>` via `createPortal` — do not remove.** It is opened from inside event cards / the event hero, which are `overflow-hidden`, fade to `opacity-0` when un-hovered, and apply a `transform` on hover; a transformed ancestor becomes the containing block for `position: fixed`, so rendering in place pins the overlay inside the card and clips it away. |

> Add new components here as they are created.

### Event sharing — link unfurl (1b) + story card (1c)

Sharing an event produces two branded graphics, both generated server-side with `next/og` `ImageResponse` (no new deps) from the event's **own** picture (`image_url`, or the same `picsum.photos/seed/<id>` placeholder the card uses):

- **Link unfurl (paste anywhere — iMessage/WhatsApp/Slack):** `app/event/[id]/opengraph-image.tsx` renders the 1200×630 card (event image left, NewFind mark → title → "place · date · price"). `app/event/[id]/layout.tsx` is a server component whose only job is `generateMetadata()` (title/description/OG/Twitter); Next auto-wires the `opengraph-image` route into `og:image`/`twitter:image`. The page itself stays a client component.
- **Share button → story (post to a story):** `app/event/[id]/story/route.tsx` returns a 1080×1920 PNG (full-bleed event image, "YOU'RE INVITED" → title → "category · place" → "Join on NewFind"). `lib/share-event.ts` fetches it and hands it to `navigator.share`; falls back to `ShareModal`.
- Shared helpers in `lib/event-media.ts` (`eventImageUrl`/`priceLabel`/`locationLabel`/`shortDate`) and `lib/event-server.ts` (`getEventForShare`/`siteOrigin`). Set `NEXT_PUBLIC_SITE_URL` in production so absolute share URLs/`metadataBase` are correct (defaults to `http://localhost:3000`).

---

## Brand & Design — Read Before Building Any New Page

Before building a new feature, read the PRD at `Eventmind_files/eventmind_prd.md` to understand the product intent. Do not build features that are not in the PRD without confirming with the team first.

EventMind's design is clean, minimal, and premium — inspired by functionhealth.com (aesthetic) and austoentertainment.com (colour palette). **User-friendliness, simplicity, and consistency are the top priorities.** Do not add unnecessary complexity, decorations, or features.

### ⚠️ Consistency is a requirement, not a preference — read this first

**The same thing must look and behave the same way everywhere in the app.** A user moving from the home page to an event page to a community page should never notice that two different people built them. This outranks matching a mockup pixel-for-pixel: if a mockup conflicts with an established pattern, say so and ask before diverging.

Concretely, before you build any UI:

1. **Search for the pattern before you write it.** If a share button, favourite/heart, date row, price chip, badge, or empty state already exists somewhere, **import that component**. Do not hand-roll a second version. A second version is a bug, even when it looks fine on its own.
2. **One control = one component.** Share + wishlist controls live in [`components/EventActions.tsx`](frontend_react/apps/web/src/components/EventActions.tsx) and are used by BOTH the cards and the `/event/[id]` hero. If a control needs to look different on a new surface, add a **prop** (see `labelSide`), do not fork the file.
3. **One icon per concept.** A calendar means the same glyph everywhere; same for location, time, person. Do not introduce a new icon for a concept that already has one.
4. **Consistent ≠ identical behaviour by accident.** If two surfaces share a look, they must share the code — otherwise they silently drift. Copy-paste is how the drift starts.
5. **If you find an inconsistency, report it.** Do not quietly work around it, and do not unilaterally restyle a shared surface to fix it — flag it and let Gautham decide, because a "fix" in one place changes every other place.

> **Known outstanding inconsistencies** are tracked under "Known design inconsistencies (open)" below. Check that list before assuming something is intentional.

### Colour palette — use these exact values everywhere, no substitutes

| Token | Hex | Where |
|---|---|---|
| Green | `#184E4A` | Buttons, CTAs, wordmark, active states, icons |
| Linen | `#F2EFEA` | Navbar bg, page bg, dropdown bg, scaffold bg |
| Text | `#111827` | All body text and headings |
| Border | `#E2DDD5` | Input borders, card borders, dividers |
| Nav border | `#C8C1B8` | Navbar bottom border, event card borders |
| Hint/muted | `#9CA3AF` | Placeholder text, secondary labels |

**Why linen and not white for backgrounds?** `#184E4A` reads as near-black on pure white. Linen gives it the clearly-green appearance the brand needs.

**Colour naming convention (user instructions):**
- When Gautham says **"green"** or **"green shade"** → always use `#184E4A`. Never use any other green (e.g. `#16a34a`, Tailwind `green-*`).
- When Gautham says **"white"** or **"white shade"** (unless he explicitly means pure white) → always use linen `#F2EFEA`. Pure white `#FFFFFF` is only acceptable for text on dark/coloured backgrounds (e.g. badge labels, button text on green).

### Theming — light/dark (IMPORTANT: colours are now CSS variables)

The app has a **light/dark theme** with a sun/moon toggle in the navbar. The brand palette above is no longer hardcoded — every colour is a `--brand-*` CSS variable defined **once** in `apps/web/src/app/globals.css` (light in `:root`, dark in `:root[data-theme="dark"]`). **Do not reintroduce raw brand hexes** (`#184E4A`, `#F2EFEA`, etc.) in components — use the variables:

- Tokens: `--brand-green`, `--brand-green-hover`, `--brand-on-green` (text/icons that sit ON a green fill), `--brand-bg` (page), `--brand-surface` (cards/navbar/inputs), `--brand-text`, `--brand-border`, `--brand-nav-border`, `--brand-hint`.
- **Terracotta accent:** `--brand-terracotta` (`#C1603F`), `--brand-terracotta-hover`, `--brand-on-terracotta` (white). Used by the event-assistant chat button. (It used to be the `/event/[id]` category badge too; that badge now takes a per-category colour from `EventBadges.tsx`, where terracotta survives as the "Other"/"General" colour.) **Deliberately the same hex in both themes** — it is a semantic accent, not a themed surface, so it sits with the badge reds/golds rather than the green/linen system. Use the token, not the hex: `BRAND.terracotta` or `var(--brand-terracotta)`. (Some older raw `#C1603F` literals still exist — e.g. the "spots left" chip and social-proof avatars on `/event/[id]`; migrate them to the token when you next touch that code.)
- In inline styles: `style={{ color: "var(--brand-text)" }}` or import the `BRAND` string map from `@/lib/theme` (`BRAND.green`, `BRAND.onGreen`, …).
- In Tailwind classes: arbitrary values with the var, e.g. `text-[var(--brand-hint)]`, `bg-[var(--brand-surface)]`.
- **The old `LINEN` was overloaded** (page bg AND text-on-green). These diverge in dark mode — map background uses to `--brand-surface`/`--brand-bg` and text-on-green uses to `--brand-on-green`.
- Alpha tints: use `color-mix(in srgb, var(--brand-green) N%, transparent)` — a CSS var can't take a hex-alpha suffix like `${GREEN}14`.
- Theme plumbing: `ThemeProvider`/`useTheme()` in `apps/web/src/providers/theme-provider.tsx`; persisted to localStorage key `eventmind-theme`; a no-flash `<head>` script in `layout.tsx` sets `data-theme` before first paint.
- **Dark palette is "warm green-black".** To switch to neutral dark-gray, uncomment the `.dark-gray alternate` block inside the `[data-theme="dark"]` rule in `globals.css` — no component edits needed.
- **Intentionally left fixed (not themed):** `Footer.tsx` (deep-green block), `HeroCarousel` letterbox, and semantic accent colours (badge reds/oranges/blues, star gold, error red, status green/amber, Google/Facebook brand colours).

### Typography

**Single-font architecture (one source of truth).** The whole app uses **one font by default** — currently **Roboto** — loaded exactly once in `layout.tsx` and exposed as the CSS variable `--font-app`. `globals.css` maps that variable to the `body` font-family and to Tailwind's `--font-sans` token, so every page and component inherits it automatically. There are **no per-component font declarations** — do not re-import a font in a component or set `fontFamily` inline.

**To swap the font** (e.g. Roboto → Inter): change only the two marked lines in `layout.tsx` — the `next/font/google` import and the loader call (`Roboto({ … })` → `Inter({ … })`). Keep `variable: "--font-app"` unchanged. Nothing else needs to touch.

Do not introduce a second font without explicit approval. If a component genuinely needs to opt out, it should reference its own scoped font, but the default for everything is `--font-app`.

**Font-size floor: 15px minimum.** No text renders below **15px** anywhere. A single rule in `globals.css` raises `text-xs` (12px), `text-sm` (14px), and arbitrary `text-[9px]`…`text-[14px]` to `15px !important`; sizes already ≥15px are untouched. This gives the site a comfortable, Talk_to_file-like scale (their effective minimum was ~14–15px). This is safe because the app uses no responsive text scaling (no `md:text-*` etc.) — if you ever add responsive size-ups from a small base, revisit the `!important`. To change the minimum site-wide, edit the single `font-size` value in that rule. Do not add new sub-15px font sizes.

**Prominent-copy scale (above the floor).** So key copy doesn't sit at the 15px minimum, these use fixed sizes: a **page subtitle** (the `<p>` under a page `<h1>`) is **18px**; an **empty-state heading** is **18px** and its **helper line** is **16px**. Applied consistently across Explore, Organizer console, My Events, Create Event, Onboarding, Create Community, and Community detail. Follow this on new pages. Card type is exempt (see below).

**Opt-out via `data-keep-type`.** An element (and its subtree) carrying the `data-keep-type` attribute is exempt from the floor, so components with deliberately small, hand-tuned type keep it. Currently only [`EventCard.tsx`](frontend_react/apps/web/src/components/EventCard.tsx) uses it (its 11/12/14px type is intentional and must not change). The event/community **carousels** already use no sub-15px type, so they need no marker and the floor never affects them. Add `data-keep-type` to any future card whose small type must be preserved.

### Known design inconsistencies (open)

Found during the `/event/[id]` hero work. **Not yet fixed — do not assume these are intentional.** Agreed with Gautham to tackle the icon unification as a separate task.

1. **Three different icon sets for the same concepts.** Date/time/location are drawn three ways:
   - `EventsCarousel.tsx` — `CalendarIcon` (filled, `viewBox 0 0 1024 1024`), `LocationPinIcon` (filled teardrop), plus a *fourth* `PinIcon` (different again) used elsewhere in the same file.
   - `event/[id]/page.tsx` — outline heroicons (`stroke`, 22px, green) in the booking card.
   - `EventCard.tsx` — outline heroicons at 12px.
   → Pick ONE set and apply it everywhere. This is the next scheduled design task.
2. **`components/EventCard.tsx` is dead code.** Nothing imports it. The card actually rendered on home / `/explore` / `/community/[slug]` is `EventCardItem`, exported from `EventsCarousel.tsx` — a confusingly similar name. `EventCard.tsx` is the only remaining consumer of `components/ShareButton.tsx`, so **that file is effectively dead too**. Both are candidates for deletion; confirm with Gautham first.
3. **Two of the six badge types are dead for real data.** `BADGE_CONFIG` defines `today` and `recommended`, but `toCarouselEvent()` only ever emits `sold-out`, `selling-fast`, `this-week`, `free`. Nothing else produces `badgeTypes`, so **a real event can never be tagged Today or Recommended** — those two only appear on the hardcoded sample array inside `EventsCarousel.tsx`. Consequence: the **"Recommended" filter tab** on the home page filters on `badgeTypes?.includes('recommended')`, so it cannot match a live event. Either emit the tags from `toCarouselEvent` (needs a "recommended" signal from the backend) or drop the tab + config entries.
4. **`CommunityCarousel.tsx` has its own copy of `BADGE_CONFIG`** (communities use a subset). Not merged with `EventBadges.tsx` because community badges are a different domain — but the colours are duplicated and will drift.
5. **`CommunityCarousel.tsx` still has a decorative share button.** Its local `ShareButton` (two usages) only calls `preventDefault/stopPropagation` — it looks like a share control and does nothing. The equivalent bug on the event cards is now fixed via `EventActions.tsx`; the community cards need the same treatment (they need a community share flow, which does not exist yet).
6. ~~**The `/event/[id]` category badge is a different shape to the status tags.**~~ **Resolved (decided, not changed):** the category tag stays `rounded-lg` while the status tags stay `rounded-full`. Gautham's call — the two now sit at opposite ends of the row (category left, status right) rather than adjacent, and the differing shape + softer colour family help signal "category" vs "status". Do not "fix" this.
7. **Organiser name is hardcoded** to "EventMind Collective" on `/event/[id]` (see "What Is Not Built Yet").
8. **`/event/[id]` is not responsive below the hero.** The main grid is a fixed `gridTemplateColumns: "2.4fr 1fr"` with no breakpoint, and the page uses a flat `px-12` instead of the standard `px-4 sm:px-6 lg:px-12`. On a phone the booking card overflows the viewport. Pre-existing; the hero itself is responsive.

### Hover states (navbar and interactive elements)
On hover: background → `#184E4A`, text/icon → `#F2EFEA`. This pattern is used throughout the navbar, all dropdown items, and event cards. Maintain it for any new interactive elements.

### Spacing and layout
- Navbar height: 72px, horizontal padding: `px-12` (48px)
- Page content: `px-12` horizontal padding to align with navbar
- Cards: `rounded-2xl`, border `#C8C1B8`, linen background (`#F2EFEA`)
- Buttons: `rounded-xl` or `rounded-2xl`

### Tone of UI copy
Conversational but professional. Avoid jargon. Keep labels short. Example: "Claim Free Ticket" not "Register for Free Event".

---

## Performance Rules

- Use `next/image` for all images. **Never use `<img>` tags.**
- Use `next/link` for all internal navigation. **Never use `<a>` tags directly.**
- Lazy-load components below the fold with `next/dynamic` where appropriate.
- Always provide a meaningful `sizes` prop on `<Image>` components — do not leave it as the default.
- Do not add new npm dependencies without asking first.
- Do not import from `node_modules` paths that are not in `package.json`.

---

## What Has Been Built (React)

For the full technical breakdown, read `Eventmind_files/REACT_MIGRATION.md`.

Summary of working pages:

| Route | What it does |
|---|---|
| `/` | Discovery page — hero carousel, city-based EventsCarousel + CommunityCarousel (API-driven), Footer |
| `/auth` | Login / register toggle — two-column layout (hero panel on `lg+`, form-only on mobile), Google/Facebook buttons (disabled, "Coming soon") |
| `/event/[id]` | Event detail — **full-bleed hero** (edge-to-edge event photo under a dark scrim, no side gutters, no corner radius) with a back button top-left, wishlist + share top-right, and a **centre-aligned, always-one-line** title; on the line below it the **category tag sits left** and **every status tag that applies sits right** (Free / Selling Fast / This Week / Sold Out — rendered by `EventBadges.tsx`, so a tag is identical to the one on a card); then description, reviews with star ratings, booking card, sticky booking bar, auth guard. **Date/time/location live in the booking card, not the hero.** All three round controls (back / wishlist / share) come from `EventActions.tsx` at `size="lg"`, so they match the event cards and each other. The category tag is a per-category colour from `EventBadges.tsx` (no longer terracotta). Main grid is `2.4fr 1fr` (not `2fr`) to pull the booking card right while keeping its right edge on the shared px-12 line. **One-line title:** `heroTitleSize()` in `page.tsx` scales the font down as the title gets longer (`clamp(20px, min(5, 169/chars)vw, 64px)`) and the `h1` is `whitespace-nowrap`; `overflow-hidden`+ellipsis is the last-resort guard so a pathological title clips instead of wrapping or forcing a horizontal page scroll. Verified 1-line for the seeded titles at 1440px. |
| `/checkout/[id]` | Checkout — order summary + payment; free events skip card form (800ms fake delay); paid events use Stripe intent (2s fake delay); success modal → `/dashboard` |
| `/dashboard` | User dashboard — 3 tabs: My Tickets (QR codes via qrserver.com), My Wishlist, Networking Profile (hardcoded interests) |
| `/organizer` | Organiser console — 3 stat cards (Active Events real, Revenue + Attendees mocked), events table |
| `/organizer/create` | Create/publish event — Event Type toggle (In-Person/Online/Hybrid), Save as Draft + Publish, inline validation, organizer verification guard |
| `/organizer/my-events` | Organiser's own published events list, auth guard |
| `/organizer/onboarding` | One-time KYC form — company name, address, country, registration number (label changes per country) |
| `/chat/[roomId]` | Live WebSocket chat room — connection status indicator, left/right message alignment by sender |
| `/explore` | **Unified browse page for events AND communities.** 3-segment view switch below the search row — `View Events` / `View Communities` / `View Both` (default Both), synced to `?view=` (omitted = both). A contextual **Create** button sits inline to the right of the switch: `Create Event` in events view (→ `/organizer/create`), `Create Community` in communities view (→ `/community/create`), **none** in Both view. In **View Both** events + communities render as a single mixed grid (interleaved, no section headings); single-content views show just that type. Controls: shared search box, city picker, **Sort by** (Relevance / Date / Name / Price / Popularity — client-side, synced to `?sort=`), and a collapsible **Filters** panel (category for both; format/date/free apply to events only and hide in communities-only view). When city = `Online`, both queries switch to `category=online` instead of a geo radius. Events use `eventsApi`, communities use `communitiesApi` (city-aware). |
| `/communities` | **Permanent redirect → `/explore?view=communities`** (server-side `redirect()`). The old standalone listing was merged into `/explore`. |
| `/community/[slug]` | Community detail — hero banner, linked events grid |
| `/community/create` | Create community (organiser only) — eligibility gate: requires 2+ published events (progress bar shown if ineligible), redirects if already has a community |

Additional pages (all now active):

| Route | What it does |
|---|---|
| `/communities` | Redirects to `/explore?view=communities` (community browsing now lives on the unified Explore page) |
| `/community/[slug]` | Community detail page |
| `/community/create` | Create a community (organiser only) |
| `/explore` | Unified browse page for events + communities (see table above) |
| `/organizer/my-events` | Organiser's own events list |
| `/organizer/onboarding` | Organiser onboarding flow |

**Home page behaviour (important):**
- On load, fetches events near the selected city via `eventsApi.search()` and separately fetches online events (lat/lng 0,0 — so they show regardless of city).
- On first visit to a new city, auto-calls `recommendationsApi.ingestCity()` to pull events from Ticketmaster. This is done **once per city**, tracked in localStorage under `eventmind-ingested-cities`. If ingestion returns 0 events, falls back to `recommendationsApi.generateEventsForCity()` (AI generation) after a 3-second delay.
- Wishlist is fully functional — persisted to localStorage under `eventmind-wishlist`.

**Responsiveness:**
All pages are responsive. Standard patterns used throughout:
- Grids: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`
- Horizontal padding: `px-4 sm:px-6 lg:px-12`
- Navbar: desktop layout on `lg+`, hamburger + collapsible menu on `<lg`
- Auth page: two-column (hero + form) on `lg+`, form-only on mobile
- HeroCarousel: 16:9 aspect ratio (`aspectRatio: "16 / 9"`, `maxHeight: 85vh`)

**Auth guard pattern:**
Protected pages (`/dashboard`, `/checkout`, `/chat`, `/organizer/*`) use a `useEffect` that reads `useAuthStore.isAuthenticated` and redirects to `/auth` if false. JWT is decoded with `atob()` + `JSON.parse()` (no external library). Tokens persisted in localStorage under `eventmind-auth`.

---

## What Is Not Built Yet

Read the full breakdown in `Eventmind_files/REACT_MIGRATION.md` under "What Is Not Built Yet". Key gaps:

- **Chat** — page exists but only reachable via ticket card. No inbox, no room list, not in main nav.
- **Notification bell** — icon present, no panel or backend integration.
- **Help page** — link present, no page.
- **Real ticket issuance** — tickets saved to Zustand/localStorage only, not to the database.
- **Social login** — buttons present but disabled.
- **SEO metadata** — event pages now have `generateMetadata()` + OG/story share images (see "Event sharing" above). Other dynamic routes (`/community/[slug]`, etc.) still need their own `generateMetadata()`.
- **Mobile app** — monorepo is structured for it (`apps/mobile`), not started yet.
- **Event image/banner upload** — the schema now has an `image_url` column (populated for synced Ticketmaster events). Native organiser upload (file → storage → `image_url`) is still not wired up; the create form has no image field yet.
- **Ticket tiers** — backend only supports a single price per event; multi-tier (Free/Standard/VIP) needs schema changes.
- **Ticketmaster geocoding** — Ticketmaster ingestion runs but many events have no venue coordinates. Currently saved with `lat:0, lng:0`. Needs geocoding API (Google Maps or Nominatim) to resolve real coordinates. See `backend/services/recommendation/app/services/ticketmaster_ingestion.py`.
- **Hardcoded organizer name on event detail** — `/event/[id]` shows "EventMind" as the organizer name rather than the actual organizer's name. Needs a lookup (or include organizer name in the event schema).
- **Networking Profile tab** — interests section on `/dashboard` profile tab shows hardcoded values (Technology, AI, Venture Capital). Needs real user profile storage.
- **Chat entry point** — `/chat/[roomId]` is only reachable via ticket card in the dashboard. No chat inbox, no room list, not linked from the main nav.

## Planned Work

### Ticketmaster Event Ingestion
- Lives in `backend/services/recommendation/app/services/ticketmaster_ingestion.py`
- Triggered by `POST /recommendation/ingest-city?city=...&lat=...&lng=...&radius=100` via the gateway
- **The home page now calls this automatically** on first visit to any city (tracked in `eventmind-ingested-cities` in localStorage). If the city is still empty after ingestion, it falls back to `recommendationsApi.generateEventsForCity()` for AI-generated events.
- Events are fetched from Ticketmaster and saved directly into `platform_dev.db` via the event service — there is no separate file
- **Current bug:** Many Ticketmaster events have no venue coordinates. Temporary fix saves them with `lat:0, lng:0`. Real fix requires geocoding (not yet implemented).
- Once geocoding is added and this works end-to-end, `seed_events.py` becomes unnecessary for populating events (though it will still be useful for seeding communities)

### Running on PostgreSQL (implemented)
Shadow mode (`shadow_runner.py`) uses one shared SQLite file. To run on Postgres instead — one database per service, matching production — use `postgres_runner.py`. No code/model changes are needed; SQLAlchemy handles both dialects and `create_all` builds the schema on startup.

```powershell
# 1. Start Postgres (creates the 8 per-service DBs on first init via
#    backend/db/init/01-create-databases.sql; data persists in the pgdata volume)
docker compose up -d postgres

# 2. Install the driver (also in each DB-backed service's requirements.txt)
python -m pip install psycopg2-binary

# 3. Start all services against Postgres (Kafka + Redis still mocked)
python backend\scripts\postgres_runner.py

# 4. Load data (use PYTHONUTF8=1 on Windows so seed prints don't crash on cp1252)
$env:PYTHONUTF8=1; python backend\scripts\seed_events.py
python backend\scripts\sync_ticketmaster.py
```

- **Per-service DBs:** only services whose `config.py` declares `DATABASE_URL` get one — `auth_db, user_db, event_db, ticketing_db, payment_db, chat_db, review_db, community_db`. `gateway`, `agents`, `recommendation`, `notification` are stateless.
- **Host port 55432**, not 5432 — `docker-compose.yml` maps `55432:5432` to avoid clashing with a native Postgres that may already own 5432. Connect with `postgresql://user:password@localhost:55432/<svc>_db`. Override via `PG_DSN_BASE`.
- **Inspect:** `docker compose exec -T postgres psql -U user -d event_db -c "\dt"`.

---

## Contribution Guidelines

When you complete work in a session:

1. **Update this file (`CLAUDE.md`)** — add anything that would help the next Claude instance pick up without re-asking. Keep it factual and forward-looking, not a session log.
2. **Save new documents to `Eventmind_files/`** — not inside `eventmind/`. That folder is for code only.
3. **Keep `Eventmind_files/REACT_MIGRATION.md` current** — update the "Pages Built" table and "What Is Not Built Yet" section as features are completed.
4. **Update the Component Registry above** — whenever a component is created or its purpose changes significantly.
5. **Run `pnpm --filter @eventmind/web type-check` before finishing** — all changes must be type-error free. This is non-negotiable.
6. **Match the brand palette exactly** — do not introduce new colours or fonts without approval. The app uses a single font (currently Roboto) defined once in `layout.tsx` as `--font-app`; everything inherits it. See the Typography section.
7. **Test in the browser** — for UI changes, run the dev server and visually verify the change before reporting it done. Type-checking does not catch visual bugs.
8. **Keep Node.js at v20+** — the project `.nvmrc` pins 24.16.0. If you use nvm, run `nvm use` inside `frontend_react/` to switch automatically.
9. **Do not commit `.env.local` or `start.bat`** — both are in `.gitignore`. Never commit secrets or local environment files.
10. **If you delete `platform_dev.db`** — restart all services first (so the community service creates the communities table), then re-run `seed_events.py`.
11. **Always stop the dev server with `Ctrl+C` in its terminal** — do not just close the window or kill the terminal. On Windows, killing the terminal leaves the Next.js Turbopack worker processes orphaned. They accumulate across runs (we once found 321 zombie `node` processes), eat RAM, and cause `Zone Allocation failed / JavaScript heap out of memory` crashes on subsequent runs — especially on low-RAM (8 GB) machines. If a run ever crashes, clean up the orphans before retrying:
    ```powershell
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'next' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
    ```
