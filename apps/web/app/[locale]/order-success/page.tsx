import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export default async function OrderSuccessPage() {
  const t = await getTranslations('order')

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4 sm:text-3xl md:text-4xl">{t('success')}</h1>
        <p className="text-muted-foreground mb-8">
          Wir haben Ihre Bestellung erhalten und werden uns bald bei Ihnen melden.
        </p>
        <Button asChild>
          <Link href="/">Zurück zum Katalog</Link>
        </Button>
      </div>
    </div>
  )
}

