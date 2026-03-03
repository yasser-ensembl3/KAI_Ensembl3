# All In One Shop - Project Memory

## Project Overview
- **Name**: All In One Shop
- **Type**: Online bookstore specializing in dark romance, romantasy, new adult
- **Base**: `headless-shopify-template/prototype/` (Next.js 16.1, React 19, Tailwind v4)
- **Status**: Frontend prototype DONE (Phase 2 complete), ready for Supabase backend (Phase 3)

## Architecture (from Gemini discussion)
- **Frontend**: Next.js on Vercel (free)
- **Backend/DB**: Supabase (PostgreSQL, free tier)
- **Domain**: OVH
- **Payment**: Manual via WhatsApp/Mobile Money
- **Notifications**: Resend (email)
- See `architecture.md` for full details

## Current State (2026-02-17)
- All Shopify code removed, replaced with static book data
- 18 dark romance/romantasy books (Ana Huang, Sarah J. Maas, H.D. Carlton, Rebecca Yarros, etc.)
- 10 categories (Dark Romance, Romantasy, New Adult, Mafia Romance, etc.)
- Hero with dark romance cover image (`public/images/hero-cover.png`)
- Dark romance CSS theme (burgundy #c22d2d, gold #c9a96e, serif italic fonts)
- Cart with localStorage, prices in Ariary (Ar)
- Pages: /, /livres, /livres/[handle], /categories, /categories/[handle], /commander, /commander/confirmation, /devis
- Build passes clean, TypeScript clean

## Key Files
- `src/data/books.ts` - 18 books (static data, will become Supabase)
- `src/data/categories.ts` - 10 categories
- `src/data/cart.tsx` - Cart context (useReducer + localStorage)
- `src/data/locales.tsx` - formatPrice() → "XX XXX Ar"
- `src/app/globals.css` - Full dark romance theme (~1540 lines)
- `src/components/HeroSection.tsx` - Hero with cover image
- `src/app/devis/page.tsx` - Quote request form (book, author, email/facebook)

## Next Steps (Phase 3+)
1. Connect to Supabase (tables: books, orders)
2. WhatsApp ordering flow
3. Stock management
4. RLS security on Supabase
5. Email notifications (Resend)
6. OVH domain → Vercel DNS
7. Facebook/Instagram launch

## User Preferences
- Language: French
- User name: Yasser
- Prefers concise communication
- Dark romance aesthetic is important
