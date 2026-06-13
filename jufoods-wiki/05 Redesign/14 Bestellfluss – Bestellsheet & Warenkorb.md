# 14 Bestellfluss – Bestellsheet & Warenkorb

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Mockup-Referenz:**
> - Mobile Screen 04 — „Torte Bestellen" (Bottom-Sheet)
> - Mobile Screen 05 — „Warenkorb"
> - Desktop Screen 03 (Produktdetail) — CTA öffnet bestehenden Modal

---

## Ziel

Zwei bestehende Komponenten restylen:

1. **`TorteBestellenModal`** → das 4-Schritt-Bestellsheet aus dem Mockup (Vaul Drawer von unten, dunkler Hintergrund dahinter, weißes Sheet mit Drag-Handle).
2. **`ShoppingCart`** → die Warenkorb-Ansicht aus Screen 05 (weiße Karten pro Artikel, Status-Badge, Mengensteuerung, CTA-Zeile).

**Wichtig:** Die Datenstruktur im `cart-store.ts` bleibt unverändert. Besonderheit: `productId` hält die **Design-ID** und `designId` hält die **Flavour-ID** (historische Benennung).

---

## Aktueller Stand (Dateien)

| Datei | Funktion |
|---|---|
| `apps/web/components/torte-bestellen-modal.tsx` | 4-Schritt-Bestellmodal (Vaul/Dialog) |
| `apps/web/components/shopping-cart.tsx` | Warenkorb als Dialog/Modal |
| `apps/web/stores/cart-store.ts` | Zustand-Store (CartItem-Shape, bleibt unverändert) |
| `apps/web/stores/ui-store.ts` | `openCart()`, `closeCart()`, `isCartOpen` |
| `apps/web/components/flavour-selector.tsx` | Geschmack-Wahl (eingebettet im Modal) |
| `apps/web/components/design-selector.tsx` | Design-Wahl (Step 1 im Modal) |

---

## CartItem-Shape (zur Erinnerung, nicht ändern)

```ts
interface CartItem {
  productId:    string   // ← tatsächlich Design-ID (torten_designs.id)
  productSlug:  string
  productName:  string   // Design-Name
  images:       string[]
  designId:     string   // ← tatsächlich Flavour-ID (torten_flavours.id)
  designName:   string   // Flavour-Name
  quantity:     number
  personCount?: number
  deliveryDate?:string
  remarks?:     string
}
```

---

## 1. TorteBestellenModal — Ziel-Layout (Mobil, Screen 04)

```
┌────────────────────────────────────────┐
│  [dunkler Hintergrund #3B2A2A, 35% h] │  ← Hintergrundbild/Farbe
└────────────────────────────────────────┘
┌────────────────────────────────────────┐  ← bg-white, border-radius 20px oben
│  ─────── (Drag-Handle 40×4px)         │
│  Torte bestellen               [✕]    │
│  ┌──────────────────────────────────┐ │
│  │ [Bild 40×40]  Produktname       │ │  ← Mini-Produktkarte
│  │              Kategorie          │ │
│  └──────────────────────────────────┘ │
│                                        │
│  GESCHMACKSRICHTUNG                    │
│  [Vanille] [Erdbeere] [Schokolade] … │  ← scrollbar Flavour-List
│                                        │
│  GRÖßE / PERSONENANZAHL               │
│  [2–4][6–8][10–12][12+]               │  ← Personenanzahl-Grid (restyle)
│                                        │
│  ABHOLDATUM & -ZEIT                   │
│  [📅 Datum & Uhrzeit wählen]          │
│                                        │
│  KOMMENTAR                             │
│  [Textarea: Besondere Wünsche…]        │
│                                        │
│  ──────────────────────────────────── │
│  [In den Warenkorb]                   │  ← bg-primary, text-white
└────────────────────────────────────────┘
```

### Änderungen an `torte-bestellen-modal.tsx`

1. **Vaul-Drawer** (bereits verwendet) bleibt; Hintergrund-Overlay-Style anpassen:
   - Hinter dem Sheet: dunkler/gebrandeter Hintergrund (`bg-secondary` = `#3B2A2A`) statt System-Scrim.
2. **Drag-Handle:** `<div class="w-10 h-1 bg-border rounded mx-auto my-3">`.
3. **Header:** `Torte bestellen` (Playfair) + X-Button.
4. **Mini-Produktkarte:** zeigt ausgewähltes Design-Bild (40×40, `rounded-lg`) + Name + Kategorie.
5. **Flavour-Auswahl:** vertikale Liste statt Tag-Cloud; jeder Flavour als `<button>` mit aktivem State (`border-primary bg-primary/10`). Scrollbar bei > 6 Einträgen.
6. **Personenanzahl:** wie in [[13 Produktdetail]] beschrieben — 4 Kacheln.
7. **Datum:** `<DateTimePicker>` unverändert, nur visuell angepasst (volle Breite, border-input).
8. **CTA:** `w-full py-3.5 bg-primary text-white font-semibold rounded-xl`.
9. **4-Schritt-Fortschrittsbalken** (aktuell vorhanden) → prüfen ob auf Mobil sichtbar bleiben oder entfernen. Mockup zeigt Single-Scroll ohne Schritte → evtl. auf Desktop-Dialog behalten, auf Mobil weglassen.

