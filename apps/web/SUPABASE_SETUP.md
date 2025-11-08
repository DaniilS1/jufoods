# Supabase Setup & Database Schema

## 📊 Datenbank-Schema

Das Projekt verwendet Supabase (PostgreSQL) für die Datenbank. Die Tabellen werden über Migrationen erstellt.

### Tabellen

#### 1. **products** - Produktinformationen

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_uk TEXT NOT NULL,
  name_de TEXT NOT NULL,
  description_uk TEXT,
  description_de TEXT,
  category TEXT NOT NULL CHECK (category IN ('torten', 'desserts')),
  ingredients_uk TEXT[],
  ingredients_de TEXT[],
  allergens_uk TEXT[],
  allergens_de TEXT[],
  available_designs JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. **orders** - Bestellungen

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  notes TEXT,
  items JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. **auth.users** - Benutzer (von Supabase Auth verwaltet)

Wird automatisch von Supabase Auth erstellt und verwaltet.

## 🔐 Row Level Security (RLS)

### Products
- **Öffentlicher Lesezugriff**: Alle können Produkte ansehen
```sql
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);
```

### Orders
- **Benutzer können eigene Bestellungen sehen**
```sql
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);
```

- **Jeder kann Bestellungen erstellen** (Gast-Checkout)
```sql
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);
```

- **Benutzer können eigene Bestellungen aktualisieren**
```sql
CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);
```

## 📍 Indizes

Für bessere Performance wurden folgende Indizes erstellt:

```sql
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

## 🔄 Automatische Updates

Ein Trigger aktualisiert automatisch das `updated_at` Feld bei Änderungen:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🚀 Migration ausführen

### Option 1: Lokale Entwicklung mit Supabase CLI

1. Supabase CLI installieren:
```bash
npm install -g supabase
```

2. Supabase initialisieren (falls noch nicht geschehen):
```bash
cd apps/web
supabase init
```

3. Migrationen ausführen:
```bash
pnpm db:migrate
```

### Option 2: Supabase Dashboard

1. Gehen Sie zu Ihrem Supabase-Projekt
2. Navigieren Sie zu **SQL Editor**
3. Kopieren Sie den Inhalt von `supabase/migrations/20240101000000_initial_schema.sql`
4. Führen Sie das SQL-Script aus

### Option 3: Direkt in Supabase Studio

1. Starten Sie Supabase Studio:
```bash
pnpm db:studio
```

2. Navigieren Sie zu **SQL Editor** und führen Sie die Migration aus

## ✅ Verifizierung

Nach der Migration können Sie die Tabellen überprüfen:

```sql
-- Tabellen auflisten
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Produkte anzeigen
SELECT * FROM products;

-- Bestellungen anzeigen
SELECT * FROM orders;
```

## 📝 Nächste Schritte

1. **Produktdaten migrieren**: 
   - Produkte aus `data/products.json` in die `products` Tabelle einfügen
   - Bilder in Supabase Storage hochladen und URLs aktualisieren

2. **Testdaten hinzufügen**:
   - Einige Beispielprodukte für Tests einfügen

3. **Storage Bucket erstellen** (für Produktbilder):
   - In Supabase Dashboard → Storage → Create Bucket
   - Bucket-Name: `product-images`
   - Öffentlich: Ja

## 🔗 Wichtige Links

- [Supabase Dokumentation](https://supabase.com/docs)
- [PostgreSQL Dokumentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

