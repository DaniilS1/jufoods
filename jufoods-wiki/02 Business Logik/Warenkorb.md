# Warenkorb

## Überblick

Der Warenkorb ist **vollständig client-seitig** implementiert — kein Server-State. Er verwendet Zustand mit `localStorage`-Persistenz.

- **Store:** `stores/cart-store.ts`
- **localStorage-Key:** `jufoods-cart`
- **Persistenz:** Bleibt auch nach Seitenreload erhalten

---

## Datenmodell

```typescript
interface CartItem {
  productId: string       // uuid
  productSlug: string     // für URLs
  productName: string     // Anzeigename
  productImageUrl?: string

  designId: string        // uuid des gewählten Designs
  designName: string      // Anzeigename des Designs
  designImageUrl?: string

  quantity: number        // Anzahl
  personCount?: number    // Personenanzahl (optional)
  deliveryDate?: string   // Wunschdatum (ISO)
  remarks?: string        // Sonderanfragen
}
```

**Eindeutige Identifikation:** `(productId, designId)` — gleiche Kombination erhöht die Menge.

---

## Aktionen

| Aktion | Beschreibung |
|---|---|
| `addItem(item)` | Fügt Position hinzu. Falls schon vorhanden: `quantity + 1` |
| `removeItem(productId, designId)` | Entfernt Position vollständig |
| `updateQuantity(productId, designId, qty)` | Setzt Menge auf gewünschten Wert |
| `clearCart()` | Leert den gesamten Warenkorb (nach Bestellabschluss) |
| `getTotalItems()` | Gibt Gesamtanzahl aller Items zurück (Summe der quantities) |

---

## UI-Komponenten

| Komponente | Beschreibung |
|---|---|
| `components/shopping-cart.tsx` | Warenkorb-Sidebar (slide-in) |
| `stores/ui-store.ts` | `isCartOpen` steuert die Sichtbarkeit |

Der Warenkorb öffnet sich als Slide-in-Sidebar über `useUIStore().openCart()`.

---

## Checkout-Übergabe

Beim Absenden des Checkout-Formulars:

1. `useCartStore().items` werden als `items`-Array an `POST /api/orders` gesendet
2. Nach Erfolg: `clearCart()` aufrufen
3. Redirect zu `/order-success`

→ Vollständiger Ablauf: [[Bestellprozess]]

---

## Hydration

Da Zustand SSR-Hydration nutzt, kann es kurz zu State-Diskrepanzen kommen. Warenkorb-UI erst nach Client-Mount rendern (z.B. `useEffect` oder `suppressHydrationWarning`).
