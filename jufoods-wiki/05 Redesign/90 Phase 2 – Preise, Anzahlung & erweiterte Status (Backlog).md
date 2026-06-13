# 90 Phase 2 – Preise, Anzahlung & erweiterte Status (Backlog)

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Status:** Backlog — nicht in Phase 1 umgesetzt
> **Referenz:** Mockup-Screens 04–06 zeigen diese Felder

---

## Warum Phase 2?

Das Preismodell erfordert **Datenbankmigrationen**, neue API-Endpunkte, UI-Felder im Admin
und Änderungen am Checkout/Warenkorb. Das Redesign (Phase 1) baut auf dem bestehenden
preisfreien Modell auf, um schnell lieferbar zu sein.

---

## Scope Phase 2

### 1. Preismodell

**Desserts:** Fester Preis pro Produkt.
- Migration: Neue Spalte `price_eur NUMERIC(10,2)` in `products`.
- Admin: Preis-Feld in `admin-product-management.tsx`.
- Warenkorb: Dessert-Artikel zeigen Preis; Subtotal berechnen.
- Checkout: Subtotal + Gesamtübersicht.

**Torten (individuelle):** Admin setzt Preis manuell nach Eingang der Bestellung.
- Migration: Neue Spalte `admin_price_eur NUMERIC(10,2)` in `orders`.
- Admin-UI: Preis-Feld `<input type="number" placeholder="€">` + „Senden"-Button → `PATCH /api/admin/orders/[id]` mit `{ price: ... }`.
- Kunden-Benachrichtigung: Preis-Update per E-Mail oder WhatsApp (außerhalb App).
- Kunden-Ansicht (Meine Bestellungen): Preis anzeigen sobald gesetzt, sonst „Preis wird bald mitgeteilt".

### 2. Erweiterte Bestellstatus (7 Stufen)

**Aktuelle DB-Status (4):** `pending | confirmed | completed | cancelled`

**Neue Status (7):**
```
pricing       → Preisberechnung
price_sent    → Preis gesendet
deposit_due   → Anzahlung ausstehend
confirmed     → Bestätigt
in_production → In Produktion
ready         → Abholbereit
completed     → Abgeschlossen
cancelled     → Storniert
```

**Migration:**
```sql
ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status = ANY (ARRAY[
    'pricing','price_sent','deposit_due','confirmed',
    'in_production','ready','completed','cancelled'
  ]));
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pricing';
```

> Bestehende `pending`-Einträge → migrieren zu `pricing`.

**Admin-UI:** Status-Dropdown mit allen 7 Optionen (wie im Mockup).
**Kunden-UI:** Status-Filter-Chips in [[16 Konto – Meine Bestellungen & Profil]] um neue Status erweitern.

### 3. Anzahlung (Deposit)

- Migration: Neue Spalte `deposit_paid BOOLEAN DEFAULT FALSE` in `orders`.
- Admin-UI: Checkbox „Anzahlung erhalten" (aus Mockup Screen 04 und 06).
- Logik: Checkbox setzt `deposit_paid = true` via `PATCH /api/admin/orders/[id]`.

### 4. Admin-Preis-Feld (Detail-Panel)

Aus Mockup Desktop Screen 04, Quick-Actions-Karte:

```
Preis festlegen:
[€ Betrag ─────────────────────] [Senden]
```

Und Mockup Mobile Screen 06:
```
Preis: [€ ────────] [Senden]
```

---

## Betroffene Dateien (Phase 2)

| Datei | Änderung |
|---|---|
| `supabase/migrations/YYYYMMDD_pricing.sql` | Neue Spalten + Status-Enum |
| `db_schema.md` | Dokumentation aktualisieren |
| `apps/web/types/supabase.ts` | `pnpm db:generate` nach Migration |
| `api/admin/orders/[id]/route.ts` | `price`, `deposit_paid` in PATCH-Body |
| `components/admin-orders-management.tsx` | Preis-Feld + Deposit-Checkbox |
| `components/account/recent-orders.tsx` | Preis anzeigen; neue Status-Chips |
| `components/shopping-cart.tsx` | Dessert-Subtotal |
| `components/checkout-client.tsx` | Gesamt-Preis-Zeile im Review-Schritt |
| `messages/de.json` + `uk.json` | Neue Status-Labels, Preis-Strings |

---

## Migrations-Skizze

```sql
-- 1. Preisspalten
ALTER TABLE products ADD COLUMN price_eur NUMERIC(10,2);
ALTER TABLE orders   ADD COLUMN admin_price_eur NUMERIC(10,2);
ALTER TABLE orders   ADD COLUMN deposit_paid BOOLEAN DEFAULT FALSE;

-- 2. Status-Enum erweitern
ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status = ANY (ARRAY[
    'pricing'::text,'price_sent'::text,'deposit_due'::text,
    'confirmed'::text,'in_production'::text,'ready'::text,
    'completed'::text,'cancelled'::text
  ]));

-- 3. Bestehende 'pending' → 'pricing' migrieren
UPDATE orders SET status = 'pricing' WHERE status = 'pending';
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pricing';
```

---

## i18n-Keys (Phase 2 Vorschau)

```jsonc
"admin": {
  "orders": {
    "actions": {
      "setPrice":   "Preis festlegen",
      "sendPrice":  "Senden",
      "deposit":    "Anzahlung erhalten"
    }
  }
},
"account": {
  "orderStatus": {
    "pricing":      "🕐 Preisberechnung",
    "price_sent":   "💬 Preis gesendet",
    "deposit_due":  "💳 Anzahlung ausstehend",
    "in_production":"🎂 In Produktion",
    "ready":        "📦 Abholbereit"
  }
}
```

---

## Abhängigkeiten vor Phase 2

1. Phase 1 (Redesign) vollständig deployed.
2. Entscheidung: Kunden-Benachrichtigung bei Preis-Update (E-Mail-Template? WhatsApp-API?).
3. Entscheidung: Dessert-Preise direkt in der DB pflegen oder aus externem System?
