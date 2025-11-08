import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ProductDetailWrapper } from '@/components/product-detail-wrapper'
import { ProductCard } from '@/components/product-card'
import { createClient } from '@/lib/supabase/server'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const t = await getTranslations('product')
  const tNav = await getTranslations('nav')

  // Fetch product from Supabase
  const supabase = await createClient()
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !product) {
    notFound()
  }

  // Only fetch designs for torten (cakes), other categories don't have designs
  let availableDesigns: { id: string; name_uk: string; name_de: string; image: string }[] = []
  
  if (product.category === 'torten') {
    const { data: allDesigns, error: designsError } = await supabase
      .from('designs')
      .select('id, name_uk, name_de, image_url')
      .order('name_de')

    // Transform the designs data to match the expected format
    availableDesigns = (allDesigns || []).map((design) => ({
      id: design.id,
      name_uk: design.name_uk,
      name_de: design.name_de,
      image: design.image_url || '/placeholder-cake.svg',
    }))
  }

  const name = locale === 'uk' ? product.name_uk : product.name_de
  const description = locale === 'uk' ? product.description_uk : product.description_de
  const ingredients = locale === 'uk' ? (product.ingredients_uk || []) : (product.ingredients_de || [])
  const allergens = locale === 'uk' ? (product.allergens_uk || []) : (product.allergens_de || [])
  const categoryName = locale === 'uk' 
    ? (product.category === 'torten' ? 'Торти' : 'Десерти')
    : (product.category === 'torten' ? tNav('cakes') : tNav('desserts'))

  // Fetch similar products (4 random products from the same category, excluding current product)
  const { data: similarProductsData } = await supabase
    .from('products')
    .select('*')
    .eq('category', product.category)
    .neq('id', product.id)

  // Shuffle and take first 4 products
  const shuffledSimilar = (similarProductsData || []).sort(() => Math.random() - 0.5).slice(0, 4)
  
  const similarProducts = shuffledSimilar.map((similarProduct) => ({
    id: similarProduct.id,
    slug: similarProduct.slug,
    name: locale === 'uk' ? similarProduct.name_uk : similarProduct.name_de,
    description: locale === 'uk' ? similarProduct.description_uk : similarProduct.description_de,
    imageUrl: similarProduct.image_url || '/placeholder-cake.svg',
    category: similarProduct.category,
  }))

  return (
    <div className="container py-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          {tNav('catalog')}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/?category=${product.category}`} className="hover:text-primary transition-colors">
          {categoryName}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{name}</span>
      </nav>

      <ProductDetailWrapper
        product={{
          id: product.id,
          slug: product.slug,
          name,
          description: description || '',
          imageUrl: product.image_url,
          availableDesigns,
          category: product.category,
        }}
        locale={locale}
      >
        {/* Ingredients & Allergens */}
        <div className="space-y-3 pt-4 border-0">
          {ingredients.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-1.5">{t('ingredients')}</h3>
              <p className="text-md text-muted-foreground">{ingredients.join(', ')}</p>
            </div>
          )}

          {allergens.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-1.5">{t('allergens')}</h3>
              <p className="text-sm text-muted-foreground">{allergens.join(', ')}</p>
            </div>
          )}
        </div>
      </ProductDetailWrapper>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6">{t('similarProducts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similarProducts.map((similarProduct) => (
              <ProductCard
                key={similarProduct.id}
                id={similarProduct.id}
                slug={similarProduct.slug}
                name={similarProduct.name}
                description={similarProduct.description || ''}
                imageUrl={similarProduct.imageUrl}
                category={similarProduct.category}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

