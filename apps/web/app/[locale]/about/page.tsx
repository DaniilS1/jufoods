import { getTranslations } from 'next-intl/server'

export default async function AboutPage() {
  const t = await getTranslations('about')

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold mb-8 sm:text-3xl md:text-4xl">{t('title')}</h1>
        <div className="prose prose-lg max-w-none">
          <p>{t('content')}</p>
        </div>
      </div>
    </div>
  )
}

