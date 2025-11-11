'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFavoritesStore } from '@/stores/favorites-store'
import { cn } from '@/lib/utils'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'

interface FavoriteProductCardProps {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string
  category: string
  defaultFlavourName?: string | null
}

export function FavoriteProductCard({
  id,
  slug,
  name,
  description,
  imageUrl,
  category,
  defaultFlavourName,
}: FavoriteProductCardProps) {
  const t = useTranslations('product')
  const [mounted, setMounted] = useState(false)
  const isFavorite = useFavoritesStore((state) => state.isFavorite)
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)
  const favorite = mounted ? isFavorite(id) : false

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white relative">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-white rounded-t-lg">
        <Link href={`/products/${slug}`} className="absolute inset-0 z-10">
          <Image
            src={normalizeSupabaseImageUrl(imageUrl)}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110 brightness-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-30 h-9 w-9 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleFavorite(id)
            }}
          >
            <Heart
              className={cn('h-5 w-5 transition-all', favorite && 'fill-primary text-primary')}
            />
            <span className="sr-only">{favorite ? t('unfavorite') : t('favorite')}</span>
          </Button>
        )}
      </div>
      <CardContent className="p-5">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <Link href={`/products/${slug}`}>
              <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors text-foreground">
                {name}
              </h3>
            </Link>
            {category === 'torten' && defaultFlavourName && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary mb-2">
                {t('defaultFlavour', { flavour: defaultFlavourName })}
              </span>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

