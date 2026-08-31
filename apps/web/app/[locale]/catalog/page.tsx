import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { SectionCard } from '@/components/catalog/section-card'
import { CustomSectionCard } from '@/components/catalog/custom-section-card'
import { catalogueSections, tortenSections, dessertSections } from '@/lib/catalogue-sections'
import type { Locale } from '@/i18n'

interface CatalogOverviewProps {
  params: { locale: Locale }
}

export default async function CatalogOverviewPage({ params }: CatalogOverviewProps) {
  const { locale } = params
  const [t, supabase] = await Promise.all([getTranslations('catalog'), createClient()])

  const { data: categoryImages } = await supabase
    .from('category_images')
    .select('section_id, image_url')

  const imageMap: Record<string, string> = {}
  for (const row of categoryImages ?? []) {
    imageMap[row.section_id] = row.image_url
  }

  const countEntries = await Promise.all(
    catalogueSections.map(async (section) => {
      const query =
        section.group === 'torten'
          ? section.classic
            ? supabase.from('torten_designs').select('id', { count: 'exact', head: true }).eq('classic', true)
            : supabase
                .from('torten_designs')
                .select('id', { count: 'exact', head: true })
                .eq('sub_category', section.dbSubCategory as string)
          : supabase.from('products').select('id', { count: 'exact', head: true }).eq('category', section.dbCategory)

      const { count } = await query
      return [section.id, count ?? 0] as const
    })
  )
  const countMap = Object.fromEntries(countEntries)

  return (
    <main className="container py-8 md:py-12">
      {/* Breadcrumb — desktop only */}
      <nav className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
        <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>›</span>
        <span className="text-foreground font-medium">{t('title')}</span>
      </nav>

      <div className="mb-8 md:mb-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold">{t('title')}</h1>
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
              count={countMap[section.id]}
              countLabel={t('sectionCount', { count: countMap[section.id] })}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {dessertSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              label={t(`sections.${section.id}` as Parameters<typeof t>[0])}
              locale={locale}
              desc={locale === 'uk' ? section.descUk : section.descDe}
              imageUrl={imageMap[section.id]}
              count={countMap[section.id]}
              countLabel={t('sectionCount', { count: countMap[section.id] })}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
