import { getTranslations } from 'next-intl/server'

export default async function AboutPage() {
  const t = await getTranslations('about')

  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-3xl px-0 md:px-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">{t('title')}</h1>
        <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed">
          <p>{t('content')}</p>
        </div>
      </div>
    </div>
  )
}

