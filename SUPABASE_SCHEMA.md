# Gestor La Gruta — Supabase Database Schema

## Project Overview

**Gestor La Gruta** is an inventory management system for multi-location hospitality businesses (bars/restaurants). It's an Electron desktop app built with React 19 + TypeScript + Vite. The frontend is complete with mock data; this document defines the Supabase schema to replace it.

---

## Tech Stack Context

- Frontend: React 19, TypeScript, React Router v7, Tailwind CSS, shadcn/ui
- Desktop: Electron 35
- State: React Context (AuthContext, InventoryContext)
- Current storage: localStorage (to be replaced by Supabase)
- Auth: Custom PIN/access-code system (NOT Supabase Auth — keep custom logic)

---

## User Roles

| Role | Access | Auth Method |
|------|--------|-------------|
| `admin` | Full system (all bars, all data) | 4-digit access code |
| `worker` | Single bar, limited operations | 4-digit PIN |

---

## Database Tables

### 1. `admin_accounts`
Admin users who manage the system.

```sql
CREATE TABLE admin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  access_code CHAR(4) NOT NULL UNIQUE,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2. `bars`
Physical bar/restaurant locations.

```sql
CREATE TABLE bars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  manager TEXT,
  phone TEXT,
  image TEXT, -- base64 or URL
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3. `workers`
Warehouse/almacen staff.

```sql
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pin CHAR(4) NOT NULL UNIQUE,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar TEXT, -- base64 or URL
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4. `worker_bars`
N:N relationship — workers can serve multiple bars.

```sql
CREATE TABLE worker_bars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  bar_id UUID NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  UNIQUE (worker_id, bar_id)
);
```

### 5. `categories`
Product categories (e.g., Bebidas, Licores, Insumos).

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_bulk BOOLEAN NOT NULL DEFAULT false -- true = weight-based category
);
```

### 6. `subcategories`
Product subcategories (e.g., Refrescos, Tequila, Cerveza).

```sql
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE (name, category_id)
);
```

### 7. `suppliers`
Product suppliers/vendors.

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 8. `products`
Main inventory items. Each product belongs to one bar.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL,
  bar_id UUID NOT NULL REFERENCES bars(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,       -- denormalized for query performance
  subcategory TEXT NOT NULL,    -- denormalized for query performance
  supplier TEXT,                -- denormalized
  category_id UUID REFERENCES categories(id),
  subcategory_id UUID REFERENCES subcategories(id),
  supplier_id UUID REFERENCES suppliers(id),
  stock NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock NUMERIC(10, 2) NOT NULL CHECK (min_stock >= 0),
  max_stock NUMERIC(10, 2) NOT NULL CHECK (max_stock >= min_stock),
  unit TEXT NOT NULL,           -- 'lata', 'botella', 'kg', 'ml', etc.
  price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  last_purchase DATE,
  image TEXT,                   -- base64 or URL
  is_weight_based BOOLEAN NOT NULL DEFAULT false,
  weight_unit TEXT CHECK (weight_unit IN ('kg', 'g', 'ml', 'L')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sku, bar_id)
);

-- Computed status via generated column (Postgres 12+)
-- Or use a view / function instead:
CREATE VIEW products_with_status AS
SELECT *,
  CASE
    WHEN stock <= 0 THEN 'out_of_stock'
    WHEN stock <= min_stock THEN 'low_stock'
    ELSE 'in_stock'
  END AS status
FROM products;
```

**Business rules:**
- `sku` is UNIQUE per bar (same SKU can exist in different bars)
- `stock` is ALWAYS in individual units (boxes are pre-converted before storing)
- `is_active = false` = soft delete

### 9. `product_barcodes`
Multiple barcodes per product (individual, box of 6, box of 24, etc.).

```sql
CREATE TABLE product_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL UNIQUE,  -- EAN/UPC, globally unique
  quantity_per_scan INTEGER NOT NULL DEFAULT 1 CHECK (quantity_per_scan >= 1),
  label TEXT,                    -- 'Individual', 'Caja 24 latas', etc.
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Business rule:** `barcode` is globally unique — one barcode maps to exactly one product.

### 10. `inventory_movements`
Raw stock in/out log.

```sql
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID NOT NULL REFERENCES bars(id),
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,         -- denormalized (name may change)
  worker_id UUID REFERENCES workers(id),
  worker_name TEXT NOT NULL,          -- denormalized
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  quantity NUMERIC(10, 2) NOT NULL,
  previous_quantity NUMERIC(10, 2) NOT NULL,
  new_quantity NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_movements_bar_ts ON inventory_movements(bar_id, timestamp DESC);
CREATE INDEX idx_movements_product ON inventory_movements(product_id);
```

