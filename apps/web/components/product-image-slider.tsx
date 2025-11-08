'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { useFavoritesStore } from '@/stores/favorites-store'

interface Design {
  id: string
  name_uk: string
  name_de: string
  image: string
}

interface ProductImageSliderProps {
  productImageUrl: string
  productName: string
  availableDesigns: Design[]
  selectedDesignId?: string
  locale: string
  productId?: string
}

export function ProductImageSlider({
  productImageUrl,
  productName,
  availableDesigns,
  selectedDesignId,
  locale,
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
  // Build image list: product image (index 0) + all design images (index 1+)
  const images = [
    {
      url: productImageUrl,
      alt: productName,
      type: 'product' as const,
    },
    ...availableDesigns.map((design) => ({
      url: design.image,
      alt: locale === 'uk' ? design.name_uk : design.name_de,
      type: 'design' as const,
      designId: design.id,
    })),
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  // When selectedDesignId changes, jump to the corresponding design image
  useEffect(() => {
    if (selectedDesignId) {
      const designIndex = availableDesigns.findIndex((d) => d.id === selectedDesignId)
      if (designIndex !== -1) {
        // Design images start at index 1 (after product image)
        setCurrentIndex(designIndex + 1)
      }
    } else {
      // If no design selected, show product image
      setCurrentIndex(0)
    }
  }, [selectedDesignId, availableDesigns])

  const goToSlide = (index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index)
    }
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images.length])

  if (images.length === 0) {
    return null
  }

  return (
    <div className="relative aspect-square w-full max-w-xl mx-auto lg:mx-0 overflow-hidden rounded-lg bg-muted group">
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

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToPrevious}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToNext}
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-white/50 hover:bg-white/70'
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

