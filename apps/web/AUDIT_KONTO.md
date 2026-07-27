# Jufoods — Audit „Mein Konto" (Benutzerkonto-Feature)

**Datum:** 2026-07-27
**Umfang:** Reine Code-/Konfigurationsanalyse, keine Änderungen. Fokus ausschließlich auf das Kundenkonto-Feature: `/account`-Seite, `/api/account/*`-Routen, `lib/supabase/account.ts`, zugehörige RLS-Migrationen (`20260727000000`–`007`) sowie die Berührungspunkte zu Login/Registrierung (`/api/auth/*`), soweit sie das Konto direkt betreffen.

> **Vorbemerkung:** Der globale Audit vom 2026-07-26 (`AUDIT.md`) hatte für diesen Bereich mehrere kritische Funde (fehlende RLS auf `users`/`settings`/`custom_designs`, fehlende Reauth bei Passwortänderung, fehlendes Session-Refresh in der Middleware, keine Verknüpfung von Gastbestellungen). **Alle diese Punkte sind seither behoben** — die neuen Migrationen `20260727000000`–`007` und Code-Änderungen an `middleware.ts` und `app/api/account/password/route.ts` decken sie ab. Dieser Audit prüft den aktuellen Stand und findet die verbleibenden, neuen Probleme.

---

## Zusammenfassung

| # | Befund | Schweregrad | Status |
|---|--------|-------------|--------|
| 1 | Verknüpfung von Gast-Bestellhistorie an neu registrierte Konten hängt an einer **Supabase-Dashboard-Einstellung** ("Confirm email"), die im Repo nicht erzwungen/prüfbar ist | **HOCH (bedingt)** | ⚠️ Manuell zu prüfen — per SQL/Advisors nicht auslesbar, siehe unten |
| 2 | Kein Rate-Limiting auf `/api/account/password`, `/api/account/profile`, `/api/account/designs` | MITTEL | ✅ Behoben (Password + Designs; Profile GET/PUT sind reine Lese-/eigene-Zeile-Writes ohne externe Kosten, bewusst ausgelassen) |
| 3 | Hartcodierte englische Validierungstexte in `profile-form.tsx` | NIEDRIG–MITTEL | ✅ Behoben |
| 4 | `linkGuestOrdersToUser()` wird bei jedem Profil-Request neu ausgeführt (unnötige Service-Role-RPCs/Row-Locks) | NIEDRIG | ✅ Behoben |
| 5 | `notes`-Feld bei Custom-Designs serverseitig unbegrenzt lang, Client begrenzt nur auf 300 Zeichen | NIEDRIG | ✅ Behoben |
| 6 | Verwaiste Datei `components/account/account-client 2.tsx` weiterhin vorhanden | Aufräumen | ✅ Behoben (gelöscht) |
| 7 | `AccountProfileResponse`-Typ fehlt das vom Server tatsächlich gesendete `email`-Feld | Minor | ✅ Behoben |

**Update 2026-07-27:** Punkte 2–7 sind gefixt (siehe Details unten und Diffs in den jeweiligen Dateien). Punkt 1 ist die einzige offene Position — er lässt sich nicht aus dem Code heraus beheben, da Supabase (Hosted) die Auth-Einstellungen außerhalb von Postgres verwaltet (`select * from auth.config` existiert nicht; die Security-Advisors listen diese Einstellung ebenfalls nicht). **Bitte manuell in Supabase Studio → Authentication → Sign In / Providers → Email prüfen, ob „Confirm email" aktiv ist.**

---

## Was funktioniert / seit dem letzten Audit behoben

