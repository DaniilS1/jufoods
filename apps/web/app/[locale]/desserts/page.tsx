import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { SectionCard } from '@/components/catalog/section-card'
import { dessertSections } from '@/lib/catalogue-sections'
import type { Locale } from '@/i18n'

interface DessertsPageProps {
  params: { locale: Locale }
}

export default async function DessertsPage({ params }: DessertsPageProps) {
  const { locale } = params
  const [t, supabase] = await Promise.all([getTranslations('catalog'), createClient()])

  const { data: dessertProducts } = await supabase
    .from('products')
    .select('category')
    .in('category', ['desserts', 'cheesecakes', 'macarons', 'cookies'])

  const dessertCountMap: Record<string, number> = {}
  for (const p of dessertProducts ?? []) {
    if (p.category) {
      dessertCountMap[p.category] = (dessertCountMap[p.category] ?? 0) + 1
    }
  }

  function getDessertCount(section: (typeof dessertSections)[number]): number | undefined {
    return dessertCountMap[section.dbCategory] || undefined
  }

  return (
    <main className="container py-8 md:py-12">
      <div className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">{t('sectionGroupDesserts')}</h1>
        <p className="text-muted-foreground mt-1.5 text-sm md:text-base">{t('dessertsPageSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
        {dessertSections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            label={t(`sections.${section.id}` as Parameters<typeof t>[0])}
            locale={locale}
            desc={locale === 'uk' ? section.descUk : section.descDe}
            count={getDessertCount(section)}
            variant="dessert"
          />
        ))}
      </div>
    </main>
  )
}
