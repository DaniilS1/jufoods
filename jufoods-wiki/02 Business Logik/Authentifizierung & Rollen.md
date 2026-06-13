# Authentifizierung & Rollen

## Authentifizierungssystem

**Supabase Auth** — E-Mail/Passwort + OAuth (via Supabase-Konfiguration).

Nutzer können sich optional registrieren. Bestellen ist auch als Gast möglich.

---

## Registrierungs-Flow

```
Nutzer füllt Registrierungsformular aus
    ↓
supabase.auth.signUp({ email, password })
    ↓
Supabase erstellt auth.users-Eintrag
    ↓
DB-Trigger läuft automatisch:
  → INSERT in public.users (role: 'customer')
  → INSERT in public.settings (Defaults)
    ↓
Nutzer erhält Bestätigungs-E-Mail
```

Trigger-Migration: `20250311_user_on_signup_and_role.sql`

---

## Login-Flow

```
supabase.auth.signInWithPassword({ email, password })
    ↓
Session wird in Cookie gespeichert
    ↓
Server-Komponenten lesen Session via createClient() (SSR-Client)
```

---

## Passwort-Reset-Flow

```
1. /forgot-password → supabase.auth.resetPasswordForEmail(email, {
     redirectTo: `${origin}/api/auth/callback?next=/reset-password`
   })

2. Nutzer klickt Link in E-Mail
   → /api/auth/callback?code=...&next=/reset-password

3. Server tauscht Code gegen Session aus
   → Redirect zu /reset-password

4. /reset-password → supabase.auth.updateUser({ password: newPassword })
```

---

## Rollen-System

| Rolle | Beschreibung | Gesetzt durch |
|---|---|---|
| `customer` | Standard-Nutzer nach Registrierung | DB-Trigger automatisch |
| `admin` | Vollzugriff auf Admin-Panel und alle Daten | Manuell in DB setzen |

### Admin-Rolle vergeben

Im Supabase Studio oder via SQL:
```sql
UPDATE public.users SET role = 'admin' WHERE id = 'user-uuid';
```

### Admin-Check im Code

```typescript
// lib/supabase/require-admin.ts
const { ok, status, message, supabase, user } = await requireAdmin()
if (!ok) return NextResponse.json({ error: message }, { status })
```

Prüft: 1) Session vorhanden → 2) `users.role = 'admin'`

---

## Session-Management

| Kontext | Client | Datei |
|---|---|---|
| Server-Komponenten / API-Routes | `createClient()` (SSR) | `lib/supabase/server.ts` |
| Client-Komponenten | `createBrowserClient()` | `lib/supabase/client.ts` |
| Admin-Operationen (RLS-bypass) | `createServiceRoleClient()` | `lib/supabase/admin.ts` |

---

## Geschützte Seiten

| Seite | Schutz |
|---|---|
| `/[locale]/account` | Login erforderlich (client-seitig geprüft) |
| `/[locale]/admin` | Login + `role='admin'` |
| `/api/account/*` | Login erforderlich (401 wenn nicht authentifiziert) |
| `/api/admin/*` | Login + `role='admin'` (403 wenn keine Admin-Rolle) |

---

## Formular-Komponenten

| Komponente | Zuständig für |
|---|---|
| `components/login-form.tsx` | Login |
| `components/register-form.tsx` | Registrierung |
| `components/forgot-password-form.tsx` | Passwort-Zurücksetzen-Anfrage |
| `components/reset-password-form.tsx` | Neues Passwort setzen |
| `components/auth-button.tsx` | Login/Logout-Button im Header |
