'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Heart, Menu, User } from 'lucide-react'
import { Logo } from '@/components/logo'
import { useCartStore } from '@/stores/cart-store'
import type { CartStore } from '@/stores/cart-store'
import { useFavoritesStore } from '@/stores/favorites-store'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/search-bar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

export function Header() {
  const t = useTranslations('common')
  const tNav = useTranslations('nav')
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const totalItems = useCartStore((state: CartStore) => state.getTotalItems())
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
  const favoriteCount = favoriteIds.length
  const { openCart, openNavDrawer } = useUIStore()
  const supabase = createClient()

  const locale = pathname?.split('/')[1] || 'de'

  useEffect(() => {
    setMounted(true)
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register') ||
    pathname?.includes('/forgot-password') || pathname?.includes('/reset-password')
  const isAdminPage = pathname?.includes('/admin')
  const isCheckoutPage = pathname?.includes('/checkout')

  const navLinks = [
    { href: `/${locale}/catalog`, label: tNav('catalog') },
    { href: `/${locale}/about`, label: tNav('about') },
    { href: `/${locale}/contact`, label: tNav('contact') },
  ]

  const isNavActive = (href: string) => {
    if (href.endsWith('/catalog')) {
      return pathname?.includes('/catalog')
    }
    return pathname?.endsWith(href.split(`/${locale}`)[1] || '')
  }

  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={openNavDrawer}
              className="h-11 w-11 hover:bg-accent rounded-full"
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 shadow-sm pt-[env(safe-area-inset-top)]">
      <div className="container flex h-14 items-center gap-3">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={openNavDrawer}
            className="h-11 w-11 hover:bg-accent rounded-full"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Menu</span>
          </Button>
          <Logo href={`/${locale}`} size="sm" priority />
        </div>

        {/* Center: Desktop nav links */}
        {!isAdminPage && !isCheckoutPage && (
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isNavActive(link.href)
                    ? 'text-foreground bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Search + Icons */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden md:block mr-1">
            <SearchBar />
          </div>

          <Button variant="ghost" size="icon" asChild className="relative h-11 w-11 hover:bg-accent rounded-full">
            <Link href={`/${locale}/favorites`}>
              <Heart className="h-5 w-5" aria-hidden="true" />
              {mounted && favoriteCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 min-w-[18px] h-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground shadow-sm px-1">
                  {favoriteCount}
                </span>
              )}
              <span className="sr-only">{t('favorites')}</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon" onClick={openCart} className="relative h-11 w-11 hover:bg-accent rounded-full">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {mounted && totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground shadow-sm px-1">
                {totalItems}
              </span>
            )}
            <span className="sr-only">{t('cart')}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-11 w-11 hover:bg-accent rounded-full"
            aria-label={t('account')}
          >
            <Link href={userEmail ? `/${locale}/account` : `/${locale}/login`}>
              {mounted && userEmail ? (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                    {userEmail.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-5 w-5" aria-hidden="true" />
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
