# 91 E-Commerce Audit (2026-09-01)

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Anlass:** Auf Nutzerwunsch — System-Audit unter Anwendung des `/e-commerce`-Skills: „was fehlt uns oder was ist noch nicht gut genug für den Endnutzer". Kein Payment/Preismodell-Review — das ist laut [[90 Phase 2 – Preise, Anzahlung & erweiterte Status (Backlog)]] bewusst Out-of-Scope für Phase 1.

---

## Bereits geprüft und für gut befunden (nicht Teil dieses Audits)

- `stores/cart-store.ts` — Zustand+persist, korrekte Line-Merge-Logik (Produkt+Design+Datum+Personenzahl)
- `app/api/orders/route.ts` — Zod-Validierung, IP+E-Mail-Rate-Limiting, atomare Postgres-RPC `create_order_with_customer`, Webhook mit Fehler-Tracking
- Checkout-Flow, Formular-Konsistenz (Höhen/Focus-Ringe), Fonts — siehe [[15 Checkout]] und [[01 Design-System & Tokens]]
- `components/search-bar.tsx` — hat bereits einen 300ms-Debounce (Zeile 165), kein Bug

---

## Direkt behoben

| # | Problem | Datei(en) | Fix |
|---|---|---|---|
| 1 | **Kontaktformular sendet nie etwas** — `onSubmit` hat nur `console.log()` + `setTimeout()` gemacht und danach eine echte Erfolgsmeldung angezeigt. Jede Kontaktanfrage eines Kunden ging spurlos verloren, während die Seite „Nachricht erfolgreich gesendet" behauptete. | `components/contact-form.tsx`, neu: `app/api/contact/route.ts` | Echte API-Route nach dem Muster von `lib/orders/order-webhook.ts` (HMAC-signierter Webhook-POST, Rate-Limiting via `lib/rate-limit.ts`, Timeout). Formular zeigt jetzt eine ehrliche Fehlermeldung (`contact.error`, neuer i18n-Key in beiden Sprachen) statt eines Fake-Erfolgs, wenn `CONTACT_WEBHOOK_URL` fehlt oder der Versand fehlschlägt. |
| 2 | Kein sprachabhängiges `<title>`/`<meta description>` — jede Seite (auch `/uk/*`) zeigte den statischen deutschen Text aus `app/layout.tsx`. | `app/[locale]/layout.tsx`, `messages/{de,uk}.json` (neuer `meta`-Namespace) | `generateMetadata()` in `app/[locale]/layout.tsx` ergänzt, liest lokalisierten Titel/Beschreibung. Überschreibt automatisch für alle Routen unter `[locale]` (Next.js Metadata-Merging), ohne alle 19 `page.tsx` einzeln anfassen zu müssen. |
| 3 | Vier vergessene Debug-`console.log()`-Aufrufe in Storefront-Code (`favorites-client.tsx` ×3, teils mit vollem State-Dump). | `components/favorites-client.tsx` | Entfernt. (`admin-product-management.tsx:300` bewusst stehen gelassen — internes Admin-Tool, niedrige Priorität.) |

Verifiziert: `pnpm lint` + `pnpm build` fehlerfrei (siehe unten).

---

## Offene Punkte — dokumentiert, nicht umgesetzt

Diese Punkte sind zu groß für einen Ad-hoc-Fix (neue Seiten, rechtliche Textinhalte, Architekturentscheidungen) und brauchen entweder echte Inhalte vom Betreiber oder eine bewusste Priorisierungsentscheidung.

### 1. Rechtliche Pflichtseiten fehlen komplett — **hohe Priorität** — **umgesetzt (2026-09-01), Platzhalter**

Neue Routen `app/[locale]/impressum/page.tsx`, `app/[locale]/datenschutz/page.tsx`, `app/[locale]/agb/page.tsx`, gerendert über eine gemeinsame `components/legal-page.tsx` (Draft-Warnbanner + Abschnittsliste aus `t.raw('sections')`). Footer verlinkt jetzt alle drei zusätzlich zu „Über uns"/„Kontakt". Inhalte in `messages/{de,uk}.json` unter `legal`/`impressum`/`datenschutz`/`agb` — **vollständig mit `[Platzhaltern]` für Firmenname, Anschrift, Vertretungsberechtigte, Handelsregister, USt-ID**, da diese Daten nicht vorlagen (wie gewünscht). AGB berücksichtigt bewusst das echte Geschäftsmodell (Bestellung = unverbindliche Anfrage, kein Fixpreis bei Bestellung, siehe `product.priceNote`) statt eines generischen Sofortkauf-Templates; Widerrufsrecht-Abschnitt weist auf die reguläre Ausnahme für Sonderanfertigungen (§ 312g Abs. 2 Nr. 1 BGB) hin.

