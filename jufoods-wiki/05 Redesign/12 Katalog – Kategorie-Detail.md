# 12 Katalog – Kategorie-Detail

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Mockup-Referenz:**
> - Desktop Screen 02 — „Geburtstagstorten — Sidebar + Produktraster"
> - Mobile Screen 02 — „[Kategorie] (nach Klick)"

---

## Ziel

Eine neue Route `/[locale]/catalog/[section]` einrichten, die beim Klick auf eine
Section-Karte aufgerufen wird. Sie zeigt:

- **Desktop:** linke Sidebar (alle Sections als Liste) + rechts Produkt-/Design-Raster.
- **Mobil:** Top-Bar mit Zurück-Button + Name, horizontale Subcat-Pills, 2-spaliges Grid + FAB.

Diese Route **ersetzt** das bisherige `?category/?subcategory/?view`-Suchparameter-System
auf der Root-Seite. Der bestehende `ProductCard`-Komponent und `TortenViewToggle` werden
wiederverwendet.

---

## Aktueller Stand (Dateien)

| Datei | Funktion |
|---|---|
| `apps/web/app/[locale]/page.tsx` | Heute: Katalog-Logik inkl. Sidebar-ähnlicher Filterung |
| `apps/web/components/subcategory-tabs.tsx` | Horizontale Subkat-Tabs + FAB + TorteBestellenModal |
| `apps/web/components/torten-view-toggle.tsx` | Designs/Geschmäcker-Toggle |
| `apps/web/components/product-card.tsx` | Produkt-Kachel (wiederverwendet) |
| `apps/web/lib/subcategory-config.ts` | Subcategory-Definitionen |
| `apps/web/lib/catalogue-sections.ts` | NEU — Section-Config (aus [[11 Katalog – Übersicht]]) |

---

## Neue Dateien / Route

```
apps/web/app/[locale]/catalog/
├── page.tsx                 ← Katalog-Übersicht (→ Note 11)
├── layout.tsx               ← optional Breadcrumb
└── [section]/
    └── page.tsx             ← Kategorie-Detail (diese Note)

apps/web/components/catalog/
├── catalog-sidebar.tsx      ← NEU: Desktop-Sidebar mit allen Sections
├── catalog-detail-client.tsx← NEU: Client-Wrapper für Filter-State (mobile pills + toggle)
└── section-card.tsx         ← (aus Note 11)
```

---

## Query-Logik

Die `CatalogueSection.query`-Defintion aus `lib/catalogue-sections.ts` steuert den
Supabase-Query in `catalog/[section]/page.tsx`:

```ts
// Torten-Design-Sections (feier, hochzeit, bento, zum-tee)
const { data: designs } = await supabase
  .from('torten_designs')
  .select('id, slug, name_de, name_uk, description_de, description_uk, image_url, sub_category, classic')
  .eq('sub_category', section.query.subCategory)

// Klassische Torten
const { data: designs } = await supabase
  .from('torten_designs')
  .select('...')
  .eq('classic', true)

// Dessert-Sections (desserts, cookies, macarons, cheesecakes)
const { data: products } = await supabase
  .from('products')
  .select('id, slug, name_de, name_uk, description_de, description_uk, image_url, category, sub_category')
  .eq('category', section.query.category)
```

Für Torten-Sections wird **zusätzlich** `torten_flavours` gefetcht (für den
Geschmäcker-View), genau wie heute in `app/[locale]/page.tsx:73`.

---

## Ziel-Layout

### Desktop (1280 px)

```
[HEADER 64px]
[BREADCRUMB: Home › Katalog › Feiertorten]
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR 280px (bg-white/50, border-r)  │ MAIN flex-1            │
│                                        │                         │
│ TORTEN ─────────────                   │ [Feiertorten]           │
│ • Feiertorten (aktiv) 24 Designs       │ 24 Designs verfügbar    │
│   Hochzeitstorten                      │                         │
│   Bento Torten                         │ [Alle][Subcat A][Sub B] │
│   Zum Tee                              │ [🎨 Designs][🎂 Geschm.]│
│   Klassische Torten                    │                         │
│                                        │ ┌────┬────┬────┐        │
│ DESSERTS ───────────                   │ │ P  │ P  │ P  │        │
│   Desserts                             │ │ ro │ ro │ ro │        │
│   Cookies                              │ │ d  │ d  │ d  │        │
│   Macarons                             │ ├────┼────┼────┤        │
│   Cheesecakes                          │ │ P  │ P  │ P  │        │
└────────────────────────────────────────┴─┴────┴────┴────┴────────┘
```

- Sidebar: `w-[280px] shrink-0 border-r border-border bg-white/50 p-5`
  - Aktiver Eintrag: `bg-primary/15 rounded-lg`, Punkt `bg-primary`, Pfeil `→` sichtbar.
  - Inaktiver Eintrag: Punkt `bg-border`, Pfeil versteckt.
  - Gruppen-Labels: `text-xs font-bold uppercase tracking-wider text-muted-foreground`.
- Main-Bereich:
  - Header-Zeile: Playfair-Name der Section + Anzahl-Text + Subcat-Pills + Toggle.
  - Grid: `grid-cols-3 gap-3.5`.
  - ProductCard: `bg-white rounded-xl overflow-hidden shadow-sm`.

