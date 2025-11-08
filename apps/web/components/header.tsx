'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { ShoppingCart, Heart, Menu, Cake, IceCream, Cookie, Circle, Sparkles, CakeSlice, Donut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cart-store'
import type { CartStore } from '@/stores/cart-store'
import { useFavoritesStore } from '@/stores/favorites-store'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/search-bar'
import { AdminTabs } from '@/components/admin-tabs'

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
      <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={openNavDrawer}
              className="hover:bg-primary/10 rounded-full"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
            <Link href={`/${locale}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <Cake className="h-5 w-5 text-primary" />
              <span className="text-xl font-bold text-primary hidden sm:inline-block">jufoods</span>
            </Link>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 shadow-sm">
      {/* Top Row: Logo, Search, and Actions */}
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={openNavDrawer}
            className="hover:bg-primary/10 rounded-full"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity shrink-0">
            <Cake className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold text-primary hidden sm:inline-block">jufoods</span>
          </Link>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Search Bar - Right aligned */}
          <div className="hidden md:block">
            <SearchBar />
          </div>
          <Button variant="ghost" size="icon" asChild className="relative hover:bg-primary/10 rounded-full">
            <Link href="/favorites">
              <Heart className="h-5 w-5" />
              {mounted && favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
                  {favoriteCount}
                </span>
              )}
              <span className="sr-only">{t('favorites')}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={openCart} className="relative hover:bg-primary/10 rounded-full">
            <ShoppingCart className="h-5 w-5" />
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
            <nav className="flex gap-2 overflow-x-auto scrollbar-hide py-2 -mx-4 px-4">
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
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 relative',
                    isActiveCategory
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  )}
                >
                  <Icon className="h-4 w-4" />
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

