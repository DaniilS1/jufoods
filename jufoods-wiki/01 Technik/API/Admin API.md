# Admin API

Alle Endpunkte erfordern `role = 'admin'`. Zugang wird über `requireAdmin()` in `lib/supabase/require-admin.ts` geprüft.

---

## GET /api/admin/orders

Listet alle Bestellungen auf.

**Response `200`:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "customer_name": "Anna Müller",
      "customer_email": "anna@example.com",
      "customer_phone": "+49 123 456789",
      "status": "pending",
      "items": [...],
      "created_at": "2026-06-06T12:00:00Z"
    }
  ]
}
```

---

## GET /api/admin/orders/[id]

Gibt Details einer einzelnen Bestellung zurück — inkl. **angereicherter Items** (Produkt- und Designnamen aufgelöst).

**Response `200`:**
```json
{
  "order": { ...vollständiger Order-Datensatz },
  "enrichedItems": [
    {
      "productName": "Schokoladentorte",
      "designName": "Bento-Design Herz",
      "quantity": 1,
      "images": ["https://..."]
    }
  ]
}
```

---

## PATCH /api/admin/orders/[id]

Aktualisiert den Status einer Bestellung.

**Request Body:**
```json
{ "status": "confirmed" }
```

**Erlaubte Status-Werte:** `pending` | `confirmed` | `completed` | `cancelled`

**Response `200`:**
```json
{ "success": true }
```

**Fehler:**
```json
// 400
{ "error": "Invalid status value" }

// 404
{ "error": "Order not found" }
```

---

## GET /api/admin/customers

Listet alle Kunden auf.

**Response `200`:**
```json
{
  "customers": [
    {
      "id": "uuid",
      "display_email": "anna@example.com",
      "full_name": "Anna Müller",
      "phone_or_social": "+49 123 456789",
      "residence_city": "München",
      "order_count": 3,
      "first_order_at": "2025-12-01T...",
      "last_order_at": "2026-06-01T..."
    }
  ]
}
```

---

## Zugehörige Dateien

- `apps/web/app/api/admin/orders/route.ts`
- `apps/web/app/api/admin/orders/[id]/route.ts`
- `apps/web/app/api/admin/customers/route.ts`
- `apps/web/lib/supabase/require-admin.ts`
- `apps/web/components/admin-orders-management.tsx`
- `apps/web/components/admin-customers-management.tsx`
