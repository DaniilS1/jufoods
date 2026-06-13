# Account API

Alle Endpunkte erfordern eine aktive Supabase-Session (Login). Bei fehlendem Auth: `401 Unauthorized`.

---

## GET /api/account/profile

Gibt Nutzerprofil und Einstellungen zurück.

**Response `200`:**
```json
{
  "profile": {
    "fullName": "Anna Müller",
    "phone": "+49 123 456789",
    "email": "anna@example.com"
  },
  "settings": {
    "preferredLanguage": "de",
    "marketingOptIn": false,
    "notificationsEmail": true
  }
}
```

---

## PUT /api/account/profile

Aktualisiert Profil und/oder Einstellungen.

**Request Body (alle Felder optional):**
```typescript
{
  fullName?: string
  phone?: string
  preferredLanguage?: 'de' | 'uk'
  marketingOptIn?: boolean
  notificationsEmail?: boolean
}
```

**Response `200`:** Aktualisiertes Profil + Einstellungen.

---

## PUT /api/account/password

Ändert das Passwort des eingeloggten Nutzers.

**Request Body:**
```typescript
{ "newPassword": string }  // 8–72 Zeichen
```

**Response `200`:**
```json
{ "success": true }
```

**Fehler:**
```json
// 400
{ "error": "Password must be between 8 and 72 characters" }
```

---

## GET /api/account/orders

Gibt die letzten Bestellungen des eingeloggten Nutzers zurück.

**Query-Parameter:** `?limit=5` (Standard: 5, Min: 1, Max: 20)

**Response `200`:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "status": "completed",
      "createdAt": "2026-05-15T...",
      "items": [...]
    }
  ]
}
```

---

## GET /api/account/designs

Listet alle Custom-Designs des eingeloggten Nutzers auf.

**Response `200`:**
```json
{
  "designs": [
    {
      "id": "uuid",
      "imageUrl": "https://...supabase.co/...",
      "notes": "Mein Wunschdesign für Geburtstag",
      "createdAt": "2026-03-10T..."
    }
  ]
}
```

---

## POST /api/account/designs

Lädt ein neues Custom-Design als eingeloggter Nutzer hoch.

**Request:** `FormData`
- `file` — Bilddatei
- `notes` — Optionaler Text

**Response `200`:**
```json
{
  "design": {
    "id": "uuid",
    "imageUrl": "https://...supabase.co/custom-designs/{userId}/{filename}",
    "notes": "...",
    "createdAt": "2026-06-06T..."
  }
}
```

---

## Zugehörige Dateien

- `apps/web/app/api/account/profile/route.ts`
- `apps/web/app/api/account/password/route.ts`
- `apps/web/app/api/account/orders/route.ts`
- `apps/web/app/api/account/designs/route.ts`
- `apps/web/lib/supabase/account.ts`
- `apps/web/components/account/`
