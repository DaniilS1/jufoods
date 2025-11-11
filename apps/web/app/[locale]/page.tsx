import { getTranslations } from 'next-intl/server'
import { ProductCard } from '@/components/product-card'
import { createClient } from '@/lib/supabase/server'
import { SubcategoryTabs } from '@/components/subcategory-tabs'
import { hasSubcategories } from '@/lib/subcategory-config'

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string; subcategory?: string }>
}) {
  const { locale } = await params
  const { category, subcategory } = await searchParams
  const t = await getTranslations('nav')
  const tCatalog = await getTranslations('catalog')

  // Default category is 'torten' if no category is specified
  const selectedCategory = category || 'torten'

  // Valid categories
  const validCategories = ['torten', 'desserts', 'cookies', 'macarons', 'cheesecakes']
  const activeCategory = validCategories.includes(selectedCategory) ? selectedCategory : 'torten'

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

  if (activeCategory === 'torten') {
    const { data: designs, error } = await supabase
      .from('torten_designs')
      .select('id, slug, name_de, name_uk, description_de, description_uk, sub_category, image_url')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching torten designs:', error)
    }

    products =
      designs?.map((design) => ({
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
      console.error('Error fetching products:', error)
    }

    products =
      productsData?.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: locale === 'uk' ? product.name_uk : product.name_de,
        description: locale === 'uk' ? product.description_uk : product.description_de,
        imageUrl: product.image_url || '/placeholder-cake.svg',
        category: product.category,
        subCategory: product.sub_category,
      })) || []
  }

  // Get category name for empty state
  const categoryNames: Record<string, string> = {
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
        />
      )}
      <div className="container py-8">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

