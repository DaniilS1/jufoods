# Roadmap

→ [[Roadmap (RU)|Russische Version]]

---

## Module

| # | Modul | Status |
|---|---|---|
| 1 | [[#Modul 1 Katalog\|Katalog fertig bauen]] | 🔲 Offen |
| 2 | [[#Modul 2 Hero-Seite\|Hero-Seite]] | 🔲 Offen |
| 3 | [[#Modul 3 Admin-Panel\|Admin-Panel vereinfachen]] | 🔲 Offen |
| 4 | [[#Modul 4 E-Mail-Benachrichtigungen\|E-Mail-Benachrichtigungen]] | 🔲 Offen |
| 5 | [[#Modul 5 Payment\|Payment]] | 🔲 Offen |
| 6 | [[#Modul 6 Finetuning & Go Live\|Finetuning & Go Live]] | 🔲 Offen |

---

## Modul 1: Katalog

**Ziel:** Den Produktkatalog vollständig und konsistent fertigstellen.

### Torten-Logik anpassen
- [ ] Produktdetailseite vollständig auf `torten_designs` umstellen (kein Fallback auf `products` mehr)
- [ ] Design-Flavour-Verknüpfung (`design_flavour`) korrekt in der Detailansicht nutzen
- [ ] Warenkorb: nur Design-ID + optionale Füllungsauswahl speichern
- [ ] TypeScript-Typen für das neue Torten-System bereinigen

### Kategorien überarbeiten
- [ ] Kategorienavigation überdenken (Header-Tabs vs. Sidebar vs. Dropdown)
- [ ] Unterkategorie-Filterung UX verbessern
- [ ] `products/page.tsx` (aktuell nur Redirect) entscheiden: eigene Katalogseite oder auf Homepage belassen

### Andere Produkte anders darstellen
- [ ] Desserts, Cookies, Cheesecakes, Macarons: eigenes Detaillayout (ohne Füllungsauswahl)
- [ ] Fehlende Produktdaten in der DB ergänzen (Bilder, Beschreibungen)
- [ ] Konsistente Darstellung zwischen Torten- und Nicht-Torten-Produkten sicherstellen

---

## Modul 2: Hero-Seite

**Ziel:** Eine ansprechende Landing Page als ersten Eindruck beim Besuch der Website.

### Inhalt
- [ ] Hero-Bereich: Logo prominent, großes Hauptbild / Bildgalerie
- [ ] Kurzbeschreibung des Angebots (Texte DE + UK)
- [ ] Call-to-Action Button → Katalog

### Design
- [ ] Bildauswahl für den Hero (Produktfotos / Stimmungsbilder)
- [ ] Design-Konzept festlegen (Stil, Farben, Layout)
- [ ] Responsive Hero für Mobile und Desktop

### Weitere Sektionen (optional)
- [ ] Highlights / Bestseller-Sektion
- [ ] Kurze „Über uns"-Sektion
- [ ] Kundenstimmen / Testimonials

---

## Modul 3: Admin-Panel

**Ziel:** Das Admin-Panel vereinfachen und die tägliche Verwaltung beschleunigen.

### Vereinfachung
- [ ] Admin-Startseite: Übersicht mit den wichtigsten KPIs (offene Bestellungen, neue Kunden)
- [ ] Produktanlage vereinfachen: weniger Pflichtfelder, bessere UX
- [ ] Überflüssige Felder und Funktionen entfernen

### Produktauswahl überarbeiten
- [ ] Design-Flavour-Zuordnung im Admin intuitiver gestalten
- [ ] Bild-Upload UX verbessern (Drag & Drop, Vorschau)
- [ ] Bestelldetailansicht verbessern (alle relevanten Infos auf einen Blick)

### Bestellverwaltung
- [ ] Bestellungen nach Status filtern/sortieren
- [ ] Schnellaktionen direkt in der Bestellliste (Status ändern ohne Detail-Ansicht)

---

## Modul 4: E-Mail-Benachrichtigungen

**Ziel:** Automatische E-Mails für Kunden und Admin bei relevanten Events.

### Kunden-E-Mails
- [ ] Bestellbestätigung an Kunden (nach `POST /api/orders`)
- [ ] Status-Update-E-Mail (wenn Admin Status ändert: confirmed / completed / cancelled)

### Admin-E-Mails
- [ ] Neue-Bestellung-Benachrichtigung an Admin

### Technische Umsetzung
- [ ] E-Mail-Provider wählen (Resend / Postmark / SendGrid)
- [ ] E-Mail-Templates erstellen (DE + UK, responsiv, on-brand)
- [ ] Integration in Order-Flow (entweder direkt in API oder via n8n-Webhook)

---

## Modul 5: Payment

**Ziel:** Online-Bezahlung für Bestellungen ermöglichen.

### Konzept
- [ ] Zahlungsmodell festlegen: Vollzahlung online, Anzahlung, oder Rechnung nach Lieferung
- [ ] Zielmarkt prüfen: Deutschland, Österreich, Schweiz → SEPA, Karte, PayPal

### Technische Umsetzung
- [ ] Payment-Provider wählen (Stripe empfohlen)
- [ ] Checkout-Flow um Zahlungsschritt erweitern
- [ ] Bestellstatus nach erfolgreichem Payment automatisch auf `confirmed` setzen
- [ ] Fehlgeschlagene Zahlungen behandeln

### Rechtliches
- [ ] AGB, Widerrufsrecht, Datenschutz anpassen
- [ ] Rechnungserstellung / Quittung

---

## Modul 6: Finetuning & Go Live

**Ziel:** Produktionsreif machen, launchen, stabil halten.

### Performance & Qualität
- [ ] Lighthouse-Score optimieren (Core Web Vitals)
- [ ] Bilder optimieren (WebP, Größen, Lazy Loading)
- [ ] Grundlegende Tests schreiben (Checkout-Flow, API-Endpunkte)

### SEO & Metadaten
- [ ] `<title>` und `<meta description>` für alle Seiten (DE + UK)
- [ ] Open Graph Tags für Social Sharing
- [ ] Sitemap generieren

### Deployment
- [ ] Hosting-Plattform wählen und konfigurieren (Vercel empfohlen)
- [ ] Domain einrichten und SSL
- [ ] Umgebungsvariablen in Production setzen
- [ ] CI/CD Pipeline einrichten (automatischer Deploy bei Push auf `main`)

### Go Live
- [ ] Finaler QA-Durchlauf (Mobile + Desktop, DE + UK)
- [ ] Supabase Production-Projekt prüfen (Backups, RLS, Limits)
- [ ] Soft Launch → Feedback sammeln

---

## ✅ Bereits fertiggestellt

Vollständige Liste: [[Abgeschlossene Features]]

**Kurzübersicht:**
- Torten-Katalog (Design- und Füllungsansicht) mit Subkategorie-Tabs
- Produktdetailseite (Torten + andere Produkte)
- Warenkorb mit localStorage-Persistenz
- Checkout-Flow (5 Stufen, Zod-Validierung, Webhook)
- Login / Registrierung / Passwort-Reset
- Rollen-System (customer / admin)
- Kunden-Account (Profil, Passwort, Bestellhistorie, Custom-Designs)
- Admin-Panel (Produkte, Designs, Füllungen, Bestellungen, Kunden)
- Favoriten
- Responsive Design
- Zweisprachigkeit (DE / UK)

---

## Meilensteine

| Datum | Beschreibung |
|---|---|
| 2025-02 | `torten_designs` + `torten_flavours` Tabellen |
| 2025-03 | Admin CRUD, Auth mit Rollen |
| 2025-11 | Account-Seite, Settings, Custom-Design-Upload |
| 2026-03 | `customers`-Tabelle, strukturiertes Checkout-Payload |
| 2026-05 | Zutaten/Allergene auf `text` umgestellt |
| 2026-06 | Checkout überarbeitet, Webhook, Wiki + CLAUDE.md erstellt |
