# 18 Auth & statische Seiten

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Mockup-Referenz:** Kein eigener Screen — Token und Komponenten aus [[01 Design-System & Tokens]] anwenden

---

## Ziel

Alle restlichen Seiten token-konform restylen:

- Auth-Seiten: Login, Register, Passwort vergessen, Passwort zurücksetzen.
- Statische Seiten: Über uns, Kontakt, Favoriten, Bestellbestätigung.

Keine inhaltlichen Änderungen. Nur visuelle Angleichung an das Design-System.

---

## Aktueller Stand (Dateien)

| Seite | Route | Hauptdatei |
|---|---|---|
| Login | `/[locale]/login` | `app/[locale]/login/page.tsx` + `components/login-form.tsx` |
| Register | `/[locale]/register` | `app/[locale]/register/page.tsx` + `components/register-form.tsx` |
| Passwort vergessen | `/[locale]/forgot-password` | `components/forgot-password-form.tsx` |
| Passwort zurücksetzen | `/[locale]/reset-password` | `components/reset-password-form.tsx` |
| Über uns | `/[locale]/about` | `app/[locale]/about/page.tsx` |
| Kontakt | `/[locale]/contact` | `app/[locale]/contact/page.tsx` + `components/contact-form.tsx` |
| Favoriten | `/[locale]/favorites` | `app/[locale]/favorites/page.tsx` + `components/favorites-client.tsx` |
| Bestellbestätigung | `/[locale]/order-success` | `app/[locale]/order-success/page.tsx` |

---

## Auth-Seiten (Login / Register / Forgot / Reset)

### Ziel-Layout

```
[Reduzierter Header: Logo + ggf. Sprachschalter]

  Zentriertes Card-Panel (max-w-md, mx-auto, mt-16)
  bg-card border border-border rounded-2xl p-8 shadow-md

  [Logo rund 48px] zentriert
  [Playfair Heading: "Willkommen zurück"] oder "Registrieren"

  [Felder]
  [CTA-Button: bg-primary text-white, full width]
  [Link: Noch kein Konto? Registrieren / Schon Konto? Anmelden]
```

### Änderungen je Formular-Komponente

Alle vier Formulare (`login-form.tsx`, `register-form.tsx`, `forgot-password-form.tsx`,
`reset-password-form.tsx`):

1. **Input-Felder:** `min-h-[44px]`, `border-input rounded-lg`, sichtbares Label.
2. **CTA-Button:** `w-full py-3 bg-primary text-white font-semibold rounded-xl`.
3. **Error-Messages:** unter dem Feld in `text-destructive text-xs`.
4. **Card-Container:** `bg-card border border-border rounded-2xl p-8 shadow-md`.
5. **Playfair-Heading** als `h1` (`font-display text-2xl font-bold`).
6. **Loading-State:** Button mit Spinner während Request (bereits vorhanden — beibehalten).

---

## Über uns (`/[locale]/about`)

Heute: statische Prosa-Seite, nur `about.title` + `about.content`.

### Ziel

```
[Header 64px / 56px]
[Page-Content: max-w-3xl mx-auto px-6 py-12]

  [Playfair H1: "Über uns"]
  [Fließtext-Blöcke]

  Ggf. Bild (Logo/Foto) + Badges (München, Seit 2023, Auf Bestellung)
```

- Keine neuen i18n-Keys nötig (nutzt `about.title` + `about.content`).
- Ggf. Badge-Streifen analog zur Startseite Über-uns-Karte ergänzen (optional).

---

## Kontakt (`/[locale]/contact`)

### Änderungen an `contact-form.tsx`

1. Felder: `min-h-[44px]`, `rounded-lg`, sichtbares Label.
2. CTA: `bg-primary text-white`.
3. Erfolgs-/Fehlermeldung: Toast via `<Sonner>` (bereits eingebunden).
4. Optional: Kontaktdaten (E-Mail, Telefon) neben dem Formular auf Desktop.

---

## Favoriten (`/[locale]/favorites`)

### Änderungen an `favorites-client.tsx`

- **Empty-State** wenn keine Favoriten: Icon + Playfair-Text „Noch keine Favoriten" + CTA-Button „Zum Katalog" → `/catalog`.
- **Produkt-Grid:** `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`.
- `<FavoriteProductCard>`: analog zu `<ProductCard>` gestyled.

---

## Bestellbestätigung (`/[locale]/order-success`)

Heute: statische Seite mit grünem Haken + Text + Button.

### Ziel

```
[Reduzierter Header]

[Zentrierter Inhalt: max-w-lg mx-auto mt-20 text-center]

  ✅ (Lucide CheckCircle, text-green-600, w-16 h-16)
  [Playfair H1: "Bestellung erhalten!"]
  [Fließtext: "Wir melden uns bald bei Ihnen…"]
  [Button: "Zurück zum Katalog" → /catalog]
```

- Keine neuen i18n-Keys (nutzt bestehende `order.success.*`).
- CheckCircle-Icon statt hartkodiertes SVG.

---

## i18n-Keys (neue)

```jsonc
"favorites": {
  "emptyTitle":   "Noch keine Favoriten",
  "emptyDesc":    "Speichere deine Lieblingsprodukte für später.",
  "emptyCta":     "Zum Katalog"
},
"auth": {
  "noAccount":    "Noch kein Konto?",
  "hasAccount":   "Schon ein Konto?",
  "toRegister":   "Registrieren",
  "toLogin":      "Anmelden"
}
```

---

## Offene Punkte

- [ ] Header auf Auth-Seiten: reduziert (Logo + Sprachschalter) oder voll? → reduziert empfohlen.
- [ ] `about.content` in i18n ist heute ein einzelner String — bei Umbau mit Bildkarte ggf. aufteilen.
- [ ] Kontaktseite: E-Mail/Telefon als statischer Block neben dem Formular — welche Daten?

---

## Abnahme/Verifikation

- [x] Login: zentriertes Card-Panel, Felder 44px, CTA `bg-primary`
- [x] Register: gleiche Struktur
- [x] Vergessen / Zurücksetzen: gleiche Struktur
- [x] Über uns: Playfair H1, Fließtext leserlich
- [x] Kontakt: Formular funktioniert, Toast bei Erfolg/Fehler
- [x] Favoriten: Produkt-Grid oder Empty-State sichtbar; „Zum Katalog" führt zu `/catalog`
- [x] Bestellbestätigung: CheckCircle-Icon, Playfair-Heading, CTA zu `/catalog`
- [x] Alle Seiten: `pnpm lint` + `pnpm build` ohne Fehler