- **Weiterhin offen:** Jede Seite trägt einen sichtbaren roten Banner „Entwurf — noch nicht rechtlich geprüft" (`legal.draftBanner`). **Die eckigen Platzhalter müssen durch echte Firmendaten ersetzt und alle drei Seiten vor Livegang von einer Anwältin/einem Anwalt geprüft werden** — das ist keine automatisierbare Aufgabe.

### 2. Keine Bestellbestätigung, die der Kunde sicher zu Gesicht bekommt

- **Ist-Zustand:** Nach dem Absenden landet der Kunde auf `/order-success` (`app/[locale]/order-success/page.tsx`) — einer rein generischen Seite ohne Bestellnummer, ohne Zusammenfassung, nur „Wir haben Ihre Bestellung erhalten". Die einzige weitere Benachrichtigung läuft über den optionalen `ORDER_WEBHOOK_URL` (n8n) — dessen Versand (z. B. eine E-Mail an den Kunden) passiert **außerhalb dieser Codebase** und ist von hier aus nicht verifizierbar. Es gibt kein E-Mail-Package (`resend`/`nodemailer`/etc.) im `package.json`.
- **Warum relevant:** Schließt der Kunde den Tab, ohne dass n8n eine Bestätigungsmail verschickt (oder falls `ORDER_WEBHOOK_URL` gar nicht gesetzt ist — der Code warnt dann nur in der Server-Konsole, siehe `app/api/orders/route.ts:225-228), hat der Kunde **keinerlei Nachweis** seiner Bestellung — keine Bestellnummer, keine E-Mail, nichts zum Vorzeigen bei Rückfragen.
- **Wo:** `orders`-Tabelle hat kein menschenlesbares `order_number`-Feld, nur eine UUID `id` (siehe `db_schema.md:44`). Für eine Anzeige auf `/order-success` müsste: (a) die `orderId` aus der `POST /api/orders`-Antwort im Client (`checkout-client.tsx` `onSubmit`) mitgenommen und per Query-Param/Router-State an `/order-success` übergeben werden, (b) dort angezeigt werden (z. B. gekürzte UUID oder neues fortlaufendes `order_number`-Feld per Migration).
- **Aufwand:** Mittel — Migration (optional, für schöne Bestellnummern) + 2 Dateien anfassen (`checkout-client.tsx`, `order-success/page.tsx`) + i18n. Unabhängig davon: zu prüfen, ob die n8n-Automation tatsächlich eine Kunden-E-Mail verschickt — das kann von hier aus nicht verifiziert werden.

### 3. Keine eigenen Fehlerseiten (404 / 500) — **umgesetzt (2026-09-01)**

`app/not-found.tsx` (locale-neutraler globaler Fallback, greift wenn Next.js gar keine Route matchen kann — z. B. `/de/irgendwas-erfundenes`), `app/[locale]/not-found.tsx` (mit vollem `AppShell`/Header/Footer, greift bei explizitem `notFound()` z. B. für unbekannte Produkt-Slugs oder Katalog-Sections), `app/[locale]/error.tsx` (Client-Boundary mit „Erneut versuchen" + „Zur Startseite"). Neue i18n-Keys `notFound.*`/`errorPage.*`.

**Bug gefunden & behoben während der Umsetzung:** `app/not-found.tsx` hatte anfangs ein eigenes `<html><body>`, was zu einem React-Hydration-Fehler führte (`app/layout.tsx` stellt diese Tags bereits bereit — verschachtelte `<html>` sind ungültig). Per Playwright-Konsolen-Check gefunden und korrigiert; beide 404-Varianten jetzt sauber verifiziert (Screenshots: globaler Fallback zeigt Theme-Hintergrund ohne Header/Footer korrekt, lokalisierter Fallback zeigt vollen AppShell mit „Zum Katalog"-CTA).

### 4. Keine SEO-Grundlagen jenseits des Titels — **umgesetzt (2026-09-01)**

- `app/sitemap.ts` — dynamisch aus `catalogueSections` + Supabase (`torten_designs`/`products`.slug), 92 URLs zur Build-Zeit, beide Locales.
- `app/robots.ts` — erlaubt alles außer `/api/`, `/*/admin`, `/*/account`, `/*/checkout`, `/*/order-success`; verweist auf Sitemap.
- `metadataBase` (neu: `lib/site-config.ts`, `NEXT_PUBLIC_SITE_URL` mit `https://jufoods.com`-Platzhalter) + Default-OG-Bild in `app/layout.tsx`.
- `generateMetadata` in `app/[locale]/layout.tsx` erweitert um OpenGraph/Twitter/`alternates.languages` (Locale-Umschaltung sauber verlinkt).
- **Pro-Produkt-`generateMetadata`** in `app/[locale]/products/[slug]/page.tsx` — echter Titel/Beschreibung/Bild, per curl verifiziert (`og:image` zeigt das echte Supabase-Produktbild).
- **Pro-Kategorie-`generateMetadata`** in `app/[locale]/catalog/[section]/page.tsx` — Sections-Titel + `category_images`-Bild falls vorhanden.
- **Nicht gemacht:** Twitter-/OG-Bild ist aktuell `cakes.jpeg` (34 KB, quadratisch) als Website-weiter Fallback — kein eigens zugeschnittenes 1200×630-OG-Bild. Für ein poliertes Social-Preview wäre ein dediziertes Bild ein kleiner Folge-Punkt.

### 5. Katalog-Suche: Client-seitiger Full-Table-Scan (niedrige Priorität, Skalierungsnotiz)

- **Ist-Zustand:** `components/search-bar.tsx` lädt bei jeder Sucheingabe (debounced, 300ms) **die komplette** `torten_designs`- und `products`-Tabelle ohne Server-Filter und filtert danach im Browser per `.includes()`.
- **Warum (noch) kein Problem:** Katalog hat aktuell ~30 Einträge — vernachlässigbar.
- **Warum relevant für später:** Wächst der Katalog auf einige hundert Produkte, wird jede Sucheingabe eine immer größere Datenmenge laden, obwohl nur wenige Treffer gebraucht werden.
- **Wo:** `components/search-bar.tsx:70-98` — Supabase-Query auf `.ilike('name_de', \`%${query}%\`)` (oder `.textSearch(...)`) mit Server-seitigem Filter statt Full-Select+Client-Filter umstellen, plus `.limit(8)` direkt in der Query.
- **Aufwand:** Klein bis mittel, aber ohne akuten Druck — als Backlog-Punkt vermerkt, nicht jetzt umgesetzt.

---

## Nicht geprüft (außerhalb dieses Audit-Scopes)

- Vollständige WCAG-Prüfung (nur Stichproben während der Checkout-/Formular-Arbeit dieser Session)
- Admin-Panel-UX (eigener Nutzerkreis, andere Prioritäten — siehe [[17 Admin Panel]])
- Lasttest/Performance unter echter Last (Katalog ist aktuell klein genug, dass das nicht dringend ist)

---

## Verifikation

- [x] `pnpm lint` ohne neue Fehler
- [x] `pnpm build` ohne Fehler
- [x] `/api/contact` — Playwright-Test: Formular ohne `CONTACT_WEBHOOK_URL` zeigt jetzt die Fehlermeldung statt Fake-Erfolg
- [x] Impressum/Datenschutz/AGB als Platzhalter-Seiten angelegt (2026-09-01) — **echte Firmendaten + anwaltliche Prüfung stehen noch aus**, siehe Draft-Banner auf jeder Seite
- [ ] Bestellnummer auf `/order-success` anzeigen — weiterhin offen
- [x] `sitemap.xml` + `robots.txt` + OG-Tags (2026-09-01) — Custom-OG-Bild (1200×630) weiterhin offen
- [x] `app/not-found.tsx` + `app/[locale]/not-found.tsx` + `app/[locale]/error.tsx` (2026-09-01) — inkl. Hydration-Bug-Fix, Playwright-verifiziert