### Mobil (375 px)

```
┌──────────────────────────────────────────────────┐
│ [← Zurück] [Section-Name]  [🛒]                  │  56px Header
│ ──────────────────────────────────────────────── │
│ [Alle] [Subcat A] [Subcat B] ...  (horizontal)   │  Pills-Zeile
├──────────────────────────────────────────────────┤
│ [Anzahl]                [🎨 Designs][🎂 Geschm.] │
│ ┌──────────────┬──────────────┐                  │
│ │ ProductCard  │ ProductCard  │                  │
│ ├──────────────┼──────────────┤                  │
│ │ ProductCard  │ ProductCard  │                  │
│ └──────────────┴──────────────┘                  │
│                                          [+ FAB] │
└──────────────────────────────────────────────────┘
```

- Header: Zurück-Button (`←`) + Section-Name (Playfair) + Warenkorb-Icon.
- Subcat-Pills: horizontal scrollbar (`overflow-x-auto scrollbar-hidden`), `gap-1 py-2 px-3`.
- Toggle: `inline-flex bg-primary/12 rounded-[9px] p-0.5 gap-0.5`.
- Grid: `grid-cols-2 gap-2.5 px-3`.
- FAB (nur Torten): `fixed bottom-4 right-4 w-11 h-11 rounded-full bg-primary shadow-lg` → öffnet TorteBestellenModal.

---

## Subcategory-Pills

Für Dessert-Sections (desserts, cookies, …) werden die `subcategory-config`-Einträge als
Pills gerendert (`getSubcategoriesForCategory(section.category)`). Die Pills setzen einen
`?sub=`-URL-Parameter (einfacher State), der den Grid filtert.

Für Torten-Sections gibt es keine Subcategory-Pills (da jede Section bereits eine
Subcategory ist) — stattdessen nur den Designs/Geschmäcker-Toggle.

---

## Komponenten (neu / ändern)

### `apps/web/app/[locale]/catalog/[section]/page.tsx` (NEU)

Server Component: liest `params.section`, löst `getSectionById`, fetcht Daten, rendert
`<CatalogDetailClient>` + Sidebar.

### `apps/web/components/catalog/catalog-sidebar.tsx` (NEU)

Client Component (für `usePathname` aktiver Link). Rendert beide Gruppen aus
`CATALOGUE_SECTIONS`. Übermittelt aktive Section per `href`.

### `apps/web/components/catalog/catalog-detail-client.tsx` (NEU)

Client Component: hält `subcat`-State (mobil-Pills) + `view`-State (toggle). Rendert Grid
mit gefilterten Items. Auf Desktop: kein eigener Filter-State nötig (Sidebar + URL).

### Wiederverwendete Komponenten

- `components/product-card.tsx` — unverändert
- `components/torten-view-toggle.tsx` — unverändert (State-Prop statt URL-Param)
- `components/torte-bestellen-modal.tsx` — FAB-Trigger für Torten-Sections
- `components/subcategory-tabs.tsx` — **deprecated**, Logik in neuen Komponenten

---

## Bestehende Suchparameter-Logik (wird abgelöst)

Das bisherige System (`?category`, `?subcategory`, `?view`) in der Root-Page-tsx und dem
Header wird **vollständig ersetzt**. Die URL-Struktur ist neu:

```
alt:  /de?category=torten&subcategory=feier&view=designs
neu:  /de/catalog/feier?view=designs
```

---

## i18n-Keys

```jsonc
"catalog": {
  "designsAvailable": "{count} Designs verfügbar",
  "view": {
    "designs":   "🎨 Designs",
    "flavours":  "🎂 Geschmäcker"
  },
  "subcatAll": "Alle"
}
```

---

## Offene Punkte

- [x] `?view=designs|flavours` als URL-Param für Torten-Sections: Deep-Linking gewünscht? → Ja, umgesetzt.
- [x] `notFound()` wenn Section-ID unbekannt. → Umgesetzt.
- [ ] Produktzähler (Anzahl Designs) — Count-Query beim Seitenaufruf oder vorab in Config?
- [ ] `subcategory-tabs.tsx` nach Migration: deprecated oder löschen?
- [x] TorteBestellenModal: `initialSubcategory` muss dem neuen Section-`sub_category`-Wert entsprechen. → Umgesetzt.

---

## Abnahme/Verifikation

- [x] `/de/catalog/feier` lädt und zeigt Feiertorten-Designs
- [x] `/de/catalog/cookies` lädt und zeigt Cookie-Produkte
- [x] Desktop: Sidebar mit allen 9 Sections, aktive Section hervorgehoben
- [x] Mobil: Zurück-Button → `/catalog`, korrekte Section-Name im Header
- [x] Designs/Geschmäcker-Toggle funktioniert (nur für Torten-Sections)
- [x] FAB öffnet TorteBestellenModal (nur für Torten-Sections)
- [ ] Subcategory-Pills filtern Grid (für Dessert-Sections)
- [x] `notFound()` bei ungültiger Section-ID
- [ ] Breadcrumb: Home › Katalog › [Section-Name]
- [x] `pnpm lint` + `pnpm build` ohne Fehler
