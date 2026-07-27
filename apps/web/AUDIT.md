# Jufoods — Globaler Audit (Produkte, Warenkorb, Checkout, Bestellungen, Admin, Login/Gast)

**Datum:** 2026-07-26
**Umfang:** Reine Code-/Konfigurationsanalyse, keine Code-Änderungen. Basierend auf einer Untersuchung von Katalog/Produktseiten, Warenkorb (Zustand-Store), Checkout, `/api/orders`, Admin-Panel (`/admin`, `/api/admin/*`), Auth-Flows (Login/Register/Reset) und Supabase-Migrationen/RLS-Policies.

> **Wichtiger Rahmenbefund zuerst:** Dies ist **kein klassischer Preis-Checkout**, sondern ein **Anfrage-/Angebots-Flow**. Es gibt in der gesamten Datenbank (`products`, `torten_designs`, `torten_flavours`, `orders`) **keine Preis-Spalte**, keine Zahlungsintegration und keine Gesamtsumme im Warenkorb. Der Kunde konfiguriert eine Bestellung, die Bäckerei meldet sich danach manuell (Telefon/WhatsApp) zur Preisklärung. Das ist vermutlich Absicht — sollte aber explizit bestätigt werden, falls eigentlich ein echter Bezahlvorgang geplant war.

---

## Management Summary — die 7 wichtigsten Funde

Sortiert nach Impact, unabhängig vom Bereich:

