# Tabelle: products

Enthält alle **Nicht-Torten-Produkte** (Desserts, Cookies, Cheesecakes, Macarons). Torten haben eine eigene Tabelle: [[torten_designs]].

## Spalten

| Spalte | Typ | Constraints | Beschreibung |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Eindeutige ID |
| `slug` | `text` | UNIQUE | URL-freundlicher Bezeichner |
| `name_uk` | `text` | NOT NULL | Name auf Ukrainisch |
| `name_de` | `text` | NOT NULL | Name auf Deutsch |
| `description_uk` | `text` | | Beschreibung Ukrainisch |
| `description_de` | `text` | | Beschreibung Deutsch |
| `ingredients_uk` | `text` | | Zutaten Ukrainisch |
| `ingredients_de` | `text` | | Zutaten Deutsch |
| `allergens_uk` | `text` | | Allergene Ukrainisch |
| `allergens_de` | `text` | | Allergene Deutsch |
| `category` | `text` | CHECK | Hauptkategorie (s.u.) |
| `sub_category` | `text` | | Unterkategorie |
| `available_designs` | `jsonb` | DEFAULT `[]` | Verfügbare Design-Optionen als JSON-Array |
| `image_url` | `text` | | Haupt-Bild-URL |
| `images_urls` | `text[]` | | Array weiterer Bilder |
| `created_at` | `timestamptz` | DEFAULT now() | Erstellungszeitpunkt |
| `updated_at` | `timestamptz` | DEFAULT now() | Letztes Update |

## Erlaubte Kategorien (CHECK-Constraint)

```
'torten' | 'desserts' | 'cookies' | 'macarons' | 'cheesecakes'
```

> Hinweis: Obwohl `category = 'torten'` möglich ist, werden neue Torten ausschließlich über [[torten_designs]] verwaltet. Der Wert `'torten'` in der `products`-Tabelle ist Legacy.

## Wichtiges

- `ingredients_uk/de` und `allergens_uk/de` wurden in Migration `20260509` von Arrays auf `text` umgestellt
- `available_designs` ist ein JSONB-Array mit Design-Optionen — Format: `[{id, slug, name, imageUrl}]`
- Bilder liegen in Supabase Storage (Bucket `bilder`), URL-Normalisierung via `lib/image-utils.ts`

## RLS

| Operation | Erlaubt für |
|---|---|
| SELECT | Öffentlich |
| INSERT / UPDATE / DELETE | Admin only |
