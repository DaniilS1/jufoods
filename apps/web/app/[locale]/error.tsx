'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useLocale()
  const t = useTranslations('errorPage')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-5">
        <AlertTriangle className="h-10 w-10 text-destructive/70" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold md:text-3xl">{t('title')}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={reset}>
          {t('retry')}
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={`/${locale}`}>{t('home')}</Link>
        </Button>
      </div>
    </div>
  )
}
