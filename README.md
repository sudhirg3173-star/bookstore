# Bookstore - Nextjs

A full-featured bookstore web app built with **Next.js 14**, powered by the `books-master.csv` database. Replicates the design and functionality of [bookio.wpbingosite.com](https://bookio.wpbingosite.com/).

## 🚀 Getting Started

```bash
cd bookstore
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** The `books-master.csv` must be in the parent directory (`../books-master.csv` relative to this folder), which is the default location in this workspace.

## 📄 Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero slider, trending books, categories, testimonials |
| `/shop` | All books with filters, sort, pagination, grid/list view |
| `/shop/[sku]` | Product detail with tabs, add to cart, related books |
| `/category/[subject]` | Books filtered by subject |
| `/search?q=...` | Search results |
| `/cart` | Shopping cart with promo code support |
| `/wishlist` | Saved books |

## ✨ Features

- **Hero Slider** — 3 auto-advancing animated banners
- **Product Grid** — 16 books/page, sort by price/rating/name/new
- **Filters** — By category, availability, price range
- **Cart** — Persistent (localStorage), quantity updates, promo codes
- **Wishlist** — Persistent (localStorage), add/remove
- **Search** — Full-text search across title, author, subject, description
- **Product Detail** — Image, rating, description, info tabs, related books
- **Responsive** — Mobile-first, works on all screen sizes

### Feature Breakdown by Section

| Section | Features |
|---------|----------|
| **Header** | Sticky nav, search bar, cart/wishlist counters, mobile drawer, category dropdown |
| **Homepage** | Auto-sliding hero banner, promo strip, trending tabs, category grid, Books of Month with live countdown timer, dual CTA banners, top books, testimonials, features section |
| **Shop** | Grid/list view toggle, sort (price/rating/name/new), pagination (16/page), sidebar filters (category, availability, price range), mobile filter drawer |
| **Product Detail** | Book image, star rating, price with discount badge, add to cart + quantity selector, wishlist toggle, description/details/reviews tabs, related books |
| **Cart** | Quantity controls, remove item, clear cart, subtotal, promo code `BOOKIO20` for 20% off, free shipping over ₹999 |
| **Wishlist** | Persistent bookmarks, add all to cart, remove items |
| **Search** | Full-text search across title, author, subject, and description |

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Public site URL |
| `CASHFREE_CLIENT_ID` | Yes | Cashfree Payment Gateway App ID (server only) |
| `CASHFREE_CLIENT_SECRET` | Yes | Cashfree Payment Gateway secret key (server only) |
| `CASHFREE_ENV` | Yes | `sandbox` for testing, `production` for live payments |
| `PAYMENT_LOCAL_STORE` | Local only | `true` uses isolated files in development sandbox; omit in production |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase Client API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_ADMIN_PROJECT_ID` | Yes | Firebase Admin project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Yes | Service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Yes | Service account private key (base64-encoded) |
| `ADMIN_EMAIL` | Yes | Email of the sole authorized admin user |
| `DB_SERVER` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` / `DB_PORT` | Optional | SQL Server connection |

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → Create project
2. **Authentication** → Sign-in method → Enable **Email/Password**
3. **Authentication** → Users → Add user (set `ADMIN_EMAIL` to this email)
4. **Project Settings** → Service Accounts → **Generate new private key** → download JSON
5. Base64-encode the `private_key` field from the JSON:
   ```bash
   node -e "process.stdout.write(Buffer.from(require('./serviceAccount.json').private_key).toString('base64'))"
   ```
6. Set `FIREBASE_ADMIN_PRIVATE_KEY` to the base64 string in `.env.local`

### Firestore Security Rules

The production policy is in `firestore.rules`, referenced by `firebase.json`.
It replaces the expired development rule with deny-by-default permissions:

- Users can read their own profile and edit approved profile fields. Signup allows the existing buyer, seller and author labels; identity, role and creation fields cannot be changed by clients afterward.
- Wishlists are private to their owner and limited to 500 SKUs.
- Signed-in users can read only orders with their Firebase UID in `userId`. Order creation, payment status, totals and delivery updates are server-only.
- Collection-wide profile/wishlist reads, guest order reads and unknown collections are denied. Firebase Admin SDK operations bypass these rules and require separately protected server credentials and API authorization.

Run the security regression checks with Node.js 22.16+ and Java 21+ available:

```bash
npm run test:firestore
```

This starts a local emulator with the isolated `demo-bookstore-rules` project and
never touches live data. Firebase CLI and the emulator are downloaded on first use.
The tests cover valid profile and wishlist operations, cross-user access denial,
role/identity tampering, owner-filtered order queries and blocked client payment
writes. Existing profile fields added by the server remain protected.

To publish, replace the contents of Firebase Console > Firestore Database > Rules
with `firestore.rules` and click **Publish**. Alternatively, authenticate Firebase
CLI yourself and explicitly select the correct project:

```bash
npx --yes firebase-tools@14.22.0 deploy --only firestore:rules --project YOUR_FIREBASE_PROJECT_ID
```

Adding the local file does not publish the rules. Review existing profiles before
deployment if they lack the fields used by this application's current schema.

## Cashfree Payments

Checkout creates an INR order on the server using catalogue prices, then opens
Cashfree's official JavaScript SDK with `redirectTarget: "_self"`. The return page
and signed webhooks fetch the order from Cashfree; only `order_status: "PAID"`
confirms payment. Pending orders are stored before redirecting, and payment
confirmation is idempotent. Existing order-history statuses are retained
(`Credit` means paid). Browser query parameters cannot mark an order paid.

### Local Sandbox

Requires Node.js 22.16+ for the local launcher. Set your **sandbox** App ID and
secret directly in `.env.payments.local` using `.env.payments.example` as the
template. These are server secrets; never use `NEXT_PUBLIC_` for payment keys.
Keep existing Firebase client settings in `.env.local` for account sign-in.
Guest checkout does not need Firebase Admin credentials in this local mode.

```bash
npm install
npm run test:payments
npm run dev:payments
```

The launcher starts at `http://localhost:3001`, selects another port if busy,
forces sandbox mode, and stores orders in ignored `.local/payments/*.json`
instead of production Firestore. Open `/shop`, add a book, and proceed to checkout.
There are no real charges in Cashfree sandbox. Blank sandbox keys allow browsing
but cannot create a hosted payment session. The credential-free test command
mocks Cashfree; it does not claim to exercise the hosted gateway.

For hosted checkout and real webhook delivery, expose the local port using an
HTTPS tunnel (for example `ngrok http 3001`), set `NEXT_PUBLIC_APP_URL` in
`.env.payments.local` to that HTTPS origin, restart the launcher, and open the
store through the tunnel. Whitelist that exact domain in the Cashfree sandbox
dashboard. Configure payment success, failed, and user-dropped webhooks at
`https://<your-tunnel-host>/api/payment/webhook` using API version `2025-01-01`.
Localhost cannot receive Cashfree webhooks; the return page still verifies
server-side, but a tunnel is required to test browser-closed webhook completion.

Cashfree's documented sandbox card: `4576238912771450`, expiry `03/2028`,
CVV `123`, name `Test`, OTP `111000`. Test UPI VPAs: `testsuccess@gocash`
and `testfailure@gocash` where UPI collect is offered.

Check these scenarios:

1. Successful payment: return page verifies success, matching cart clears, stored order is `Credit` with payment ID.
2. Failed/cancelled attempt: no success message, cart remains, an active order stays `Pending` so it can be retried.
3. Missing/fake `order_id` or `?status=Credit`: never displays payment success.
4. Invalid webhook signature: HTTP 403; repeated valid webhook: no duplicate order or paid-status downgrade.
5. Close the browser after paying: webhook confirms the stored order without a return-page visit.

### Production

Set `CASHFREE_ENV=production`, live App ID/secret, your whitelisted HTTPS
`NEXT_PUBLIC_APP_URL`, and Firebase Admin credentials. Remove `PAYMENT_LOCAL_STORE`
or set it to `false`. Register the same webhook path in the live Cashfree dashboard.
The local file store deliberately refuses production mode. Restart after changing
environment variables. New orders use Cashfree; existing historical orders remain
unchanged. Do not switch gateways while old Instamojo payments are still in flight.

References: [redirect integration](https://www.cashfree.com/docs/payments/online/web/redirect),
[sandbox test data](https://www.cashfree.com/docs/payments/online/resources/sandbox-environment),
[webhook verification](https://www.cashfree.com/docs/payments/online/webhooks/signature-verification).

## International Shipping (ShipGlobal)

Checkout uses ShipGlobal's `POST /apiv1/rates/calculate` for international physical
orders. India retains the existing free shipping policy; PDF-only orders need no
shipment. Customers select a service, and the server fetches its rate again before
creating the INR Cashfree order. Changed rates require checkout refresh rather
than silently charging a different amount. The verified shipping fee, service,
destination and parcel weight are saved with the pending order.

Set these **server-only** variables in `.env.local` (or `.env.payments.local` when
using the isolated payment launcher), then restart the server:

```dotenv
SHIPGLOBAL_EMAIL=your-shipglobal-account-email
SHIPGLOBAL_PASSWORD=your-shipglobal-account-password
SHIPGLOBAL_WEIGHTS_KG=0.5
```

For now, a positive numeric `SHIPGLOBAL_WEIGHTS_KG` sets one packed unit weight
in KG for every physical book and standard, including its share of packaging.
The example `0.5` means 0.5 KG per item, so three physical items weigh 1.5 KG.
PDFs are excluded and quantities multiply the unit weight. The combined parcel
weight rounds up to the nearest gram. A shared default is an estimate: select a
suitable value for your catalogue and verify actual packed weights before relying
on these quotes in production.

When per-item weights are available, the same variable also accepts a JSON object:

```dotenv
SHIPGLOBAL_WEIGHTS_KG='{"9781234567890":0.65,"std-example-standard":0.4}'
```

Replace the example SKUs and weights with measured values. Book SKUs are ISBNs;
physical standard SKUs are `std-<standardSlug>`. In JSON-object mode, every physical
SKU in the order must have a positive numeric weight. Invalid weight configuration,
missing credentials, unavailable services or provider errors block international
payment. Restart after changing the environment value. Do not prefix these
variables with `NEXT_PUBLIC_` or commit real credentials.

The rate request uses ISO-2 destination country codes and the delivery postcode.
The documented rate response provides `subtotal_fee` in INR; service notes and
transit times are displayed without adding a markup. Confirm taxes, duties and
volumetric billing with ShipGlobal before enabling live international checkout.
The documented calculator does not accept dimensions. These quotes do **not**
book shipments, debit the shipping wallet, generate labels or enable tracking.
Those separate APIs need fulfillment setup, including destination-specific service
codes, measured dimensions in CM, invoice currency (INR/EUR/GBP/USD), a unique
invoice number (the order ID) and invoice date (`YYYY-MM-DD`). The calculator's
documented service titles are not assumed to be booking service codes.

`npm run test:payments` includes credential-free ShipGlobal adapter and shipping
payment tests. Actual account rates still require a live test with configured
weights and credentials. Confirm that your Cashfree account supports the intended
international phone numbers and card payment methods as well.

Reference: [ShipGlobal API documentation](https://documenter.getpostman.com/view/27717351/2s9YXfd4Ky).

## 🛠 Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (cart + wishlist state with localStorage persistence)
- **Lucide React** (icons)

## � Project Structure

```
bookstore/
├── src/
│   ├── app/
│   │   ├── globals.css              ← Global styles + Tailwind
│   │   ├── layout.tsx               ← Root layout (Header + Footer)
│   │   ├── page.tsx                 ← Homepage
│   │   ├── not-found.tsx            ← 404 page
│   │   ├── cart/
│   │   │   └── page.tsx             ← Shopping cart
│   │   ├── category/
│   │   │   └── [subject]/
│   │   │       └── page.tsx         ← Category listing
│   │   ├── search/
│   │   │   └── page.tsx             ← Search results
│   │   ├── shop/
│   │   │   ├── page.tsx             ← All books shop
│   │   │   └── [slug]/
│   │   │       ├── page.tsx         ← Product detail (server)
│   │   │       └── ProductDetailClient.tsx  ← Product detail (client)
│   │   └── wishlist/
│   │       └── page.tsx             ← Wishlist
│   ├── components/
│   │   ├── home/
│   │   │   ├── AdventureBanner.tsx  ← Dual CTA banners
│   │   │   ├── BooksOfMonth.tsx     ← Featured books + countdown timer
│   │   │   ├── FeaturesSection.tsx  ← Bookio Press / App / Gift cards
│   │   │   ├── HeroBanner.tsx       ← Auto-sliding hero
│   │   │   ├── PromoBanner.tsx      ← 20% off promo strip
│   │   │   ├── Testimonials.tsx     ← Customer reviews
│   │   │   ├── TopBooksSection.tsx  ← Reusable book grid section
│   │   │   ├── TopCategories.tsx    ← Category icon grid
│   │   │   └── TrendingBooks.tsx    ← Tabbed trending products
│   │   ├── layout/
│   │   │   ├── Footer.tsx           ← Footer with newsletter
│   │   │   └── Header.tsx           ← Sticky nav + search + cart icon
│   │   ├── shop/
│   │   │   ├── ProductCard.tsx      ← Book card (grid + wishlist + cart)
│   │   │   ├── ProductGrid.tsx      ← Paginated grid/list with sort
│   │   │   └── ShopSidebar.tsx      ← Filter sidebar (category/price/stock)
│   │   └── ui/
│   │       └── StarRating.tsx       ← Star rating display
│   ├── lib/
│   │   ├── books.ts                 ← CSV parser + all data query functions
│   │   └── utils.ts                 ← cn(), formatPrice(), slugify(), helpers
│   ├── store/
│   │   ├── cartStore.ts             ← Zustand cart (persisted)
│   │   └── wishlistStore.ts         ← Zustand wishlist (persisted)
│   └── types/
│       └── book.ts                  ← Book + CartItem TypeScript types
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

## �📊 Data

Books data is read directly from `books-master.csv` at runtime using Node.js `fs`. The CSV contains:
- Subject, Title, Authors, SKU, Price, Availability, Pages, Year, Category, Image URL, Description

Ratings and review counts are deterministically generated from SKU for consistent display.

## Trending 
* The books need ISBN numbers to be added to the books array 
* In the standard array, the standardSlug() function replaces all non-alphanumeric characters (including :) with -. So the slugs in the JSON must use hyphens, not colons.

e.g. 
* CQI-27-2:2018 → slug is cqi-27-2-2018

