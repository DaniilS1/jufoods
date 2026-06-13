# State Management

Client-seitiger State wird mit **Zustand** verwaltet. Drei Stores, alle in `apps/web/stores/`.

---

## Cart Store — `stores/cart-store.ts`

Verwaltet den Warenkorb. Persistiert im `localStorage` (Key: `jufoods-cart`).

### State Shape

```typescript
interface CartItem {
  productId: string
  productSlug: string
  productName: string
  productImageUrl?: string
  designId: string
  designName: string
  designImageUrl?: string
  quantity: number
  personCount?: number
  deliveryDate?: string
  remarks?: string
}

interface CartStore {
  items: CartItem[]
}
```

### Actions

| Action | Beschreibung |
|---|---|
| `addItem(item)` | Produkt hinzufügen (erhöht Menge wenn schon vorhanden) |
| `removeItem(productId, designId)` | Position entfernen |
| `updateQuantity(productId, designId, quantity)` | Menge ändern |
| `clearCart()` | Warenkorb leeren |
| `getTotalItems()` | Gesamtanzahl aller Items |

### Deduplizierung

Items werden per `(productId + designId)` identifiziert. `addItem` erhöht die Menge, falls die Kombination bereits im Warenkorb ist.

### Verwendung

```typescript
import { useCartStore } from '@/stores/cart-store'

const { items, addItem, removeItem, clearCart } = useCartStore()
```

---

## Favorites Store — `stores/favorites-store.ts`

Verwaltete Produkt-Favoriten. Persistiert im `localStorage` (Key: `jufoods-favorites`).

> **Kein Server-State** — Favoriten sind nur lokal gespeichert, auch für eingeloggte Nutzer.

### State Shape

```typescript
interface FavoritesStore {
  favoriteIds: string[]  // Produkt-IDs
}
```

### Actions

| Action | Beschreibung |
|---|---|
| `toggleFavorite(productId)` | Favorit hinzufügen oder entfernen |
| `isFavorite(productId)` | Gibt `true` zurück, wenn favorisiert |
| `clearFavorites()` | Alle Favoriten löschen |

### Verwendung

```typescript
import { useFavoritesStore } from '@/stores/favorites-store'

const { isFavorite, toggleFavorite } = useFavoritesStore()
```

---

## UI Store — `stores/ui-store.ts`

UI-State (Overlays, Drawers). **Nicht persistiert** — wird bei Seitenreload zurückgesetzt.

### State Shape

```typescript
interface UIStore {
  isCartOpen: boolean
  isMobileMenuOpen: boolean
  isNavDrawerOpen: boolean
}
```

### Actions

| Action | Beschreibung |
|---|---|
| `openCart()` / `closeCart()` / `toggleCart()` | Warenkorb-Sidebar steuern |
| `openMobileMenu()` / `closeMobileMenu()` / `toggleMobileMenu()` | Mobile-Menü steuern |
| `openNavDrawer()` / `closeNavDrawer()` / `toggleNavDrawer()` | Nav-Drawer steuern |

### Verwendung

```typescript
import { useUIStore } from '@/stores/ui-store'

const { isCartOpen, openCart, closeCart } = useUIStore()
```

---

## Persistenz-Details

Zustand verwendet `persist` Middleware mit `createJSONStorage(() => localStorage)`:

```typescript
// Automatisch — kein manueller localStorage-Zugriff nötig
persist(storeCreator, {
  name: 'jufoods-cart',        // localStorage-Key
  storage: createJSONStorage(() => localStorage),
})
```

> **Hydration-Warnung:** Bei SSR kann es kurz zu State-Diskrepanzen kommen. Zustand-Stores erst nach Mount lesen.
