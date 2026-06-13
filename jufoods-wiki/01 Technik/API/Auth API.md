# Auth API

Authentifizierung wird vollständig über **Supabase Auth** abgewickelt. Die folgenden Endpunkte sind Next.js Route Handler.

---

## GET /api/auth/me

Gibt den aktuellen Nutzer und seine Rolle zurück.

**Response `200`:**
```json
{ "role": "customer" }
// oder
{ "role": "admin" }
```

**Response `401`** (nicht eingeloggt):
```json
{ "error": "Not authenticated" }
```

---

## GET /api/auth/callback

OAuth- und E-Mail-Link-Callback-Handler. Tauscht den `code`-Parameter gegen eine Session aus.

**Query-Parameter:**
- `code` — Auth-Code von Supabase
- `next` — Redirect-Ziel nach Login (optional, Standard: `/`)

**Ablauf:**
1. `code` gegen Session tauschen (`exchangeCodeForSession`)
2. Redirect zu `next` oder `/`

**Zugehörige Datei:** `apps/web/app/api/auth/callback/route.ts`

---

## Supabase Auth — Client-seitige Flows

Die eigentliche Auth-Logik (Registrierung, Login, Logout, Passwort-Reset) läuft über den **Supabase Client** direkt aus den Formular-Komponenten:

### Login
```typescript
const supabase = createBrowserClient()
await supabase.auth.signInWithPassword({ email, password })
```

### Registrierung
```typescript
await supabase.auth.signUp({ email, password })
// → DB-Trigger erstellt automatisch users-Zeile
```

### Passwort vergessen
```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${origin}/api/auth/callback?next=/reset-password`
})
```

### Logout
```typescript
await supabase.auth.signOut()
```

---

## Session-Handling

- **Server-Komponenten:** `createClient()` aus `lib/supabase/server.ts` — liest Cookies automatisch
- **Browser-Komponenten:** `createBrowserClient()` — liest lokalen Session-Storage
- **Admin-Aktionen:** `createServiceRoleClient()` aus `lib/supabase/admin.ts` — bypassed RLS

## Nutzerprofil bei Registrierung

Ein PostgreSQL-Trigger erstellt bei jedem neuen `auth.users`-Eintrag automatisch:
- Einen Eintrag in `public.users` (Role: `'customer'`)
- Einen Eintrag in `public.settings` (Defaults)

Migration: `20250311_user_on_signup_and_role.sql`