### 11. `reception_sessions`
Batch reception workflow — scan multiple products, confirm all at once.

```sql
CREATE TABLE reception_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID NOT NULL REFERENCES bars(id),
  admin_id UUID REFERENCES admin_accounts(id),
  admin_name TEXT NOT NULL,     -- denormalized
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'confirmed', 'cancelled')),
  notes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);
```

### 12. `reception_items`
Line items in a batch reception session.

```sql
CREATE TABLE reception_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES reception_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_barcode_id UUID REFERENCES product_barcodes(id),
  barcode_label TEXT,           -- e.g., 'Caja 24'
  scan_count INTEGER NOT NULL DEFAULT 1 CHECK (scan_count >= 1),
  quantity_per_scan INTEGER NOT NULL DEFAULT 1,
  total_individual_qty NUMERIC(10, 2) NOT NULL, -- = scan_count * quantity_per_scan
  unit TEXT NOT NULL,
  is_weight_based BOOLEAN NOT NULL DEFAULT false,
  weight NUMERIC(10, 2),        -- only for weight-based items
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 13. `inventory_history`
Comprehensive audit log — one entry per stock operation, 5 types.

```sql
CREATE TABLE inventory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID NOT NULL REFERENCES bars(id),
  bar_name TEXT NOT NULL,             -- denormalized
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,         -- denormalized
  product_category TEXT NOT NULL,     -- denormalized
  product_subcategory TEXT NOT NULL,  -- denormalized
  admin_id UUID REFERENCES admin_accounts(id),
  admin_name TEXT NOT NULL,           -- denormalized
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'scan_individual',   -- Single item scanned
    'scan_box',          -- Box barcode (multiple units)
    'batch_reception',   -- Part of a reception session
    'bulk_weight',       -- Weighed on scale
    'manual_adjustment'  -- Direct stock correction
  )),
  quantity NUMERIC(10, 2) NOT NULL,   -- Always in individual units
  unit TEXT NOT NULL,
  previous_stock NUMERIC(10, 2) NOT NULL,
  new_stock NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  -- scan_box specific
  box_quantity INTEGER,
  box_size INTEGER,               -- quantity_per_scan
  box_label TEXT,                 -- 'Caja 24 latas'
  barcode_scanned TEXT,
  -- bulk_weight specific
  weight NUMERIC(10, 2),
  weight_unit TEXT CHECK (weight_unit IN ('kg', 'g', 'ml', 'L')),
  -- batch_reception specific
  reception_session_id UUID REFERENCES reception_sessions(id),
  reception_session_notes TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_bar_ts ON inventory_history(bar_id, timestamp DESC);
CREATE INDEX idx_history_admin_ts ON inventory_history(admin_id, timestamp DESC);
CREATE INDEX idx_history_product ON inventory_history(product_id);
CREATE INDEX idx_history_entry_type ON inventory_history(entry_type);
CREATE INDEX idx_history_session ON inventory_history(reception_session_id);
```

### 14. `inventory_alerts`
Low stock and out-of-stock notifications.

```sql
CREATE TABLE inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  bar_id UUID NOT NULL REFERENCES bars(id),
  type TEXT NOT NULL CHECK (type IN ('low_stock', 'out_of_stock')),
  current_stock NUMERIC(10, 2) NOT NULL,
  threshold NUMERIC(10, 2) NOT NULL, -- min_stock at time of alert
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_bar_resolved ON inventory_alerts(bar_id, is_resolved);
```

### 15. `activities`
System-wide event log for the dashboard activity feed.

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('stock_in', 'stock_out', 'alert', 'login', 'inventory')),
  message TEXT NOT NULL,
  user_id TEXT,             -- admin or worker id (polymorphic)
  user_name TEXT,
  bar_id UUID REFERENCES bars(id),
  bar_name TEXT,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_ts ON activities(timestamp DESC);
CREATE INDEX idx_activities_bar ON activities(bar_id, timestamp DESC);
```

### 16. `sales` (Optional — future revenue tracking)

```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id UUID NOT NULL REFERENCES bars(id),
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  seller_name TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_bar_ts ON sales(bar_id, timestamp DESC);
```

---

## Key Business Rules

1. **Stock is always in individual units.** When a box barcode with `quantity_per_scan = 24` is scanned 3 times, the DB receives `quantity = 72`, never `3`.

2. **SKU is unique per bar** — same SKU can exist across different bars.

3. **Barcode is globally unique** — one barcode → one product only.

4. **PIN and access_code are always 4 digits** (CHAR(4), store as plain text or bcrypt hash — decide security level).

5. **Soft deletes everywhere** — `is_active = false` instead of DELETE.

