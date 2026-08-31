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

  const { data: categoryImages } = await supabase
    .from('category_images')
    .select('section_id, image_url')

  const imageMap: Record<string, string> = {}
  for (const row of categoryImages ?? []) {
    imageMap[row.section_id] = row.image_url
  }

  return (
    <main className="container py-8 md:py-12">
      <div className="mb-8 md:mb-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold">{t('sectionGroupTorten')}</h1>
        <p className="text-muted-foreground mt-1.5 text-sm md:text-base">{t('tortenPageSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Custom design card — always first */}
        <CustomSectionCard locale={locale} />
        {tortenSections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            label={t(`sections.${section.id}` as Parameters<typeof t>[0])}
            locale={locale}
            desc={locale === 'uk' ? section.descUk : section.descDe}
            imageUrl={imageMap[section.id]}
          />
        ))}
      </div>
    </main>
  )
}
