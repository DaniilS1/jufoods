'use client'

import { useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { NavigationDrawer } from '@/components/navigation-drawer'
import { ShoppingCart } from '@/components/shopping-cart'

interface AppShellProps {
  children: React.ReactNode
}

/**
 * App shell - single client boundary for layout chrome.
 * Best practice: Header, Footer, NavigationDrawer, ShoppingCart share the same
 * React tree so Zustand store and event handlers work correctly.
 */
export function AppShell({ children }: AppShellProps) {
  const locale = useLocale()
  const t = useTranslations('common')

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div
        role="status"
        className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
      >
        {t('devBanner')}
      </div>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ShoppingCart />
      <NavigationDrawer />
    </div>
  )
}
