# Tabelle: torten_flavours

Globale **Füllungsoptionen** für Torten. Füllungen sind nicht design-spezifisch — ein Design kann beliebige Füllungen anbieten (via Junction-Tabelle `design_flavour`).

## Spalten

| Spalte | Typ | Constraints | Beschreibung |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Eindeutige ID |
| `slug` | `text` | UNIQUE, NOT NULL | URL-freundlicher Bezeichner |
| `flavour_number` | `integer` | UNIQUE, NOT NULL | Nummerische Bezeichnung der Füllung |
| `name_de` | `text` | NOT NULL | Name auf Deutsch |
| `name_uk` | `text` | NOT NULL | Name auf Ukrainisch |
| `description_de` | `text` | | Beschreibung Deutsch |
| `description_uk` | `text` | | Beschreibung Ukrainisch |
| `ingredients_de` | `text[]` | DEFAULT `[]` | Zutaten Deutsch (Array) |
| `ingredients_uk` | `text[]` | DEFAULT `[]` | Zutaten Ukrainisch (Array) |
| `allergens_de` | `text[]` | DEFAULT `[]` | Allergene Deutsch (Array) |
| `allergens_uk` | `text[]` | DEFAULT `[]` | Allergene Ukrainisch (Array) |
| `nutrition` | `jsonb` | | Nährwertinformationen |
| `image_url` | `text` | | Bild-URL |
| `created_at` | `timestamptz` | DEFAULT now() | Erstellungszeitpunkt |
| `updated_at` | `timestamptz` | DEFAULT now() | Letztes Update |

## Beziehungen

- Verknüpft mit [[torten_designs]] über `design_flavour` (Junction-Tabelle, n:m)
- `design_flavour`: `{ design_id → torten_designs.id, flavour_id → torten_flavours.id }`

## Nutrition-Format (JSONB)

```json
{
  "kcal": "320",
  "fat": "18g",
  "carbs": "35g",
  "protein": "5g"
}
```

Oder als preformatierter Text-Block (`nutritionText`) für komplexere Angaben.

## RLS

| Operation | Erlaubt für |
|---|---|
| SELECT | Öffentlich |
| INSERT / UPDATE / DELETE | Admin only |

## Zugehörige Komponenten

- `components/flavour-selector.tsx` — Frontend-Füllungsauswahl
- `components/flavour-detail-wrapper.tsx` — Zutaten, Allergene, Nährwerte
- `components/admin-flavour-management.tsx` — Admin CRUD
