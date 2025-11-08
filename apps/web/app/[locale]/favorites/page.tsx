import { getTranslations } from 'next-intl/server'
import { FavoritesClient } from '@/components/favorites-client'

export default async function FavoritesPage() {
  const t = await getTranslations('favorites')

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <FavoritesClient />
    </div>
  )
}

