import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { ProductCard } from '@/components/product-card'
import { createClient } from '@/lib/supabase/server'
import { SubcategoryTabs } from '@/components/subcategory-tabs'
import { TortenViewToggle } from '@/components/torten-view-toggle'
import { hasSubcategories } from '@/lib/subcategory-config'
import type { Locale } from '@/i18n'

const CATEGORY_KEYS = ['torten', 'desserts', 'cookies', 'macarons', 'cheesecakes'] as const

const searchParamsSchema = z.object({
  category: z.enum(CATEGORY_KEYS).optional(),
  subcategory: z
    .string()
    .trim()
    .min(1)
    .optional(),
  view: z.enum(['designs', 'flavours']).optional(),
})

interface CatalogPageProps {
  params: { locale: Locale }
  searchParams?: Record<string, string | string[] | undefined>
}

function resolveSearchParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function CatalogPage({ params, searchParams }: CatalogPageProps) {
  const locale = params.locale
  const parsedSearchParams = searchParamsSchema.safeParse({
    category: resolveSearchParam(searchParams?.category),
    subcategory: resolveSearchParam(searchParams?.subcategory),
    view: resolveSearchParam(searchParams?.view),
  })

  const resolvedCategory =
    parsedSearchParams.success && parsedSearchParams.data.category ? parsedSearchParams.data.category : 'torten'
  const activeCategory: (typeof CATEGORY_KEYS)[number] = resolvedCategory
  const subcategory =
    parsedSearchParams.success && parsedSearchParams.data.subcategory
      ? parsedSearchParams.data.subcategory
      : undefined
  const tortenView: 'designs' | 'flavours' =
    activeCategory === 'torten' && parsedSearchParams.success && parsedSearchParams.data.view === 'flavours'
      ? 'flavours'
      : 'designs'

  const t = await getTranslations('nav')
  const tCatalog = await getTranslations('catalog')

  // Fetch products from Supabase
  const supabase = await createClient()
  let products:
    | Array<{
      id: string
      slug: string
      name: string
      description: string
      imageUrl: string
      category: string
      subCategory?: string | null
      defaultFlavourName?: string | null
    }>
    | [] = []

  try {
    if (activeCategory === 'torten') {
      if (tortenView === 'flavours') {
        const { data: flavours, error } = await supabase
          .from('torten_flavours')
          .select('id, slug, name_de, name_uk, description_de, description_uk, image_url')
          .order('flavour_number', { ascending: true })

        if (error) {
          console.warn('Error fetching torten flavours:', error.message)
        } else if (flavours) {
          products = flavours.map((flavour) => ({
            id: flavour.id,
            slug: flavour.slug,
            name: locale === 'uk' ? flavour.name_uk : flavour.name_de,
            description: (locale === 'uk' ? flavour.description_uk : flavour.description_de) || '',
            imageUrl: flavour.image_url || '/placeholder-cake.svg',
            category: 'torten',
          }))
        }
      } else {
        const { data: designs, error } = await supabase
          .from('torten_designs')
          .select('id, slug, name_de, name_uk, description_de, description_uk, sub_category, image_url')
          .order('created_at', { ascending: false })

        if (error) {
          console.warn('Error fetching torten designs:', error.message)
        } else if (designs) {
          products =
            designs.map((design) => ({
              id: design.id,
              slug: design.slug,
              name: locale === 'uk' ? design.name_uk : design.name_de,
              description: (locale === 'uk' ? design.description_uk : design.description_de) || '',
              imageUrl: design.image_url || '/placeholder-cake.svg',
              category: 'torten',
              subCategory: design.sub_category,
            })) || []

          if (subcategory) {
            products = products.filter((product) => product.subCategory === subcategory)
          }
        }
      }
    } else {
      let productsQuery = supabase
        .from('products')
        .select('*')
        .eq('category', activeCategory)

      if (subcategory) {
        productsQuery = productsQuery.eq('sub_category', subcategory)
      }

      const { data: productsData, error } = await productsQuery.order('created_at', { ascending: false })

      if (error) {
        console.warn('Error fetching products:', error.message)
      } else if (productsData) {
        products = productsData.map((product) => ({
          id: product.id,
          slug: product.slug,
          name: locale === 'uk' ? product.name_uk : product.name_de,
          description: locale === 'uk' ? product.description_uk : product.description_de,
          imageUrl: product.image_url || '/placeholder-cake.svg',
          category: product.category,
          subCategory: product.sub_category,
        }))
      }
    }
  } catch (error) {
    console.warn('Failed to fetch products from Supabase:', error instanceof Error ? error.message : 'Unknown error')
    // Continue with empty products array - app will show "no products" message
  }

  // Get category name for empty state
  const categoryNames: Record<(typeof CATEGORY_KEYS)[number], string> = {
    torten: t('cakes'),
    desserts: t('desserts'),
    cookies: t('cookies'),
    macarons: t('macarons'),
    cheesecakes: t('cheesecakes'),
  }

  const showSubcategoryTabs = hasSubcategories(activeCategory)

  return (
    <>
      {showSubcategoryTabs && (
        <SubcategoryTabs
          category={activeCategory}
          currentSubcategory={subcategory || null}
          locale={locale}
          currentView={tortenView}
        />
      )}
      <div className="container py-4">
        {activeCategory === 'torten' && (
          <div className="mb-6 flex justify-end items-start text-left">
            <TortenViewToggle currentView={tortenView} />
          </div>
        )}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">{tCatalog('noProducts', { category: categoryNames[activeCategory] })}</p>
          </div>
        )}
      </div>
    </>
  )
}

