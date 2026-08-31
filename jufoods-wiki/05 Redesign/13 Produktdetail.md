# 13 Produktdetail

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Mockup-Referenz:**
> - Desktop Screen 03 — „Product Detail — Split Layout"
> - Mobile Screen 03 — „Product Detail"

---

## Ziel

Die Produktdetailseite in ein klares **Split-Layout** (Desktop) und eine **Bild-oben +
Info-unten**-Struktur (Mobil) umgestalten. Das Tabs-Konzept (Info / Zutaten / KBZHU) aus
dem Mockup wird umgesetzt. Alle bestehenden Funktionen (Geschmack wählen, Personenanzahl,
Favorit, Bestellung) bleiben erhalten.

---

## Aktueller Stand (Dateien)

| Datei | Funktion |
|---|---|
| `apps/web/app/[locale]/products/[slug]/page.tsx` | Server Component: löst Slug, fetcht Design/Flavour/Produkt |
| `apps/web/components/product-detail-wrapper.tsx` | Server-Wrapper → lädt `ProductDetailClient` |
| `apps/web/components/product-detail-client.tsx` | Client UI: Geschmack, Personenanzahl, Add-to-Cart |
| `apps/web/components/product-image-slider.tsx` | Bild-Karussell |
| `apps/web/components/flavour-detail-wrapper.tsx` | Spezieller Wrapper für Flavour-Detailseiten |

---

## Ziel-Layout

### Desktop (1280 px) — Split 580px + Rest

```
[HEADER 64px]
[BREADCRUMB: Home › Torten › Feiertorten › Sommergarten]
┌────────────────────────────────┬──────────────────────────────────┐
│  BILD-BEREICH (580px)          │  INFO-BEREICH (flex-1, bg-white) │
│  bg-[#F0E0D8] mit Muster      │                                  │
│  border-r border-border        │  [TORTEN · FEIER]                │
│                                │  Produktname (Playfair, 36px)    │
│  [Produktfoto]                 │  Beschreibung (14px, color-muted)│
│                                │                                  │
│  [Thumbnail 56px] [56px] [56] │  ── Tabs ──────────────────────  │
│  ↑ absolute bottom             │  [Info] [Zutaten] [KBZHU]        │
│                                │                                  │
│                                │  Tab-Inhalt:                     │
│                                │  Zusammensetzung + Allergene     │
│                                │                                  │
│                                │  Personenanzahl wählen           │
│                                │  [1–2] [4–6] [8–10] ...         │
│                                │                                  │
│                                │  Geschmacksrichtung              │
│                                │  [Vanille] [Erdbeere] [Zimt] …  │
│                                │                                  │
│                                │  ─ CTA ───────────────────────── │
│                                │  [ℹ Preishinweis]               │
│                                │  [Torte bestellen] [♡]           │
└────────────────────────────────┴──────────────────────────────────┘
```

- Linke Seite: `w-[580px] shrink-0 bg-[#F0E0D8] flex items-center justify-center relative border-r border-border`
- Thumbnails: `absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2`
- Rechte Seite: `flex-1 bg-white p-10 flex flex-col overflow-y-auto`

### Mobil (375 px)

```
[HEADER 56px: ← | ♡]
┌────────────────────────────────┐
│  BILD (aspect-ratio 4/3)       │
│  bg-[#F0E0D8]                  │
│  [● ○ ○] Dot-Indikator unten  │
└────────────────────────────────┘
┌────────────────────────────────┐  ← border-radius 16px, margin-top -16px
│  bg-white                      │
│  [TORTEN · GEBURTSTAG]         │
│  Produktname (22px, Playfair)  │
│  Beschreibung (13px)           │
│  [Info] [Zutaten] [KBZHU]     │  ← border-bottom tabs
│  Tab-Inhalt (Zutaten, Allergen)│
└────────────────────────────────┘
┌────────────────────────────────┐
│  bg-white, border-t            │
│  [💬 Preishinweis]             │
│  [Torte bestellen] (100%)      │
└────────────────────────────────┘
```

- Bild-Bereich: `aspect-[4/3]` füllt volle Breite.
- Info-Bereich: `bg-white rounded-t-2xl -mt-4 relative z-10 px-5 pt-5`
- CTA-Bereich: `bg-white border-t border-border px-5 pt-3 pb-6 sticky bottom-0`

---

## Tab-Inhalte

### Tab „Info"
- Zusammensetzung (`⚗️`): `torten_flavours.ingredients_de[]` als kommagetrennte Liste.
- Allergene (`⚠️`): `torten_flavours.allergens_de[]`.

### Tab „Zutaten"
- Detaillierte Zutatenliste (gleiche Datenquelle, andere Darstellung: Liste statt Text).

### Tab „KBZHU"
- Nährwerttabelle aus `torten_flavours.nutrition` (jsonb):

```ts
// Erwartete Struktur (nullable)
interface Nutrition {
  kcal?: number
  protein?: number  // g
  fat?: number      // g
  carbs?: number    // g
}
```

- Falls `nutrition === null`: „Nährwerte auf Anfrage erhältlich."

---

## Personenanzahl (statt Größen S/M/L)

Das bestehende freie Personenanzahl-Eingabefeld aus `product-detail-client.tsx` wird
**beibehalten**, aber in einem Button-Grid restyled:

