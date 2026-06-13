# Routing & Seiten

## Routing-Übersicht

Alle Seiten haben ein Locale-Präfix (`/de/...` oder `/uk/...`). Die Middleware (`apps/web/middleware.ts`) erkennt die Sprache automatisch und leitet um.

- **Default-Locale:** Deutsch (`de`)
- **Unterstützte Locales:** `['uk', 'de']`
- **Ausnahmen (kein Locale-Präfix):** `/api/*`, `/_next/*`, statische Dateien, Favicons

---

## Öffentliche Seiten

| Route | Zweck |
|---|---|
| `/[locale]` | Homepage / Landing Page |
| `/[locale]/products` | Produktkatalog |
| `/[locale]/products/[slug]` | Produktdetail-Ansicht |
| `/[locale]/checkout` | Bestellprozess (mehrstufig) |
| `/[locale]/order-success` | Bestellbestätigung nach erfolgreichem Checkout |
| `/[locale]/favorites` | Favoriten-Liste |
| `/[locale]/about` | Über uns |
| `/[locale]/contact` | Kontaktformular |

## Auth-Seiten

| Route | Zweck |
|---|---|
| `/[locale]/login` | Anmelde-Formular |
| `/[locale]/register` | Registrierung |
| `/[locale]/forgot-password` | Passwort-Zurücksetzen-Anfrage |
| `/[locale]/reset-password` | Neues Passwort setzen |
| `/[locale]/account` | Kundenkonto-Dashboard |

## Admin-Seiten (geschützt)

| Route | Zweck |
|---|---|
| `/[locale]/admin` | Admin-Dashboard |

Zugang nur für Nutzer mit `role = 'admin'`. Gating über `requireAdmin()` in `lib/supabase/require-admin.ts`.

---

## API Routes

### Öffentliche Endpoints

| Methode | Route | Zweck |
|---|---|---|
| `GET` | `/api/products` | Alle Produkte abrufen |
| `POST` | `/api/products` | Produkt erstellen (admin) |
| `GET` | `/api/designs` | Alle Torten-Designs abrufen |
| `POST` | `/api/designs` | Design erstellen (admin) |
| `PUT` | `/api/designs` | Design aktualisieren (admin) |
| `DELETE` | `/api/designs?id=uuid` | Design löschen (admin) |
| `POST` | `/api/orders` | Bestellung aufgeben |
| `POST` | `/api/custom-designs` | Custom-Design-Bild hochladen |
| `POST` | `/api/upload` | Bild zu Supabase Storage hochladen |
| `GET` | `/api/auth/me` | Aktuellen Nutzer & Rolle abrufen |
| `GET` | `/api/auth/callback` | OAuth-Callback-Handler |

### Authentifizierte Endpoints (`/api/account/*`)

| Methode | Route | Zweck |
|---|---|---|
| `GET` | `/api/account/profile` | Nutzerprofil & Einstellungen |
| `PUT` | `/api/account/profile` | Profil aktualisieren |
| `PUT` | `/api/account/password` | Passwort ändern |
| `GET` | `/api/account/orders` | Eigene Bestellungen |
| `GET` | `/api/account/designs` | Eigene Custom-Designs |
| `POST` | `/api/account/designs` | Custom-Design hochladen |

### Admin-Endpoints (`/api/admin/*`)

| Methode | Route | Zweck |
|---|---|---|
| `GET` | `/api/admin/orders` | Alle Bestellungen |
| `GET` | `/api/admin/orders/[id]` | Bestelldetails mit angereicherten Items |
| `PATCH` | `/api/admin/orders/[id]` | Bestellstatus ändern |
| `GET` | `/api/admin/customers` | Alle Kunden |

Detaillierte Request/Response-Dokumentation: [[../API/API Überblick|API Überblick]]

---

## Middleware-Logik

```
Request kommt rein
  └─ Ist es /api, /_next, oder statische Datei?
       ├─ Ja → Kein Locale-Handling, direkt weiter
       └─ Nein → Locale aus URL/Accept-Language/Cookie ermitteln
                  └─ Redirect zu /de/... oder /uk/...
```

Relevante Datei: `apps/web/middleware.ts`
