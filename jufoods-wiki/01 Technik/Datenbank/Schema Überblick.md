# Datenbankschema — Überblick

Supabase (PostgreSQL) mit Row-Level Security (RLS). Remote-only — kein lokaler Datenbankserver.

Vollständige Referenz: `db_schema.md` im Repository-Root.

---

## Tabellenübersicht

| Tabelle | Zweck |
|---|---|
| `products` | Nicht-Torten-Produkte (Desserts, Cookies, Cheesecakes, Macarons) |
| `torten_designs` | Spezifische Tortendesigns mit Bildern und Unterkategorien |
| `torten_flavours` | Globale Füllungsoptionen für Torten |
| `design_flavour` | Junction-Tabelle: welche Füllungen für welches Design verfügbar sind |
| `orders` | Kundenbestellungen |
| `customers` | Kunden-Datensätze (auch Gäste) |
| `users` | Nutzerprofile, verknüpft mit Supabase Auth |
| `settings` | Nutzer-Einstellungen (Sprache, Marketing-Opt-In) |
| `custom_designs` | Hochgeladene Custom-Design-Bilder von Nutzern |

---

## Entity-Relationship-Diagramm

```
auth.users
    │
    └──▶ users (role: customer|admin)
              │
              ├──▶ settings (1:1)
              ├──▶ custom_designs (1:n)
              └──▶ customers (optional link, 1:1)

customers
    └──▶ orders (1:n)
              │
              ├── items (jsonb)
              ├── checkout_details (jsonb)
              └──▶ custom_designs (optional FK)

products ──────────────────────────────────────────▶ orders.items (via productId in jsonb)

torten_designs ──▶ design_flavour ◀── torten_flavours
      │
      └──────────────────────────────────────────────▶ orders.items (via designId in jsonb)
```

---

## Row-Level Security (RLS)

| Tabelle | Lesen | Schreiben |
|---|---|---|
| `products` | Öffentlich | Admin only |
| `torten_designs` | Öffentlich | Admin only |
| `torten_flavours` | Öffentlich | Admin only |
| `design_flavour` | Öffentlich | Admin only |
| `orders` | Admin: alle; Nutzer: eigene | Anonym (Bestellanlage); Admin: Status-Update |
| `customers` | Admin only | Service-Role (bypass RLS) |
| `users` | Eigene Zeile | Eigene Zeile |
| `settings` | Eigene Zeile | Eigene Zeile |
| `custom_designs` | Eigene Zeile | Eigene Zeile |

> Admin-Checks laufen über `requireAdmin()` in `lib/supabase/require-admin.ts`. Der Service-Role-Client bypassed RLS komplett.

---

## Storage

- **Bucket:** `bilder` (öffentlich)
- **Pfade:**
  - Produktbilder: `products/{productId}/{filename}`
  - Custom Designs: `custom-designs/{userId}/{filename}`
  - Tortendesign-Bilder: verschiedene Pfade unter designs

**URL-Pattern:**
```
https://{SUPABASE_URL}/storage/v1/object/public/bilder/{path}
```

URL-Normalisierung über `lib/image-utils.ts`. Fallback: `/placeholder-cake.svg`.

---

## Einzelne Tabellen

- [[Tabellen/products|products]]
- [[Tabellen/torten_designs|torten_designs]]
- [[Tabellen/torten_flavours|torten_flavours]]
- [[Tabellen/orders|orders]]
- [[Tabellen/customers|customers]]
- [[Tabellen/users & settings|users & settings]]
- [[Migrationen|Migrationsverlauf]]
