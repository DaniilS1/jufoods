# 11 Katalog – Übersicht

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Mockup-Referenz:**
> - Desktop Screen 01 — „Katalog — Kategorieübersicht (keine Tabs)"
> - Mobile Screen 01 — „Kategorie-Übersicht"

---

## Ziel

Eine neue **Katalog-Übersichtsseite** unter `/[locale]/catalog` einführen, die alle
Kategorien als große Karten zeigt — **keine horizontalen Tabs mehr**. Das Kern-Konzept:
zwei Abschnitte (Torten / Desserts) mit je einer Karte pro Section, die beim Klick auf
`/[locale]/catalog/[section-id]` führen.

---

## Aktueller Stand (Dateien)

| Datei | Funktion |
|---|---|
| `apps/web/app/[locale]/page.tsx` | Heute Katalog + Startseite in einem |
| `apps/web/components/header.tsx:176` | Kategorie-Nav-Tabs in Header-Unterzeile |
| `apps/web/lib/subcategory-config.ts` | Bisherige Subcategory-Registry |

**Neue Dateien:**

| Datei | Funktion |
|---|---|
| `apps/web/app/[locale]/catalog/page.tsx` | Neue Katalog-Übersicht (Server Component) |
| `apps/web/app/[locale]/catalog/layout.tsx` | Optional: Breadcrumb-Wrapper |
| `apps/web/lib/catalogue-sections.ts` | Neue Section-Config (s. unten) |
| `apps/web/components/catalog/section-card.tsx` | Einzelne Kategorie-Karte |
| `apps/web/components/catalog/catalog-overview.tsx` | Zwei-Gruppen-Grid |

---

## `lib/catalogue-sections.ts` — neue Config

```ts
export interface CatalogueSection {
  id: string
  group: 'torten' | 'desserts'
  translationKey: string        // Key unter catalog.sections.*
  heroColor: string             // Tailwind bg-[...] oder token
  query:
    | { table: 'torten_designs'; subCategory: string }
    | { table: 'torten_designs'; classic: true }
    | { table: 'products'; category: string }
}

export const CATALOGUE_SECTIONS: CatalogueSection[] = [
  // Torten
  { id: 'feier',      group: 'torten',   translationKey: 'feier',      heroColor: '#C4907A', query: { table: 'torten_designs', subCategory: 'feier'    } },
  { id: 'hochzeit',   group: 'torten',   translationKey: 'hochzeit',   heroColor: '#A08898', query: { table: 'torten_designs', subCategory: 'hochzeit' } },
  { id: 'bento',      group: 'torten',   translationKey: 'bento',      heroColor: '#7AB09A', query: { table: 'torten_designs', subCategory: 'bento'    } },
  { id: 'zum-tee',    group: 'torten',   translationKey: 'zum-tee',    heroColor: '#C4A87A', query: { table: 'torten_designs', subCategory: 'zum-tee'  } },
  { id: 'klassische', group: 'torten',   translationKey: 'klassische', heroColor: '#9A8878', query: { table: 'torten_designs', classic: true           } },
  // Desserts
  { id: 'desserts',   group: 'desserts', translationKey: 'desserts',   heroColor: '#8FB8A2', query: { table: 'products', category: 'desserts'    } },
  { id: 'cookies',    group: 'desserts', translationKey: 'cookies',    heroColor: '#C4A87A', query: { table: 'products', category: 'cookies'     } },
  { id: 'macarons',   group: 'desserts', translationKey: 'macarons',   heroColor: '#C48090', query: { table: 'products', category: 'macarons'    } },
  { id: 'cheesecakes',group: 'desserts', translationKey: 'cheesecakes',heroColor: '#B89090', query: { table: 'products', category: 'cheesecakes' } },
]

export function getSectionById(id: string) {
  return CATALOGUE_SECTIONS.find(s => s.id === id)
}

export function getSectionsByGroup(group: 'torten' | 'desserts') {
  return CATALOGUE_SECTIONS.filter(s => s.group === group)
}
```

---

## Ziel-Layout

### Desktop (1280 px)

```
[HEADER 64px]
[BREADCRUMB: Home › Katalog]

Unser Sortiment                    [🔍 Alle Kategorien durchsuchen...]
─────────────────────────────────────────────────────────────────────

Torten ─────────────────────────────────────────────────────────────
[Feier]   [Hochzeit]   [Bento]                  ← 3-col grid, 190px h.
[Zum Tee] [Klassische]                           ← 3-col, 190px h.

Desserts ────────────────────────────────────────────────────────────
[Desserts] [Cookies] [Macarons] [Cheesecakes]    ← 4/5-col grid, 160px h.
```

- Page-Padding: `px-12 pt-8`
- Abschnitts-Divider: `text-xs font-bold uppercase tracking-widest text-muted-foreground` + `<hr>`
- Torten-Grid: `grid-cols-3 gap-3.5` (→ 5 Karten = 2 Zeilen)
- Desserts-Grid: `grid-cols-4 gap-3` (→ 4 Karten = 1 Zeile; + 5. eventuell)
- Section-Karte: `rounded-xl overflow-hidden relative h-[190px] cursor-pointer shadow-sm` mit farbigem Hintergrund, Gradient overlay, Playfair-Name unten links, Produkt-Count-Badge oben rechts, Pfeil-Kreis.
- Such-Feld: visuell nur (kein Dropdown auf dieser Seite); klick → `/catalog?q=` (optional).

