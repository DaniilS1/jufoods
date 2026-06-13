# 10 Startseite (Home)

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Mockup-Referenz:**
> - Desktop Screen 00 — `Jufoods Desktop Mockup.dc.html` (Abschnitt „00 · Home Page")
> - Mobile Screen 00 — `Jufoods Design Mockup.dc.html` (Abschnitt „Home Page")

---

## Ziel

Eine **echte Startseite** einführen. Heute ist `/[locale]` der Katalog. Nach dem Redesign:

- `/[locale]` → Startseite mit Hero, Über-uns-Streifen, „So wird bestellt".
- `/[locale]/catalog` → Katalog (neue Route, siehe [[11 Katalog – Übersicht]]).

Die Startseite braucht **keinen Daten-Fetch aus Supabase** — sie ist vollständig statisch.

---

## Aktueller Stand (Dateien)

| Datei | Funktion |
|---|---|
| `apps/web/app/[locale]/page.tsx` | Heute: CatalogPage (Server Component, fetcht Produkte) |
| `apps/web/components/subcategory-tabs.tsx` | Heute in der Root-Page gerendert |
| `apps/web/components/torten-view-toggle.tsx` | Heute in der Root-Page gerendert |
| `apps/web/components/product-card.tsx` | Heute in der Root-Page gerendert |

**Änderung:** `apps/web/app/[locale]/page.tsx` wird zur neuen Startseite umgebaut. Der
Katalog-Code zieht in `apps/web/app/[locale]/catalog/page.tsx`.

---

## Ziel-Layout

### Desktop (1280 px)

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (64 px)                                         │
├───────────────────────┬─────────────────────────────────┤
│  TORTEN               │  DESSERTS                       │
│  Hero-Karte (400 px)  │  Hero-Karte (400 px)            │
│  Hintergrund #C4907A  │  Hintergrund #8FB8A2            │
│  Gradient to-top      │  Gradient to-top                │
│  "Individuelle Torten"│  "Desserts & Süßes"             │
│  [CTA-Button]         │  [CTA-Button]                   │
├───────────────────────┴─────────────────────────────────┤
│  SO WIRD BESTELLT (2×2 Grid, weiße Karte)    ÜBER UNS  │
│  01 Katalog  02 Formular  03 Preis  04 Anz.  (weiße K.) │
└─────────────────────────────────────────────────────────┘
```

- **Hero-Sektion:** `grid grid-cols-2 gap-4 px-12 pt-6`
- Jede Hero-Karte: `h-[400px] rounded-2xl overflow-hidden relative cursor-pointer`
  - Hintergrundbild-Placeholder: einfarbiger Hintergrund + Streifen-Pattern, später durch echtes Bild ersetzt.
  - Gradient overlay: `bg-gradient-to-t from-black/80 via-black/20 to-transparent`
  - Label (Overline), H2 (Playfair Display, 40 px), Beschreibungstext, CTA-Button.
  - CTA → navigiert zu `/[locale]/catalog/feier` (Torten) bzw. `/[locale]/catalog/desserts` (Desserts).
- **Untere Zeile:** `grid grid-cols-2 gap-4 px-12 py-4`
  - „So wird bestellt": weiße Karte, 2×2-Grid mit 4 Schritten (Nummer + Icon + Titel).
  - „Über uns": weiße Karte, Playfair-Heading, Beschreibungstext, 3 Badges (Bestellung, München, Seit 2023).

### Mobil (375 px)

```
[HEADER 56px]
[Torten-Karte 210px]  [Desserts-Karte 210px]   ← flex gap-2.5, px-3, pt-3
[Über-uns-Karte]                               ← weißes Panel, px-3, mt-3
[SO WIRD BESTELLT — 2×2 Grid weiße Kacheln]   ← px-3, mt-3, pb-5
```

- Hero-Karten: `flex-1 h-[210px] rounded-2xl` (nebeneinander, nicht übereinander)
- Über-uns: `bg-white border border-border rounded-xl p-4`
- Schritt-Kacheln: `bg-white border border-border rounded-xl p-3` (Emoji + Nummer + Titel)

---

## Komponenten (neu / ändern)

### `apps/web/app/[locale]/page.tsx` — **komplett umbauen**

Wird zu einer einfachen **statischen Server Component**:

```tsx
// Keine Daten-Fetches, keine Search-Params
export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <BottomStrip />
    </main>
  )
}
```

### Neue Komponenten (unter `components/home/`)

| Datei | Inhalt |
|---|---|
| `components/home/hero-section.tsx` | 2 Hero-Karten (Torten / Desserts) |
| `components/home/how-to-order.tsx` | „So wird bestellt" 4-Schritte-Grid |
| `components/home/about-strip.tsx` | Über-uns-Karte mit Badges |

Alternativ: Alles direkt in `page.tsx`, wenn die Seite klein genug ist.

### Migration der heutigen Katalog-Logik

Folgende Dateien / Importe aus `page.tsx` werden **verschoben**, nicht gelöscht:

- `SubcategoryTabs` → zieht in `catalog/[section]/page.tsx`
- `TortenViewToggle` → zieht in `catalog/[section]/page.tsx`
- `ProductCard` → bleibt in `components/`, wird neu importiert

---

## i18n-Keys

Neue Keys (beide Dateien `messages/de.json` + `messages/uk.json`):

```jsonc
"home": {
  "hero": {
    "torten": {
      "label":       "TORTEN",
      "title":       "Individuelle Torten",
      "description": "Geburtstag, Hochzeit, Bento — jede Torte nach Ihren Wünschen.",
      "cta":         "Torten entdecken →"
    },
    "desserts": {
      "label":       "DESSERTS",
      "title":       "Desserts & Süßes",
      "description": "Macarons, Cookies, Cheesecakes — handgemacht mit Liebe.",
      "cta":         "Desserts entdecken →"
    }
  },
  "howToOrder": {
    "label":   "SO WIRD BESTELLT",
    "step1":   "Katalog durchsuchen",
    "step2":   "Formular ausfüllen",
    "step3":   "Preisangebot erhalten",
    "step4":   "Anzahlung & Bestätigung"
  },
  "about": {
    "label":       "ÜBER UNS",
    "title":       "Hausgemacht mit Liebe, in München",
    "description": "Juliia backt individuelle Torten und Desserts nach Bestellung. Jedes Stück entsteht von Hand — mit Liebe zum Detail.",
    "badge1":      "Torten auf Bestellung",
    "badge2":      "München",
    "badge3":      "Seit 2023"
  }
}
```

---

## Offene Punkte

- [ ] Echte Produktfotos für Hero-Karten (aktuell Platzhalter-Hintergrundfarbe).
- [ ] Hintergrundmuster (Punkte/Streifen) im Body hinter dem Seiteninhalt — übernehmen oder weglassen? Mockup zeigt `#F5EDEA` mit radial-gradient Punktraster.
- [ ] `/[locale]/products` Redirect noch nötig? → Redirect auf `/catalog` aktualisieren.
- [ ] SEO: `metadata` für Startseite ergänzen.

---

## Abnahme/Verifikation

- [x] `/[locale]` zeigt Startseite, **nicht** mehr den Katalog
- [x] 2 Hero-Karten nebeneinander auf Desktop (400 px Höhe), nebeneinander auf Mobil (210 px Höhe)
- [x] CTA-Buttons navigieren korrekt zu `/catalog/feier` bzw. `/catalog/desserts`
- [x] „So wird bestellt" — 4 Schritte sichtbar (2×2 auf Desktop und Mobil)
- [x] „Über uns" — Text + 3 Badges sichtbar
- [x] Playfair Display auf Hero-Headings aktiv
- [x] Keine Supabase-Queries auf dieser Seite (Dev Tools Network-Tab)
- [x] `pnpm build` ohne Fehler
