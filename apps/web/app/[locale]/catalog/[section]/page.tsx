import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { CatalogSidebar } from '@/components/catalog/catalog-sidebar'
import { TortenViewToggle } from '@/components/torten-view-toggle'
import { createClient } from '@/lib/supabase/server'
import { getSectionById } from '@/lib/catalogue-sections'
import type { Locale } from '@/i18n'
import { z } from 'zod'

interface SectionPageProps {
  params: { locale: Locale; section: string }
  searchParams?: Record<string, string | string[] | undefined>
}

type ProductItem = {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string
  category: string
  subCategory?: string | null
}

function getViewParam(val?: string | string[]): 'designs' | 'flavours' {
  const v = Array.isArray(val) ? val[0] : val
  return v === 'flavours' ? 'flavours' : 'designs'
}

export default async function CatalogSectionPage({ params, searchParams }: SectionPageProps) {
  const { locale, section: sectionId } = params
  const catalogSection = getSectionById(sectionId)
  if (!catalogSection) notFound()

  const t = await getTranslations('catalog')
  const tortenView = catalogSection.group === 'torten' ? getViewParam(searchParams?.view) : 'designs'

  const supabase = await createClient()
  let products: ProductItem[] = []

  try {
    if (catalogSection.group === 'torten') {
      if (tortenView === 'flavours') {
        const { data } = await supabase
          .from('torten_flavours')
          .select('id, slug, name_de, name_uk, description_de, description_uk, image_url')
          .order('flavour_number', { ascending: true })
        products = (data ?? []).map((f) => ({
          id: f.id,
          slug: f.slug,
          name: locale === 'uk' ? f.name_uk : f.name_de,
          description: (locale === 'uk' ? f.description_uk : f.description_de) ?? '',
          imageUrl: f.image_url ?? '/placeholder-cake.svg',
          category: 'torten',
        }))
      } else {
        let q = supabase
          .from('torten_designs')
          .select('id, slug, name_de, name_uk, description_de, description_uk, sub_category, classic, image_url')
          .order('created_at', { ascending: false })

        if (catalogSection.classic) {
          q = q.eq('classic', true)
        } else if (catalogSection.dbSubCategory) {
          q = q.eq('sub_category', catalogSection.dbSubCategory)
        }

        const { data } = await q
        products = (data ?? []).map((d) => ({
          id: d.id,
          slug: d.slug,
          name: locale === 'uk' ? d.name_uk : d.name_de,
          description: (locale === 'uk' ? d.description_uk : d.description_de) ?? '',
          imageUrl: d.image_url ?? '/placeholder-cake.svg',
          category: 'torten',
          subCategory: d.sub_category,
        }))
      }
    } else {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category', catalogSection.dbCategory)
        .order('created_at', { ascending: false })
      products = (data ?? []).map((p) => ({
        id: p.id,
        slug: p.slug,
        name: locale === 'uk' ? p.name_uk : p.name_de,
        description: (locale === 'uk' ? p.description_uk : p.description_de) ?? '',
        imageUrl: p.image_url ?? '/placeholder-cake.svg',
        category: p.category,
        subCategory: p.sub_category,
      }))
    }
  } catch {
    // show empty state
  }

  const sectionLabel = t(`sections.${catalogSection.id}` as Parameters<typeof t>[0])

  return (
    <div className="container py-6 md:py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <CatalogSidebar locale={locale} activeSectionId={sectionId} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <Link
              href={`/${locale}/catalog`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('backToCatalog')}
            </Link>
          </div>

          {/* Title row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="font-display text-2xl md:text-3xl font-bold">{sectionLabel}</h1>
            {catalogSection.group === 'torten' && (
              <TortenViewToggle currentView={tortenView} />
            )}
          </div>

          {/* Mobile section pills */}
          <div className="lg:hidden overflow-x-auto mb-6 -mx-4 px-4">
            <div className="flex gap-2 min-w-max pb-1">
              {/* shown inline in sidebar on desktop, as pills on mobile */}
            </div>
          </div>

          {/* Product grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">{t('noProducts', { category: sectionLabel })}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