- **RLS aktiv** auf `public.users`, `public.settings`, `public.custom_designs` (Migration `...000`) — Rollen-Self-Promotion und beliebiges Auslesen fremder Profile sind nicht mehr möglich; `role`-Spalte zusätzlich per `REVOKE UPDATE` abgesichert.
- **Storage-Policies für `bilder`** auf reines öffentliches Lesen reduziert; anonymes Schreiben/Löschen entfernt (Migration `...002`).
- **`orders`-RLS verschärft**: kein anonymes Direkt-INSERT mehr, keine Selbst-Status-Änderung durch Kunden mehr — Bestellungen laufen jetzt ausschließlich über die service-role-gestützte RPC `create_order_with_customer` (Migration `...001`, `...003`).
- **Passwortänderung verlangt jetzt Reauth**: `PUT /api/account/password` prüft das aktuelle Passwort per `signInWithPassword`, bevor `updateUser({password})` läuft — der zuvor bemängelte Ein-Request-Kontoübernahme-Pfad bei gekaperter Session ist geschlossen.
- **Middleware refresht jetzt die Supabase-Session** (`await supabase.auth.getUser()` + Cookie-Sync in `middleware.ts`) — das vorher bemängelte Risiko sporadischer Logouts bei abgelaufenem Access-Token ist behoben.
- **Gastbestellungen werden rückwirkend verknüpft**: Trigger auf `customers.user_id` plus callable `link_guest_customer_to_user()`-RPC (Migration `...004`), aufgerufen aus `ensureUserProfile()` bei jedem Login/Profil-Request. Kunden sehen jetzt alte Gastbestellungen unter „Mein Konto", sobald sie sich mit derselben E-Mail registrieren/einloggen.
- **Rate-Limiting eingeführt** für `/api/orders` und `/api/custom-designs` (`lib/rate-limit.ts`, RPC `check_and_record_rate_limit`, fail-open bei Fehlkonfiguration) — siehe aber Fund #2, der Account-Bereich wurde dabei ausgelassen.
- **Funktions-Grants bereinigt**: `create_order_with_customer`, `link_guest_customer_to_user`, `check_and_record_rate_limit` sind jetzt explizit von `anon`/`authenticated` per Default-Privileges-Nachtrag entzogen (Migration `...007`) — ein reales Supabase-Detail (Default Privileges ≠ `PUBLIC`-Pseudorolle), das leicht übersehen wird.
- Passwort-Mindestlänge ist jetzt konsistent 8 Zeichen (Registrierung, Reset, Kontoänderung).
- Übersetzungen für den Account-Bereich (`account.*`, inkl. `orders.*`, `orderStatus.*` mit ICU-Plural) sind vollständig und in `de.json`/`uk.json` deckungsgleich.

---

## Verbleibende / neue Funde

### 1. Gast-Historie-Verknüpfung hängt an einer nicht im Repo sichtbaren Einstellung (HOCH, bedingt)

`ensureUserProfile()` (`lib/supabase/account.ts:58`) ruft bei **jedem** authentifizierten Aufruf von `/api/account/profile`, `/api/auth/me` und dem OAuth/Magic-Link-Callback fire-and-forget `linkGuestOrdersToUser(userId, user.email)` auf. Die RPC verknüpft jede bestehende `customers`-Zeile mit gleicher normalisierter E-Mail — inkl. Name, Telefon, Lieferadresse, gesamter Bestellhistorie — an das gerade eingeloggte `auth.users`-Konto.

Das ist die richtige Lösung für das im letzten Audit bemängelte Problem, **setzt aber voraus, dass `user.email` tatsächlich verifiziert ist**, bevor eine Session existiert. Das wird nicht vom Code erzwungen, sondern von der Supabase-Auth-Projekteinstellung „Confirm email" (Dashboard, nicht in Migrationen versioniert). Ist diese Einstellung deaktiviert, kann sich jede Person mit einer fremden E-Mail-Adresse registrieren, sofort eine Session erhalten (kein Bestätigungslink nötig) und automatisch die komplette Bestell-/Kontakthistorie des echten Kunden übernehmen, der zuvor als Gast unter dieser E-Mail bestellt hat.

`register-form.tsx` behandelt zwar den Fall „kein Session ohne Bestätigung" (Verify-Dialog), das beweist aber nicht, dass die Einstellung projektweit erzwungen ist — nur dass der Code beide Fälle abfängt.

**Empfehlung:** In Supabase Studio → Authentication → Sign In / Providers → Email bestätigen, dass „Confirm email" aktiv ist, und das dokumentieren (z. B. in `db_schema.md` oder einer README-Notiz), da es sonst bei einem Projekt-Reset/neuen Supabase-Projekt stillschweigend deaktiviert sein könnte.

### 2. Kein Rate-Limiting im Account-Bereich (MITTEL)

`lib/rate-limit.ts` (`checkRateLimit`/`getClientIp`) wird aktuell nur in `/api/orders` und `/api/custom-designs` verwendet. Die drei `/api/account/*`-Routen nutzen es nicht:

