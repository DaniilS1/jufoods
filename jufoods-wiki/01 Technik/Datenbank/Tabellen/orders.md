# Tabelle: orders

Speichert alle Kundenbestellungen. Unterstützt sowohl Gast-Bestellungen als auch Bestellungen von eingeloggten Nutzern.

## Spalten

| Spalte | Typ | Constraints | Beschreibung |
|---|---|---|---|
| `id` | `uuid` | PK | Eindeutige Bestell-ID |
| `user_id` | `uuid` | FK → users (optional) | Eingeloggter Nutzer (null = Gast) |
| `customer_id` | `uuid` | FK → customers, NOT NULL | Kundendatensatz (immer vorhanden) |
| `customer_name` | `text` | NOT NULL | Vollständiger Name (denormalisiert) |
| `customer_email` | `text` | NOT NULL | E-Mail (denormalisiert) |
| `customer_phone` | `text` | | Telefonnummer |
| `customer_address` | `text` | | Lieferadresse |
| `notes` | `text` | | Freitext-Anmerkungen aus dem Checkout |
| `items` | `jsonb` | NOT NULL | Bestellpositionen (s.u.) |
| `checkout_details` | `jsonb` | | Vollständiges strukturiertes Checkout-Payload |
| `custom_design_id` | `uuid` | FK → custom_designs (optional) | Hochgeladenes Custom-Design |
| `status` | `text` | CHECK | Bestellstatus (s.u.) |
| `created_at` | `timestamptz` | DEFAULT now() | Bestellzeitpunkt |
| `updated_at` | `timestamptz` | DEFAULT now() | Letztes Update |

## Status-Werte (CHECK-Constraint)

| Status | Beschreibung |
|---|---|
| `pending` | Neu eingegangen (Standard) |
| `confirmed` | Vom Admin bestätigt |
| `completed` | Fertiggestellt & übergeben |
| `cancelled` | Storniert |

## items (JSONB-Format)

Array von Bestellpositionen:

```json
[
  {
    "productId": "uuid",
    "designId": "uuid",
    "quantity": 2,
    "personCount": 10,
    "deliveryDate": "2026-07-15",
    "remarks": "Bitte ohne Nüsse"
  }
]
```

## checkout_details (JSONB-Format)

Vollständiges Checkout-Payload (siehe [[../../Business Logik/Bestellprozess|Bestellprozess]]):

```json
{
  "contact": {
    "salutation": "mrs",
    "firstName": "Anna",
    "lastName": "Müller",
    "phone": "+49 123 456789",
    "consentWhatsapp": true,
    "consentTelegram": false,
    "messengerPhone": null
  },
  "orderDetails": {
    "eventDate": "2026-07-15",
    "eventTime": "15:00",
    "celebrationDate": "Geburtstag",
    "remarks": "Herzlichen Glückwunsch!"
  },
  "delivery": {
    "pickupOrDelivery": "pickup",
    "deliveryAddress": null
  },
  "referralSource": "Instagram",
  "residenceCity": "München"
}
```

## RLS

| Operation | Erlaubt für |
|---|---|
| SELECT | Admin: alle; Nutzer: eigene (`user_id`) |
| INSERT | Anonym (Gast-Bestellungen möglich) |
| UPDATE | Admin only |

## Zugehörige Dateien

- `app/api/orders/route.ts` — Bestellanlage & Webhook
- `app/api/admin/orders/[id]/route.ts` — Status-Update
- `lib/orders/order-types.ts` — TypeScript-Typen
