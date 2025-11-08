# Designs Tabelle Setup

## 📊 Datenbank-Schema

### Designs Tabelle

Die `designs` Tabelle speichert verfügbare Design-Optionen für Produkte:

```sql
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uk TEXT NOT NULL,
  name_de TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Product Designs Junction-Tabelle

Die `product_designs` Tabelle verknüpft Produkte mit Designs (Many-to-Many Beziehung):

```sql
CREATE TABLE product_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, design_id)
);
```

## 🚀 Migration ausführen

### Option 1: Supabase CLI

```bash
cd apps/web
pnpm db:migrate
```

### Option 2: Supabase Dashboard

1. Gehen Sie zu **SQL Editor** in Ihrem Supabase Dashboard
2. Öffnen Sie `supabase/migrations/20240104000000_create_designs_table.sql`
3. Kopieren Sie den Inhalt und führen Sie ihn aus

## 📝 Beispiel-Designs einfügen

Führen Sie `insert-designs.sql` aus oder verwenden Sie:

```sql
INSERT INTO designs (name_uk, name_de, image_url) VALUES
('Класичний', 'Klassisch', '/placeholder-cake.svg'),
('Елегантний', 'Elegant', '/placeholder-cake.svg'),
('Сучасний', 'Modern', '/placeholder-cake.svg');
```

## 🔗 Designs mit Produkten verknüpfen

### Design zu einem Produkt hinzufügen:

```sql
-- Beispiel: Verknüpfe "Klassisch" Design mit "Zitronen-Mohn-Torte"
INSERT INTO product_designs (product_id, design_id)
SELECT 
  p.id as product_id,
  d.id as design_id
FROM products p
CROSS JOIN designs d
WHERE p.slug = 'zitronen-mohn-torte'
  AND d.name_de = 'Klassisch';
```

### Alle Designs für ein Produkt abrufen:

```sql
SELECT 
  d.id,
  d.name_uk,
  d.name_de,
  d.image_url
FROM designs d
INNER JOIN product_designs pd ON d.id = pd.design_id
WHERE pd.product_id = (
  SELECT id FROM products WHERE slug = 'zitronen-mohn-torte'
);
```

### Alle Designs auflisten:

```sql
SELECT * FROM designs ORDER BY name_de;
```

## 🔄 Migration von JSONB zu Designs-Tabelle

Wenn Sie bereits Produkte mit `available_designs` JSONB haben, können Sie diese migrieren:

```sql
-- 1. Designs aus existing products extrahieren und einfügen
-- (Dies ist ein Beispiel - Sie müssen dies anpassen)

-- 2. Designs mit Produkten verknüpfen basierend auf dem JSONB
-- (Dies erfordert eine angepasste Migration je nach Ihrer Datenstruktur)
```

## 📋 Verwendung in der Anwendung

### Designs aus Datenbank laden:

```typescript
const { data: designs } = await supabase
  .from('designs')
  .select('*')
  .order('name_de');

// Designs für ein spezifisches Produkt
const { data: productDesigns } = await supabase
  .from('product_designs')
  .select(`
    design_id,
    designs (
      id,
      name_uk,
      name_de,
      image_url
    )
  `)
  .eq('product_id', productId);
```

## 🔐 Row Level Security

- **Designs**: Öffentlicher Lesezugriff für alle
- **Product Designs**: Öffentlicher Lesezugriff, alle können verknüpfen (für Admin-Interface)

## 📝 Nächste Schritte

1. Migration ausführen
2. Beispiel-Designs einfügen
3. Designs mit Produkten verknüpfen
4. Admin-Interface anpassen, um Designs aus der DB zu laden
5. Product Detail-Seite anpassen, um Designs aus `product_designs` zu laden

