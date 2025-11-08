import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface FavoritesStore {
  favoriteIds: string[]
  toggleFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean
  clearFavorites: () => void
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      toggleFavorite: (productId: string) => {
        const favorites = get().favoriteIds
        if (favorites.includes(productId)) {
          set({ favoriteIds: favorites.filter((id) => id !== productId) })
        } else {
          set({ favoriteIds: [...favorites, productId] })
        }
      },
      isFavorite: (productId: string) => {
        return get().favoriteIds.includes(productId)
      },
      clearFavorites: () => set({ favoriteIds: [] }),
    }),
    {
      name: 'jufoods-favorites',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
