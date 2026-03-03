'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
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

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ShoppingCart />
      <NavigationDrawer />
    </div>
  )
}
