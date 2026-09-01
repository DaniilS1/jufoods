'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LocaleNotFound() {
  const locale = useLocale()
  const t = useTranslations('notFound')

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="rounded-full bg-primary/10 p-5">
        <SearchX className="h-10 w-10 text-primary/60" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold md:text-3xl">{t('title')}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <Button asChild size="lg" className="mt-2">
        <Link href={`/${locale}/catalog`}>{t('cta')}</Link>
      </Button>
    </div>
  )
}
