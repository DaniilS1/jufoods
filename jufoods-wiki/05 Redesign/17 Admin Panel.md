# 17 Admin Panel

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Mockup-Referenz:**
> - Desktop Screen 04 — „Admin Panel — Sidebar + Master-Detail"
> - Mobile Screen 06 — „Admin · Bestellungen"
> - Mobile Screen 07 — „Admin · Designs verwalten"
> - Mobile Screen 08 — „Admin · Kunden"

---

## Ziel

Das Admin-Panel von einem **horizontalen Tab-Bar im Header** auf ein professionelles
**Desktop-Sidebar + Master-Detail-Layout** umstellen und auf Mobil als **Dark-Header +
Tab-Pills + aufklappbare Karten** darstellen.

**⚠ Preise, Anzahlung und erweiterte Status → Phase 2 (nicht implementieren)**
Konkret: Admin kann heute nur Status `completed` setzen. Das bleibt so. Der Mockup-Screen
zeigt Preis-Felder und Anzahlungs-Checkbox — **diese Felder werden in Phase 1 nicht
gebaut**. Stattdessen: Kommentar-/Notiz-Feld + Status-Dropdown mit den 4 bestehenden Status.

---

## Aktueller Stand (Dateien)

| Datei | Funktion |
|---|---|
| `apps/web/app/[locale]/admin/layout.tsx` | Auth-Guard (admin role check) |
| `apps/web/app/[locale]/admin/page.tsx` | `?tab=`-State + dynamische Import-Panels |
| `apps/web/components/admin-tabs.tsx` | Horizontale Tab-Bar im Header |
| `apps/web/components/admin-orders-management.tsx` | Bestell-Verwaltung |
| `apps/web/components/admin-design-management.tsx` | Design-CRUD |
| `apps/web/components/admin-flavour-management.tsx` | Flavour-CRUD |
| `apps/web/components/admin-customers-management.tsx` | Kunden-Liste |
| `apps/web/components/admin-product-management.tsx` | Produkt-CRUD |

---

## Neue Admin-Navigation

Die bisherige `admin-tabs.tsx` (im Header gerendert) wird durch eine **linke dunkle Sidebar**
(Desktop) bzw. **Tab-Pills im Dark-Header** (Mobil) ersetzt.

### Sidebar-Menü (Desktop)

| Tab | Icon (Lucide) | Label |
|---|---|---|
| `orders` | `ShoppingBag` | Bestellungen |
| `designs` | `Image` | Designs |
| `flavours` | `UtensilsCrossed` | Geschmäcker |
| `products` | `Package` | Produkte |
| `customers` | `Users` | Kunden |

Unten in der Sidebar: ⚙️ Einstellungen (Link zu `/account`) + Abmelden.

### Mobil-Tab-Pills (Screen 06–08)

```tsx
const adminTabs = ['orders', 'designs', 'customers', 'flavours']  // 4 Tabs auf Mobil
```

---

## Ziel-Layout

### Desktop (1280 px)

```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo + Jufood.s + Admin]  ← Dark Sidebar 228px, bg-secondary   │
│                                                                   │
│ [📦] Bestellungen (aktiv)  │  ┌────ober-Bar────────────────────┐│
│ [🖼] Designs                │  │ Bestellungen        [🔍][+Neu]││
│ [🍽] Geschmäcker            │  ├────────────────────────────────┤│
│ [📋] Produkte               │  │ Stats: Offen | Wartend | Woche ││
│ [👥] Kunden                 │  ├────────────────────────────────┤│
│                             │  │ Filter: Alle|Offen|Bestätigt…  ││
│                             │  ├────────────────────────────────┤│
│ [⚙️ Einstellungen]         │  │ [Order-Liste  │ Order-Detail]  ││
│ [→ Abmelden]               │  │ (Master 360px│ (Detail flex:1) ││
└─────────────────────────────┴──┴────────────────────────────────┘
```

**Sidebar:**
- `w-[228px] bg-secondary text-white flex flex-col`
- Logo-Bereich: `padding: 20px`, `border-b border-white/7`
- Nav-Elemente: `flex items-center gap-2.5 px-3 py-2.5 rounded-lg`; aktiv: `bg-primary/25`; Icon `text-white`, Label `font-semibold`
- Badges (Anzahl offener Bestellungen): `bg-primary/35 text-white text-[10px] rounded-full px-1.5`

**Master-Detail (Bestellungen):**
- Master: `w-[360px] flex-col gap-1.5 overflow-y-auto` — Bestellkarten
- Detail: `flex-1 bg-white rounded-xl border border-border p-6 flex-col gap-4`
- Aktive Bestellkarte: `bg-secondary text-white` (dunkles Braun)
- Inaktive Bestellkarte: `bg-white border border-border rounded-xl`

**Bestelldetail-Panel (Desktop):**
```
JF-2025-001   [✅ Bestätigt]
Sommergarten · M · Vanille        15.07.2025
──────────────────────────────────────────
[Kundendaten-Karte]   [Aktionen-Karte]
[Bestelldetails-Karte][Notiz-Karte]
```

**Aktionen-Karte (Phase 1 — kein Preis):**
- Status-Dropdown: `pending → confirmed → completed → cancelled`
- Notiz-Textarea (intern)
- `Speichern`-Button

### Mobil (375 px) — Screen 06

