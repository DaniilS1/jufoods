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
  available_designs: any
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
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadFavoriteProducts()
    }
  }, [favoriteIds, mounted])

  async function loadFavoriteProducts() {
    if (favoriteIds.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', favoriteIds)
        .order('created_at', { ascending: false })

      if (error) throw error

      setProducts(data || [])
    } catch (error) {
      console.error('Error loading favorite products:', error)
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

  if (favoriteIds.length === 0 || products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-6">
            <Heart className="h-12 w-12 text-primary opacity-50" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t('emptyTitle')}</h2>
            <p className="text-muted-foreground max-w-md">{t('emptyDescription')}</p>
          </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            />
          )
        })}
      </div>
    </div>
  )
}

