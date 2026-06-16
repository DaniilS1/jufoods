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

interface CatalogDesignCardProps {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string
  locale: string
  onOrder: () => void
}

export function CatalogDesignCard({
  id,
  slug,
  name,
  description,
  imageUrl,
  locale,
  onOrder,
}: CatalogDesignCardProps) {
  const t = useTranslations('catalog')
  const [mounted, setMounted] = useState(false)
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds)
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite)
  const favorite = mounted ? favoriteIds.includes(id) : false

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-[4/5] sm:aspect-[4/3] w-full overflow-hidden bg-muted">
        <Link href={`/${locale}/products/${slug}`} className="block h-full w-full">
          <Image
            src={normalizeSupabaseImageUrl(imageUrl)}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2.5 right-2.5 z-10 h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-sm border border-border/50"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleFavorite(id)
            }}
          >
            <Heart
              className={cn('h-4 w-4 transition-all', favorite && 'fill-primary text-primary')}
            />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-1.5">
        <Link href={`/${locale}/products/${slug}`}>
          <h3 className="font-semibold text-sm sm:text-base text-foreground leading-tight line-clamp-1">
            {name}
          </h3>
        </Link>
        <div
          className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1 [&_p]:m-0 [&_ul]:m-0 [&_ul]:pl-4"
          dangerouslySetInnerHTML={{ __html: description }}
        />
        <Button
          size="sm"
          className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onOrder}
        >
          {t('orderCta')}
        </Button>
      </div>
    </div>
  )
}
