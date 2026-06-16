import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import type { Locale } from '@/i18n'

interface OrderSuccessProps {
  params: { locale: Locale }
}

export default async function OrderSuccessPage({ params }: OrderSuccessProps) {
  const { locale } = params
  const t = await getTranslations('order')
  const tHome = await getTranslations('home')

  return (
    <div className="min-h-dvh flex items-start justify-center pt-16 px-4">
      <div className="max-w-lg w-full text-center">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-6" />
        <h1 className="text-2xl md:text-3xl font-bold mb-3">{t('success')}</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {locale === 'uk'
            ? 'Ми отримали ваше замовлення і незабаром зв’яжемося з вами.'
            : 'Wir haben Ihre Bestellung erhalten und werden uns bald bei Ihnen melden.'}
        </p>
        <Link
          href={`/${locale}/catalog`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors"
        >
          {tHome('toCatalog')}
        </Link>
      </div>
    </div>
  )
}

