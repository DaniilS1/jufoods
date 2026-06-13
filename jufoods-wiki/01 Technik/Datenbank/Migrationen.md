# Migrationsverlauf

Alle Migrationsdateien liegen in `apps/web/supabase/migrations/`. Werden mit `pnpm db:migrate` auf die Remote-Datenbank angewendet.

## Migrationen in chronologischer Reihenfolge

| Datum | Datei | Zweck |
|---|---|---|
| 2024-01-01 | `initial_schema.sql` | Basistabellen: `products`, `users`, `orders` |
| 2024-01-02 | `insert_products.sql` | Initialer Produkt-Seed |
| 2024-01-03 | `create_storage_bucket.sql` | Erstellt `bilder`-Storage-Bucket |
| 2024-01-04 | `create_designs_table.sql` | Erste Torten-Designs-Tabelle |
| 2024-01-05 | `update_categories.sql` | Produktkategorien ergänzt/angepasst |
| 2024-01-06 | `add_products_crud_policies.sql` | RLS-Policies für `products` |
| 2024-01-07 | `fix_storage_policies.sql` | Storage-Bucket-Berechtigungen korrigiert |
| 2025-02-01 | `torten_design_flavour.sql` | Neue Tabellen: `torten_designs`, `torten_flavours` |
| 2025-02-20 | `create_design_flavour_link.sql` | Junction-Tabelle `design_flavour` (n:m) |
| 2025-03-09 | `add_order_item_remarks.sql` | Anmerkungs-Feld pro Bestellposition |
| 2025-03-11 | `user_on_signup_and_role.sql` | DB-Trigger: `users`-Zeile bei Registrierung; `role`-Feld |
| 2025-03-15 | `add_torten_designs_classic.sql` | `classic`-Boolean auf `torten_designs` |
| 2025-03-15 | `add_torten_designs_images_urls.sql` | `images_urls`-Array auf `torten_designs` |
| 2025-03-16 | `add_torten_flavours_flavour_number.sql` | `flavour_number` (unique int) auf `torten_flavours` |
| 2025-11-24 | `account_enhancements.sql` | `settings`-Tabelle; Profil-Erweiterungen |
| 2026-03-28 | `customers_and_order_enhancements.sql` | `customers`-Tabelle; `checkout_details`-JSONB auf `orders`; Order-Customer-Verknüpfung |
| 2026-05-09 | `products_ingredients_allergens_text.sql` | `ingredients_*` und `allergens_*` von Arrays auf `text` umgestellt |

## Befehle

```bash
# Neue Migration anlegen
# Datei manuell in supabase/migrations/ anlegen mit Timestamp-Präfix:
# YYYYMMDDHHMMSS_beschreibung.sql

# Migrationen anwenden
pnpm db:migrate

# TypeScript-Typen neu generieren (nach jeder Migration!)
pnpm db:generate
```

> **Wichtig:** Nach jeder Migration immer `pnpm db:generate` ausführen, damit `lib/database.types.ts` aktuell bleibt.
