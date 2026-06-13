# API Überblick

Alle API-Endpunkte der Jufoods-App. Implementiert als Next.js Route Handlers in `apps/web/app/api/`.

## Öffentliche Endpunkte

| Methode | Route | Zweck | Details |
|---|---|---|---|
| `GET` | `/api/products` | Alle Produkte | [[Products & Designs API]] |
| `POST` | `/api/products` | Produkt erstellen | [[Products & Designs API]] |
| `GET` | `/api/designs` | Alle Tortendesigns | [[Products & Designs API]] |
| `POST` | `/api/designs` | Design erstellen | [[Products & Designs API]] |
| `PUT` | `/api/designs` | Design aktualisieren | [[Products & Designs API]] |
| `DELETE` | `/api/designs?id=uuid` | Design löschen | [[Products & Designs API]] |
| `POST` | `/api/orders` | Bestellung aufgeben | [[Orders API]] |
| `POST` | `/api/custom-designs` | Custom-Bild hochladen (anon) | [[Products & Designs API]] |
| `POST` | `/api/upload` | Bild zu Storage hochladen | [[Products & Designs API]] |

## Auth-Endpunkte

| Methode | Route | Zweck | Details |
|---|---|---|---|
| `GET` | `/api/auth/me` | Aktuellen Nutzer & Rolle | [[Auth API]] |
| `GET` | `/api/auth/callback` | OAuth-Callback | [[Auth API]] |

## Account-Endpunkte (Login erforderlich)

| Methode | Route | Zweck | Details |
|---|---|---|---|
| `GET` | `/api/account/profile` | Profil & Einstellungen | [[Account API]] |
| `PUT` | `/api/account/profile` | Profil aktualisieren | [[Account API]] |
| `PUT` | `/api/account/password` | Passwort ändern | [[Account API]] |
| `GET` | `/api/account/orders` | Eigene Bestellungen | [[Account API]] |
| `GET` | `/api/account/designs` | Eigene Custom-Designs | [[Account API]] |
| `POST` | `/api/account/designs` | Custom-Design hochladen | [[Account API]] |

## Admin-Endpunkte (Admin-Rolle erforderlich)

| Methode | Route | Zweck | Details |
|---|---|---|---|
| `GET` | `/api/admin/orders` | Alle Bestellungen | [[Admin API]] |
| `GET` | `/api/admin/orders/[id]` | Bestelldetails | [[Admin API]] |
| `PATCH` | `/api/admin/orders/[id]` | Status ändern | [[Admin API]] |
| `GET` | `/api/admin/customers` | Alle Kunden | [[Admin API]] |

## Authentifizierungsmuster

### Öffentliche Routen
Kein Auth-Check, Supabase-Client mit Anon-Key.

### Account-Routen
```typescript
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### Admin-Routen
```typescript
const { ok, status, message, supabase, user } = await requireAdmin()
if (!ok) return NextResponse.json({ error: message }, { status })
```

## Fehlerformat

```json
{ "error": "Fehlerbeschreibung" }
```

HTTP-Status-Codes: `400` (Bad Request), `401` (Unauthorized), `403` (Forbidden), `404` (Not Found), `500` (Server Error).
