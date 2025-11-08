import { create } from 'zustand'

interface UIStore {
  isCartOpen: boolean
  isMobileMenuOpen: boolean
  isNavDrawerOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  openMobileMenu: () => void
  closeMobileMenu: () => void
  toggleMobileMenu: () => void
  openNavDrawer: () => void
  closeNavDrawer: () => void
  toggleNavDrawer: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  isCartOpen: false,
  isMobileMenuOpen: false,
  isNavDrawerOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  openNavDrawer: () => set({ isNavDrawerOpen: true }),
  closeNavDrawer: () => set({ isNavDrawerOpen: false }),
  toggleNavDrawer: () => set((state) => ({ isNavDrawerOpen: !state.isNavDrawerOpen })),
}))

