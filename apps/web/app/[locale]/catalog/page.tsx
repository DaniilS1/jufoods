import { getTranslations } from 'next-intl/server'
import { SectionCard } from '@/components/catalog/section-card'
import { tortenSections, dessertSections } from '@/lib/catalogue-sections'
import type { Locale } from '@/i18n'

interface CatalogOverviewProps {
  params: { locale: Locale }
}

export default async function CatalogOverviewPage({ params }: CatalogOverviewProps) {
  const { locale } = params
  const t = await getTranslations('catalog')

  return (
    <main className="container py-8 md:py-12">
      <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">{t('title')}</h1>

      {/* Torten group */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          {t('sectionGroupTorten')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {tortenSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              label={t(`sections.${section.id}` as Parameters<typeof t>[0])}
              locale={locale}
            />
          ))}
        </div>
      </section>

      {/* Desserts group */}
      <section>
        <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          {t('sectionGroupDesserts')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {dessertSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              label={t(`sections.${section.id}` as Parameters<typeof t>[0])}
              locale={locale}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
