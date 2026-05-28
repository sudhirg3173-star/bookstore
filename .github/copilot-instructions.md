# Copilot Instructions — Kabdwal Bookstore

## Commands

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm run lint      # ESLint via next lint
```

There is no test suite. No test runner is configured.

## Architecture

Next.js 14 App Router project. All pages are in `src/app/`, all reusable components in `src/components/`, data-access in `src/lib/`, and Zustand stores in `src/store/`.

**Data layer** (`src/lib/`):
- `books.ts` — reads `data/wiley_books.csv` at runtime via Node.js `fs`, parses it with a custom character-level CSV parser, and caches results in a module-level `_books` variable. Call `invalidateBooksCache()` after any write.
- `standards.ts` — same pattern for `data/standards.csv`. Uses `standardSlug()` for URL slugs.
- `adminCsv.ts` — low-level `readCSV`/`writeCSV` helpers used by admin API routes. Exposes `BOOKS_CSV_PATH` and `STANDARDS_CSV_PATH` constants.
- `utils.ts` — `cn()` (clsx + tailwind-merge), `formatPrice()` (INR locale), `slugify()`, and deterministic `getBookRating()`/`getReviewCount()` derived from SKU.

**Routing pattern** — book detail pages use `slug = sku` (the ISBN). Standards detail pages use `standardSlug(number)` which lowercases and replaces non-alphanumeric runs with `-`.

**Client/server split** — data-fetching pages are server components; interactive parts are extracted into `*Client.tsx` files (e.g., `shop/[slug]/ProductDetailClient.tsx`, `controlCenter/ControlCenterClient.tsx`).

**Auth** — `/controlCenter/*` is protected by `src/middleware.ts` using an HMAC-SHA-256 session cookie (`admin_session`). The middleware runs on Edge Runtime. Login is at `/controlCenter/login`.

**Admin API** (`src/app/api/admin/`) — REST endpoints for CRUD on books and standards CSVs, bulk CSV upload/merge, and image uploads. All mutating routes call `invalidateBooksCache()` or `invalidateStandardsCache()` after writing.

**Trending** — `data/trending.json` drives both trending books and trending standards:
```json
{ "books": ["<sku>", ...], "standard": ["<slug>", ...] }
```

**State** — cart and wishlist use Zustand with the `persist` middleware (localStorage). Store keys: `bookstore-cart` (v1) and `bookstore-wishlist`.

**Payments** — Instamojo gateway via `src/app/api/payment/`. Exchange rates fetched from `open.er-api.com` and cached per server instance for 1 hour (`src/app/api/exchange-rates/route.ts`).

## Key Conventions

**Slugs for books** — `slug === sku === ISBN`. `standardSlug()` in `src/lib/standards.ts` replaces all non-alphanumeric characters (including `:`) with `-`. e.g. `CQI-27-2:2018` → `cqi-27-2-2018`. SKUs in `trending.json` must use this same form.

**Image download pipeline** — When a book/standard row has an HTTP(S) image URL, it is downloaded to `public/images/books/` or `public/images/standards/` in the background (fire-and-forget), the CSV is updated to the local path, and the cache is invalidated. Until then, `imageUrl` is `""` and the UI should show a fallback.

**CSV column names** — `books.ts` normalises headers to lowercase with underscores on read (e.g. `Image_URL` → `image_url`). `adminCsv.ts` (`readCSV`/`writeCSV`) preserves original casing. Admin API routes use `adminCsv.ts` and keep original CSV header casing.

**Price/currency** — Books have a `currency` field (defaults to `"INR"`). Standards can price in non-INR currencies; the checkout converts via the `/api/exchange-rates` endpoint.

**`cn()` utility** — Always use `cn()` from `@/lib/utils` for conditional Tailwind class merging, never raw template literals.

**Admin layout** — The root layout (`src/app/layout.tsx`) reads the `x-is-admin` response header (set by middleware) to suppress `<Header>` and `<Footer>` on all `/controlCenter` routes.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_APP_URL         # Public site URL
INSTAMOJO_API_KEY           # Payment gateway key
INSTAMOJO_AUTH_TOKEN        # Payment gateway token
INSTAMOJO_API_URL           # https://www.instamojo.com/api/1.1 (or sandbox URL)
ADMIN_PASSWORD              # Control Center login password
SESSION_SECRET              # HMAC signing secret for admin_session cookie
DB_SERVER / DB_USER / DB_PASSWORD / DB_NAME / DB_PORT  # SQL Server (if used)
```
