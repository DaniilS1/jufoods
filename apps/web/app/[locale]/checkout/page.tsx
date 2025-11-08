import { getTranslations } from 'next-intl/server'
import { CheckoutClient } from '@/components/checkout-client'

export default async function CheckoutPage() {
  const t = await getTranslations('order')

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
      <CheckoutClient />
    </div>
  )
}

