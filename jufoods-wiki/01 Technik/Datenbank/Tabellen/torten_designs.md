# Tabelle: torten_designs

Spezialisierte Tabelle für **Tortendesigns** — separat von `products`, um komplexe Torten mit Design-Varianten und Füllungsoptionen abzubilden.

## Spalten

| Spalte | Typ | Constraints | Beschreibung |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Eindeutige ID |
| `slug` | `text` | UNIQUE, NOT NULL | URL-freundlicher Bezeichner |
| `name_de` | `text` | NOT NULL | Name auf Deutsch |
| `name_uk` | `text` | NOT NULL | Name auf Ukrainisch |
| `description_de` | `text` | | Beschreibung Deutsch |
| `description_uk` | `text` | | Beschreibung Ukrainisch |
| `category` | `text` | DEFAULT `'torten'` | Immer `'torten'` |
| `sub_category` | `text` | | Unterkategorie (s.u.) |
| `image_url` | `text` | | Haupt-Bild-URL |
| `images_urls` | `text[]` | DEFAULT `[]` | Array weiterer Bilder |
| `classic` | `boolean` | DEFAULT `false` | Klassisches Design (Sonderdarstellung) |
| `created_at` | `timestamptz` | DEFAULT now() | Erstellungszeitpunkt |
| `updated_at` | `timestamptz` | DEFAULT now() | Letztes Update |

## Unterkategorien (sub_category)

| Wert | Beschreibung | Icon |
|---|---|---|
| `feier` | Festtags-/Geburtstagsdesigns | CakeSlice |
| `hochzeit` | Hochzeitstorten | PartyPopper |
| `bento` | Bento-Torten | Box |
| `zum-tee` | Kleine Torten zum Tee | Coffee |

## Beziehungen

- **Füllungen:** Verknüpft mit [[torten_flavours]] über die Junction-Tabelle `design_flavour` (n:m)
- **Bestellungen:** Wird in `orders.items` (JSONB) als `designId` referenziert

## RLS

| Operation | Erlaubt für |
|---|---|
| SELECT | Öffentlich |
| INSERT / UPDATE / DELETE | Admin only |

## Zugehörige Komponenten

- `components/design-selector.tsx` — Frontend-Design-Auswahl
- `components/admin-design-management.tsx` — Admin CRUD
- `app/api/designs/route.ts` — API-Endpunkte
