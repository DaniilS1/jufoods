'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { normalizeSupabaseImageUrl } from '@/lib/image-utils'
import { useFavoritesStore } from '@/stores/favorites-store'

interface ProductImageSliderProps {
    productImageUrl: string
    productName: string
    productId?: string
    additionalImages?: string[]
}

export function ProductImageSlider({
    productImageUrl,
    productName,
    productId,
    additionalImages = [],
}: ProductImageSliderProps) {
    const t = useTranslations('product')
    const [mounted, setMounted] = useState(false)
    const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)
    const favorite = mounted && productId ? favoriteIds.includes(productId) : false

    useEffect(() => {
        setMounted(true)
    }, [])

    const allImages = [productImageUrl, ...additionalImages].filter(Boolean)
    const [currentIndex, setCurrentIndex] = useState(0)

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
    }

    return (
        <div className="space-y-4">
            {/* Main Image Container */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted/80 group shadow-lg">
                {/* Favorite Button */}
                {mounted && productId && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 z-40 h-10 w-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-md"
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

                {/* Navigation Arrows */}
                {allImages.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 h-10 w-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={goToPrevious}
                        >
                            <ChevronLeft className="h-5 w-5" />
                            <span className="sr-only">Previous image</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 h-10 w-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={goToNext}
                        >
                            <ChevronRight className="h-5 w-5" />
                            <span className="sr-only">Next image</span>
                        </Button>
                    </>
                )}

                {/* Image Container */}
                <div className="relative w-full  mx-auto h-full">
                    {allImages.map((imageUrl, index) => {
                        const normalizedUrl = normalizeSupabaseImageUrl(imageUrl)
                        const isVisible = index === currentIndex
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
                                        alt={`${productName} - Image ${index + 1}`}
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

                {/* Image Indicators */}
                {allImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-40">
                        {allImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={cn(
                                    'h-2 rounded-full transition-all',
                                    index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-white/60 hover:bg-white/80'
                                )}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Thumbnail Gallery (if multiple images) */}
            {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {allImages.map((imageUrl, index) => {
                        const normalizedUrl = normalizeSupabaseImageUrl(imageUrl)
                        const isLocalPath = normalizedUrl.startsWith('/') && !normalizedUrl.startsWith('http')

                        return (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={cn(
                                    'relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                                    index === currentIndex
                                        ? 'border-primary shadow-md'
                                        : 'border-transparent hover:border-primary/50'
                                )}
                            >
                                <Image
                                    src={normalizedUrl}
                                    alt={`${productName} thumbnail ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                    unoptimized={isLocalPath}
                                />
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