```
[Dark Header bg-secondary padding 16px]
  [Logo 32px] Admin Panel  [Admin-Badge]
  [Tab-Pills: Bestellungen|Designs|Kunden|Geschmäcker]

[Stats: Offen | Wartend | Woche] ← 3-Spalten-Grid, Border

[Filter-Chips: Alle|Offen|Wartend|Bestätigt]  ← horizontal scroll

[Bestellkarte aufklappbar]
  Summary: ID + Status-Badge + Name + Produkt + Datum
  Quick-Actions (immer sichtbar):
    Status: [Select]
    [Notiz: Textarea]  ← kein Preis-Feld!
  Expanded: Kundendaten (Telefon, E-Mail, Kontaktmethode)
            [Anzahlung erhalten] Checkbox (Phase 2 — leer lassen/ausblenden)
            [Foto-Download]
```

---

## Komponenten (neu / ändern)

### `apps/web/components/admin-sidebar.tsx` (NEU)

```tsx
interface AdminSidebarProps {
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
}
```

- Rendert die dunkle Desktop-Sidebar.
- `useRouter` / `useSearchParams` für aktiven Tab per URL (`?tab=`).

### `apps/web/components/admin-mobile-header.tsx` (NEU)

- Dunkler Header für Mobil mit Logo + Tab-Pills.

### `apps/web/app/[locale]/admin/page.tsx` — Änderungen

1. Rendert jetzt `<AdminSidebar>` (Desktop) oder `<AdminMobileHeader>` (Mobil).
2. `<AdminTabs>` aus `header.tsx` entfernen.
3. Master-Detail-Layout für Bestellungen.
4. Lazy-Import der Management-Panels bleibt erhalten.

### `apps/web/components/admin-tabs.tsx` — **deprecated**

Wird aus `header.tsx` entfernt. Datei kann gelöscht oder als Legacy behalten werden.

### `admin-orders-management.tsx` — Änderungen

1. **Stats-Row** (4 Kacheln Desktop / 3 Spalten Mobil): Offen, Wartend, Woche-Umsatz (Phase 1 ohne €-Wert → Anzahl), Gesamt.
2. **Filter-Strip:** Alle, Offen (`pending`), Bestätigt (`confirmed`), Abgeschlossen (`completed`), Storniert (`cancelled`).
3. **Master-Liste (Desktop):** Karten wie oben beschrieben.
4. **Detail-Panel (Desktop):** 2×2-Grid mit Kundendaten + Aktionen + Details + Notiz.
5. **Mobil:** aufklappbare Karten, Quick-Actions immer sichtbar.
6. **Aktionen — Phase 1:** Status-Select + Notiz. **Kein Preis-Feld, keine Anzahlungs-Checkbox** (→ Phase 2).

### `admin-design-management.tsx` — visuell anpassen

- Kategorie-Tabs als Pills (Geburtstag, Hochzeit, …).
- Design-Kacheln: `flex` mit Bild + Name + Kategorie + Toggle (aktiv/inaktiv) + Bearbeiten + Löschen.
- „+ Neu hinzufügen"-Button: `bg-primary text-white`.

### `admin-flavour-management.tsx` — visuell anpassen

- Analog zu Design-Management restyled.

### `admin-customers-management.tsx` — visuell anpassen

- Screen 08: Such-Feld + Kunden-Karten (Avatar-Initials + Name + Tel + letzter Kauf + Bestellanzahl).

### `admin-product-management.tsx` — visuell anpassen

- Token-konform restyled.

---

## i18n-Keys

Bestehende `admin.*`-Keys anpassen + ergänzen:

```jsonc
"admin": {
  "sidebar": {
    "orders":    "Bestellungen",
    "designs":   "Designs",
    "flavours":  "Geschmäcker",
    "products":  "Produkte",
    "customers": "Kunden",
    "settings":  "Einstellungen",
    "logout":    "Abmelden"
  },
  "orders": {
    "stats": {
      "open":    "Offen",
      "pending": "Wartend",
      "week":    "Diese Woche",
      "total":   "Gesamt"
    },
    "actions": {
      "status":   "Status ändern",
      "note":     "Interne Notiz",
      "save":     "Speichern",
      "photoDownload": "📥 Foto herunterladen"
    },
    "customerSection": "Kundendaten"
  }
}
```

---

## Offene Punkte

- [ ] Stats-Werte (Anzahl offen etc.): Server-seitiger Count-Query oder Client-Fetch?
- [ ] Master-Detail: Mobile zeigt keine zweite Spalte → Detail als neuer Screen oder Modal?
- [ ] Badge im Sidebar (Anzahl offener Bestellungen) braucht Echtzeit-Count → `api/admin/orders?status=pending&count=true`.
- [ ] Preis-Feld und Anzahlungs-Checkbox: im Code kommentieren als `// Phase 2` und ausblenden, nicht löschen.

---

## Abnahme/Verifikation

- [x] Desktop: Dunkle Sidebar 228px mit 5 Nav-Punkten, aktiver Tab hervorgehoben
- [x] Mobil: Dark-Header + 4 Tab-Pills + Stats-Zeile
- [x] Bestellungen: Filter-Chips funktionieren; nur 4 bestehende Status
- [ ] Bestellkarte (Desktop): Master-Klick öffnet Detail-Panel rechts
- [ ] Bestellkarte (Mobil): aufklappbar; Quick-Actions (Status-Select + Notiz) sichtbar
- [x] **Kein Preis-Feld, keine Anzahlungs-Checkbox** im UI
- [x] Status-Änderung zu `confirmed`/`completed`/`cancelled` funktioniert via API
- [x] Design-Management: Karten mit Toggle + Bearbeiten + Löschen
- [x] Kunden-Tab: Suchfeld + Kunden-Karten
- [x] Admin-Zugang: Redirect → `/login` wenn nicht eingeloggt; Redirect → `/` wenn kein Admin
- [x] `pnpm lint` + `pnpm build` ohne Fehler