### Mobil (375 px)

```
[HEADER 56px]
[Seite scrollt vertikal]

Torten ─────────────
[Feier      116px Karte]
[Hochzeit   116px Karte]
[Bento      116px Karte]
[Zum Tee    116px Karte]
[Klassische 116px Karte]

Desserts ───────────
[Desserts   116px Karte]
[Cookies    116px Karte]
[Macarons   116px Karte]
[Cheesecakes 116px Karte]
```

- Karten: `flex-col gap-2 px-3`
- Karten-Höhe: `h-[116px]` (aus Mockup)
- Gradient: `from-black/55 via-black/10 to-transparent` diagonal oben-links
- Klick → navigiert zu `/[locale]/catalog/[section-id]`

---

## Komponenten (neu / ändern)

### `apps/web/app/[locale]/catalog/page.tsx` (NEU)

```tsx
// Server Component
import { getSectionsByGroup } from '@/lib/catalogue-sections'
import { CatalogOverview } from '@/components/catalog/catalog-overview'

export default function CatalogPage() {
  const tortenSections   = getSectionsByGroup('torten')
  const dessertSections  = getSectionsByGroup('desserts')
  return <CatalogOverview torten={tortenSections} desserts={dessertSections} />
}
```

### `apps/web/components/catalog/catalog-overview.tsx` (NEU, Client)

Rendert Breadcrumb + Abschnitt-Divider + Section-Card-Grids.

### `apps/web/components/catalog/section-card.tsx` (NEU)

```tsx
interface SectionCardProps {
  section: CatalogueSection
  locale: string
  size?: 'torten' | 'desserts'  // steuert Höhe
}
```

- Hintergrundfarbe aus `section.heroColor`
- Gradient-Overlay
- Name (Playfair Display), Beschreibung (optional aus i18n), Count-Badge, Pfeil-Icon
- `<Link href={`/${locale}/catalog/${section.id}`}>` als Wrapper

### Header-Anpassung (`header.tsx`)

Die bisherige Kategorien-Nav-Unterzeile wird entfernt (→ [[02 Navigation, AppShell, Header, Drawer & Footer]]).

### Redirect-Update

`apps/web/app/[locale]/products/page.tsx` — Redirect von `/products` → `/catalog` aktualisieren.

---

## i18n-Keys

```jsonc
"catalog": {
  "title":       "Unser Sortiment",
  "subtitle":    "Wählen Sie eine Kategorie, um Designs und Geschmäcker zu entdecken",
  "searchPlaceholder": "Alle Kategorien durchsuchen...",
  "sections": {
    "feier":       { "name": "Feiertorten",       "desc": "Individuell nach Wunsch" },
    "hochzeit":    { "name": "Hochzeitstorten",   "desc": "Mehrstöckige Traumtorten" },
    "bento":       { "name": "Bento Torten",      "desc": "Mini-Torten für 4–6 Personen" },
    "zum-tee":    { "name": "Zum Tee",            "desc": "Klassische Kuchenmomente" },
    "klassische":  { "name": "Klassische Torten", "desc": "Bewährte Rezepte, Festpreis" },
    "desserts":    { "name": "Desserts",           "desc": "Tarts, Mousse, Kapkeiky & mehr" },
    "cookies":     { "name": "Cookies",            "desc": "Chocolate, Blondie & mehr" },
    "macarons":    { "name": "Macarons",           "desc": "Bunte Macarons in vielen Sorten" },
    "cheesecakes": { "name": "Cheesecakes",        "desc": "New York, San Sebastian & mehr" }
  },
  "groups": {
    "torten":   "Torten",
    "desserts": "Desserts"
  }
}
```

---

## Offene Punkte

- [ ] Produkt-Anzahl pro Section anzeigen (erfordert serverseitigen Count-Query je Section — optional für v1).
- [ ] Suchfeld auf Übersicht — nur visuell oder funktional? → v1: visuell, klick öffnet `<SearchBar>`.
- [ ] Breadcrumb-Komponente: aus shadcn `breadcrumb` nehmen.
- [ ] Welches Hintergrundbild für Section-Karten? Vorerst einfarbiger Hintergrund; später echte Produktfotos.

---

## Abnahme/Verifikation

- [x] `/[locale]/catalog` lädt und zeigt 9 Karten in 2 Gruppen
- [x] Karten navigieren zu `/[locale]/catalog/[section-id]`
- [ ] Breadcrumb: Home › Katalog
- [x] Torten-Gruppe: 5 Karten (feier, hochzeit, bento, zum-tee, klassische)
- [x] Desserts-Gruppe: 4 Karten (desserts, cookies, macarons, cheesecakes)
- [ ] Mobil: alle Karten als vertikale Liste, 116 px Höhe, 12 px seitlicher Abstand
- [x] `pnpm lint` + `pnpm build` ohne Fehler
