# Tabellen: users & settings

## users

Nutzerprofile, verknüpft mit Supabase Auth (`auth.users`). Wird automatisch bei der Registrierung über einen DB-Trigger erstellt.

### Spalten

| Spalte | Typ | Constraints | Beschreibung |
|---|---|---|---|
| `id` | `uuid` | PK, FK → auth.users | Gleiche ID wie Supabase Auth |
| `full_name` | `text` | | Vollständiger Name |
| `phone` | `text` | | Telefonnummer |
| `avatar_url` | `text` | | Profilbild-URL |
| `role` | `text` | CHECK, DEFAULT `'customer'` | Rolle: `'customer'` oder `'admin'` |
| `created_at` | `timestamptz` | DEFAULT now() | Registrierungsdatum |
| `updated_at` | `timestamptz` | DEFAULT now() | Letztes Update |

### Rollen-System

| Rolle | Zugang |
|---|---|
| `customer` | Konto-Seiten, eigene Bestellungen, Custom-Design-Upload |
| `admin` | Alles + Admin-Panel, alle Bestellungen/Kunden, Produkt-CRUD |

Admin-Gating: `requireAdmin()` in `lib/supabase/require-admin.ts`.

### RLS

| Operation | Erlaubt für |
|---|---|
| SELECT | Eigene Zeile (`id = auth.uid()`) |
| UPDATE | Eigene Zeile |

---

## settings

Nutzer-Einstellungen (1:1 zu `users`).

### Spalten

| Spalte | Typ | Constraints | Beschreibung |
|---|---|---|---|
| `id` | `uuid` | PK | Eindeutige ID |
| `user_id` | `uuid` | UNIQUE, FK → users, NOT NULL | Verknüpfter Nutzer |
| `preferred_language` | `text` | DEFAULT `'de'` | Bevorzugte Sprache (`'de'` oder `'uk'`) |
| `marketing_opt_in` | `boolean` | DEFAULT `false` | Marketing-Einwilligung |
| `notifications_email` | `boolean` | DEFAULT `true` | E-Mail-Benachrichtigungen |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

### RLS

| Operation | Erlaubt für |
|---|---|
| SELECT / UPDATE | Eigene Zeile (`user_id = auth.uid()`) |

---

## custom_designs

Hochgeladene Custom-Design-Bilder von eingeloggten Nutzern.

### Spalten

| Spalte | Typ | Constraints | Beschreibung |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → users, NOT NULL | Eigentümer |
| `image_url` | `text` | NOT NULL | URL in Supabase Storage |
| `notes` | `text` | | Freitext-Notizen zum Design |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

### Storage-Pfad

```
custom-designs/{userId}/{filename}
```

### RLS

| Operation | Erlaubt für |
|---|---|
| SELECT / INSERT / UPDATE / DELETE | Eigene Zeile (`user_id = auth.uid()`) |

## Zugehörige Dateien

- `lib/supabase/account.ts` — Helper-Funktionen für alle drei Tabellen
- `app/api/account/profile/route.ts` — Profil & Einstellungen API
- `app/api/account/designs/route.ts` — Custom-Designs API
- `components/account/` — Frontend-Komponenten
