# 15 Checkout

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Mockup-Referenz:** Kein eigener Checkout-Screen im Mockup — Felder vollständig behalten, visuell an Design-System angleichen

---

## Ziel

Den bestehenden **5-Schritt-Checkout-Wizard** (`checkout-client.tsx`) komplett restylen:
mobilfreundlich, Schritt-Fortschrittsanzeige, 44 px Touch-Targets, semantische Keyboards.
**Alle Felder und die Validierungslogik bleiben unverändert.**

---

## Aktueller Stand (Dateien)

| Datei | Funktion |
|---|---|
| `apps/web/app/[locale]/checkout/page.tsx` | Server Component: Auth-Check, lädt User-Profil, rendert CheckoutClient |
| `apps/web/components/checkout-client.tsx` | Client-Komponente: 5-Schritt-Wizard mit react-hook-form + zod |
| `apps/web/components/date-time-picker.tsx` | Datum+Uhrzeit-Auswahl |
| `apps/web/components/phone-input.tsx` | Telefon mit Ländervorwahl |

---

## 5 Schritte (unverändert)

| Schritt | Felder |
|---|---|
| 1 Kundendaten | Anrede (Herr/Frau), Vorname, Nachname, E-Mail |
| 2 Bestelldetails | Abholdatum + Uhrzeit (`eventDate` + `eventTime`), Wunschdatum Feier + `timeNeeded`, Bemerkungen |
| 3 Lieferung | Abholung / Lieferung Radio, Wohnort; bei Lieferung: Straße + PLZ + Stadt |
| 4 Kontakt | Telefon (Länderwahl + Nummer), WhatsApp/Telegram Einwilligung + ggf. 2. Nummer, Woher kennen Sie uns |
| 5 Überprüfung | Zusammenfassung aller Angaben + Artikel, Absenden |

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
│  [1]──[2]──[3]──[4]──[5]     │  (kein Preis Phase1)│
│                               │                     │
│  Schritt-Inhalt (Felder)      │                     │
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

1. **Schritt-Fortschrittsanzeige:**
   - Zahlen-Bubbles (`1`–`5`) mit State: `completed` / `active` / `upcoming`.
   - Verbindungslinien zwischen Bubbles.

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

6. **Sidebar (Desktop):**
   - Artikel-Liste mit Thumbnails.
   - Kein Preis (Phase 1).

### `date-time-picker.tsx` — visuell anpassen

- `min-h-[44px]`, `border-input`, `rounded-lg`.

### `phone-input.tsx` — visuell anpassen

- `min-h-[44px]`, konsistente Border.

---

## i18n-Keys

Die meisten Keys existieren bereits unter `order.*`. Neue Keys:

```jsonc
"order": {
  "stepIndicator": "Schritt {current} von {total}",
  "steps": {
    "customerData":   "Kundendaten",
    "orderDetails":   "Bestelldetails",
    "delivery":       "Lieferung",
    "contact":        "Kontakt",
    "review":         "Überprüfung"
  },
  "backButton":    "← Zurück",
  "nextButton":    "Weiter →",
  "submitButton":  "Bestellung absenden"
}
```

---

## Offene Punkte

- [ ] Review-Schritt (5): Artikel-Darstellung aus Warenkorb klären — gleich wie ShoppingCart-Karten?
- [ ] Auto-Fill: `autoComplete`-Attribute auf allen Felder ergänzen.
- [ ] Fehler-Zusammenfassung bei Submit-Versuch (aria-live="polite" für Barrierefreiheit).
- [ ] Minimal-Header auf Checkout-Seite: nur Logo + ggf. Warenkorb-Icon (kein volles Nav).

---

## Abnahme/Verifikation

- [x] Schritt-Indikator (1–5) sichtbar, aktiver Schritt hervorgehoben
- [x] Mobil (375 px): Alle Felder min. 44px Höhe, kein horizontaler Scroll
- [x] Alle 5 Schritte navigierbar (Weiter / Zurück)
- [x] Zod-Validierung funktioniert; Fehler unter dem jeweiligen Feld
- [x] E-Mail-Feld zeigt E-Mail-Keyboard auf iOS
- [x] Telefon-Feld zeigt Telefon-Keyboard (via `<PhoneInput>`)
- [x] Absenden → `/order-success` Weiterleitung
- [x] Supabase-Daten-Insert korrekt (orders + customers)
- [x] `pnpm lint` + `pnpm build` ohne Fehler