| # | Befund | Schweregrad | Bereich |
|---|--------|-------------|---------|
| 1 | `public.users` hat **keine Row-Level-Security (RLS)** aktiviert. Jeder eingeloggte Kunde kann mit dem öffentlichen Anon-Key theoretisch `role` auf `admin` setzen und sich selbst zum Admin machen — jede Admin-Prüfung im Code (`requireAdmin()`, Layout-Check, alle "Admins can…"-RLS-Policies) hängt letztlich an dieser einen ungeschützten Tabelle. Zusätzlich sind so alle Namen/Telefonnummern/Rollen aller Nutzer per direktem `SELECT` auslesbar. | **KRITISCH** | Admin/Sicherheit |
| 2 | Storage-Bucket `bilder` erlaubt **öffentliches Hochladen/Überschreiben/Löschen** ohne Auth-Check (`"Anyone can upload/update/delete to bilder"`). Das hebelt die Admin-Prüfung im `/api/upload`-Route komplett aus und gefährdet auch Kundenbilder von individuellen Torten-Anfragen. | **KRITISCH** | Admin & Checkout |
| 3 | Die `orders`-Tabelle erlaubt per RLS-Policy **anonymes direktes INSERT** (`WITH CHECK (true)`). Jeder mit dem öffentlichen Anon-Key kann Bestellungen direkt in die DB schreiben — inkl. beliebigem `status` — und dabei die gesamte Server-Validierung in `/api/orders` umgehen. Eine weitere Altlast-Policy erlaubt Kunden zudem, den `status` ihrer **eigenen** Bestellung direkt zu ändern (z. B. auf „completed" zu setzen), am Admin-Workflow vorbei. | **KRITISCH** | Checkout/Admin |
| 4 | **Liefertermin und Personenzahl gehen beim Checkout verloren.** Diese Felder sind auf der Produktseite Pflicht, um eine Torte in den Warenkorb legen zu können — werden aber beim Absenden der Bestellung **nicht mitgeschickt** und tauchen weder in der Datenbank noch in der Webhook-Benachrichtigung an die Bäckerei auf. Das Personal kann pro Bestellung nicht wissen, wann welche Torte für wie viele Personen geliefert werden soll. | **BLOCKER (Business-Logik)** | Warenkorb/Checkout |
| 5 | **Kein Server-seitiges Schema-Validierung** in `/api/orders` — nur oberflächliche Prüfungen (Pflichtfeld vorhanden ja/nein). Termine, Mengen, Produkt-IDs werden ungeprüft übernommen. Kombiniert mit Fund #3 bedeutet das: Der einzige echte Schutz der Bestelldaten ist aktuell das Frontend-Formular. | **HOCH** | Checkout |
| 6 | **Gastbestellungen werden nie nachträglich mit einem Kundenkonto verknüpft.** Meldet sich ein Gast später mit derselben E-Mail an, sieht er seine früheren Bestellungen nicht in „Mein Konto", weil `/api/account/orders` strikt nach `orders.user_id` filtert und dieses Feld bei Gastbestellungen dauerhaft `NULL` bleibt. Zusätzlich kann jeder eine fremde E-Mail-Adresse beim Gast-Checkout verwenden und damit Name/Telefon/Ort des zugehörigen Kundendatensatzes überschreiben (keine Verifizierung des Mail-Besitzes). | **HOCH** | Login/Gast |
| 7 | **Keine Bestätigungs-Mail/SMS an den Kunden.** Die einzige Benachrichtigung ist ein Fire-and-Forget-Webhook an die Bäckerei, der bei Timeout/Fehlkonfiguration/Server-Abbruch (Serverless) still fehlschlagen kann, ohne dass es irgendwo sichtbar wird. Fehlt `ORDER_WEBHOOK_URL` oder schlägt der Aufruf fehl, erfährt **niemand** von der neuen Bestellung außer über manuelles Nachschauen im Admin-Panel. | **HOCH** | Checkout |

**Sofortmaßnahme-Empfehlung:** Punkte 1–3 sind reine Datenbank-/RLS-Themen (Supabase-Migrationen) und sollten vorrangig behoben werden, da sie über den öffentlichen Anon-Key ausnutzbar sind, unabhängig von der Frontend-Logik. Punkt 4 ist der gravierendste **funktionale** Bug für den eigentlichen Geschäftszweck (Kuchenbestellungen mit Termin).

---

## 1. Produkte ansehen, auswählen, in den Warenkorb legen

**Ergebnis: Grundsätzlich funktionsfähig**, mit einigen Bugs und einem sehr ernsten Datenverlust-Problem beim Übergang zum Checkout (siehe Fund #4 oben).

### Was funktioniert
- Kataloglisten (`/catalog`, `/catalog/[section]`, `/torten`, `/desserts`) laden Produkte serverseitig direkt aus Supabase, mehrsprachig (`name_de`/`name_uk`) korrekt aufgelöst.
- Produktdetailseite mit robuster Fallback-Logik für Torten-Designs → Design-Flavour-Kombination → generische Flavour-Ansicht → generisches Produkt.
- Flavour-Auswahl (Slider, „Alle anzeigen"-Dialog), Bildergalerie mit Touch-Swipe, Formular-Validierung vor „In den Warenkorb" (Flavour, Termin, Personenzahl, mind. 1 Bild bei Custom-Torten) — inkl. sauberer Accessibility (`aria-invalid`, `aria-describedby`, `role="alert"`).
- Custom-Torten-Builder: Bild-Upload (bis 5 Bilder, Typ-/Größenprüfung clientseitig **und** serverseitig gespiegelt), Freitext-Notiz, funktioniert im Warenkorb.
- Warenkorb (Zustand + `localStorage`) übersteht Reloads; Mengen-Handling, Favoriten (separater Store) funktionieren.
- i18n: Alle relevanten Strings in `de.json`/`uk.json` vorhanden, keine fehlenden Keys gefunden.

### Bugs / Probleme

| Schwere | Befund |
|---|---|
| **Blocker** | Liefertermin & Personenzahl gehen zwischen „In den Warenkorb" und Bestellabsendung verloren (siehe Management Summary #4). `checkout-client.tsx` sendet nur `{productId, designId, quantity, ...}` — `item.deliveryDate`/`item.personCount` fehlen komplett im Request an `/api/orders`. |
| **Bug** | Der Dedup-Schlüssel im Warenkorb ist nur `productId + designId` (`stores/cart-store.ts`). Wird dieselbe Torte/Flavour zweimal mit unterschiedlichem Termin/Personenzahl hinzugefügt, wird nur die Menge erhöht — der ursprüngliche Termin/die Personenzahl der ersten Zeile bleiben stehen, die zweite Eingabe geht verloren. |
| **Bug** | Produkt-/Favoriten-Karten verlinken auf `/products/${slug}` **ohne Locale-Präfix**. Da die Middleware `localePrefix: 'always'` nutzt, wird ein Klick während des Browsens auf Ukrainisch (`/uk/...`) auf `/de/products/...` umgeleitet — die Sprache springt unbemerkt auf Deutsch zurück. |
| **Bug** | Mehrbild-Galerie (`products.images_urls`) ist in der DB vorhanden, wird aber nur für Torten-Designs ausgelesen — normale Desserts/Kekse zeigen nie mehr als ein Bild, obwohl das Schema es hergibt. |
| **Bug** | `orders.custom_design_id` ist serverseitig vollständig verdrahtet, wird vom Client aber nie gesendet — bleibt bei jeder echten Bestellung `NULL`. Die dazugehörige `custom_designs`-Tabelle wird von einem komplett anderen, unabhängigen Feature (Account-Design-Uploads) befüllt. |
| **Bug/Risiko** | `/api/custom-designs` (Bild-Upload für Custom-Torten) hat **keinen Auth-Check und kein Rate-Limiting** — anders als das Admin-Pendant `/api/upload`. Jeder kann beliebig viele Bilder (bis 10 MB) mit einer erfundenen `productId` hochladen — offene Kostenfalle für den Storage. |
| Minor | `/api/products`-Route ist toter Code (kein Aufrufer im gesamten Repo gefunden). `products/page.tsx` ist nur ein Redirect auf die Startseite, keine echte Liste. Keine Pagination in den Katalogseiten (bei aktueller Größe unkritisch). Debug-`console.log`-Aufrufe in `favorites-client.tsx`. |

---

## 2. Checkout-Prozess und was mit der Bestellung passiert

**Ergebnis: Der Flow funktioniert im Happy Path**, hat aber mehrere ernste Sicherheits- und Datenintegritätslücken auf Datenbankebene, die unabhängig vom Frontend ausnutzbar sind.

### Was funktioniert
- Formular (React Hook Form + Zod) validiert Anrede, Name, E-Mail, Termin, Liefer-/Abholoption (mit bedingter Adresspflicht), Telefon.
- Gast und eingeloggter Kunde nutzen denselben Checkout; bei Login werden Name/E-Mail vorausgefüllt.
- `/api/orders` legt bei jeder Bestellung einen `customers`-Datensatz an/aktualisiert ihn per normalisierter E-Mail (Dedup funktioniert), erstellt danach die `orders`-Zeile mit `status: 'pending'` (serverseitig fest codiert — gut).
- Bestellung schlägt nicht fehl, wenn der Benachrichtigungs-Webhook fehlschlägt (Fire-and-Forget, korrekt vom Prinzip her).

### Kritische Probleme (Datenbank/RLS-Ebene)

| Schwere | Befund |
|---|---|
| **Hoch** | RLS-Policy `"Anyone can create orders" ... WITH CHECK (true)` auf `orders` erlaubt anonymes Direkt-INSERT über den öffentlichen Anon-Key — komplett unter Umgehung von `/api/orders` und jeglicher dortigen Validierung/Kundenzuordnung. |
| **Hoch** | Keine serverseitige Schema-Validierung in `/api/orders` — nur Grundprüfungen (Feld vorhanden, nicht leer). Termine, Mengen (keine Obergrenze), Produkt-IDs werden ungeprüft in JSONB gespeichert; nicht existierende Produkt-IDs führen nicht zu einem Fehler, sondern nur zu einem gekürzten Anzeigenamen. |
| **Bug** | Kunden- und Bestell-Insert laufen **nicht in einer Transaktion**. Schlägt der Bestell-Insert nach erfolgreichem Kunden-Upsert fehl, bleiben `order_count`/`last_order_at` beim Kunden dauerhaft falsch (Phantom-Bestellung), ohne Rollback. |
| **Bug** | Kein Idempotenz-Schutz — Doppelklick/Retry kann doppelte Bestellungen erzeugen (nur clientseitiger `isSubmitting`-Schutz). |

### Benachrichtigung & Bestätigung

| Schwere | Befund |
|---|---|
| **Hoch** | Keine Bestätigungs-E-Mail/SMS an den Kunden — überhaupt kein E-Mail-Versand-System im Code (kein Resend/SendGrid/Nodemailer). Die Order-Success-Seite ist eine reine statische „Danke"-Seite ohne Bestellnummer/Zusammenfassung. |
| **Hoch** | Der Webhook (`ORDER_WEBHOOK_URL`) wird **nicht awaited** vor der Response — auf Serverless-Plattformen (z. B. Vercel) kann der Prozess beendet werden, bevor der Request tatsächlich rausgeht. Es gibt kein Retry, keine Signatur (kein HMAC) und keine Sichtbarkeit im Admin-Panel, ob eine Benachrichtigung tatsächlich zugestellt wurde. Bei fehlendem/fehlerhaftem Webhook merkt **niemand**, dass eine Bestellung eingegangen ist, außer durch manuelles Nachschauen. |
| Hoch (Storage) | Bucket `bilder` erlaubt öffentliches Schreiben/Löschen ohne Auth — betrifft auch die im Checkout hochgeladenen Custom-Torten-Bilder (Integritätsrisiko). |

### Sonstiges
- `app/order-summary-04/` ist ein **totes Shadcn-Template mit Fake-Daten** (erfundene Produkte, erfundener Kunde), liegt außerhalb von `[locale]` und ist über die Middleware praktisch nicht erreichbar (404). Nur als Design-Vorlage für den Checkout-Review-Schritt genutzt, sollte aber aus dem `app/`-Baum entfernt werden, damit es nicht als Route mitgebaut wird.
- Bestätigungstext auf der Order-Success-Seite ist per Ternary hart codiert statt über `next-intl`-Keys — verstößt gegen die eigene i18n-Regel des Projekts.

---

## 3. Admin-Panel — Bestellungen & Kunden

**Ergebnis: Die UI-Funktionalität selbst ist solide gebaut**, aber die Zugriffskontrolle steht auf einem sehr wackligen Datenbank-Fundament (siehe Fund #1).

### Was funktioniert
- Admin-Bereich ist serverseitig korrekt geschützt: `admin/layout.tsx` prüft Login **und** `role === 'admin'` gegen die `users`-Tabelle, alle `/api/admin/*`-Routen nutzen denselben `requireAdmin()`-Check — kein rein client-seitiges Verstecken.
- Bestellübersicht + Detailansicht funktionieren, inkl. korrekter Anzeige von Custom-Torten-Bildern und Kundennotizen im Bestelldetail.
- Statusänderung einer Bestellung ist serverseitig auf eine feste Werteliste (`pending/confirmed/completed/cancelled`) validiert — kann nicht auf ungültige Werte gesetzt werden **über diese Route**.
- Kundenliste mit Suche/Pagination (clientseitig über react-table) funktioniert; es gibt aktuell **keine** Lösch-/Bearbeitungsfunktion für Kunden im Admin-Panel — das macht die im Auftrag erwähnte Sorge „Kunde mit Bestellungen versehentlich löschen" aktuell gegenstandslos (Funktion existiert schlicht nicht).
- Kategorie-Bilder-Verwaltung ist erreichbar nur über den geschützten Admin-Bereich.

### Kritische Probleme

| Schwere | Befund |
|---|---|
| **Kritisch** | `public.users` hat **keine RLS aktiviert** (ebenso `settings`, `custom_designs`). Jede Admin-Prüfung im gesamten Code (`requireAdmin()`, Layout, alle „Admins can…“-Policies auf `products`, `torten_designs`, `customers`, `orders`, `category_images`) beruht letztlich auf einem `SELECT role FROM users`. Ohne RLS ist diese Tabelle standardmäßig für jeden mit dem Anon-Key voll lesbar **und schreibbar** — ein Kunde könnte theoretisch die eigene `role` auf `admin` setzen. Auch als reines Datenleck relevant (alle Namen/Telefonnummern/Rollen aller Nutzer abrufbar). |
| **Kritisch** | Legacy-Policy `"Users can update their own orders"` auf `orders` hat **keine Spalten-/Wert-Einschränkung**. Ein eingeloggter Kunde kann per direktem Supabase-Call den `status` seiner eigenen Bestellung ändern (z. B. auf „completed“ setzen) — komplett am Admin-Workflow und der API-Validierung vorbei. |
| **Hoch** | Storage-Bucket `bilder`: „Anyone can upload/update/delete“ — hebelt die Admin-Gate von `/api/upload` und der Kategorie-Bild-Verwaltung aus. |
| Bug | Kein Server-seitiges MIME-/Größen-Limit beim Bild-Upload (`/api/upload`); der `folder`-Parameter aus dem Client wird ungefiltert in den Storage-Pfad übernommen (kein Path-Traversal-Schutz, aber durch Admin-Gate abgemildert). |
| Bug | Weder Bestell- noch Kundenliste haben serverseitige Pagination — bei Wachstum wird jedes Mal die komplette Historie geladen. |
| Minor | Mobile Notiz-Editor in der Bestellansicht synchronisiert den State nicht zurück ins Eltern-Objekt (Notiz wirkt nach Neuöffnen ggf. veraltet, bis neu geladen wird). Kein Rollback der UI bei fehlgeschlagenem Status-Update. Admin-Rollen-Check ist an drei Stellen dupliziert statt zentral (`require-admin.ts`, Layout, `/api/upload`) — Wartungsrisiko. |

---

## 4. Login, Registrierung & Gastbestellungen

**Ergebnis: Grundfunktionen (Login, Registrierung, Passwort-Reset) funktionieren**, mit einer wichtigen Middleware-Lücke und mehreren UX-/Konsistenzproblemen. Gast-Checkout funktioniert technisch, aber ohne jede Verifizierung der angegebenen E-Mail.

### Was funktioniert
- Registrierung erzeugt zuverlässig einen `users`/`settings`-Eintrag über einen DB-Trigger (`handle_new_user()`) — nicht clientseitig manipulierbar.
- Passwort-Reset-Flow (Anfrage → E-Mail-Link → Callback tauscht Code gegen Session → neues Passwort setzen) ist Ende-zu-Ende korrekt verdrahtet.
- `/account` und `/admin` sind serverseitig korrekt geschützt (Redirect bei fehlendem Login/fehlender Rolle).
- Gast-Checkout funktioniert tatsächlich ohne Zwang zur Registrierung; Gastkunden werden per normalisierter E-Mail dedupliziert (kein doppelter `customers`-Eintrag bei wiederholten Gastbestellungen).
- `auth.*`-Übersetzungen sind zwischen `de.json` und `uk.json` vollständig deckungsgleich.

### Probleme

| Schwere | Befund |
|---|---|
| **Hoch** | `middleware.ts` macht **ausschließlich** Locale-Routing, aber keinerlei Supabase-Session-Refresh — obwohl `lib/supabase/server.ts` im Code selbst den Kommentar enthält, dass fehlende Cookie-Schreibvorgänge „ignoriert werden können, wenn Middleware die Session erneuert“. Das ist hier nicht der Fall. Bei abgelaufenem Access-Token (Standard: 1 Stunde) kann die Session in Server Components nicht zuverlässig erneuert werden — mit aktivierter Refresh-Token-Rotation drohen sporadische, unerklärte Logouts für Nutzer mit länger laufenden Sessions. |
| **Hoch** (Login/Gast-Kombi) | Gast-Checkout: Wird eine bereits existierende E-Mail (z. B. die eines registrierten Kunden) beim Gast-Checkout verwendet, werden Name/Telefon/Ort dieses Kundendatensatzes **ohne jede Verifizierung** überschrieben. Es gibt keinen Abgleich, ob der Absender wirklich Zugriff auf diese E-Mail-Adresse hat. |
| **Hoch** | Keine Verknüpfung von Gastbestellungen mit später registrierten Konten (siehe Management Summary #6) — Bestellhistorie im Kundenkonto bleibt für alte Gastbestellungen dauerhaft unsichtbar. |
| **Mittel** | Inkonsistente Passwort-Richtlinie: Registrierung/Login/Reset verlangen nur 6 Zeichen, die Passwort-Änderung im Kundenkonto verlangt 8 Zeichen — ohne Komplexitätsanforderungen irgendwo. |
| **Mittel** | Kein Rate-Limiting/CAPTCHA auf Login, Registrierung oder `/api/orders` — Schutz vor Brute-Force liegt komplett bei (nicht im Repo prüfbaren) Supabase-Projekteinstellungen. |
| **Mittel** | Passwortänderung im Kundenkonto verlangt keine erneute Eingabe des aktuellen Passworts — bei gekaperter Session reicht ein einziger API-Call zur Kontoübernahme. |
| Bug | Rohe, unübersetzte Supabase-Fehlermeldungen (Englisch) werden bei Login/Registrierung/Reset direkt angezeigt statt über `next-intl` zu laufen — auf einer rein deutsch/ukrainischen Seite sichtbar unpassend. |
| Bug | Hart codierte englische Validierungstexte in der Passwort-Änderung im Kundenkonto (`Min. 8 characters`, `Passwords do not match`), obwohl an gleicher Stelle sonst übersetzt wird. |
| Minor | Auth-Callback leitet auch bei fehlgeschlagenem Code-Austausch (abgelaufener Link) kommentarlos weiter, ohne Fehlermeldung — Nutzer wirkt „ausgeloggt“, ohne zu wissen warum. `/reset-password` prüft nicht, ob überhaupt eine gültige Recovery-Session vorliegt, bevor das Formular angezeigt wird. |

---

## Aufräum-Kandidaten (toter/verwaister Code)

Keine funktionalen Auswirkungen, aber zur Sauberkeit erwähnenswert:

- `apps/web/app/order-summary-04/` + `components/shadcn-studio/blocks/order-summary-04/` — totes Shadcn-Template mit Fake-Daten, über Middleware nicht erreichbar.
- `components/custom-design-upload.tsx` — nirgends mehr eingebunden, ersetzt durch `custom-torte-wrapper.tsx`.
- `components/account/account-client 2.tsx` — verwaiste Kopie ohne Referenzen.
- `apps/web/app/api/products/route.ts` — keine Aufrufer im gesamten Repo gefunden.
- `category_images`-Tabelle wird im Code verwendet, ist aber nicht in `db_schema.md` dokumentiert (Schema-Doku ist an dieser Stelle veraltet).

---

## Priorisierte Empfehlung für die nächsten Schritte

1. **RLS auf `public.users`, `settings`, `custom_designs` aktivieren** und die Altlast-Policy `"Users can update their own orders"` auf eine reine Lese-Policy (ohne freies `status`-Update) einschränken. Reine Supabase-Migration, kein Frontend-Change nötig.
2. **Storage-Policies für `bilder` auf Admin-only Schreiben (Upload über Server-Route) umstellen** bzw. RLS/Policy so anpassen, dass anonyme Nutzer nicht beliebig überschreiben/löschen können.
3. **`orders`-INSERT-Policy verschärfen** (z. B. nur über Service-Role/serverseitig, kein `WITH CHECK (true)` für `anon`) plus serverseitige Zod-Validierung in `/api/orders` nachziehen.
4. **Liefertermin & Personenzahl im Checkout-Payload ergänzen** — der wichtigste rein funktionale Fix, ohne den das Kerngeschäft (Termin-basierte Kuchenbestellung) nicht zuverlässig funktioniert.
5. Guest→Account-Verknüpfung nachrüsten (Bestellhistorie über `customer_id`/E-Mail statt nur `user_id` abfragen, oder Backfill beim Verknüpfen).
6. Mittelfristig: Bestätigungs-E-Mail an Kunden einführen und den Bestell-Webhook awaiten bzw. mit Retry/Signatur absichern.
