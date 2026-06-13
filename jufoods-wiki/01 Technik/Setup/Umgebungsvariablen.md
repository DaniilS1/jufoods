# Umgebungsvariablen

Konfigurationsdatei: `apps/web/.env` (aus `.env.example` kopieren, nie committen).

---

## Pflichtfelder

| Variable | Beschreibung |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-Projekt-URL (öffentlich, im Browser verfügbar) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon-Key für clientseitige Supabase-Operationen |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-Role-Key (nur serverseitig! RLS-Bypass) |

> `NEXT_PUBLIC_*` Variablen sind im Browser sichtbar — nur öffentlich unkritische Werte verwenden.
> `SUPABASE_SERVICE_ROLE_KEY` **niemals** clientseitig verwenden.

---

## Optionale Felder

| Variable | Standard | Beschreibung |
|---|---|---|
| `ORDER_WEBHOOK_URL` | — | Ziel-URL für Order-Benachrichtigungen (z.B. n8n) |
| `ORDER_WEBHOOK_TIMEOUT_MS` | `8000` | Webhook-Timeout in ms (min: 2000, max: 30000) |

---

## Wo die Werte finden?

1. **Supabase Dashboard** → Project Settings → API
   - `NEXT_PUBLIC_SUPABASE_URL` = "Project URL"
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = "anon (public)"
   - `SUPABASE_SERVICE_ROLE_KEY` = "service_role (secret)"

2. **Webhook-URL** = dein n8n- oder sonstiger Automation-Endpunkt

---

## Sicherheitshinweise

- `.env` ist in `.gitignore` — niemals committen
- `SUPABASE_SERVICE_ROLE_KEY` gibt vollständigen DB-Zugriff ohne RLS — geheim halten
- Im Production-Deployment: über Hosting-Plattform (Vercel, Coolify, etc.) als Secrets setzen

---

## Verweise

- Setup: [[Dev Setup]]
- Supabase-Konfiguration: [[Supabase]]
