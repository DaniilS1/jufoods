# Issues — Modul 1: Katalog

← Zurück zur [[../03 Projektmanagement/Roadmap|Roadmap]]

---

## Todo

| # | Titel | Typ | Priorität |
|---|---|---|---|
| [[#M1-01\|M1-01]] | ProductCard-Link fehlt Locale-Präfix | 🐛 Bug | Hoch |
| [[#M1-02\|M1-02]] | Warenkorb speichert Füllungs-ID als Design-ID | 🐛 Bug | Hoch |
| [[#M1-03\|M1-03]] | Torten-Detailseite: Füllungsauswahl UX entscheiden | ⚙️ Konzept | Hoch |
| [[#M1-04\|M1-04]] | Classic-Design: Verhalten definieren | ⚙️ Konzept | Mittel |
| [[#M1-05\|M1-05]] | Torten-Kategorien: Tabs durch 4 große Kategorie-Karten ersetzen | 🔨 Feature | Hoch |
| [[#M1-06\|M1-06]] | Torten-Katalog: nur Bilder anzeigen, kein Text auf den Karten | 🔨 Feature | Hoch |
| [[#M1-07\|M1-07]] | Nicht-Torten Detailseite vereinfachen | 🔨 Feature | Mittel |
| [[#M1-08\|M1-08]] | Katalog: alle Produkttypen zeigen dieselbe Karte | 🔨 Feature | Mittel |
| [[#M1-09\|M1-09]] | TortenViewToggle in SubcategoryTabs integrieren | 🔨 Feature | Niedrig |
| [[#M1-10\|M1-10]] | Fehlende Produktdaten für Desserts & Co. | 📝 Content | Mittel |

## In Bearbeitung

| # | Titel | Seit |
|---|---|---|
| | | |

## Erledigt

| # | Titel | Abgeschlossen am |
|---|---|---|
| | | |

---

## M1-01: ProductCard-Link fehlt Locale-Präfix

**Typ:** 🐛 Bug | **Priorität:** Hoch

**Problem:**  
In `components/product-card.tsx` verlinkt die Karte auf `/products/${slug}` — ohne Locale:

```tsx
// components/product-card.tsx
<Link href={`/products/${slug}`}>
```

Das verursacht bei jedem Klick einen Extra-Redirect durch die Middleware (`/products/torte-x` → `/de/products/torte-x`). Auf langsamen Verbindungen merkbar.

**Fix:**  
Die Komponente muss `locale` als Prop akzeptieren und den Link korrekt aufbauen:

```tsx
<Link href={`/${locale}/products/${slug}`}>
```

**Betroffene Datei:** `components/product-card.tsx`

---

## M1-02: Warenkorb speichert Füllungs-ID als Design-ID

**Typ:** 🐛 Bug | **Priorität:** Hoch

**Problem:**  
In `components/product-detail-client.tsx` (Zeile 112) wird beim Hinzufügen einer Torte die **Füllungs-ID** als `designId` im Warenkorb gespeichert:

```tsx
addItem({
  productId: product.id,   // ← ID des torten_designs ✅
  designId: flavour.id,    // ← ID der Füllung (falsch benannt!)
  designName: flavour.displayName,
})
```

Das Torten-Design selbst (`torten_designs.id`) wird **nicht** in den Warenkorb gelegt. Im Checkout weiß der Server nicht, welches Design bestellt wurde — nur welche Füllung.

**Fix:**  
`CartItem` um `flavourId` / `flavourName` erweitern. `designId` und `designName` auf das echte Design setzen:

```typescript
// stores/cart-store.ts — CartItem
interface CartItem {
  productId: string      // ID des torten_designs
  designId: string       // ID des torten_designs (bisher = flavour.id ← falsch)
  designName: string     // Name des Designs
  flavourId?: string     // NEU: ID der gewählten Füllung
  flavourName?: string   // NEU: Name der gewählten Füllung
  // ...
}
```

**Betroffene Dateien:**  
- `stores/cart-store.ts`
- `components/product-detail-client.tsx`
- `app/api/orders/route.ts` (enrichedLines-Logik)
- `components/shopping-cart.tsx` (Anzeige)

---

## M1-03: Torten-Detailseite — Füllungsauswahl UX entscheiden

**Typ:** ⚙️ Konzept | **Priorität:** Hoch

**Problem:**  
Aktuell zeigt die Detailseite einen vollen Füllungs-Selector mit Zutaten, Allergenen und Nährwerten — die Füllung muss zwingend ausgewählt werden, um in den Warenkorb zu legen.

Im `plan.md` steht als Ziel: *"Detailansicht zeigt Designinformationen, listet globale Flavours nur informativ — kein designbezogener Selector mehr."*

**Entscheidung gefragt:**

| Option | Beschreibung | Aufwand |
|---|---|---|
| **A: Selektor beibehalten** | Kunde muss Füllung wählen bevor er bestellen kann (Status quo) | Kein Aufwand |
| **B: Füllungen informativ** | Liste der verfügbaren Füllungen anzeigen, Auswahl im Checkout | Mittel |
| **C: Füllung im Checkout** | Kein Selektor auf Detailseite, Füllung wird im Checkout-Formular gewählt | Groß |

→ **Entscheidung treffen bevor Implementierung beginnt.**

---

## M1-04: Classic-Design — Verhalten definieren

**Typ:** ⚙️ Konzept | **Priorität:** Mittel

**Problem:**  
`torten_designs.classic = true` hat folgendes Verhalten im Code:
- Kein Fetch aus `design_flavour` (keine verknüpften Füllungen)
- Fallback-Zutaten und -Nährwerte werden angezeigt
- Kein Füllungs-Selector

Für den Nutzer ist unklar was „klassisch" bedeutet und ob es bestellbar ist.

**Entscheidung gefragt:**
- Was ist ein Classic-Design? (vorgegebene Füllung, keine Anpassung möglich?)
- Soll es einen eigenen visuellen Hinweis auf der Karte/Detailseite geben?
- Kann ein Classic-Design trotzdem bestellt werden?

---

## M1-05: Torten-Kategorien — Tabs durch 4 große Kategorie-Karten ersetzen

**Typ:** 🔨 Feature | **Priorität:** Hoch

**Beschreibung:**  
Die aktuelle Subkategorie-Leiste (kleine Tabs: Feier / Hochzeit / Bento / Zum Tee) wird ersetzt durch **4 große Karten**, die jeweils eine Kategorie visuell repräsentieren. Beim Klick öffnet sich der Torten-Katalog gefiltert auf diese Kategorie.

**Aktueller Stand:**  
`components/subcategory-tabs.tsx` rendert horizontale Tabs als `<button>`-Reihe unter dem Header.

**Neues Verhalten:**
- Beim Aufrufen von `?category=torten` (ohne Subkategorie): Zeige 4 große Karten anstelle des Produkt-Grids
- Jede Karte: Hintergrundbild, Kategoriename (DE/UK), bei Klick → `?category=torten&subcategory=feier`
- Beim Aufrufen mit Subkategorie (`?subcategory=feier`): Zeige direkt das Produkt-Grid (kein Karten-Screen)
- Zurück-Button zum Karten-Screen

**4 Kategorien:**

| Subkategorie | DE | UK |
|---|---|---|
| `feier` | Für die Feier | Для свята |
| `hochzeit` | Hochzeit | Весілля |
| `bento` | Bento | Бенто |
| `zum-tee` | Zum Tee | До чаю |

**Betroffene Dateien:**
- `app/[locale]/page.tsx` — Logik: Karten-Screen vs. Produkt-Grid
- `components/subcategory-tabs.tsx` — entweder erweitern oder neue Komponente `torten-category-cards.tsx`
- `lib/subcategory-config.ts` — Kategorie-Bilder ergänzen

**Offene Frage:** Welche Bilder sollen auf den 4 Kategorie-Karten erscheinen? (Aus Supabase Storage oder statisch)

---

## M1-06: Torten-Katalog — nur Bilder auf den Design-Karten, kein Text

**Typ:** 🔨 Feature | **Priorität:** Hoch

**Beschreibung:**  
Im Torten-Katalog (nachdem eine Kategorie ausgewählt wurde) sollen die Design-Karten **nur das Bild zeigen** — kein Name, keine Beschreibung, kein Kategorie-Label. Reines Bild-Grid.

**Aktueller Stand:**  
`components/product-card.tsx` zeigt: Bild → Kategorie-Label → Name → Beschreibung → Buttons.

**Neues Verhalten für Torten-Designs:**
- Nur das Bild, quadratisch oder leicht hochformatig
- Beim Hover / Tap: optionaler sanfter Overlay mit Namen (optional, zu entscheiden)
- Favoriten-Button bleibt (Herz oben rechts)
- Klick führt zur Detailseite

**Vorschlag:** Neue schlanke Karte `TortenDesignCard` statt `ProductCard` für diesen Context, damit `ProductCard` für andere Kategorien unverändert bleibt.

**Betroffene Dateien:**
- `app/[locale]/page.tsx` — `TortenDesignCard` statt `ProductCard` für `activeCategory === 'torten'`
- Neue Datei: `components/torten-design-card.tsx`

---

## M1-07: Nicht-Torten Detailseite vereinfachen

**Typ:** 🔨 Feature | **Priorität:** Mittel

**Problem:**  
Alle Kategorien (Torten, Desserts, Cookies, Cheesecakes, Macarons) verwenden dieselbe `ProductCard`-Komponente ohne visuelle Unterscheidung.

**Vorschlag:**

| Kartentyp | Für | Besonderheit |
|---|---|---|
| Torten-Karte | `torten_designs` | Zeigt Anzahl verfügbarer Füllungen als Badge |
| Produkt-Karte | Desserts, Cookies etc. | Kompakter, kein Füllungs-Hinweis |

**Betroffene Datei:** `components/product-card.tsx`

---

## M1-06: Nicht-Torten Detailseite vereinfachen

**Typ:** 🔨 Feature | **Priorität:** Mittel

**Problem:**  
Desserts, Cookies etc. nutzen denselben `ProductDetailWrapper` (2-Spalten-Grid, Füllungs-Abschnitte ohne Inhalt). Das Layout ist für Torten konzipiert und wirkt für einfache Produkte überladen.

**Vorschlag:**  
Eigenes schlankes Layout für Nicht-Torten:
- Bild + Name + Beschreibung + Zutaten/Allergene
- Kein Datums-/Personenzahl-Input
- Direktes „In den Warenkorb" ohne Zwischenschritte

**Betroffene Dateien:**  
- `app/[locale]/products/[slug]/page.tsx` (Fallback-Branch für `products`-Tabelle)
- Neue Komponente `components/simple-product-detail.tsx` (o.ä.)

---

## M1-07: TortenViewToggle in SubcategoryTabs integrieren

**Typ:** 🔨 Feature | **Priorität:** Niedrig

**Problem:**  
Der `TortenViewToggle` (Designs / Füllungen) ist aktuell rechts über dem Produkt-Grid positioniert (`flex justify-end`). Auf Mobile ist er klein und schwer zu finden.

**Vorschlag:**  
Toggle in die Subkategorie-Tab-Leiste integrieren oder als eigenständiges prominenteres UI-Element direkt in der Navigation darstellen.

**Betroffene Dateien:**  
- `components/torten-view-toggle.tsx`
- `app/[locale]/page.tsx` (Positionierung)

---

## M1-08: Fehlende Produktdaten für Desserts & Co.

**Typ:** 📝 Content | **Priorität:** Mittel

**Problem:**  
Viele Einträge in der `products`-Tabelle (Desserts, Cookies, Cheesecakes, Macarons) haben keine oder unvollständige:
- Bilder (`image_url` = null → zeigt Placeholder)
- Beschreibungen (`description_de` / `description_uk`)
- Zutaten und Allergene

**Aufgabe:**  
Produktdaten im Admin-Panel oder direkt per Migration ergänzen.

**Prüfen:** Welche Kategorien/Produkte bereits Daten haben → `pnpm db:studio` → Tabelle `products` filtern.
