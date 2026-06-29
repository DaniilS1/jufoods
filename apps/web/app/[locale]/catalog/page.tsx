import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { SectionCard } from '@/components/catalog/section-card'
import { CustomSectionCard } from '@/components/catalog/custom-section-card'
import { tortenSections, dessertSections } from '@/lib/catalogue-sections'
import type { Locale } from '@/i18n'

interface CatalogOverviewProps {
  params: { locale: Locale }
}

export default async function CatalogOverviewPage({ params }: CatalogOverviewProps) {
  const { locale } = params
  const [t, supabase] = await Promise.all([getTranslations('catalog'), createClient()])

  const [{ data: tortenDesigns }, { data: dessertProducts }, { data: categoryImages }] =
    await Promise.all([
      supabase
        .from('torten_designs')
        .select('sub_category, classic')
        .eq('category', 'torten'),
      supabase
        .from('products')
        .select('category')
        .in('category', ['desserts', 'cheesecakes', 'macarons', 'cookies']),
      supabase.from('category_images').select('section_id, image_url'),
    ])

  const imageMap: Record<string, string> = {}
  for (const row of categoryImages ?? []) {
    imageMap[row.section_id] = row.image_url
  }

  // Build torten count map
  const tortenCountMap: Record<string, number> = {}
  let klassischeCount = 0
  for (const d of tortenDesigns ?? []) {
    if (d.classic) {
      klassischeCount++
    } else if (d.sub_category) {
      tortenCountMap[d.sub_category] = (tortenCountMap[d.sub_category] ?? 0) + 1
    }
  }

  // Build dessert count map
  const dessertCountMap: Record<string, number> = {}
  for (const p of dessertProducts ?? []) {
    if (p.category) {
      dessertCountMap[p.category] = (dessertCountMap[p.category] ?? 0) + 1
    }
  }

  function getTortenCount(section: (typeof tortenSections)[number]): number | undefined {
    if (section.classic) return klassischeCount || undefined
    if (section.dbSubCategory) return tortenCountMap[section.dbSubCategory] || undefined
    return undefined
  }

  function getDessertCount(section: (typeof dessertSections)[number]): number | undefined {
    return dessertCountMap[section.dbCategory] || undefined
  }

  return (
    <main className="container py-8 md:py-12">
      <div className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1.5 text-sm md:text-base">{t('subtitle')}</p>
      </div>

      {/* Torten group */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground whitespace-nowrap">
            {t('sectionGroupTorten')}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Custom design card — always first */}
          <CustomSectionCard locale={locale} />
          {tortenSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              label={t(`sections.${section.id}` as Parameters<typeof t>[0])}
              locale={locale}
              desc={locale === 'uk' ? section.descUk : section.descDe}
              count={getTortenCount(section)}
              variant="torten"
              imageUrl={imageMap[section.id]}
            />
          ))}
        </div>
      </section>

      {/* Desserts group */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground whitespace-nowrap">
            {t('sectionGroupDesserts')}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
          {dessertSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              label={t(`sections.${section.id}` as Parameters<typeof t>[0])}
              locale={locale}
              desc={locale === 'uk' ? section.descUk : section.descDe}
              count={getDessertCount(section)}
              variant="dessert"
              imageUrl={imageMap[section.id]}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
