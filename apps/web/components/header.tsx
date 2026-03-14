'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ShoppingCart, Heart, Menu, Cake, Cookie, Circle, CakeSlice, Donut } from 'lucide-react'
import { Logo } from '@/components/logo'
import { useCartStore } from '@/stores/cart-store'
import type { CartStore } from '@/stores/cart-store'
import { useFavoritesStore } from '@/stores/favorites-store'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/search-bar'
import { AdminTabs } from '@/components/admin-tabs'
import { Button } from '@/components/ui/button'

const categories = [
  { id: 'torten', icon: Cake, key: 'cakes' },
  { id: 'desserts', icon: Donut, key: 'desserts' },
  { id: 'cookies', icon: Cookie, key: 'cookies' },
  { id: 'macarons', icon: Circle, key: 'macarons' },
  { id: 'cheesecakes', icon: CakeSlice, key: 'cheesecakes' },
] as const

export function Header() {
  const t = useTranslations('common')
  const tNav = useTranslations('nav')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('torten')
  const totalItems = useCartStore((state: CartStore) => state.getTotalItems())
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
  const favoriteCount = favoriteIds.length
  const { openCart, openNavDrawer } = useUIStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Extract category from URL search params
    const category = searchParams?.get('category')
    const validCategories = ['torten', 'desserts', 'cookies', 'macarons', 'cheesecakes']

    if (category && validCategories.includes(category)) {
      setActiveCategory(category)
    } else {
      // Default to 'torten' if no category or invalid category
      setActiveCategory('torten')
    }
  }, [searchParams, pathname])

  const isActive = (path: string) => {
    return pathname?.includes(path)
  }

  // Check if we're on auth pages
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register')

  // Check if we're on admin pages
  const isAdminPage = pathname?.includes('/admin')

  // Check if we're on checkout page
  const isCheckoutPage = pathname?.includes('/checkout')

  // Show minimal header on auth pages with logo and menu
  if (isAuthPage) {
    const locale = pathname?.split('/')[1] || 'de'
    return (
      <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={openNavDrawer}
              className="hover:bg-primary/10 rounded-full"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Menu</span>
            </Button>
            <Logo href={`/${locale}`} size="sm" priority />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 shadow-sm pt-[env(safe-area-inset-top)]">
      {/* Top Row: Logo, Search, and Actions */}
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={openNavDrawer}
            className="hover:bg-primary/10 rounded-full"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Menu</span>
          </Button>
          <Logo href="/" size="sm" priority />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Search Bar - Right aligned */}
          <div className="hidden md:block">
            <SearchBar />
          </div>

          <Button variant="ghost" size="icon" asChild className="relative hover:bg-primary/10 rounded-full">
            <Link href="/favorites">
              <Heart className="h-5 w-5" aria-hidden="true" />
              {mounted && favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
                  {favoriteCount}
                </span>
              )}
              <span className="sr-only">{t('favorites')}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={openCart} className="relative hover:bg-primary/10 rounded-full">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {mounted && totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
                {totalItems}
              </span>
            )}
            <span className="sr-only">{t('cart')}</span>
          </Button>
        </div>
      </div>

      {/* Bottom Row: Category Tabs or Admin Tabs */}
      {isAdminPage ? (
        <AdminTabs />
      ) : isCheckoutPage ? null : (
        <div className="border-t border-primary/10 bg-transparent">
          <div className="container">
            <nav className="flex gap-1 overflow-x-auto scrollbar-hide py-1.5 -mx-4 px-4 overscroll-contain touch-manipulation sm:gap-2 sm:py-2">
              {categories.map((category) => {
                const Icon = category.icon
                const isActiveCategory = activeCategory === category.id
                const locale = pathname?.split('/')[1] || 'de'
                const href = locale ? `/${locale}?category=${category.id}` : `/?category=${category.id}`

                return (
                  <Link
                    key={category.id}
                    href={href}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-lg hover:rounded-lg text-muted-foreground text-xs font-medium transition-all whitespace-nowrap shrink-0 relative sm:gap-2 sm:px-4 sm:py-2 sm:text-sm',
                      isActiveCategory
                        ? 'bg-primary/20'
                        : 'hover:text-primary hover:bg-primary/5'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                    <span>{tNav(category.key)}</span>
                    {isActiveCategory && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

    </header>
  )
}

