# Next.js Bookstore

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

