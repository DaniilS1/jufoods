import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  /** Stable identity for this line: product + design + delivery date + person count. */
  lineKey: string
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
  /** Custom torte: URLs of customer-uploaded design images (Supabase Storage) */
  customImageUrls?: string[]
  /** Custom torte: free-text description of the desired design */
  customDesignNote?: string
}

export interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity' | 'lineKey'>) => void
  removeItem: (lineKey: string) => void
  updateQuantity: (lineKey: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
}

/**
 * Two cart lines are "the same" only if product, design, delivery date, AND
 * person count all match — otherwise a second add with a different date/count
 * silently overwrote the first line's requirements. Custom torte items keep
 * their always-unique productId (`custom-${Date.now()}`), so they never merge.
 */
function computeLineKey(item: Pick<CartItem, 'productId' | 'designId' | 'deliveryDate' | 'personCount'>): string {
  return [item.productId, item.designId, item.deliveryDate ?? '', item.personCount ?? ''].join('::')
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const lineKey = computeLineKey(item)
        const existingItem = get().items.find((i) => i.lineKey === lineKey)
        if (existingItem) {
          set({
            items: get().items.map((i) =>
              i.lineKey === lineKey ? { ...i, quantity: i.quantity + 1 } : i
            ),
          })
        } else {
          set({ items: [...get().items, { ...item, lineKey, quantity: 1 }] })
        }
      },
      removeItem: (lineKey) => {
        set({
          items: get().items.filter((i) => i.lineKey !== lineKey),
        })
      },
      updateQuantity: (lineKey, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineKey)
          return
        }
        set({
          items: get().items.map((i) => (i.lineKey === lineKey ? { ...i, quantity } : i)),
        })
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
    }),
    {
      name: 'jufoods-cart',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState) => {
        // v1 items had no lineKey; recompute it once so old carts don't crash.
        const state = persistedState as { items?: CartItem[] } | undefined
        if (state?.items) {
          state.items = state.items.map((i) => ({ ...i, lineKey: i.lineKey ?? computeLineKey(i) }))
        }
        return state as CartStore
      },
    }
  )
)
