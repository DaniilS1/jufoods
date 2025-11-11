'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { useFavoritesStore } from '@/stores/favorites-store'
import type { FlavorOption } from '@/types/product'

interface ProductImageSliderProps {
  productImageUrl: string
  productName: string
  productId?: string
}

export function ProductImageSlider({
  productImageUrl,
  productName,
  productId,
}: ProductImageSliderProps) {
  const t = useTranslations('product')
  const [mounted, setMounted] = useState(false)
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)
  const favorite = mounted && productId ? favoriteIds.includes(productId) : false

  useEffect(() => {
    setMounted(true)
  }, [])
  const images = [
    {
      url: productImageUrl,
      alt: productName,
    },
  ]

  const [currentIndex] = useState(0)

  return (
    <div className="relative aspect-[3/4] w-full max-w-[22rem] sm:max-w-[24rem] lg:max-w-[32rem] mx-auto overflow-hidden rounded-[1rem] bg-muted/80 group shadow-lg">
      {/* Favorite Button */}
      {mounted && productId && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-40 h-9 w-9 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleFavorite(productId)
          }}
        >
          <Heart
            className={cn('h-5 w-5 transition-all', favorite && 'fill-primary text-primary')}
          />
          <span className="sr-only">{favorite ? t('unfavorite') : t('favorite')}</span>
        </Button>
      )}

      {/* Image Container */}
      <div className="relative w-full h-full">
        {images.map((image, index) => {
          const normalizedUrl = normalizeSupabaseImageUrl(image.url)
          const isVisible = index === currentIndex
          // Only optimize remote images, not local paths
          const isLocalPath = normalizedUrl.startsWith('/') && !normalizedUrl.startsWith('http')
          
          return (
            <div
              key={index}
              className={cn(
                'absolute inset-0 transition-opacity duration-500 ease-in-out',
                isVisible ? 'opacity-100' : 'opacity-0'
              )}
            >
              {(isVisible || index === 0) && (
                <Image
                  src={normalizedUrl}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized={isLocalPath}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Navigation and indicators removed since only design image is shown */}
    </div>
  )
}

