import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
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
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string, designId: string) => void
  updateQuantity: (productId: string, designId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existingItem = get().items.find(
          (i) => i.productId === item.productId && i.designId === item.designId
        )
        if (existingItem) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId && i.designId === item.designId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          })
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] })
        }
      },
      removeItem: (productId, designId) => {
        set({
          items: get().items.filter(
            (i) => !(i.productId === productId && i.designId === designId)
          ),
        })
      },
      updateQuantity: (productId, designId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, designId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.designId === designId
              ? { ...i, quantity }
              : i
          ),
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
    }
  )
)