```
[2–4 Pers.] [6–8 Pers.] [10–12 Pers.] [12+ Pers.]
```

Feste Labels als Orientierung; tatsächlicher Wert bleibt frei. Diese Darstellung ahmt
das S/M/L-Mockup nach, **ohne Schema-Änderung**.

---

## Komponenten (neu / ändern)

### `product-detail-client.tsx` — Änderungen

1. **Split-Layout** einbauen (Bild links / Info rechts auf Desktop; gestapelt auf Mobil).
2. **Tabs** (shadcn `<Tabs>`) für Info / Zutaten / KBZHU.
3. **Personenanzahl-Grid** statt freies Eingabefeld.
4. **Preishinweis-Banner** (`bg-[#F5E6C8] text-[#7B5E00]`) direkt über dem CTA.
5. Bestehende Logik (Flavour-Selector, Add-to-Cart, Favorit) unverändert.

### `product-image-slider.tsx` — Änderungen

- Thumbnail-Strip: 56×56 px, `rounded-lg`, aktiver mit `border-2 border-primary`.
- Dot-Indikator auf Mobil (statt Thumbnails).

### `flavour-detail-wrapper.tsx` — Anpassung

- Gleiche Split/Stack-Struktur wie Design-Detailseite.
- Nutrition-Tab ergänzen.

---

## i18n-Keys

```jsonc
"product": {
  "tabs": {
    "info":        "Info",
    "ingredients": "Zutaten",
    "nutrition":   "KBZHU"
  },
  "composition":      "Zusammensetzung",
  "allergens":        "Allergene",
  "personCount":      "Personenanzahl",
  "personLabels": {
    "2to4":   "2–4 Pers.",
    "6to8":   "6–8 Pers.",
    "10to12": "10–12 Pers.",
    "12plus": "12+ Pers."
  },
  "priceNote":        "Der genaue Preis wird nach Ihrer Bestellung individuell berechnet.",
  "orderButton":      "Torte bestellen",
  "noNutrition":      "Nährwerte auf Anfrage erhältlich.",
  "category": {
    "torten":      "Torten",
    "feier":       "Feier",
    "hochzeit":    "Hochzeit",
    "bento":       "Bento",
    "zum-tee":    "Zum Tee",
    "klassische":  "Klassische"
  }
}
```

---

## Offene Punkte

- [x] Für generische `products` (Desserts etc.): Tabs `Zutaten` / `KBZHU` nur anzeigen wenn Daten vorhanden.
- [x] Breadcrumb: muss die aktuelle Section-ID kennen → aus `torten_designs.sub_category` ableitbar. **Umgesetzt:** neuer Helper `getSectionForProduct()` in `lib/catalogue-sections.ts` löst Section aus `category`/`subCategory`/`classic` auf. Alle drei Wrapper (`product-detail-wrapper.tsx`, `flavour-detail-wrapper.tsx`, `custom-torte-wrapper.tsx`) migriert von der alten `/${locale}?category=...`-Route auf echte Routen: `product-detail-wrapper.tsx` zeigt jetzt Home › Katalog › Gruppe › Section (deep link `/catalog/[section]`) › Produktname; `flavour-detail-wrapper.tsx` und `custom-torte-wrapper.tsx` bleiben auf Gruppen-Ebene (`/catalog`, `/torten`), da eine Geschmacksrichtung/Custom-Design keiner einzelnen Section eindeutig zuordenbar ist. Verifiziert per curl gegen `pnpm dev` für Torten-, Dessert-, Flavour- und Custom-Seite.
- [x] Ähnliche Produkte: Sektion am Ende (3–4 ProductCards aus gleicher Section). **Korrektur einer früheren Falschaussage:** existiert bereits — in `app/[locale]/products/[slug]/page.tsx:449-467` (Prop `similarProducts`, nicht im Wrapper selbst, daher beim ersten Check übersehen). Für Dessert-Produkte korrekt nach `category` (≈ Section) gefiltert; für Torten-Designs aber **nicht** nach `sub_category` gefiltert — holt irrtümlich alle `torten_designs` mit `category='torten'` unabhängig von der Section (`page.tsx:272-276`). Kleiner Folge-Fix wert: `.eq('sub_category', tortenDesign.sub_category)` ergänzen (bzw. `classic`-Fall gesondert behandeln).
- [x] Mockup verwendet Emojis für Tabs — im Code durch Lucide-Icons ersetzen (⚗️ → `FlaskConical`, ⚠️ → `AlertTriangle`). → Umgesetzt mit Lucide-Icons.

---

## Abnahme/Verifikation

- [ ] Desktop: Split-Layout 580px Bild + Info-Bereich sichtbar
- [ ] Mobil: Bild oben (4/3), Info-Panel `rounded-t-2xl` überlappt, CTA sticky bottom
- [x] Tabs funktionieren (Info / Zutaten / KBZHU)
- [x] KBZHU-Tab zeigt Nährwerte oder Fallback-Text
- [x] Personenanzahl-Grid wählbar, Add-to-Cart überträgt Wert
- [x] Favorit-Button funktioniert
- [x] Preishinweis-Banner über CTA sichtbar
- [ ] Thumbnail-Strip auf Desktop, Dot-Indikator auf Mobil
- [x] `pnpm lint` + `pnpm build` ohne Fehler
