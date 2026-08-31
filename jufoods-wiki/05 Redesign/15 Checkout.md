# 15 Checkout

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Mockup-Referenz:** Kein eigener Checkout-Screen im Mockup — Felder vollständig behalten, visuell an Design-System angleichen

---

## Ziel

Den bestehenden Checkout-Wizard (`checkout-client.tsx`) komplett restylen:
mobilfreundlich, Schritt-Fortschrittsanzeige, 44 px Touch-Targets, semantische Keyboards.
**Alle Felder und die Validierungslogik bleiben unverändert.**

> **Update (2026-09-01):** Auf Wunsch von **3 auf 5 Schritten umgebaut** (nicht umgekehrt, siehe unten) —
> die ursprünglichen 5 Einzelschritte 1–4 (Kundendaten/Bestelldetails/Lieferung/Zusatzinfo) wurden zu
> **4 gestapelten Karten innerhalb eines einzigen Schritts „Angaben"** zusammengelegt; Schritt 5 (Review)
> wurde zu „Übersicht"; ein dritter, rein visueller Schritt „Bestätigt" repräsentiert die Weiterleitung zu
> `/order-success`. Auslöser war ein Design-Referenz-Screenshot vom shadcnstudio.com-Block
> **`checkout-page-05`** (3-Schritt „Enter Info / Pay / Confirmation"-Stepper, Reise-Buchungs-Demo).
> Der Block selbst war inhaltlich nicht wiederverwendbar (Fake-Kreditkarten-Feld, Promo-Codes, Konfetti,
> Traveler-Alter/Geschlecht — nichts davon passt zu Jufoods), aber die **Stepper-UI-Primitive**
> (`components/ui/stepper.tsx`, gebaut auf `@stepperize/react@6.1.0`) ist rein Theme-Token-basiert
> (`bg-primary`/`bg-muted` etc.) und wurde 1:1 real installiert — keine Nachbau-Näherung, echter Code.
> Alle Formularfelder und die Zod-Validierung sind unverändert erhalten geblieben, nur gemeinsam
> validiert (Klick auf „Weiter" prüft jetzt alle Felder aller 4 Karten auf einmal statt nacheinander).

---

## Aktueller Stand (Dateien)

| Datei | Funktion |
|---|---|
| `apps/web/app/[locale]/checkout/page.tsx` | Server Component: Auth-Check, lädt User-Profil, rendert CheckoutClient |
| `apps/web/components/checkout-client.tsx` | Client-Komponente: 5-Schritt-Wizard mit react-hook-form + zod |
| `apps/web/components/date-time-picker.tsx` | Datum+Uhrzeit-Auswahl |
| `apps/web/components/phone-input.tsx` | Telefon mit Ländervorwahl |

---

## 3 Schritte, 4+1 Karten (Stand 2026-09-01)

| Stepper-Schritt | Inhalt |
|---|---|
| 1 Angaben | 4 gestapelte Karten auf einer Seite, gemeinsam validiert: **Kunde** (Anrede, Vorname, Nachname, E-Mail) · **Bestelldetails** (`eventDate`+`eventTime`, `celebrationDate`+`timeNeeded`, Bemerkungen) · **Lieferung** (Abholung/Lieferung Radio, Wohnort, bei Lieferung Straße+PLZ+Stadt) · **Zusätzlich** (Telefon, WhatsApp/Telegram-Consent + ggf. 2. Nummer, Woher kennen Sie uns) |
| 2 Übersicht | Zusammenfassung aller Angaben + Artikel, Absenden (bisheriger Review-Schritt, inhaltlich unverändert) |
| 3 Bestätigt | Kein eigener Panel-Inhalt auf `/checkout` — repräsentiert nur den Zielzustand nach erfolgreichem Absenden, bevor auf `/order-success` weitergeleitet wird |

Alte 5-Schritt-Feldgruppierung (Kundendaten/Bestelldetails/Lieferung/Kontakt/Überprüfung) bleibt als
interne Struktur der Karten bestehen — nur die Navigation wurde von 5 Einzel-Klicks auf 1 zusammengelegt.

---

## Ziel-Layout

### Desktop (1280 px)

```
┌─────────────────────────────────────────────────────┐
│  HEADER 64px                                        │
├───────────────────────────────┬─────────────────────┤
│  Formular (flex-1, max-w-2xl) │  Bestellübersicht   │
│                               │  (Sidebar ~380px)   │
│  ──── Schritt-Fortschritt ─── │  Artikel-Liste      │
│  ①Angaben─②Übersicht─③Bestätigt│  + Live-Zeilen      │
│                               │  (Termin, Abholung/ │
│  Schritt-Inhalt (4 Karten     │  Lieferung — sobald │
│  bei Schritt 1, 1 Karte bei   │  ausgefüllt)        │
│  Schritt 2)                   │  kein Preis (Phase1)│
│                               │                     │
│  [← Zurück]  [Weiter →]      │                     │
└───────────────────────────────┴─────────────────────┘
```

- Formular: `max-w-2xl mx-auto px-6 py-8`
- Sidebar: `w-[380px] shrink-0 bg-muted/50 border-l border-border p-6`
- Sidebar scrollt nicht, Formular scrollt.

### Mobil (375 px)

```
[HEADER reduziert: ← Logo]
──── Schritt-Fortschritt ────
● ─── ○ ─── ○ ─── ○ ─── ○   ← Punkte oder Ziffern
Schritt 1 von 5

[Schritt-Inhalt]

[← Zurück]  [Weiter →]
```

- Keine Sidebar auf Mobil — Artikel-Übersicht am Ende Schritt 5 (Review).
- CTA-Buttons: `w-full` oder `flex gap-3`.
- Schritt-Indikator: Zahlen-Bubbles mit `border-2 border-primary` für aktiv, `bg-primary text-white` für erledigt, `border-muted text-muted-foreground` für ausstehend.

---

## Komponenten (ändern)

### `checkout-client.tsx` — Styling-Änderungen

1. **Schritt-Fortschrittsanzeige — umgesetzt mit echter `Stepper`-Primitive:**
   - `components/ui/stepper.tsx` (neu, real installiert aus shadcnstudio.com `checkout-page-05`,
     Style-Familie `radix-*` — Komponente selbst ist aber Theme-Token-basiert und braucht keinen
     Umbau für `new-york`). Abhängigkeit: `@stepperize/react@6.1.0` (Version gepinnt, passend zum
     Block).
   - 3 Zahlen-Bubbles (`1`–`3`) über `StepperIndicator`, State `completed`/`active`/`inactive`
     automatisch aus `value`-Prop (`currentStep` → `'angaben' | 'uebersicht' | 'bestaetigt'`).
   - Verbindungslinien über `StepperSeparator`.

2. **Feldgestaltung:**
   - Alle `<Input>`, `<Select>`, `<Textarea>`: `min-h-[44px]` für Touch-Targets.
   - `<Input type="email">`: `inputMode="email"` + `autoComplete="email"`.
   - `<Input type="tel">`: wird durch `<PhoneInput>` gehandelt.
   - Fehlermeldungen unter dem Feld (nicht oben).
   - Labels immer sichtbar (kein Placeholder-only).

3. **Abschnitte:**
   - Jeder Schritt als `<section>` mit Playfair-Überschrift.
   - Trennlinien zwischen Feldgruppen: `<Separator>`.

4. **Navigations-Buttons:**
   - Zurück: `variant="outline"` (ghost-ähnlich mit Border).
   - Weiter / Senden: `variant="default"` (`bg-primary text-white`).
   - Beim Senden: Loading-State mit Spinner (bereits vorhanden — beibehalten).

5. **Review-Schritt (Schritt 5):**
   - Artikel-Karten (wie im Warenkorb, aus `useCartStore`).
   - Kundendaten-Zusammenfassung.
   - Kein Preis.

6. **Sidebar (Desktop) — umgesetzt:**
   - Artikel-Liste mit Thumbnails (unverändert).
   - **Neu:** Live-Key-Value-Zeilen für Feiertermin (`celebrationDate`+`timeNeeded`) und
     Abholung/Lieferung — erscheinen sobald im Formular ausgefüllt, aktualisieren sich live über
     `watch()`. Kein Personen-Zähler auf Gesamtbestellungsebene (Personenzahl ist pro Artikel, wird
     bereits pro Artikel-Zeile angezeigt).
   - Kein Preis (Phase 1).

### `date-time-picker.tsx` — visuell anpassen

- `min-h-[44px]`, `border-input`, `rounded-lg`.

### `phone-input.tsx` — visuell anpassen

- `min-h-[44px]`, konsistente Border.

---

## i18n-Keys

Die meisten Keys existierten bereits unter `order.*` (Kartentitel: `steps.customerInfo/orderDetails/
deliveryInfo/additionalInfo/review`, unverändert). Neu ergänzt (in `de.json` **und** `uk.json`):

```jsonc
"order": {
  "steps": {
    "groupInfo":      "Angaben",       // Stepper-Label Schritt 1
    "groupReview":    "Übersicht",     // Stepper-Label Schritt 2
    "groupConfirmed": "Bestätigt"      // Stepper-Label Schritt 3
  },
  "summary": {
    "deliveryDate":     "Termin",              // Sidebar-Zeile
    "pickupOrDelivery": "Abholung/Lieferung"   // Sidebar-Zeile
  }
}
```

---

## Offene Punkte

- [ ] Review-Schritt (5): Artikel-Darstellung aus Warenkorb klären — gleich wie ShoppingCart-Karten?
- [x] Auto-Fill: `autoComplete`-Attribute ergänzt (2026-09-01) — `given-name`/`family-name`/`email`/
      `street-address`/`postal-code`/`address-level2` auf allen Text-Feldern; `<PhoneInput>` hatte
      `tel-national` bereits.
- [x] Fehler-Zusammenfassung bei Submit-Versuch (2026-09-01) — Banner mit `role="alert"`
      `aria-live="polite"` direkt unter dem Stepper, listet betroffene Feldlabels bei fehlgeschlagener
      Validierung von Schritt 1 (per Playwright verifiziert). Ausgelöst durch `/e-commerce`-Skill-Review
      gegen Checkout-Best-Practices.
- [ ] Minimal-Header auf Checkout-Seite: nur Logo + ggf. Warenkorb-Icon (kein volles Nav).

---

## Abnahme/Verifikation

- [x] Schritt-Indikator (1–3, echte `Stepper`-Primitive) sichtbar, aktiver Schritt hervorgehoben
- [x] Mobil (375 px): Alle Felder min. 44px Höhe, kein horizontaler Scroll
- [x] Beide Schritte navigierbar (Weiter / Zurück); Schritt 1 validiert alle 4 Karten gemeinsam
      (per Playwright verifiziert: leeres Absenden zeigt „Pflichtfeld" auf allen 4 Karten gleichzeitig)
- [x] Sidebar-Zeilen „Termin"/„Abholung-Lieferung" aktualisieren live beim Ausfüllen (verifiziert)
- [x] Zod-Validierung funktioniert; Fehler unter dem jeweiligen Feld
- [x] E-Mail-Feld zeigt E-Mail-Keyboard auf iOS
- [x] Telefon-Feld zeigt Telefon-Keyboard (via `<PhoneInput>`)
- [x] Absenden → `/order-success` Weiterleitung
- [x] Supabase-Daten-Insert korrekt (orders + customers)
- [x] `pnpm lint` + `pnpm build` ohne Fehler
