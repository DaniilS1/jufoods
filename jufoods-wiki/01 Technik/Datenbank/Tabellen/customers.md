# Tabelle: customers

Kunden-Datensätze für alle Bestellenden — inkl. Gäste ohne Account. **Guest-first Design**: jede Bestellung erstellt oder aktualisiert automatisch einen Customer-Eintrag.

## Spalten

| Spalte | Typ | Constraints | Beschreibung |
|---|---|---|---|
| `id` | `uuid` | PK | Eindeutige Kunden-ID |
| `email_normalized` | `text` | UNIQUE, NOT NULL | E-Mail lowercase + trimmed (für Deduplizierung) |
| `display_email` | `text` | NOT NULL | E-Mail in Originalschreibweise |
| `full_name` | `text` | NOT NULL | Vollständiger Name |
| `phone_or_social` | `text` | | Telefon oder Messenger-Handle |
| `residence_city` | `text` | | Wohnort |
| `user_id` | `uuid` | FK → users (optional) | Link zu Auth-Account (falls vorhanden) |
| `first_order_at` | `timestamptz` | | Zeitpunkt der ersten Bestellung |
| `last_order_at` | `timestamptz` | | Zeitpunkt der letzten Bestellung |
| `order_count` | `integer` | DEFAULT 0 | Anzahl Bestellungen |
| `created_at` | `timestamptz` | DEFAULT now() | Erstellungszeitpunkt |
| `updated_at` | `timestamptz` | DEFAULT now() | Letztes Update |

## Deduplizierungslogik

Beim Anlegen einer Bestellung (`POST /api/orders`):

1. E-Mail normalisieren: `email.trim().toLowerCase()`
2. Suche nach `email_normalized`
3. **Gefunden:** `order_count++`, `last_order_at = now()`
4. **Nicht gefunden:** Neuen Customer-Eintrag anlegen

→ Ein Kunde kann mehrfach bestellen, ohne Account zu haben.

## RLS

| Operation | Erlaubt für |
|---|---|
| SELECT | Admin only |
| INSERT / UPDATE | Service-Role-Client (bypassed RLS) |

> Schreibzugriff erfolgt **nur** serverseitig über den Service-Role-Client (`lib/supabase/admin.ts`), nie clientseitig.

## Beziehungen

- `customers.id` → `orders.customer_id` (1:n)
- `customers.user_id` → `users.id` (optional 1:1)

## Zugehörige Dateien

- `app/api/orders/route.ts` — Customer-Anlage & -Update bei Bestelleingang
- `app/api/admin/customers/route.ts` — Admin-Listenansicht
- `components/admin-customers-management.tsx` — Frontend-Ansicht