---

## 2. ShoppingCart — Ziel-Layout (Mobil, Screen 05)

```
┌────────────────────────────────────────┐
│  Warenkorb                             │  ← Playfair, 22px
│  2 Artikel                             │  ← text-muted-foreground
├────────────────────────────────────────┤
│  ┌────────────────────────────────┐    │
│  │ [Bild 68×68] TORTEN            │    │
│  │              Sommergarten       │    │
│  │              M · Vanille · 15.07│   │
│  │              🕐 Preisberechnung │    │  ← Status-Badge (Phase-1: pending)
│  │                             [✕]│    │
│  └────────────────────────────────┘    │
│  ┌────────────────────────────────┐    │
│  │ [Bild 68×68] DESSERTS          │    │
│  │              Macarons Box       │    │
│  │              24,00 €   [−][1][+]│   │
│  │                             [✕]│    │
│  └────────────────────────────────┘    │
├────────────────────────────────────────┤
│  bg-[#F5E6C8] Hinweis-Banner          │  ← nur wenn Torten im Korb
│  [← Weiter einkaufen] [Bestellung →] │
└────────────────────────────────────────┘
```

### Änderungen an `shopping-cart.tsx`

1. **Layout:** Dialog/Sheet → Vaul Drawer von rechts (oder bestehendes Dialog beibehalten, nur restyled).
2. **Header:** Playfair `Warenkorb` + Artikel-Count.
3. **Artikel-Karte:**
   - Thumbnail: `68×68 rounded-lg bg-muted`.
   - Kategorie-Label: `text-[9px] uppercase tracking-widest text-primary font-bold`.
   - Name: `text-sm font-semibold`.
   - Parameter-Zeile: `text-xs text-muted-foreground`.
   - Status-Badge (wenn `torten`-Artikel): zeigt `🕐 Preisberechnung` (→ `status: pending`).
   - Preis (wenn vorhanden, z. B. bei Desserts mit Preis in Phase 2) oder kein Preis.
   - Mengen-Stepper (`−/+`) für Desserts, nicht für individuelle Torten.
   - `[✕]` Remove-Button.
4. **Footer:**
   - Hinweis-Banner (cremefarben `#F5E6C8`) wenn Torten-Artikel im Korb.
   - Buttons: `← Weiter einkaufen` (ghost) + `Bestellung senden →` (primary).
   - „Bestellung senden" navigiert zu `/[locale]/checkout`.

---

## i18n-Keys

```jsonc
"cart": {
  "title":          "Warenkorb",
  "empty":          "Dein Warenkorb ist leer",
  "items":          "{count} Artikel",
  "pendingNote":    "Tortenpreis wird nach Bestätigung mitgeteilt.",
  "continueShopping": "← Weiter einkaufen",
  "toCheckout":     "Bestellung senden →",
  "remove":         "Artikel entfernen",
  "orderSheet": {
    "title":        "Torte bestellen",
    "flavour":      "Geschmacksrichtung",
    "personCount":  "Größe / Personenanzahl",
    "pickupDate":   "Abholdatum & -zeit",
    "comment":      "Kommentar",
    "addToCart":    "In den Warenkorb",
    "productMini":  "Ausgewähltes Design"
  }
}
```

---

## Offene Punkte

- [ ] 4-Schritt-Fortschritt im Modal: auf Mobil weglassen? Oder kompakter darstellen?
- [ ] Vaul-Drawer vs. Dialog: `shopping-cart.tsx` nutzt heute `<Dialog>`. Ggf. auf `<Drawer>` (Vaul) wechseln für konsistentes Bottom-Sheet-Gefühl auf Mobil.
- [ ] Mengen-Stepper für Torten (individuell, nicht sinnvoll zu stückeln): Stepper bei Torten deaktivieren/ausblenden?
- [ ] Gesamt-Preis-Zeile: Phase 1 — nur Dessert-Subtotal wenn Preis vorhanden (aus Phase 2-Konzept entnommen). Vorerst: kein Preis.

---

## Abnahme/Verifikation

- [x] Bestellsheet öffnet per FAB (Mobil) und CTA-Button (Produktdetail)
- [x] Drag-Handle + X-Button schließen das Sheet
- [x] Mini-Produktkarte im Sheet zeigt korrektes Design
- [x] Flavour-Auswahl: Einträge aus `design_flavour` geladen; aktiver Eintrag hervorgehoben
- [x] Personenanzahl-Kacheln wählbar
- [x] DateTimePicker: Datum + Uhrzeit wählbar
- [x] „In den Warenkorb" fügt Item zu `cart-store` hinzu (inkl. `personCount`, `deliveryDate`, `remarks`)
- [x] Warenkorb-Icon-Badge aktualisiert sich
- [x] ShoppingCart zeigt Artikel mit Thumbnail + Kategorie + Name + Status-Badge
- [x] „Bestellung senden" führt zu Checkout
- [x] `pnpm lint` + `pnpm build` ohne Fehler
