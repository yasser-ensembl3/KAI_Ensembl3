# Architecture - All In One Shop

## From Gemini Discussion (2026-02-17)

### 4-Phase Plan
1. **Infrastructure** : Supabase + OVH domain + Vercel + RLS security
2. **Frontend** : Catalogue, cartes livres, détail, commande, devis ✅ DONE
3. **Automatisation** : Stock tracking, notifications (Resend), webhooks
4. **Lancement** : Facebook/Instagram ads, Pinterest, Carnival events

### Supabase Tables
```sql
-- Table books
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title TEXT, author TEXT, price NUMERIC,
  category TEXT, stock_quantity INT,
  image_url TEXT, description TEXT,
  is_featured BOOLEAN, is_new BOOLEAN,
  is_on_sale BOOLEAN, sale_price NUMERIC
);

-- Table orders
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT, phone TEXT,
  address TEXT, city TEXT,
  items JSONB, total NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Payment Flow (Manual)
1. Client clicks "Acheter sur WhatsApp"
2. Owner receives message, verifies payment (Mobile Money)
3. Owner updates stock in Supabase (`UPDATE books SET stock_quantity = stock_quantity - 1`)

### Payment Flow (Automated - future)
1. Client pays via payment API
2. Platform sends webhook to Vercel serverless function
3. Function updates Supabase stock

### Security (RLS)
- Lock `books` table: nobody can modify prices from frontend
- Secure `orders` table: client can't cancel their own order
- 2FA on Supabase account
- API keys in environment variables only

### Hosting
- Frontend: Vercel (free tier)
- DB: Supabase (free tier, 500MB, 50K rows)
- Domain: OVH → Vercel DNS (A record)
- ISR (Incremental Static Regeneration) for caching (important for Madagascar's slow internet)
