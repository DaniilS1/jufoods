# Abgeschlossene Features

Vollständige Dokumentation aller bereits implementierten Funktionen.

← Zurück zur [[Roadmap]]

---

## Katalog & Navigation

- **Produktkatalog** — Homepage (`/[locale]`) ist der Katalog. Zeigt alle Kategorien per URL-Parameter (`?category=torten`), filterbar nach Unterkategorie über Tabs.
- **Torten — Design/Füllungs-Ansicht** — Toggle (`TortenViewToggle`) zwischen Designs-Ansicht und Füllungen-Ansicht. Subkategorie-Tabs (feier, hochzeit, bento, zum-tee).
- **Produktdetailseite Torten** — liest aus `torten_designs`, holt verknüpfte Füllungen via `design_flavour`, zeigt Bildslider, Füllungsauswahl mit Zutaten / Allergenen / Nährwerten, Fallback-Werte, ähnliche Produkte.
- **Produktdetailseite andere Produkte** — Fallback auf `products`-Tabelle (Desserts, Cookies etc.).
- **Füllungs-Detailseite** — `/products/[flavour-slug]` zeigt Füllungsdetails mit verknüpften Designs.

## Warenkorb & Checkout

- **Warenkorb** — Slide-in Sidebar, Mengen ändern / entfernen / leeren. Zustand-Store mit localStorage. Badge-Zähler im Header.
- **Checkout Flow** — 5-stufiges Formular (Kundendaten → Bestelldetails → Lieferung → Messenger-Einwilligungen → Zusammenfassung), Zod-Validierung, internationales Telefon-Input, Datum/Zeit-Auswahl.
- **Bestellanlage** — `POST /api/orders`: Customer anlegen/deduplizieren, Order in DB, Line-Items anreichern, Webhook fire-and-forget.
- **Order-Success-Seite** — Bestätigungsseite nach Bestellabschluss.
- **Webhook-Integration** — konfigurierbarer `ORDER_WEBHOOK_URL` (z.B. n8n) mit Timeout.

## Authentifizierung & Konto

- **Login / Registrierung** — E-Mail + Passwort via Supabase Auth.
- **Passwort vergessen / zurücksetzen** — vollständiger Flow inkl. E-Mail-Link-Callback.
- **Rollen-System** — `customer` / `admin`. DB-Trigger erstellt `users`-Zeile bei Registrierung. `requireAdmin()` Guard für Admin-Endpunkte.
- **Kunden-Account** — `/[locale]/account` (Login-geschützt): Profil, Passwort, Bestellhistorie, Custom-Design-Upload.

## Admin-Panel

- **Produkt-Verwaltung** — CRUD für `products` mit Bild-Upload.
- **Design-Verwaltung** — CRUD für `torten_designs`, Subkategorie, Mehrfachbilder, `classic`-Flag.
- **Füllungs-Verwaltung** — CRUD für `torten_flavours`: Nummer, Zutaten, Allergene, Nährwerte.
- **Bestellungs-Verwaltung** — Tabellarisch, Detailansicht, Status-Update.
- **Kunden-Verwaltung** — Tabellarisch mit Bestellstatistiken.
- **Dynamisch geladen** — Code-Splitting für schnellere Admin-Ladezeiten.

## Favoriten

- Toggle per Produkt, localStorage-Persistenz (kein Account nötig), eigene Favoriten-Seite.

## Responsive Design

- Mobil-first Grid im Katalog (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`).
- Mobile-Drawer-Menü, kompakter Header auf Mobile.
- Produktdetail, Checkout, Account — alle responsiv.

## Mehrsprachigkeit

- **DE / UK** — alle UI-Texte in `messages/de.json` + `messages/uk.json`.
- Locale-basiertes Routing via Middleware (`/de/...`, `/uk/...`), Default: Deutsch.
- Sprachauswahl im Header. Alle DB-Felder bilingual.

## Weitere Seiten

- **Über uns** (`/[locale]/about`) — vorhanden, Inhalt über Übersetzungsdatei.
- **Kontakt** (`/[locale]/contact`) — vorhanden mit `ContactForm`-Komponente.
