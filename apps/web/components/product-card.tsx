'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavoritesStore } from '@/stores/favorites-store'
import { cn } from '@/lib/utils'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'

interface ProductCardProps {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string
  category: string
  defaultFlavourName?: string | null
}

export function ProductCard({
  id,
  slug,
  name,
  description,
  imageUrl,
  category,
  defaultFlavourName,
}: ProductCardProps) {
  const t = useTranslations('product')
  const [mounted, setMounted] = useState(false)
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)
  const favorite = mounted ? favoriteIds.includes(id) : false

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="group flex flex-col">
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted mb-3 shadow-sm hover:shadow-md transition-shadow">
        <Link href={`/products/${slug}`} className="absolute inset-0 z-10">
          <Image
            src={normalizeSupabaseImageUrl(imageUrl)}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </Link>
        
        {/* Heart Icon - Top Right */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-30 h-9 w-9 bg-white/95 hover:bg-white rounded-full shadow-sm border border-border/50"
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
        
        {/* Product Name Overlay - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 via-black/60 to-transparent px-3 py-4">
          <Link href={`/products/${slug}`}>
            <h3 className="font-bold text-lg text-white line-clamp-2 hover:text-primary/90 transition-colors">
              {name}
            </h3>
          </Link>
        </div>
      </div>

      {/* Description Below Image */}
      <div>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

