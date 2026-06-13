# Orders API

## POST /api/orders

Legt eine neue Bestellung an. Öffentlich zugänglich (Gast-Bestellungen möglich).

### Request Body

```typescript
{
  items: Array<{
    productId: string   // uuid
    designId: string    // uuid
    quantity: number
  }>

  customer: {
    email: string                         // Pflicht
    fullName?: string
    firstName?: string
    lastName?: string
    phone?: string
    phoneOrSocial?: string
    residenceCity?: string
    salutation?: 'mr' | 'mrs'
    consentWhatsapp: boolean
    consentTelegram: boolean
    messengerPhone?: string
    referralSource?: string               // Woher kennen Sie uns?
  }

  orderDetails?: {
    eventDate?: string                    // ISO-Datum
    eventTime?: string
    celebrationDate?: string             // Anlass
    timeNeeded?: string
    remarks?: string                     // Freitext-Notizen
  }

  delivery?: {
    pickupOrDelivery?: 'pickup' | 'delivery'
    deliveryStreet?: string
    deliveryPostalCode?: string
    deliveryCity?: string
    deliveryAddress?: string | null
  }

  customDesignId?: string                 // uuid (optional)
  locale: 'de' | 'uk'
}
```

### Validierung (Server-side)

- `items` muss nicht-leeres Array sein
- `customer.email` oder `customer.fullName` muss vorhanden sein
- Name wird aus `firstName + lastName` zusammengesetzt, falls kein `fullName`

### Server-Verarbeitung

1. E-Mail normalisieren (`trim().toLowerCase()`)
2. Customer per `email_normalized` suchen
3. Falls nicht gefunden: neuen Customer anlegen
4. `order_count++`, `last_order_at = now()` aktualisieren
5. Order mit `status = 'pending'` in `orders`-Tabelle einfügen
6. Line-Items anreichern (Produkt- und Design-Namen per DB-Query)
7. Webhook feuern (fire-and-forget, konfigurierbar)
8. `{ success: true, orderId }` zurückgeben

### Response

```json
// 201 Created
{ "success": true, "orderId": "uuid" }

// 400 Bad Request
{ "error": "Items array is required and must not be empty" }

// 500 Internal Server Error
{ "error": "Failed to create order" }
```

---

## Webhook (Order Notifications)

Wenn `ORDER_WEBHOOK_URL` gesetzt ist, sendet der Server nach jeder Bestellung ein POST-Request.

### Payload

```typescript
{
  event: 'order.created'
  version: 1
  order: Record<string, any>    // Voller Order-Datensatz aus DB
  customerId: string
  enrichedLines: Array<{
    quantity: number
    productName: string         // Aufgelöster Produktname
    designName: string | null   // Aufgelöster Designname
  }>
  locale: 'de' | 'uk'
}
```

### Konfiguration

| Variable | Beschreibung | Standard |
|---|---|---|
| `ORDER_WEBHOOK_URL` | Ziel-URL (z.B. n8n) | — (deaktiviert wenn leer) |
| `ORDER_WEBHOOK_TIMEOUT_MS` | Timeout in ms | `8000` (min: 2000, max: 30000) |

Der Webhook läuft **fire-and-forget** — ein Timeout oder Fehler blockiert nicht die Bestellbestätigung.

### Zugehörige Dateien

- `apps/web/app/api/orders/route.ts`
- `apps/web/lib/orders/order-types.ts`
