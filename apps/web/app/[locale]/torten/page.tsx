import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { SectionCard } from '@/components/catalog/section-card'
import { CustomSectionCard } from '@/components/catalog/custom-section-card'
import { tortenSections } from '@/lib/catalogue-sections'
import type { Locale } from '@/i18n'

interface TortenPageProps {
  params: { locale: Locale }
}

export default async function TortenPage({ params }: TortenPageProps) {
  const { locale } = params
  const [t, supabase] = await Promise.all([getTranslations('catalog'), createClient()])

  const { data: tortenDesigns } = await supabase
    .from('torten_designs')
    .select('sub_category, classic')
    .eq('category', 'torten')

  const tortenCountMap: Record<string, number> = {}
  let klassischeCount = 0
  for (const d of tortenDesigns ?? []) {
    if (d.classic) {
      klassischeCount++
    } else if (d.sub_category) {
      tortenCountMap[d.sub_category] = (tortenCountMap[d.sub_category] ?? 0) + 1
    }
  }

  function getTortenCount(section: (typeof tortenSections)[number]): number | undefined {
    if (section.classic) return klassischeCount || undefined
    if (section.dbSubCategory) return tortenCountMap[section.dbSubCategory] || undefined
    return undefined
  }

  return (
    <main className="container py-8 md:py-12">
      <div className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">{t('sectionGroupTorten')}</h1>
        <p className="text-muted-foreground mt-1.5 text-sm md:text-base">{t('tortenPageSubtitle')}</p>
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
          />
        ))}
      </div>
    </main>
  )
}
