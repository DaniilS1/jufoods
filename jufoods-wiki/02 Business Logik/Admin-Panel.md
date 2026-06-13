# Admin-Panel

## Zugang

URL: `/[locale]/admin`

Erfordert Supabase-Account mit `role = 'admin'`. Zugang verwalten: [[Authentifizierung & Rollen]].

---

## Funktionen

### Bestellverwaltung

Komponente: `components/admin-orders-management.tsx`

- Alle Bestellungen in tabellarischer Ansicht
- Filter nach Status (`pending`, `confirmed`, `completed`, `cancelled`)
- Bestelldetails anzeigen (inkl. aufgelöster Produktnamen)
- Status einer Bestellung ändern

API: `GET /api/admin/orders`, `GET /api/admin/orders/[id]`, `PATCH /api/admin/orders/[id]`

→ [[../Technik/API/Admin API|Admin API]]

---

### Kundenverwaltung

Komponente: `components/admin-customers-management.tsx`

- Alle Kunden in tabellarischer Ansicht
- Name, E-Mail, Telefon, Wohnort, Bestellanzahl
- Erste und letzte Bestellung ersichtlich

API: `GET /api/admin/customers`

---

### Produktverwaltung

Komponente: `components/admin-product-management.tsx`

- Alle Produkte aus `products`-Tabelle
- Erstellen, Bearbeiten, Löschen
- Bild-Upload direkt aus dem Formular

API: `GET /api/products`, `POST /api/products`

---

### Design-Verwaltung

Komponente: `components/admin-design-management.tsx`

- Alle Tortendesigns aus `torten_designs`
- Erstellen, Bearbeiten, Löschen
- Unterkategorie-Zuweisung
- Bild-Upload (inkl. mehrerer Bilder)

API: `GET /api/designs`, `POST /api/designs`, `PUT /api/designs`, `DELETE /api/designs`

---

### Füllungs-Verwaltung

Komponente: `components/admin-flavour-management.tsx`

- Alle Füllungsoptionen aus `torten_flavours`
- Erstellen, Bearbeiten, Löschen
- Zutaten, Allergene, Nährwerte verwalten
- Füllungsnummer vergeben

---

## Navigation

Zwischen den Bereichen wird über Tab-Navigation gewechselt:

Komponente: `components/admin-tabs.tsx`

Tabs: Bestellungen | Kunden | Produkte | Designs | Füllungen

---

## Datentabellen

Das Admin-Panel verwendet **TanStack React Table** für alle Tabellen — Sortierung, Filterung und Paginierung.

---

## Sicherheit

- Route `/[locale]/admin` und alle `/api/admin/*`-Endpoints prüfen `role='admin'`
- Admin-Schreiboperationen verwenden den Service-Role-Client (RLS-Bypass)
- Kunden-Daten nur für Admins sichtbar (RLS auf `customers`-Tabelle)
