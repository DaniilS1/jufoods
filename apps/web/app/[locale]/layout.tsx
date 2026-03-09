import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/components/app-shell'
import { locales, type Locale } from '@/i18n'

interface LocaleLayoutProps {
  children: ReactNode
  params: {
    locale: Locale
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = params

  if (!locales.includes(locale)) {
    notFound()
  }

  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider>
        <AppShell>{children}</AppShell>
        <Toaster />
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}