6. **Status is computed, not stored:**
   - `out_of_stock`: stock <= 0
   - `low_stock`: 0 < stock <= min_stock
   - `in_stock`: stock > min_stock

7. **Denormalized name fields** (product_name, bar_name, admin_name in history tables) — intentional, so audit logs show the name at the time of the event even if it changes later.

---

## Seed Data

### Default Categories
```sql
INSERT INTO categories (name, is_bulk) VALUES
  ('Bebidas', false),
  ('Licores', false),
  ('Insumos', false),
  ('Alimentos', false),
  ('Limpieza', false),
  ('Granel', true);
```

### Default Subcategories
```sql
INSERT INTO subcategories (name, category_id) VALUES
  ('Refrescos', (SELECT id FROM categories WHERE name = 'Bebidas')),
  ('Aguas', (SELECT id FROM categories WHERE name = 'Bebidas')),
  ('Cervezas', (SELECT id FROM categories WHERE name = 'Bebidas')),
  ('Tequila', (SELECT id FROM categories WHERE name = 'Licores')),
  ('Ron', (SELECT id FROM categories WHERE name = 'Licores')),
  ('Vodka', (SELECT id FROM categories WHERE name = 'Licores')),
  ('Mezcal', (SELECT id FROM categories WHERE name = 'Licores')),
  ('Whisky', (SELECT id FROM categories WHERE name = 'Licores'));
```

### Default Admin
```sql
INSERT INTO admin_accounts (name, access_code, is_active) VALUES
  ('Administrador', '0000', true);
```

---

## Supabase-Specific Notes

### Row Level Security (RLS)

Since this app uses a **custom PIN auth** (not Supabase Auth), you have two options:

**Option A — Disable RLS, use service role key from Electron:**
- Simple, fast to implement
- OK for desktop Electron app (key is in the binary, but it's a local app)
- Use Supabase's `service_role` key from the Electron main process

**Option B — Custom JWT via Supabase Edge Functions:**
- Admin/worker logs in → Edge Function validates PIN → returns signed JWT
- Frontend uses JWT for subsequent requests with RLS enforced
- More secure, more complex

**Recommendation: Start with Option A (service key in Electron), migrate to Option B if security is needed.**

### Realtime (Optional)
Enable Supabase Realtime on these tables for live updates:
- `inventory_alerts` — push alerts to admin dashboard
- `products` — live stock updates across devices
- `activities` — live activity feed

### Storage (Optional)
Use Supabase Storage for product/bar images instead of storing base64 in DB:
- Bucket: `product-images`
- Bucket: `bar-images`
- Bucket: `worker-avatars`

---

## API Mapping (Frontend → Supabase)

| Frontend call | Supabase query |
|---------------|---------------|
| `getProducts(barId)` | `supabase.from('products').select('*, product_barcodes(*)').eq('bar_id', barId).eq('is_active', true)` |
| `lookupBarcode(code)` | `supabase.from('product_barcodes').select('*, products(*)').eq('barcode', code).single()` |
| `recordEntry(productId, qty)` | UPDATE `products.stock` + INSERT `inventory_movements` + INSERT `inventory_history` |
| `confirmBatchReception(session)` | UPDATE `reception_sessions.status` + loop UPDATE products + INSERT history entries |
| `verifyAdminPin(pin)` | `supabase.from('admin_accounts').select('*').eq('access_code', pin).eq('is_active', true).single()` |
| `workerLogin(pin)` | `supabase.from('workers').select('*, worker_bars(bar_id, bars(*))').eq('pin', pin).eq('is_active', true).single()` |
| `getInventoryHistory(filters)` | `supabase.from('inventory_history').select('*').eq('bar_id', barId).order('timestamp', { ascending: false })` |

---

## Migration Order

Create tables in this order to respect foreign key constraints:

1. `admin_accounts`
2. `bars`
3. `workers`
4. `worker_bars`
5. `categories`
6. `subcategories`
7. `suppliers`
8. `products`
9. `product_barcodes`
10. `inventory_movements`
11. `reception_sessions`
12. `reception_items`
13. `inventory_history`
14. `inventory_alerts`
15. `activities`
16. `sales`

---

## Files to Modify After DB Setup

| File | What changes |
|------|-------------|
| `src/contexts/AuthContext.tsx` | Replace mock login with Supabase queries |
| `src/contexts/InventoryContext.tsx` | Replace localStorage with Supabase CRUD |
| `src/data/mockData.ts` | Delete or keep for dev/testing |
| Create `src/lib/supabase.ts` | Supabase client initialization |
| Create `src/lib/api/` | API layer functions (products, auth, history, etc.) |