- **`PUT /api/account/password`**: Die einzige Bremse gegen wiederholtes Erraten des aktuellen Passworts ist Supabases eigenes, projektweites Rate-Limit für `signInWithPassword` — nicht pro Konto/IP aus dem Code steuerbar. Bei einer gekaperten Session (gestohlenes Cookie, XSS) kann ein Angreifer beliebig oft raten, solange Supabase es zulässt.
- **`POST /api/account/designs`**: Ein eingeloggter Nutzer kann unbegrenzt viele 10-MB-Bilder hochladen — exakt das Storage-Kostenfalle-Problem, das für `/api/custom-designs` (Gast-Pendant) bereits per Rate-Limit behoben wurde, hier aber übersehen wurde, weil die Route ohnehin einen Auth-Check hat.

**Empfehlung:** `checkRateLimit` auch hier ergänzen, z. B. `account:password:${user.id}` (5/10 Min) und `account:designs:${user.id}` (10–20/Std).

### 3. Hartcodierte englische Validierungstexte in `profile-form.tsx` (NIEDRIG–MITTEL)

```ts
fullName: z.string().trim().min(2, 'Min. 2 characters').max(120, 'Max. 120 characters'),
phone: z.string().trim().max(32, 'Max. 32 characters')...
```

Diese Strings laufen nicht durch `next-intl` und erscheinen auf Deutsch/Ukrainisch als rohes Englisch bei Validierungsfehlern — Verstoß gegen die i18n-Pflicht in `CLAUDE.md`. Genau dieses Muster wurde in `password-form.tsx` bereits korrekt auf `t()`/`tAccount()` umgestellt; im `ProfileForm` ist es stehen geblieben.

### 4. Wiederholte Service-Role-RPCs bei jedem Profil-Request (NIEDRIG)

`linkGuestOrdersToUser()` feuert bei jedem `GET /api/account/profile`-Aufruf (React Query `staleTime: 60s`, aber jeder Seiten-Reload/Remount fragt neu ab) sowie bei jedem `/api/auth/me`-Call. Die RPC macht intern ein `SELECT ... FOR UPDATE` auf `customers`. Funktional harmlos (idempotent, no-op wenn schon verknüpft), aber unnötige DB-Last/Row-Locks für ein Ereignis, das nur einmal pro Konto einen echten Effekt hat. Sauberer wäre: nur im Auth-Callback bzw. einmal pro Login-Session aufrufen statt bei jedem Profil-Fetch.

### 5. Keine Serverseitige Längenprüfung für `notes` bei Custom-Designs (NIEDRIG)

`components/account/design-upload.tsx` begrenzt die Notiz clientseitig auf 300 Zeichen (`maxLength={300}`), `POST /api/account/designs` übernimmt den `notes`-Wert aus dem FormData jedoch ungeprüft. Isoliert geringes Risiko, in Kombination mit Fund #2 (kein Rate-Limit) ein kleiner zusätzlicher Abuse-Vector.

### 6. Aufräumen: verwaiste Datei weiterhin vorhanden

`components/account/account-client 2.tsx` — bereits im letzten Audit als „verwaiste Kopie ohne Referenzen" notiert, aber immer noch im Repo (unversioniert, `git status` zeigt sie als `??`). Enthält eine ältere Variante ohne Sidebar-Navigation. Sollte gelöscht werden, bevor sie versehentlich reaktiviert/committed wird.

### 7. Typ-Inkonsistenz (Minor)

`AccountProfileResponse['profile']` in `account-client.tsx` deklariert nur `fullName`/`phone`, der Server (`serializeResponse` in `app/api/account/profile/route.ts`) sendet zusätzlich `email` im selben Objekt. Keine funktionale Auswirkung (E-Mail wird separat als Prop durchgereicht), aber der Typ ist irreführend/unvollständig.

---

## Priorisierte Empfehlung

1. **Supabase-Dashboard prüfen**: „Confirm email" aktiv? (Fund #1) — einziger Punkt, der nicht per Code/Migration verifizierbar ist, aber die größte Auswirkung hätte, falls falsch konfiguriert.
2. **Rate-Limiting auf `/api/account/password` und `/api/account/designs` ergänzen** (Fund #2) — gleiche Bausteine wie bei `/api/orders` bereits vorhanden, reine Ergänzung.
3. **`profile-form.tsx`-Validierungstexte übersetzen** (Fund #3) — kleiner, schneller Fix.
4. Optional: `linkGuestOrdersToUser`-Aufruf entkoppeln (Fund #4), `notes`-Länge serverseitig begrenzen (Fund #5), verwaiste Datei löschen (Fund #6), Typ korrigieren (Fund #7).
