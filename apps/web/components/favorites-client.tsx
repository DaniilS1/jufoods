'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavoritesStore } from '@/stores/favorites-store'
import { FavoriteProductCard } from '@/components/favorite-product-card'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  slug: string
  name_uk: string
  name_de: string
  description_uk: string | null
  description_de: string | null
  category: string
  image_url: string | null
  sub_category?: string | null
  default_flavour_name?: string | null
}

export function FavoritesClient() {
  const t = useTranslations('favorites')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
  const clearFavorites = useFavoritesStore((state) => state.clearFavorites)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    // Debug: Check localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('jufoods-favorites')
      console.log('Favorites from localStorage:', stored)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      loadFavoriteProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteIds, mounted, locale])

  async function loadFavoriteProducts() {
    if (favoriteIds.length === 0) {
      setProducts([])
      setLoading(false)
      setError(null)
      return
    }

    console.log('Loading favorite products for IDs:', favoriteIds)
    setLoading(true)
    setError(null)
    try {
      const [designsResponse, productsResponse] = await Promise.all([
        supabase
          .from('torten_designs')
          .select(
            `
              id,
              slug,
              name_uk,
              name_de,
              description_uk,
              description_de,
              category,
              sub_category,
              image_url
            `
          )
          .in('id', favoriteIds),
        supabase
          .from('products')
          .select('*')
          .in('id', favoriteIds),
      ])

      if (designsResponse.error) {
        console.error('Error loading torten designs:', designsResponse.error)
      }
      if (productsResponse.error) {
        console.error('Error loading products:', productsResponse.error)
      }

      const tortenDesignIds = designsResponse.data?.map((d) => d.id) || []
      let defaultFlavourMap = new Map<string, { nameUk: string | null; nameDe: string | null }>()

      if (tortenDesignIds.length > 0) {
        const { data: flavourLinks, error: flavourLinkError } = await supabase
          .from('design_flavour')
          .select(
            `
              design_id,
              torten_flavours (
                name_uk,
                name_de
              )
            `
          )
          .in('design_id', tortenDesignIds)
          .order('name_de', { foreignTable: 'torten_flavours', ascending: true })

        if (flavourLinkError) {
          console.error('Error loading design flavour links:', flavourLinkError)
        }

        flavourLinks?.forEach((link) => {
          const flavour = Array.isArray(link.torten_flavours)
            ? link.torten_flavours[0]
            : link.torten_flavours
          if (!flavour || defaultFlavourMap.has(link.design_id)) {
            return
          }
          defaultFlavourMap.set(link.design_id, {
            nameUk: flavour.name_uk,
            nameDe: flavour.name_de,
          })
        })
      }

      const tortenProducts: Product[] =
        designsResponse.data?.map((design) => {
          const defaultFlavour = defaultFlavourMap.get(design.id)

          return {
            id: design.id,
            slug: design.slug,
            name_uk: design.name_uk,
            name_de: design.name_de,
            description_uk: design.description_uk,
            description_de: design.description_de,
            category: 'torten',
            image_url: design.image_url,
            sub_category: design.sub_category,
            default_flavour_name: defaultFlavour
              ? locale === 'uk'
                ? defaultFlavour.nameUk || null
                : defaultFlavour.nameDe || null
              : null,
          }
        }) || []

      const otherProducts: Product[] = productsResponse.data || []

      const combinedMap = new Map<string, Product>()
      for (const product of [...tortenProducts, ...otherProducts]) {
        combinedMap.set(product.id, product)
      }

      const loadedProducts = favoriteIds.map((id) => combinedMap.get(id)).filter(Boolean) as Product[]
      
      console.log('Loaded products:', {
        favoriteIds,
        tortenCount: tortenProducts.length,
        otherProductsCount: otherProducts.length,
        loadedCount: loadedProducts.length,
      })
      
      if (loadedProducts.length === 0 && favoriteIds.length > 0) {
        console.warn('No products found for favorite IDs:', favoriteIds)
        console.warn('Torten designs found:', designsResponse.data?.length || 0)
        console.warn('Other products found:', productsResponse.data?.length || 0)
        setError('Could not load some favorite products')
      }

      setProducts(loadedProducts)
    } catch (error) {
      console.error('Error loading favorite products:', error)
      setError('Failed to load favorite products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">{tCommon('loading')}</p>
      </div>
    )
  }

  if (favoriteIds.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-5">
            <Heart className="h-10 w-10 text-primary/60" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{t('emptyTitle')}</h2>
            <p className="text-muted-foreground max-w-sm text-sm">{t('emptyDesc')}</p>
          </div>
          <a
            href={`/${locale}/catalog`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors"
          >
            {t('emptyCta')}
          </a>
        </div>
      </div>
    )
  }

  if (products.length === 0 && !loading) {
    return (
      <div className="text-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-5">
            <Heart className="h-10 w-10 text-primary/60" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{t('emptyTitle')}</h2>
            {error ? (
              <p className="text-destructive max-w-sm text-sm">{error}</p>
            ) : (
              <p className="text-muted-foreground max-w-sm text-sm">{t('emptyDescription')}</p>
            )}
          </div>
          <a
            href={`/${locale}/catalog`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors"
          >
            {t('emptyCta')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {products.length} {tCommon('favorites')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFavorites}
              className="text-destructive hover:text-destructive"
            >
              {t('clearAll')}
            </Button>
          </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {products.map((product) => {
          const name = locale === 'uk' ? product.name_uk : product.name_de
          const description = locale === 'uk' ? product.description_uk : product.description_de

          return (
            <FavoriteProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              name={name}
              description={description || ''}
              imageUrl={product.image_url || '/placeholder-cake.svg'}
              category={product.category}
              defaultFlavourName={product.default_flavour_name || null}
            />
          )
        })}
      </div>
    </div>
  )
}

