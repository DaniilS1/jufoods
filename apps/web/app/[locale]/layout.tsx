import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n'

const Header = dynamic(
  () => import('@/components/header').then((mod) => ({ default: mod.Header })),
  {
    ssr: false,
    loading: () => null,
  }
)

const ShoppingCart = dynamic(
  () => import('@/components/shopping-cart').then((mod) => ({ default: mod.ShoppingCart })),
  {
    ssr: false,
    loading: () => null,
  }
)

const NavigationDrawer = dynamic(
  () => import('@/components/navigation-drawer').then((mod) => ({ default: mod.NavigationDrawer })),
  {
    ssr: false,
    loading: () => null,
  }
)

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

interface LocaleLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = params
  if (!locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex min-h-screen flex-col bg-pattern-soft">
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Suspense fallback={null}>
          <ShoppingCart />
        </Suspense>
        <Suspense fallback={null}>
          <NavigationDrawer />
        </Suspense>
      </div>
    </NextIntlClientProvider>
  )
}

