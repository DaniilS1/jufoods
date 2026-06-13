# Products & Designs API

## GET /api/products

Gibt alle Produkte zurück.

**Response `200`:**
```json
{ "products": [ ...Product[] ] }
```

---

## POST /api/products

Erstellt ein neues Produkt.

**Request Body:**
```typescript
{
  slug?: string
  name_uk: string              // Pflicht
  name_de: string              // Pflicht
  description_uk?: string
  description_de?: string
  ingredients_uk?: string
  ingredients_de?: string
  allergens_uk?: string
  allergens_de?: string
  category: 'torten' | 'desserts' | 'cookies' | 'macarons' | 'cheesecakes'
  sub_category?: string
  available_designs?: object[] // JSON-Array
  image_url?: string
}
```

**Response `201`:**
```json
{ "product": { ...Product } }
```

---

## GET /api/designs

Gibt alle Tortendesigns zurück.

**Response `200`:**
```json
{ "designs": [ ...TortenDesign[] ] }
```

---

## POST /api/designs

Erstellt ein neues Tortendesign.

**Request Body:**
```typescript
{
  name_uk: string
  name_de: string
  description_uk?: string
  description_de?: string
  sub_category?: string         // 'feier' | 'hochzeit' | 'bento' | 'zum-tee'
  image_url?: string
  slug?: string
}
```

**Response `201`:**
```json
{ "id": "uuid" }
```

---

## PUT /api/designs

Aktualisiert ein vorhandenes Tortendesign.

**Request Body:**
```typescript
{
  id: string       // uuid — Pflicht
  name_uk: string
  name_de: string
  // ... alle weiteren Felder optional
}
```

**Response `200`:**
```json
{ "success": true }
```

---

## DELETE /api/designs

Löscht ein Tortendesign.

**Query-Parameter:** `?id=uuid`

**Response `200`:**
```json
{ "success": true }
```

---

## POST /api/custom-designs

Lädt ein Custom-Design-Bild hoch (auch ohne Login). Wird aus dem Bestell-Formular verwendet.

**Request:** `FormData`
- `file` — Bilddatei
- `productId` — zugehörige Produkt-ID

**Response `200`:**
```json
{ "imageUrl": "https://...supabase.co/storage/v1/object/public/bilder/..." }
```

---

## POST /api/upload

Allgemeines Bild-Upload-Endpoint für Admin-Zwecke.

**Request:** `FormData`
- `file` — Bilddatei

**Response `200`:**
```json
{ "imageUrl": "https://...supabase.co/storage/v1/object/public/bilder/..." }
```

Storage-Bucket: `bilder` (öffentlich).
