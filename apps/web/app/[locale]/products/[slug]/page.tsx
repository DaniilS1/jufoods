import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ProductDetailWrapper } from '@/components/product-detail-wrapper'
import { FlavourDetailWrapper } from '@/components/flavour-detail-wrapper'
import { ProductCard } from '@/components/product-card'
import { SubcategoryTabs } from '@/components/subcategory-tabs'
import { createClient } from '@/lib/supabase/server'
import { hasSubcategories } from '@/lib/subcategory-config'
import type { FlavorOption, NutritionFact, DesignOption } from '@/types/product'

interface TortenFlavourRecord {
  id: string
  slug: string
  name_de: string
  name_uk: string
  description_de: string | null
  description_uk: string | null
  ingredients_de: string[] | null
  ingredients_uk: string[] | null
  allergens_de: string[] | null
  allergens_uk: string[] | null
  nutrition: Record<string, unknown> | null
  image_url: string | null
}

interface DesignFlavourLink {
  flavour_id: string
  torten_flavours: TortenFlavourRecord | null
}

interface TortenDesignRecord {
  id: string
  slug: string
  name_de: string
  name_uk: string
  description_de: string | null
  description_uk: string | null
  category: string
  sub_category: string | null
  image_url: string | null
  images_urls: string[] | null
  classic: boolean
}

interface FlavourDesignLink {
  design_id: string
  torten_designs: {
    id: string
    slug: string
    name_de: string
    name_uk: string
    image_url: string | null
  } | null
}

const FALLBACK_INGREDIENTS_UK: string[] = [
  'вершковий сир',
  'вершки 30%',
  'курячі яйця',
  'пшеничне борошно',
  'цукор',
  'вершкове масло',
  'білий шоколад (молоко, соєвий лецитин)',
  'ягідне пюре',
  'темний шоколад (соєвий лецитин)',
  'рослинна олія',
  'молоко',
  'лимонний сік',
  'кукурудзяний крохмаль',
  'какао-масло',
  'мак',
  'лимонна цедра',
  'желатин',
  'розпушувач',
  'сіль',
  'ванільний цукор',
  'пектин NH',
  'натуральні ароматизатори',
  'жиророзчинний барвник',
]

const FALLBACK_INGREDIENTS_DE: string[] = [
  'Frischkäse',
  'Sahne 30%',
  'Hühnereier',
  'Weizenmehl',
  'Zucker',
  'Butter',
  'Weiße Schokolade (Milch, Sojalecithin)',
  'Beerenpüree',
  'Zartbitterschokolade (Sojalecithin)',
  'Pflanzenöl',
  'Milch',
  'Zitronensaft',
  'Maisstärke',
  'Kakaobutter',
  'Mohn',
  'Zitronenschale',
  'Gelatine',
  'Backtriebmittel',
  'Salz',
  'Vanillezucker',
  'Pektin NH',
  'Natürliche Aromen',
  'Fettlöslicher Farbstoff',
]

const FALLBACK_ALLERGENS_UK: string[] = ['молоко', 'яйця', 'пшеничне борошно', 'соєвий лецитин']
const FALLBACK_ALLERGENS_DE: string[] = ['Milch', 'Eier', 'Weizenmehl', 'Sojalecithin']

