# Supabase

## Überblick

Jufoods nutzt **Supabase** als vollständiges Backend: Datenbank (PostgreSQL), Authentifizierung und Datei-Storage. Betrieb **ausschließlich remote** — kein lokaler Datenbankserver.

## Supabase-Clients

Es gibt drei verschiedene Clients, je nach Kontext:

### 1. Server-Client (SSR)
`lib/supabase/server.ts` — für Server-Komponenten und Route Handlers.

```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = createClient()
```

- Verwaltet Cookies automatisch (Session-Persistenz)
- Gibt Mock-Client zurück, falls Env-Vars fehlen
- Nutzt `getUserSafely()` für fehlertolerantes Auth-Checking

### 2. Service-Role-Client
`lib/supabase/admin.ts` — bypassed RLS komplett.

```typescript
import { createServiceRoleClient } from '@/lib/supabase/admin'
const supabase = createServiceRoleClient()
```

- Nur für Server-seitige Mutationen (Bestellanlage, Customer-Update)
- Gibt `null` zurück, wenn `SUPABASE_SERVICE_ROLE_KEY` fehlt
- **Niemals** clientseitig verwenden

### 3. Browser-Client
`lib/supabase/client.ts` — für Client-Komponenten.

```typescript
import { createBrowserClient } from '@supabase/ssr'
```

Wird in Form-Komponenten für Auth-Aktionen (Login, Signup, etc.) verwendet.

---

## Admin-Guard

```typescript
import { requireAdmin } from '@/lib/supabase/require-admin'

const { ok, status, message, supabase, user } = await requireAdmin()
if (!ok) return NextResponse.json({ error: message }, { status })
```

Prüft:
1. Ob Nutzer eingeloggt ist
2. Ob `users.role = 'admin'`

---

## Storage

- **Bucket:** `bilder` (öffentlich zugänglich)
- **Pfad-Konventionen:**
  ```
  products/{productId}/{filename}
  custom-designs/{userId}/{filename}
  ```
- **URL-Format:**
  ```
  https://{SUPABASE_URL}/storage/v1/object/public/bilder/{path}
  ```
- URL-Normalisierung via `lib/image-utils.ts`

---

## Datenbank-Workflow

```bash
# Nach Schema-Änderungen (neue Spalten, neue Tabellen):
pnpm db:migrate        # Migrationen anwenden
pnpm db:generate       # TypeScript-Typen regenerieren

# Daten visuell verwalten:
pnpm db:studio         # Öffnet Supabase Studio im Browser
```

Migrations-Dateien: `apps/web/supabase/migrations/`
Generierte Typen: `apps/web/lib/database.types.ts` (nie manuell bearbeiten)

---

## Verweise

- [[../Datenbank/Schema Überblick|Datenbankschema]]
- [[../Datenbank/Migrationen|Migrationsverlauf]]
- [[Umgebungsvariablen|Umgebungsvariablen]]