const FALLBACK_NUTRITION_FACTS: Record<'uk' | 'de', NutritionFact[]> = {
  uk: [
    { label: 'Енергетична цінність', value: '371,6 ккал (≈1555 кДж)' },
    { label: 'Білки', value: '3,6 г' },
    { label: 'Жири', value: '26,8 г' },
    { label: 'Вуглеводи', value: '28,9 г' },
  ],
  de: [
    { label: 'Energie', value: '371,6 kcal (≈1555 kJ)' },
    { label: 'Eiweiß', value: '3,6 g' },
    { label: 'Fett', value: '26,8 g' },
    { label: 'Kohlenhydrate', value: '28,9 g' },
  ],
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const t = await getTranslations('product')
  const tNav = await getTranslations('nav')
  const tCatalog = await getTranslations('catalog')

  const supabase = await createClient()

  const { data: tortenDesign, error: designError } = await supabase
    .from('torten_designs')
    .select('id, slug, name_de, name_uk, description_de, description_uk, category, sub_category, image_url, images_urls, classic')
    .eq('slug', slug)
    .maybeSingle<TortenDesignRecord>()

  const isTortenDesign = !designError && tortenDesign

  let recordId = ''
  let name: string
  let description: string
  let category: string
  let subCategory: string | null = null
  let imageUrl: string | null = null
  let designFlavours: FlavorOption[] = []
  let similarProducts: Array<{
    id: string
    slug: string
    name: string
    description: string
    imageUrl: string
    category: string
  }> = []

  if (isTortenDesign && tortenDesign) {
    recordId = tortenDesign.id
    name = locale === 'uk' ? tortenDesign.name_uk : tortenDesign.name_de
    description = (locale === 'uk' ? tortenDesign.description_uk : tortenDesign.description_de) || ''
    category = tortenDesign.category
    subCategory = tortenDesign.sub_category
    imageUrl = tortenDesign.image_url

    let flavourLinks: DesignFlavourLink[] | null = null
    if (!tortenDesign.classic) {
      const { data: links, error: flavourError } = await supabase
        .from('design_flavour')
        .select(
          `
            flavour_id,
            torten_flavours (
              id,
              slug,
              name_de,
              name_uk,
              description_de,
              description_uk,
              ingredients_de,
              ingredients_uk,
              allergens_de,
              allergens_uk,
              nutrition,
              image_url
            )
          `
        )
        .eq('design_id', tortenDesign.id)
        .order('name_de', { foreignTable: 'torten_flavours', ascending: true })

      if (flavourError) {
        console.error('Error fetching torten flavours:', flavourError)
      }
      flavourLinks = links as DesignFlavourLink[] | null
    }

    if (flavourLinks && flavourLinks.length > 0) {
      const flavours = flavourLinks.flatMap((link) => {
        const tf = link.torten_flavours
        if (!tf) return []
        return Array.isArray(tf) ? (tf as TortenFlavourRecord[]) : [tf as TortenFlavourRecord]
      })
      designFlavours = flavours.map((flavour, index) => {
        const displayName = locale === 'uk' ? flavour.name_uk : flavour.name_de
        const flavourDescription = (locale === 'uk' ? flavour.description_uk : flavour.description_de) || ''
        const ingredients =
          locale === 'uk'
            ? flavour.ingredients_uk || FALLBACK_INGREDIENTS_UK
            : flavour.ingredients_de || FALLBACK_INGREDIENTS_DE
        const allergens =
          locale === 'uk'
            ? flavour.allergens_uk || FALLBACK_ALLERGENS_UK
            : flavour.allergens_de || FALLBACK_ALLERGENS_DE
        const nutritionRaw = flavour.nutrition as Record<string, unknown> | null
        const localeKey = locale === 'uk' ? 'text_uk' : 'text_de'
        const legacyText = nutritionRaw && typeof nutritionRaw.text === 'string' ? (nutritionRaw.text as string).trim() : ''
        const localeText =
          nutritionRaw && typeof nutritionRaw[localeKey] === 'string'
            ? (nutritionRaw[localeKey] as string).trim()
            : legacyText
        const nutritionText = localeText !== '' ? localeText : undefined
        const nutritionFacts =
          nutritionText !== undefined
            ? []
            : nutritionRaw && Object.keys(nutritionRaw).length > 0
              ? Object.entries(nutritionRaw)
                  .filter(([key]) => key !== 'text' && key !== 'text_de' && key !== 'text_uk')
                  .map(([label, value]) => ({
                      label,
                      value: String(value),
                    }))
              : FALLBACK_NUTRITION_FACTS[locale as 'uk' | 'de']

        return {
          id: flavour.id,
          slug: flavour.slug,
          displayName,
          description: flavourDescription,
          imageUrl: flavour.image_url || tortenDesign.image_url || '/placeholder-cake.svg',
          ingredients,
          allergens,
          nutritionFacts,
          nutritionText,
          priceDelta: null,
          isDefault: index === 0,
        }
      })
    }

    if (designFlavours.length === 0) {
      designFlavours = [
        {
          id: 'fallback',
          slug: 'fallback',
          displayName: locale === 'uk' ? 'Класичний смак' : 'Klassischer Geschmack',
          description: '',
          imageUrl: tortenDesign.image_url || '/placeholder-cake.svg',
          ingredients: locale === 'uk' ? FALLBACK_INGREDIENTS_UK : FALLBACK_INGREDIENTS_DE,
          allergens: locale === 'uk' ? FALLBACK_ALLERGENS_UK : FALLBACK_ALLERGENS_DE,
          nutritionFacts: FALLBACK_NUTRITION_FACTS[locale as 'uk' | 'de'],
          priceDelta: null,
          isDefault: true,
        },
      ]
    }

    const { data: similarDesigns } = await supabase
      .from('torten_designs')
      .select('id, slug, name_de, name_uk, description_de, description_uk, image_url, category')
      .eq('category', 'torten')
      .neq('id', tortenDesign.id)

    similarProducts = (similarDesigns || [])
      .map((design) => ({
        id: design.id,
        slug: design.slug,
        name: locale === 'uk' ? design.name_uk : design.name_de,
        description: locale === 'uk' ? design.description_uk : design.description_de,
        imageUrl: design.image_url || '/placeholder-cake.svg',
        category: 'torten',
      }))
      .slice(0, 4)
  } else {
    // Check if slug belongs to a torten_flavour (flavour-first view)
    const { data: tortenFlavour, error: flavourLookupError } = await supabase
      .from('torten_flavours')
      .select(
        'id, slug, name_de, name_uk, description_de, description_uk, ingredients_de, ingredients_uk, allergens_de, allergens_uk, nutrition, image_url'
      )
      .eq('slug', slug)
      .maybeSingle<TortenFlavourRecord>()

    if (!flavourLookupError && tortenFlavour) {
      // Fetch linked designs for this flavour
      const { data: designLinks } = await supabase
        .from('design_flavour')
        .select(
          `
          design_id,
          torten_designs (
            id,
            slug,
            name_de,
            name_uk,
            image_url
          )
        `
        )
        .eq('flavour_id', tortenFlavour.id)
        .order('name_de', { foreignTable: 'torten_designs', ascending: true })

      const linkedDesigns: DesignOption[] = (designLinks ?? []).flatMap((link) => {
        const dl = link as unknown as FlavourDesignLink
        const d = dl.torten_designs
        if (!d) return []
        const arr = Array.isArray(d) ? (d as typeof d[]) : [d]
        return arr.map((design) => ({
          id: design.id,
          slug: design.slug,
          name: locale === 'uk' ? design.name_uk : design.name_de,
          imageUrl: design.image_url || '/placeholder-cake.svg',
        }))
      })

      const flavourIngredients =
        locale === 'uk'
          ? tortenFlavour.ingredients_uk || FALLBACK_INGREDIENTS_UK
          : tortenFlavour.ingredients_de || FALLBACK_INGREDIENTS_DE
      const flavourAllergens =
        locale === 'uk'
          ? tortenFlavour.allergens_uk || FALLBACK_ALLERGENS_UK
          : tortenFlavour.allergens_de || FALLBACK_ALLERGENS_DE

      const nutritionRaw = tortenFlavour.nutrition as Record<string, unknown> | null
      const localeKey = locale === 'uk' ? 'text_uk' : 'text_de'
      const legacyText =
        nutritionRaw && typeof nutritionRaw.text === 'string' ? (nutritionRaw.text as string).trim() : ''
      const localeText =
        nutritionRaw && typeof nutritionRaw[localeKey] === 'string'
          ? (nutritionRaw[localeKey] as string).trim()
          : legacyText
      const nutritionText = localeText !== '' ? localeText : undefined
      const nutritionFacts: NutritionFact[] =
        nutritionText !== undefined
          ? []
          : nutritionRaw && Object.keys(nutritionRaw).length > 0
            ? Object.entries(nutritionRaw)
                .filter(([key]) => key !== 'text' && key !== 'text_de' && key !== 'text_uk')
                .map(([label, value]) => ({ label, value: String(value) }))
            : FALLBACK_NUTRITION_FACTS[locale as 'uk' | 'de']

      const flavourName = locale === 'uk' ? tortenFlavour.name_uk : tortenFlavour.name_de
      const flavourDescription =
        (locale === 'uk' ? tortenFlavour.description_uk : tortenFlavour.description_de) || ''
      const flavourCategoryName = tCatalog('viewFlavours')

      return (
        <>
          <SubcategoryTabs
            category="torten"
            currentSubcategory={null}
            locale={locale}
            currentView="flavours"
          />
          <div className="container py-6">
            <FlavourDetailWrapper
              flavour={{
                id: tortenFlavour.id,
                slug: tortenFlavour.slug,
                name: flavourName,
                description: flavourDescription,
                imageUrl: tortenFlavour.image_url || '/placeholder-cake.svg',
                ingredients: flavourIngredients,
                allergens: flavourAllergens,
                nutritionFacts,
                nutritionText,
              }}
              designs={linkedDesigns}
              locale={locale}
              categoryName={flavourCategoryName}
            />
          </div>
        </>
      )
    }

    // Fall back to regular products table
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !product) {
      notFound()
    }

    recordId = product.id
    name = locale === 'uk' ? product.name_uk : product.name_de
    description = (locale === 'uk' ? product.description_uk : product.description_de) || ''
    category = product.category
    subCategory = product.sub_category
    imageUrl = product.image_url

    const { data: similarProductsData } = await supabase
      .from('products')
      .select('*')
      .eq('category', product.category)
      .neq('id', product.id)

    const shuffledSimilar = (similarProductsData || []).sort(() => Math.random() - 0.5).slice(0, 4)

    similarProducts = shuffledSimilar.map((similarProduct) => ({
      id: similarProduct.id,
      slug: similarProduct.slug,
      name: locale === 'uk' ? similarProduct.name_uk : similarProduct.name_de,
      description: locale === 'uk' ? similarProduct.description_uk : similarProduct.description_de,
      imageUrl: similarProduct.image_url || '/placeholder-cake.svg',
      category: similarProduct.category,
    }))
  }

  const categoryName =
    locale === 'uk'
      ? category === 'torten'
        ? 'Торти'
        : 'Десерти'
      : category === 'torten'
        ? tNav('cakes')
        : tNav('desserts')

  const showSubcategoryTabs = hasSubcategories(category)

  return (
    <>
      {showSubcategoryTabs && (
        <SubcategoryTabs
          category={category}
          currentSubcategory={subCategory || null}
          locale={locale}
        />
      )}
      <div className="container py-6">
        <ProductDetailWrapper
          product={{
            id: recordId,
            slug,
            name,
            description,
            imageUrl: imageUrl || '/placeholder-cake.svg',
            category,
            subCategory,
            flavours: designFlavours,
            isTorten: Boolean(isTortenDesign),
            isClassic: isTortenDesign ? Boolean(tortenDesign.classic) : false,
            imagesUrls: isTortenDesign ? (tortenDesign.images_urls || []) : [],
          }}
          locale={locale}
          categoryName={categoryName}
        />

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
    </>
  )
}

